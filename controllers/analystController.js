const { supabase } = require('../config');
const reportPayload = require('../lib/analysisReportPayload');
const blockchainService = require('../services/blockchain/blockchainService');
const integratedEvidenceService = require('../services/integratedEvidenceService');

/**
 * Forensic Analyst Module — role-scoped analysis workflow.
 *
 * SECURITY CONTRACT:
 * - Every route requires requireAuth + requireAnalyst (JWT for email users,
 *   wallet lookup for MetaMask users). Non-analysts receive 403.
 * - Evidence rows are only returned for evidence the analyst has an
 *   analysis task on; case rows only for cases with analyst involvement.
 * - Sanitized DTOs whitelist fields. Never returned: victim/investigator
 *   names, file_data, submitted_by wallets of others.
 * - All state transitions are written to activity_logs (audit trail).
 * - Blockchain/IPFS interactions are read-only (verification only).
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Reject partial parses, repeated query keys and unbounded database ranges.
function positiveInteger(value, max = 2147483647) {
  if (!['string', 'number'].includes(typeof value) || !/^[1-9][0-9]*$/.test(String(value))) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n <= max ? n : null;
}
function listInputs(query, statuses, withPriority = false) {
  const page = positiveInteger(query.page === undefined ? 1 : query.page, 1000000);
  const limit = positiveInteger(query.limit === undefined ? 20 : query.limit, 100);
  const status = query.status === undefined ? '' : query.status;
  const priority = query.priority === undefined ? '' : query.priority;
  if (!page || !limit || typeof status !== 'string' || (status && !statuses.includes(status)) ||
      (withPriority && (typeof priority !== 'string' || (priority && !['critical','high','medium','low'].includes(priority)))) ||
      (withPriority && query.search !== undefined && (typeof query.search !== 'string' || query.search.length > 200))) return null;
  return {page, limit, status, priority};
}

// Never fall back to non-atomic report/task writes if deployment is incomplete.
async function reportTransition(res, analyst, taskId, params) {
  const { data, error } = await supabase.rpc('analyst_report_transition', {
    p_task_id: taskId,
    p_analyst_id: analyst.id,
    p_wallet: analyst.wallet_address || analyst.email,
    ...params,
  });
  if (error) {
    if (['PGRST202', '42883', '42501'].includes(error.code)) {
      res
        .status(503)
        .json({
          success: false,
          code: 'REPORT_TRANSITION_UNAVAILABLE',
          error: 'Report transitions are not available. Contact the administrator.',
        });
      return null;
    }
    throw error;
  }
  if (data?.code === 'OK') return data;
  const errors = {
    NOT_ASSIGNED: [404, 'Task not found or not assigned to you'],
    INVALID_INPUT: [400, 'Invalid transition input'],
    FINALIZED: [409, 'Submitted reports and completed tasks are locked'],
    STALE_REVISION: [409, 'Report changed. Reload before saving'],
    DUPLICATE_REPORTS: [409, 'Multiple reports exist for this task. Administrator review required'],
  };
  const [status, message] = errors[data?.code] || [503, 'Report transition unavailable'];
  res
    .status(status)
    .json({ success: false, code: data?.code || 'REPORT_TRANSITION_UNAVAILABLE', error: message });
  return null;
}

/** Map a DB task row into a public DTO. */
function sanitizeTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    evidence_id: row.evidence_id,
    case_id: row.case_id,
    status: row.status || 'pending',
    priority: row.priority || 'medium',
    progress: Number(row.progress) || 0,
    assigned_at: row.assigned_at,
    started_at: row.started_at,
    completed_at: row.completed_at,
    requested_by: row.requested_by || null,
    notes: row.notes || null,
    estimated_time_minutes: row.estimated_time_minutes,
    created_at: row.created_at,
    evidence: row.evidence
      ? {
          id: row.evidence.id,
          name: row.evidence.name || row.evidence.file_name || `Evidence ${row.evidence.id}`,
          file_type: row.evidence.file_type || null,
          hash: row.evidence.hash || null,
          ipfs_cid: row.evidence.ipfs_cid || null,
          blockchain_tx_hash: row.evidence.blockchain_tx_hash || null,
          blockchain_block_number: row.evidence.blockchain_block_number || null,
          blockchain_verified: Boolean(row.evidence.blockchain_verified),
          blockchain_timestamp: row.evidence.blockchain_timestamp || null,
          timestamp: row.evidence.timestamp || null,
          redaction_status: row.evidence.redaction_status || 'Sealed',
          file_size: row.evidence.file_size || null,
          description: row.evidence.description || null,
        }
      : null,
    case_number: row.case_number || null,
  };
}

/** Map a DB report row into a public DTO. */
function sanitizeReport(row) {
  if (!row) return null;
  return {
    id: row.id,
    task_id: row.task_id,
    evidence_id: row.evidence_id,
    case_id: row.case_id,
    status: row.status || 'draft',
    report_hash: row.report_hash || null,
    report_hash_version: row.report_hash_version ?? reportPayload.LEGACY,
    content_digest_check: reportPayload.verify(row),
    revision: row.revision ?? null,
    result_summary: row.result_summary || null,
    findings: row.findings || null,
    blockchain_verified: Boolean(row.blockchain_verified),
    created_at: row.created_at,
    updated_at: row.updated_at,
    submitted_at: row.submitted_at,
    evidence_name: row.evidence ? row.evidence.name || row.evidence.file_name || `Evidence ${row.evidence.id}` : null,
    evidence_hash: row.evidence ? row.evidence.hash : null,
    case_number: row.case_number || null,
  };
}

/** Build the chain-of-custody timeline for a task from real event timestamps. */
function buildCustodyTimeline(task, report) {
  const timeline = [];
  if (task.evidence && task.evidence.timestamp) {
    timeline.push({
      stage: 'Collected',
      title: 'Evidence collected & registered',
      timestamp: task.evidence.timestamp,
      detail: 'SHA-256 hash generated at collection',
    });
  }
  if (task.assigned_at) {
    timeline.push({
      stage: 'Assigned',
      title: 'Assigned to analyst',
      timestamp: task.assigned_at,
      detail: task.requested_by ? `Requested by ${task.requested_by}` : 'Evidence queue assignment',
    });
  }
  if (task.started_at) {
    timeline.push({
      stage: 'Analysis Started',
      title: 'Analysis in progress',
      timestamp: task.started_at,
      detail: `Progress ${task.progress || 0}%`,
    });
  }
  if (report && report.created_at) {
    timeline.push({
      stage: 'Report Drafted',
      title: 'Analysis report drafted',
      timestamp: report.updated_at || report.created_at,
      detail: report.report_hash ? `Hash ${report.report_hash.slice(0, 12)}…` : 'Draft report',
    });
  }
  if (report && report.submitted_at) {
    timeline.push({
      stage: 'Report Generated',
      title: 'Report submitted',
      timestamp: report.submitted_at,
      detail: report.blockchain_verified ? 'Blockchain verified' : 'Awaiting blockchain verification',
    });
  }
  if (task.completed_at) {
    timeline.push({
      stage: 'Analysis Completed',
      title: 'Analysis marked complete',
      timestamp: task.completed_at,
      detail: `Final progress ${task.progress || 100}%`,
    });
  }
  return timeline;
}

async function logAudit(action, analyst, details) {
  const { error } = (await supabase.from('activity_logs').insert({
    user_id: analyst.id,
    action,
    details: JSON.stringify(details || {}),
    timestamp: new Date().toISOString(),
  })) || {};
  if (error) console.error('Analyst audit log failed:', action, error.message);
}

// ---------------------------------------------------------------------------
// GET /analyst/stats
// ---------------------------------------------------------------------------
const getStats = async (req, res) => {
  try {
    const analyst = req.user;
    const walletMatch = analyst.wallet_address || analyst.email;

    let base = supabase
      .from('analysis_tasks')
      .select('id, evidence_id, case_id, status, priority, progress, assigned_at, started_at, completed_at', {
        count: 'exact',
      });
    base = base.or(`analyst_id.eq.${analyst.id},analyst_wallet.eq.${walletMatch}`);
    const { data: tasks, count, error } = await base;
    if (error) throw error;

    const rows = tasks || [];
    const pending = rows.filter((t) => t.status === 'pending');
    const inProgress = rows.filter((t) => t.status === 'in_progress');
    const completed = rows.filter((t) => t.status === 'completed');
    const critical = rows.filter((t) => t.priority === 'critical' && t.status !== 'completed');

    let avgMinutes = null;
    if (completed.length > 0) {
      const durations = completed
        .map((t) =>
          t.started_at && t.completed_at
            ? (new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 60000
            : null,
        )
        .filter((d) => d !== null && d >= 0);
      if (durations.length > 0) {
        avgMinutes = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
      }
    }

    // Evidence verified (blockchain) among assigned evidence.
    let verifiedEvidence = 0;
    let integrityScore = null;
    const evIds = [...new Set(rows.map((t) => t.evidence_id).filter(Boolean))];
    if (evIds.length > 0) {
      const { data: evRows, error: evError } = (await supabase
        .from('evidence')
        .select('id, blockchain_verified')
        .in('id', evIds)) || {};
      if (!evError) {
        verifiedEvidence = (evRows || []).filter((e) => e.blockchain_verified).length;
        integrityScore = Math.round(((verifiedEvidence / evRows.length) * 100));
      }
    }

    // Blockchain sync status (read-only probe, never blocks the dashboard).
    let blockchainSync = { state: 'unknown', block: null, network: null };
    try {
      await blockchainService.initialize();
      blockchainSync = {
        state: blockchainService.isInitialized() ? 'synced' : 'unavailable',
        block: await blockchainService.getBlockNumber(),
        network: (blockchainService.getNetworkInfo && blockchainService.getNetworkInfo().name) || null,
      };
    } catch (blockchainError) {
      blockchainSync.state = 'unavailable';
    }

    // Lab equipment status.
    const { data: lab, error: labError } = (await supabase
      .from('lab_equipment')
      .select('name, category, status, detail, version')
      .order('sort_order', { ascending: true })) || {};
    if (labError) throw labError;

    // Recent analyst activity (evidence-scoped, from the audit trail).
    const { data: activity, error: actError } = (await supabase
      .from('activity_logs')
      .select('action, details, timestamp')
      .eq('user_id', analyst.id)
      .order('timestamp', { ascending: false })
      .limit(10)) || {};
    if (actError) throw actError;

    res.json({
      success: true,
      data: {
        assigned_cases: new Set(rows.map((t) => t.case_id).filter(Boolean)).size,
        assigned_evidence: evIds.length,
        pending: pending.length,
        in_progress: inProgress.length,
        completed: completed.length,
        critical_priority: critical.length,
        awaiting_review: rows.filter((t) => t.status === 'in_progress' && t.progress >= 100).length,
        average_processing_minutes: avgMinutes,
        evidence_verified: verifiedEvidence,
        integrity_score: integrityScore,
        blockchain: blockchainSync,
        lab_equipment: (lab || []).map((l) => ({
          name: l.name,
          category: l.category,
          status: l.status,
          detail: l.detail,
          version: l.version,
        })),
        recent_activity: (activity || []).map((a) => ({
          action: a.action,
          details: a.details,
          timestamp: a.timestamp,
        })),
        analyst: {
          id: analyst.id,
          name: analyst.full_name,
          email: analyst.email,
        },
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Analyst stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to load analysis statistics' });
  }
};

// ---------------------------------------------------------------------------
// GET /analyst/queue
// ---------------------------------------------------------------------------
const getQueue = async (req, res) => {
  try {
    const analyst = req.user;
    const walletMatch = analyst.wallet_address || analyst.email;
    const { status, priority, search } = req.query;

    const inputs = listInputs(req.query, ['pending','in_progress','completed','archived'], true);
    if (!inputs) return res.status(400).json({success:false,error:'Invalid queue filters or pagination.'});
    const {page:pageNum, limit:limitNum} = inputs;
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('analysis_tasks')
      .select(
        `id, evidence_id, case_id, status, priority, progress, assigned_at, started_at, completed_at, requested_by, notes, estimated_time_minutes, created_at,
         evidence!inner(id, name, file_type, hash, ipfs_cid, blockchain_tx_hash, blockchain_block_number, blockchain_verified, blockchain_timestamp, timestamp, redaction_status, file_size, description)`,
      )
      .or(`analyst_id.eq.${analyst.id},analyst_wallet.eq.${walletMatch}`);

    if (status) query = query.eq('status', String(status).trim());
    if (priority) query = query.eq('priority', String(priority).trim());

    let data = null;
    let error = null;
    let matchedEvidenceIds = null;
    if (search) {
      const safe = String(search).replace(/[%_.*(),'"]/g, '').trim();
      if (safe) {
        // Two-step: fetch matching evidence ids by name/hash, then filter tasks.
        const { data: evRows, error: evError } = (await supabase
          .from('evidence')
          .select('id')
          .or(`name.ilike.%${safe}%,hash.ilike.%${safe}%,file_type.ilike.%${safe}%`)
          .limit(200)) || {};
        if (evError) throw evError;
        const ids = (evRows || []).map((e) => e.id);
        if (ids.length === 0) {
          return res.json({ success: true, data: [], pagination: { page: pageNum, limit: limitNum, total: 0, pages: 0 } });
        }
        matchedEvidenceIds = ids;
        query = query.in('evidence_id', ids);
      }
    }

    query = query.order('assigned_at', { ascending: false }).range(offset, offset + limitNum - 1);
    ({ data, error } = await query);
    if (error) throw error;

    let countQuery = supabase.from('analysis_tasks')
      .select('id, evidence!inner(id)', { count: 'exact', head: true })
      .or(`analyst_id.eq.${analyst.id},analyst_wallet.eq.${walletMatch}`);
    if (status) countQuery = countQuery.eq('status', status);
    if (priority) countQuery = countQuery.eq('priority', priority);
    if (matchedEvidenceIds) countQuery = countQuery.in('evidence_id', matchedEvidenceIds);
    const { count: total, error: countError } = (await countQuery) || {};
    if (countError) throw countError;

    // Case numbers for context.
    const caseIds = [...new Set((data || []).map((t) => t.case_id).filter(Boolean))];
    const caseMap = {};
    if (caseIds.length > 0) {
      const { data: caseRows, error: caseError } = (await supabase
        .from('cases')
        .select('id, case_number')
        .in('id', caseIds)) || {};
      if (!caseError) {
        for (const c of caseRows || []) caseMap[c.id] = c.case_number;
      }
    }

    const items = (data || []).map((t) =>
      sanitizeTask({ ...t, case_number: t.case_id ? caseMap[t.case_id] || null : null }),
    );

    res.json({
      success: true,
      data: items,
      pagination: { page: pageNum, limit: limitNum, total: total || 0, pages: Math.ceil((total || 0) / limitNum) },
    });
  } catch (error) {
    console.error('Analyst queue error:', error);
    res.status(500).json({ success: false, error: 'Failed to load the analysis queue' });
  }
};

// ---------------------------------------------------------------------------
// GET /analyst/tasks/:id
// ---------------------------------------------------------------------------
const getTaskDetail = async (req, res) => {
  try {
    const analyst = req.user;
    const walletMatch = analyst.wallet_address || analyst.email;
    const taskId = positiveInteger(req.params.id);
    if (!taskId) {
      return res.status(400).json({ success: false, error: 'Invalid task ID' });
    }

    const { data: rows, error } = (await supabase
      .from('analysis_tasks')
      .select(
        `id, evidence_id, case_id, status, priority, progress, assigned_at, started_at, completed_at, requested_by, notes, estimated_time_minutes, created_at,
         evidence!inner(id, name, file_type, hash, ipfs_cid, blockchain_tx_hash, blockchain_block_number, blockchain_verified, blockchain_timestamp, timestamp, redaction_status, file_size, description),
         case:cases(id, case_number, title)`,
      )
      .eq('id', taskId)
      .or(`analyst_id.eq.${analyst.id},analyst_wallet.eq.${walletMatch}`)
      .limit(1)) || {};
    if (error) throw error;

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Task not found or not assigned to you' });
    }
    const task = rows[0];

    const { data: reports, error: reportError } = (await supabase
      .from('analysis_reports')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
      .limit(1)) || {};
    if (reportError) throw reportError;

    const report = reports && reports.length > 0 ? reports[0] : null;

    const timeline = buildCustodyTimeline(
      { ...task, evidence: task.evidence },
      report ? sanitizeReport(report) : null,
    );

    res.json({
      success: true,
      data: {
        task: sanitizeTask({ ...task, case_number: task.case ? task.case.case_number : null }),
        case: task.case
          ? { id: task.case.id, case_number: task.case.case_number, title: task.case.title }
          : null,
        report: sanitizeReport(report),
        custody_timeline: timeline,
      },
    });
  } catch (error) {
    console.error('Analyst task detail error:', error);
    res.status(500).json({ success: false, error: 'Failed to load task details' });
  }
};

// ---------------------------------------------------------------------------
// POST /analyst/evidence/:id/start
// ---------------------------------------------------------------------------
const startAnalysis = async (req, res) => {
  try {
    const analyst = req.user;
    const walletMatch = analyst.wallet_address || analyst.email;
    const evidenceId = positiveInteger(req.params.id);
    if (!evidenceId) {
      return res.status(400).json({ success: false, error: 'Invalid evidence ID' });
    }

    const { priority = 'medium', estimated_time_minutes = null } = req.body || {};

    if (
      !['critical', 'high', 'medium', 'low'].includes(priority) ||
      (estimated_time_minutes !== null && !positiveInteger(estimated_time_minutes, 525600))
    ) {
      return res.status(400).json({ success: false, error: 'Invalid analysis options' });
    }
    // Resolve the assigned task, but let the locked transaction decide finality.
    const { data: existing, error: existingError } = await supabase
      .from('analysis_tasks')
      .select('id')
      .eq('evidence_id', evidenceId)
      .or(`analyst_id.eq.${analyst.id},analyst_wallet.eq.${walletMatch}`)
      .order('created_at', { ascending: false })
      .limit(1);
    if (existingError) throw existingError;
    if (!existing?.length)
      return res.status(403).json({ success: false, error: 'Evidence not assigned to you' });
    const taskId = existing[0].id;
    const result = await reportTransition(res, analyst, taskId, {
      p_operation: 'start',
      p_priority: priority,
      p_estimated: estimated_time_minutes,
    });
    if (!result) return;

    await logAudit('analysis_started', analyst, { task_id: taskId, evidence_id: evidenceId });

    res.json({ success: true, message: 'Analysis started', data: { task_id: taskId } });
  } catch (error) {
    console.error('Analyst start analysis error:', error);
    res.status(500).json({ success: false, error: 'Failed to start analysis' });
  }
};

// ---------------------------------------------------------------------------
// PUT /analyst/tasks/:id/progress
// ---------------------------------------------------------------------------
const updateTaskProgress = async (req, res) => {
  try {
    const analyst = req.user;
    const taskId = positiveInteger(req.params.id);
    if (!taskId) {
      return res.status(400).json({ success: false, error: 'Invalid task ID' });
    }

    const progress = req.body?.progress;
    const notes = req.body?.notes;
    if (
      !Number.isInteger(progress) ||
      progress < 0 ||
      progress > 100 ||
      (notes !== undefined && (typeof notes !== 'string' || notes.length > 5000))
    ) {
      return res.status(400).json({ success: false, error: 'Invalid progress or notes' });
    }
    const patch = await reportTransition(res, analyst, taskId, {
      p_operation: 'progress',
      p_progress: progress,
      p_notes: notes ?? null,
    });
    if (!patch) return;

    await logAudit('analysis_progress', analyst, { task_id: taskId, progress });

    res.json({ success: true, data: { task_id: taskId, progress, status: patch.status } });
  } catch (error) {
    console.error('Analyst progress error:', error);
    res.status(500).json({ success: false, error: 'Failed to update task progress' });
  }
};

// ---------------------------------------------------------------------------
// PUT /analyst/tasks/:id/report
// ---------------------------------------------------------------------------
const saveReport = async (req, res) => {
  try {
    const analyst = req.user;
    const taskId = positiveInteger(req.params.id);
    if (!taskId) {
      return res.status(400).json({ success: false, error: 'Invalid task ID' });
    }

    const resultSummary = req.body?.result_summary ?? null;
    const findings = req.body?.findings ?? null;
    const submit = req.body?.submit ?? false;
    const revision = req.body?.expected_revision;
    if (
      (resultSummary !== null &&
        (typeof resultSummary !== 'string' || resultSummary.length > 10000)) ||
      (findings !== null && (typeof findings !== 'string' || findings.length > 50000)) ||
      typeof submit !== 'boolean' ||
      !(resultSummary?.trim() || findings?.trim()) ||
      (revision !== undefined &&
        (!Number.isInteger(revision) || revision < 0 || revision > 2147483646))
    ) {
      return res.status(400).json({ success: false, error: 'Invalid report content or revision' });
    }
    const reportHash = reportPayload.digest(resultSummary, findings);
    const result = await reportTransition(res, analyst, taskId, {
      p_operation: 'save',
      p_summary: resultSummary,
      p_findings: findings,
      p_report_hash: reportHash,
      p_hash_version: reportPayload.CURRENT,
      p_submit: submit,
      p_expected_revision: revision ?? null,
    });
    if (!result) return;
    const savedHash = result.report_hash;
    const hashVersion = result.report_hash_version;
    const reportId = result.report_id;
    const status = result.status;
    const task = result;
    // Exact repeated submissions return the saved result without another audit
    // completion or notification. The function has already checked all bytes.
    if (!result.did_submit && submit)
      return res.json({
        success: true,
        message: 'Report already submitted',
        data: {
          report_id: reportId,
          task_id: taskId,
          report_hash: savedHash,
          status,
          revision: result.revision,
        report_hash_version: hashVersion,
        },
      });

    await logAudit(submit ? 'report_submitted' : 'report_saved', analyst, {
      report_id: reportId,
      task_id: taskId,
      report_hash: savedHash.slice(0, 16) + '…',
      submit,
    });

    // S8: tell the requester their analysis is done (in-app + email).
    if (submit && task.requested_by) {
      try {
        const { notifyUser } = require('../services/notificationService');
        const analystName = analyst.full_name || analyst.email || 'The analyst';
        await notifyUser(
          task.requested_by,
          'Analysis complete',
          `${analystName} submitted the ${task.analysis_type || 'forensic'} analysis report for evidence #${task.evidence_id}. The report is ready to review.`,
          'analysis_complete',
          {
            task_id: taskId,
            report_id: reportId,
            evidence_id: task.evidence_id,
            case_id: task.case_id,
          },
        );
      } catch (e) {
        console.error('analysis complete notification failed:', e.message);
      }
    }

    res.json({
      success: true,
      message: submit ? 'Report submitted successfully' : 'Report draft saved',
      data: {
        report_id: reportId,
        task_id: taskId,
        report_hash: savedHash,
        status,
        revision: result.revision,
        report_hash_version: hashVersion,
      },
    });
  } catch (error) {
    console.error('Analyst report error:', error);
    res.status(500).json({ success: false, error: 'Failed to save report' });
  }
};

// ---------------------------------------------------------------------------
// GET /analyst/reports
// ---------------------------------------------------------------------------
const getReports = async (req, res) => {
  try {
    const analyst = req.user;
    const walletMatch = analyst.wallet_address || analyst.email;
    const { status } = req.query;

    const inputs = listInputs(req.query, ['draft','submitted','approved','rejected']);
    if (!inputs) return res.status(400).json({success:false,error:'Invalid report filters or pagination.'});
    const {page:pageNum, limit:limitNum} = inputs;
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('analysis_reports')
      .select(
        `id, task_id, evidence_id, case_id, status, report_hash, report_hash_version, revision, result_summary, findings, blockchain_verified, created_at, updated_at, submitted_at,
         evidence!inner(id, name, file_type, hash)`,
      )
      .or(`analyst_id.eq.${analyst.id},analyst_wallet.eq.${walletMatch}`);

    if (status) query = query.eq('status', String(status).trim());
    query = query.order('updated_at', { ascending: false }).range(offset, offset + limitNum - 1);

    const { data, error } = await query;
    if (error) throw error;

    const caseIds = [...new Set((data || []).map((r) => r.case_id).filter(Boolean))];
    const caseMap = {};
    if (caseIds.length > 0) {
      const { data: caseRows, error: caseError } = (await supabase
        .from('cases')
        .select('id, case_number')
        .in('id', caseIds)) || {};
      if (!caseError) {
        for (const c of caseRows || []) caseMap[c.id] = c.case_number;
      }
    }

    let countQuery = supabase.from('analysis_reports')
      .select('id, evidence!inner(id)', { count: 'exact', head: true })
      .or(`analyst_id.eq.${analyst.id},analyst_wallet.eq.${walletMatch}`);
    if (status) countQuery = countQuery.eq('status', status);
    const { count: total, error: countError } = (await countQuery) || {};
    if (countError) throw countError;

    res.json({
      success: true,
      data: (data || []).map((r) =>
        sanitizeReport({ ...r, case_number: r.case_id ? caseMap[r.case_id] || null : null }),
      ),
      pagination: { page: pageNum, limit: limitNum, total: total || 0, pages: Math.ceil((total || 0) / limitNum) },
    });
  } catch (error) {
    console.error('Analyst reports error:', error);
    res.status(500).json({ success: false, error: 'Failed to load reports' });
  }
};

// ---------------------------------------------------------------------------
// GET /analyst/tools
// ---------------------------------------------------------------------------
const getTools = async (req, res) => {
  try {
    const { data, error } = (await supabase
      .from('lab_equipment')
      .select('name, category, status, detail, version, sort_order')
      .order('sort_order', { ascending: true })) || {};
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Analyst tools error:', error);
    res.status(500).json({ success: false, error: 'Failed to load forensic tools' });
  }
};

// ---------------------------------------------------------------------------
// GET /analyst/search?q=
// ---------------------------------------------------------------------------
const searchAll = async (req, res) => {
  try {
    const analyst = req.user;
    const walletMatch = analyst.wallet_address || analyst.email;
    const q = String(req.query.q || '').replace(/[%_.*(),'"]/g, '').trim();
    if (!q) {
      return res.json({ success: true, data: { tasks: [], reports: [], cases: [] } });
    }

    const { data: evRows, error: evError } = (await supabase
      .from('evidence')
      .select('id, name, hash')
      .or(`name.ilike.%${q}%,hash.ilike.%${q}%,file_type.ilike.%${q}%`)
      .limit(100)) || {};
    if (evError) throw evError;
    const evIds = (evRows || []).map((e) => e.id);

    // Case matches are scoped to cases where this analyst already has tasks,
    // preserving the assigned-evidence-only contract.
    const { data: analystTaskRows, error: acError } = (await supabase
      .from('analysis_tasks')
      .select('case_id')
      .or(`analyst_id.eq.${analyst.id},analyst_wallet.eq.${walletMatch}`)) || {};
    if (acError) throw acError;
    const analystCaseIds = [...new Set((analystTaskRows || []).map((t) => t.case_id).filter(Boolean))];

    let caseMatches = [];
    if (analystCaseIds.length > 0) {
      const { data: cRows, error: cError } = (await supabase
        .from('cases')
        .select('id, case_number, title, status, created_date, priority_level, jurisdiction')
        .in('id', analystCaseIds)
        .or(`case_number.ilike.%${q}%,title.ilike.%${q}%`)
        .limit(20)) || {};
      if (cError) throw cError;
      caseMatches = cRows || [];
    }
    const matchedCaseIds = caseMatches.map((c) => c.id);

    const taskSelect =
      'id, evidence_id, case_id, status, priority, progress, assigned_at, evidence!inner(id, name, file_type)';
    const taskPromises = [];
    if (evIds.length > 0) {
      taskPromises.push(
        supabase
          .from('analysis_tasks')
          .select(taskSelect)
          .in('evidence_id', evIds)
          .or(`analyst_id.eq.${analyst.id},analyst_wallet.eq.${walletMatch}`)
          .order('assigned_at', { ascending: false })
          .limit(20),
      );
    }
    if (matchedCaseIds.length > 0) {
      taskPromises.push(
        supabase
          .from('analysis_tasks')
          .select(taskSelect)
          .in('case_id', matchedCaseIds)
          .or(`analyst_id.eq.${analyst.id},analyst_wallet.eq.${walletMatch}`)
          .order('assigned_at', { ascending: false })
          .limit(20),
      );
    }
    const taskResults = await Promise.all(taskPromises);
    for (const r of taskResults) { if (r && r.error) throw r.error; }
    const seenTaskIds = new Set();
    const taskRows = taskResults
      .flatMap((r) => (r && r.data) || [])
      .filter((t) => (seenTaskIds.has(t.id) ? false : (seenTaskIds.add(t.id), true)))
      .sort((a, b) => String(b.assigned_at || '').localeCompare(String(a.assigned_at || '')))
      .slice(0, 20);
    const taskPromise = Promise.resolve({ data: taskRows, error: null });

    const reportPromise = supabase
      .from('analysis_reports')
      .select('id, evidence_id, case_id, status, result_summary, updated_at')
      .or(`result_summary.ilike.%${q}%,findings.ilike.%${q}%`)
      .or(`analyst_id.eq.${analyst.id},analyst_wallet.eq.${walletMatch}`)
      .order('updated_at', { ascending: false })
      .limit(20);

    const [taskRes, reportRes] = await Promise.all([taskPromise, reportPromise]);
    if (taskRes.error) throw taskRes.error;
    if (reportRes.error) throw reportRes.error;

    res.json({
      success: true,
      data: {
        tasks: (taskRes.data || []).map(sanitizeTask),
        reports: (reportRes.data || []).map((r) => sanitizeReport(r)),
        cases: caseMatches,
      },
    });
  } catch (error) {
    console.error('Analyst search error:', error);
    res.status(500).json({ success: false, error: 'Search failed' });
  }
};

// ---------------------------------------------------------------------------
// GET /analyst/evidence  (evidence inventory with analyst involvement)
// ---------------------------------------------------------------------------
const getAnalystEvidence = async (req, res) => {
  try {
    const analyst = req.user;
    const walletMatch = analyst.wallet_address || analyst.email;

    const { data: tasks, error: taskError } = (await supabase
      .from('analysis_tasks')
      .select('evidence_id, case_id, status, priority')
      .or(`analyst_id.eq.${analyst.id},analyst_wallet.eq.${walletMatch}`)) || {};
    if (taskError) throw taskError;

    const evIds = [...new Set((tasks || []).map((t) => t.evidence_id).filter(Boolean))];
    if (evIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const { data: evidence, error } = (await supabase
      .from('evidence')
      .select('id, name, file_type, hash, ipfs_cid, blockchain_tx_hash, blockchain_verified, timestamp, case_id, file_size, description')
      .in('id', evIds)
      .order('timestamp', { ascending: false })) || {};
    if (error) throw error;

    const caseIds = [...new Set((evidence || []).map((e) => e.case_id).filter(Boolean))];
    const caseMap = {};
    if (caseIds.length > 0) {
      const { data: caseRows, error: caseError } = (await supabase
        .from('cases')
        .select('id, case_number')
        .in('id', caseIds)) || {};
      if (!caseError) {
        for (const c of caseRows || []) caseMap[c.id] = c.case_number;
      }
    }

    res.json({
      success: true,
      data: (evidence || []).map((e) => ({
        id: e.id,
        name: e.name || `Evidence ${e.id}`,
        file_type: e.file_type,
        hash: e.hash,
        ipfs_cid: e.ipfs_cid,
        blockchain_tx_hash: e.blockchain_tx_hash,
        blockchain_verified: Boolean(e.blockchain_verified),
        timestamp: e.timestamp,
        case_id: e.case_id,
        case_number: e.case_id ? caseMap[e.case_id] || null : null,
        file_size: e.file_size,
        description: e.description,
        task_status: (tasks || []).find((t) => t.evidence_id === e.id)?.status || 'none',
      })),
    });
  } catch (error) {
    console.error('Analyst evidence error:', error);
    res.status(500).json({ success: false, error: 'Failed to load evidence inventory' });
  }
};

// ---------------------------------------------------------------------------
// GET /analyst/cases
// ---------------------------------------------------------------------------
const getAnalystCases = async (req, res) => {
  try {
    const analyst = req.user;
    const walletMatch = analyst.wallet_address || analyst.email;

    const { data: tasks, error: taskError } = (await supabase
      .from('analysis_tasks')
      .select('case_id, status')
      .or(`analyst_id.eq.${analyst.id},analyst_wallet.eq.${walletMatch}`)) || {};
    if (taskError) throw taskError;

    const caseIds = [...new Set((tasks || []).map((t) => t.case_id).filter(Boolean))];
    if (caseIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const { data: cases, error } = (await supabase
      .from('cases')
      .select('id, case_number, title, status, created_date, priority_level, jurisdiction')
      .in('id', caseIds)
      .order('created_date', { ascending: false })) || {};
    if (error) throw error;

    res.json({ success: true, data: cases || [] });
  } catch (error) {
    console.error('Analyst cases error:', error);
    res.status(500).json({ success: false, error: 'Failed to load cases' });
  }
};

// ---------------------------------------------------------------------------
// GET /analyst/evidence/:id/verify  (read-only integrity verification)
// ---------------------------------------------------------------------------
const verifyEvidenceIntegrity = async (req, res) => {
  try {
    const analyst = req.user;
    const walletMatch = analyst.wallet_address || analyst.email;
    const evidenceId = positiveInteger(req.params.id);
    if (!evidenceId) {
      return res.status(400).json({ success: false, error: 'Invalid evidence ID' });
    }

    const { data: taskRows, error: taskError } = (await supabase
      .from('analysis_tasks')
      .select('id')
      .eq('evidence_id', evidenceId)
      .or(`analyst_id.eq.${analyst.id},analyst_wallet.eq.${walletMatch}`)
      .limit(1)) || {};
    if (taskError) throw taskError;
    if (!taskRows || taskRows.length === 0) {
      return res.status(403).json({ success: false, error: 'Evidence not assigned to you' });
    }

    const verification = await integratedEvidenceService.verifyEvidence(evidenceId);
    await logAudit('analysis_verification', analyst, {
      evidence_id: evidenceId,
      result: verification.overallValid ? 'valid' : 'mismatch',
    });

    res.json({ success: true, data: verification });
  } catch (error) {
    console.error('Analyst verify error:', error);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
};

// ---------------------------------------------------------------------------
// GET /analyst/evidence/:id/blockchain  (read-only blockchain panel)
// ---------------------------------------------------------------------------
const getEvidenceBlockchain = async (req, res) => {
  try {
    const analyst = req.user;
    const walletMatch = analyst.wallet_address || analyst.email;
    const evidenceId = positiveInteger(req.params.id);
    if (!evidenceId) {
      return res.status(400).json({ success: false, error: 'Invalid evidence ID' });
    }

    const { data: taskRows, error: taskError } = (await supabase
      .from('analysis_tasks')
      .select('id')
      .eq('evidence_id', evidenceId)
      .or(`analyst_id.eq.${analyst.id},analyst_wallet.eq.${walletMatch}`)
      .limit(1)) || {};
    if (taskError) throw taskError;
    if (!taskRows || taskRows.length === 0) {
      return res.status(403).json({ success: false, error: 'Evidence not assigned to you' });
    }

    const { data: evidence, error } = (await supabase
      .from('evidence')
      .select('id, name, hash, ipfs_cid, blockchain_tx_hash, blockchain_block_number, gas_used, blockchain_verified, blockchain_timestamp, timestamp')
      .eq('id', evidenceId)
      .single()) || {};
    if (error) throw error;
    if (!evidence) {
      return res.status(404).json({ success: false, error: 'Evidence not found' });
    }

    let explorerUrl = null;
    if (evidence.blockchain_tx_hash) {
      try {
        explorerUrl = blockchainService.getExplorerUrl(evidence.blockchain_tx_hash);
      } catch {
        explorerUrl = null;
      }
    }

    res.json({
      success: true,
      data: {
        evidence_id: evidence.id,
        sha256: evidence.hash,
        ipfs_cid: evidence.ipfs_cid,
        blockchain: {
          tx_hash: evidence.blockchain_tx_hash,
          block_number: evidence.blockchain_block_number,
          gas_used: evidence.gas_used,
          status: evidence.blockchain_verified ? 'verified' : 'recorded',
          timestamp: evidence.blockchain_timestamp || evidence.timestamp,
          network: (blockchainService.getNetworkInfo && blockchainService.getNetworkInfo().name) || 'Polygon',
        },
        verification_result: evidence.blockchain_verified ? 'verified' : 'pending',
        explorer_url: explorerUrl,
        immutable: Boolean(evidence.blockchain_tx_hash),
      },
    });
  } catch (error) {
    console.error('Analyst blockchain panel error:', error);
    res.status(500).json({ success: false, error: 'Failed to load blockchain record' });
  }
};

module.exports = {
  getStats,
  getQueue,
  getTaskDetail,
  startAnalysis,
  updateTaskProgress,
  saveReport,
  getReports,
  getTools,
  searchAll,
  getAnalystEvidence,
  getAnalystCases,
  verifyEvidenceIntegrity,
  getEvidenceBlockchain,
  sanitizeTask,
  sanitizeReport,
  buildCustodyTimeline,
};
