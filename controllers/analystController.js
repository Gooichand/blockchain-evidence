const { supabase } = require('../config');
const crypto = require('crypto');
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
    const { status, priority, search, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
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
        query = query.in('evidence_id', ids);
      }
    }

    query = query.order('assigned_at', { ascending: false }).range(offset, offset + limitNum - 1);
    ({ data, error } = await query);
    if (error) throw error;

    const { count: total, error: countError } = (await supabase
      .from('analysis_tasks')
      .select('id', { count: 'exact', head: true })
      .or(`analyst_id.eq.${analyst.id},analyst_wallet.eq.${walletMatch}`)) || {};
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
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
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
    const evidenceId = parseInt(req.params.id, 10);
    if (isNaN(evidenceId)) {
      return res.status(400).json({ success: false, error: 'Invalid evidence ID' });
    }

    const { priority = 'medium', estimated_time_minutes = null, caseId = null } = req.body || {};

    // Task may already exist (resume path).
    const { data: existing, error: existingError } = (await supabase
      .from('analysis_tasks')
      .select('id, status')
      .eq('evidence_id', evidenceId)
      .or(`analyst_id.eq.${analyst.id},analyst_wallet.eq.${walletMatch}`)
      .order('created_at', { ascending: false })
      .limit(1)) || {};
    if (existingError) throw existingError;

    let taskId;
    if (existing && existing.length > 0) {
      taskId = existing[0].id;
      const { error: updateError } = (await supabase
        .from('analysis_tasks')
        .update({
          status: existing[0].status === 'completed' ? 'in_progress' : existing[0].status,
          started_at: existing[0].status === 'pending' ? new Date().toISOString() : undefined,
          priority,
          estimated_time_minutes,
        })
        .eq('id', taskId)) || {};
      if (updateError) throw updateError;
    } else {
      const safeCaseId = parseInt(caseId, 10) || null;
      const { data: newTask, error: insertError } = (await supabase
        .from('analysis_tasks')
        .insert({
          evidence_id: evidenceId,
          case_id: safeCaseId,
          analyst_id: analyst.id,
          analyst_wallet: analyst.wallet_address || analyst.email,
          status: 'in_progress',
          priority,
          progress: 0,
          started_at: new Date().toISOString(),
          requested_by: analyst.email || analyst.full_name,
          estimated_time_minutes,
        })
        .select('id')
        .single()) || {};
      if (insertError) throw insertError;
      taskId = newTask.id;
    }

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
    const walletMatch = analyst.wallet_address || analyst.email;
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ success: false, error: 'Invalid task ID' });
    }

    const progress = Math.min(Math.max(parseInt(req.body?.progress, 10) || 0, 0), 100);
    const notes = typeof req.body?.notes === 'string' ? req.body.notes.slice(0, 5000) : undefined;

    const { data: rows, error } = (await supabase
      .from('analysis_tasks')
      .select('id, status')
      .eq('id', taskId)
      .or(`analyst_id.eq.${analyst.id},analyst_wallet.eq.${walletMatch}`)
      .limit(1)) || {};
    if (error) throw error;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Task not found or not assigned to you' });
    }

    const patch = { progress, status: progress >= 100 ? 'in_progress' : rows[0].status };
    if (notes !== undefined) patch.notes = notes;
    const { error: updateError } = (await supabase
      .from('analysis_tasks')
      .update(patch)
      .eq('id', taskId)) || {};
    if (updateError) throw updateError;

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
    const walletMatch = analyst.wallet_address || analyst.email;
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ success: false, error: 'Invalid task ID' });
    }

    const { data: taskRows, error: taskError } = (await supabase
      .from('analysis_tasks')
      .select('id, evidence_id, case_id, status')
      .eq('id', taskId)
      .or(`analyst_id.eq.${analyst.id},analyst_wallet.eq.${walletMatch}`)
      .limit(1)) || {};
    if (taskError) throw taskError;
    if (!taskRows || taskRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Task not found or not assigned to you' });
    }
    const task = taskRows[0];

    const resultSummary = typeof req.body?.result_summary === 'string' ? req.body.result_summary.slice(0, 10000) : null;
    const findings = typeof req.body?.findings === 'string' ? req.body.findings.slice(0, 50000) : null;
    const submit = req.body?.submit === true;
    if (!resultSummary && !findings) {
      return res.status(400).json({ success: false, error: 'Report requires a result summary or findings' });
    }

    // Report hash anchors the report content (SHA-256 of summary + findings).
    const reportHash = crypto
      .createHash('sha256')
      .update(`${resultSummary || ''}|${findings || ''}`)
      .digest('hex');

    const status = submit ? 'submitted' : 'draft';
    const nowIso = new Date().toISOString();

    const { data: existing, error: existingError } = (await supabase
      .from('analysis_reports')
      .select('id')
      .eq('task_id', taskId)
      .limit(1)) || {};
    if (existingError) throw existingError;

    let reportId;
    if (existing && existing.length > 0) {
      reportId = existing[0].id;
      const { error: updateError } = (await supabase
        .from('analysis_reports')
        .update({
          status,
          report_hash: reportHash,
          result_summary: resultSummary,
          findings,
          updated_at: nowIso,
          submitted_at: submit ? nowIso : undefined,
        })
        .eq('id', reportId)) || {};
      if (updateError) throw updateError;
    } else {
      const { data: newReport, error: insertError } = (await supabase
        .from('analysis_reports')
        .insert({
          task_id: taskId,
          evidence_id: task.evidence_id,
          case_id: task.case_id,
          analyst_id: analyst.id,
          analyst_wallet: analyst.wallet_address || analyst.email,
          status,
          report_hash: reportHash,
          result_summary: resultSummary,
          findings,
          submitted_at: submit ? nowIso : null,
        })
        .select('id')
        .single()) || {};
      if (insertError) throw insertError;
      reportId = newReport.id;
    }

    // Submitting a report completes the task.
    const taskPatch = submit
      ? { status: 'completed', progress: 100, completed_at: nowIso }
      : { status: 'in_progress', progress: Math.max(task.status === 'pending' ? 10 : 50, 50) };
    const { error: taskUpdateError } = (await supabase
      .from('analysis_tasks')
      .update(taskPatch)
      .eq('id', taskId)) || {};
    if (taskUpdateError) throw taskUpdateError;

    await logAudit(submit ? 'report_submitted' : 'report_saved', analyst, {
      report_id: reportId,
      task_id: taskId,
      report_hash: reportHash.slice(0, 16) + '…',
      submit,
    });

    res.json({
      success: true,
      message: submit ? 'Report submitted successfully' : 'Report draft saved',
      data: { report_id: reportId, task_id: taskId, report_hash: reportHash, status },
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
    const { status, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('analysis_reports')
      .select(
        `id, task_id, evidence_id, case_id, status, report_hash, result_summary, findings, blockchain_verified, created_at, updated_at, submitted_at,
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

    const { count: total, error: countError } = (await supabase
      .from('analysis_reports')
      .select('id', { count: 'exact', head: true })
      .or(`analyst_id.eq.${analyst.id},analyst_wallet.eq.${walletMatch}`)) || {};
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
      return res.json({ success: true, data: { tasks: [], reports: [] } });
    }

    const { data: evRows, error: evError } = (await supabase
      .from('evidence')
      .select('id, name, hash')
      .or(`name.ilike.%${q}%,hash.ilike.%${q}%,file_type.ilike.%${q}%`)
      .limit(100)) || {};
    if (evError) throw evError;
    const evIds = (evRows || []).map((e) => e.id);

    const taskPromise =
      evIds.length > 0
        ? supabase
            .from('analysis_tasks')
            .select(`id, evidence_id, case_id, status, priority, progress, assigned_at`)
            .in('evidence_id', evIds)
            .or(`analyst_id.eq.${analyst.id},analyst_wallet.eq.${walletMatch}`)
            .order('assigned_at', { ascending: false })
            .limit(20)
        : Promise.resolve({ data: [], error: null });

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
    const evidenceId = parseInt(req.params.id, 10);
    if (isNaN(evidenceId)) {
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
    const evidenceId = parseInt(req.params.id, 10);
    if (isNaN(evidenceId)) {
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
