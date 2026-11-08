const { supabase, connectedUsers } = require('../config');

// io instance set after server initialization (same pattern as notificationController)
let io = null;
const setIO = (socketIO) => {
  io = socketIO;
};
const { stableUserId, canAccessEvidence } = require('../middleware/caseAccess');
const { logCustody } = require('./custodyController');

/**
 * Forensic analysis request workflow (roadmap M11 / spec: request forensic
 * analysis). An investigator picks one of their evidence items, chooses an
 * analysis type and priority, and the request lands in the analyst queue
 * (analysis_tasks, status pending). Analysts are notified.
 */

const ANALYSIS_TYPES = ['disk', 'memory', 'network', 'mobile', 'multimedia', 'report_review', 'general'];
const PRIORITIES = ['low', 'normal', 'high', 'critical'];

async function notifyAnalysts({ title, message, data }) {
  const { data: analysts, error } = await supabase
    .from('users')
    .select('id, wallet_address')
    .eq('role', 'forensic_analyst');
  if (error) {
    console.error('notifyAnalysts lookup error:', error);
    return;
  }
  const rows = (analysts || []).map((a) => ({
    user_wallet: a.wallet_address || `user_${a.id}`,
    title,
    message,
    type: 'analysis_request',
    data,
    is_read: false,
  }));
  if (rows.length === 0) return;
  const { data: created, error: insErr } = await supabase.from('notifications').insert(rows).select();
  if (insErr) {
    console.error('notifyAnalysts insert error:', insErr);
    return;
  }
  (created || []).forEach((n) => {
    if (io && connectedUsers && connectedUsers.has(n.user_wallet)) {
      io.to(n.user_wallet).emit('notification', n);
    }
  });
}

// POST /api/analysis/requests  { evidence_id, analysis_type, priority, notes }
const createRequest = async (req, res) => {
  try {
    const { evidence_id, analysis_type, priority, notes } = req.body || {};
    const evId = parseInt(evidence_id, 10);
    if (isNaN(evId)) return res.status(400).json({ error: 'evidence_id is required' });
    const type = ANALYSIS_TYPES.includes(analysis_type) ? analysis_type : null;
    if (!type) {
      return res.status(400).json({ error: `analysis_type must be one of: ${ANALYSIS_TYPES.join(', ')}` });
    }
    const prio = PRIORITIES.includes(priority) ? priority : 'normal';
    if (notes != null && String(notes).length > 5000) {
      return res.status(400).json({ error: 'Notes are too long (max 5000 characters)' });
    }

    const { data: ev, error: evErr } = await supabase.from('evidence').select('*').eq('id', evId).single();
    if (evErr || !ev) return res.status(404).json({ error: 'Evidence not found' });
    if (!(await canAccessEvidence(req.user, ev))) {
      return res.status(403).json({ error: 'You do not have access to this evidence' });
    }

    const { data: dup } = await supabase
      .from('analysis_tasks')
      .select('id, status')
      .eq('evidence_id', evId)
      .in('status', ['pending', 'in_progress'])
      .limit(1);
    if (dup && dup.length > 0) {
      return res.status(409).json({ error: 'An analysis request is already open for this evidence', task_id: dup[0].id });
    }

    const sid = stableUserId(req.user);
    const caseId = parseInt(ev.case_id, 10);
    const { data: task, error } = await supabase
      .from('analysis_tasks')
      .insert({
        evidence_id: evId,
        case_id: isNaN(caseId) ? null : caseId,
        status: 'pending',
        priority: prio,
        progress: 0,
        requested_by: sid,
        notes: notes ? String(notes).trim() : null,
        analysis_type: type,
      })
      .select()
      .single();
    if (error) throw error;

    try {
      await logCustody({
        evidenceId: evId,
        caseId: isNaN(caseId) ? null : caseId,
        action: 'analysis_requested',
        user: req.user,
        details: { task_id: task.id, analysis_type: type, priority: prio },
        req,
      });
    } catch (logErr) {
      console.error('custody log for analysis request failed:', logErr);
    }

    await notifyAnalysts({
      title: 'New forensic analysis request',
      message: `${req.user.full_name || req.user.email || sid} requested ${type} analysis on evidence #${evId}${ev.name ? ` (${ev.name})` : ''}.`,
      data: { task_id: task.id, evidence_id: evId, analysis_type: type, priority: prio },
    });

    res.status(201).json({ success: true, request: task });
  } catch (e) {
    console.error('createRequest error:', e);
    res.status(500).json({ error: 'Failed to create analysis request' });
  }
};

// GET /api/analysis/requests/mine - requests made by this investigator
const listMine = async (req, res) => {
  try {
    const sid = stableUserId(req.user);
    const { data, error } = await supabase
      .from('analysis_tasks')
      .select('id, evidence_id, case_id, status, priority, progress, analysis_type, notes, requested_by, assigned_at, started_at, completed_at, created_at')
      .eq('requested_by', sid)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, requests: data || [] });
  } catch (e) {
    console.error('listMine error:', e);
    res.status(500).json({ error: 'Failed to load analysis requests' });
  }
};

// GET /api/analysis/requests/:id - requester, analysts and wide roles
const getRequest = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid request id' });
    const { data: task, error } = await supabase.from('analysis_tasks').select('*').eq('id', id).single();
    if (error || !task) return res.status(404).json({ error: 'Analysis request not found' });
    const sid = stableUserId(req.user);
    const privileged = ['admin', 'forensic_analyst', 'auditor', 'evidence_manager'].includes(req.user.role);
    if (!privileged && task.requested_by !== sid) {
      return res.status(403).json({ error: 'You do not have access to this request' });
    }
    res.json({ success: true, request: task });
  } catch (e) {
    console.error('getRequest error:', e);
    res.status(500).json({ error: 'Failed to load analysis request' });
  }
};

module.exports = { createRequest, listMine, getRequest, setIO };
