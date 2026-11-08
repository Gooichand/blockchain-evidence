const { supabase } = require('../config');
const { stableUserId, canAccessCase, canAccessEvidence } = require('../middleware/caseAccess');
const { logCustody } = require('./custodyController');
const { isCaseClosed } = require('../services/caseHelpers');

/**
 * Case notes and annotations (roadmap M10 / spec: add case notes).
 *
 * Notes are timestamped and author-stamped. Edits never overwrite: a note
 * belongs to a note_group, and every edit inserts a new version row, so the
 * full history survives. Deletion is a new version flagged is_deleted.
 */

function authorOf(user) {
  return {
    author: stableUserId(user) || 'unknown',
    author_name: user.full_name || user.name || user.email || null,
    author_role: user.role || null,
  };
}

async function checkCaseAccess(req, res, caseId) {
  const cid = parseInt(caseId, 10);
  if (isNaN(cid)) {
    res.status(400).json({ error: 'Invalid case id' });
    return null;
  }
  if (!(await canAccessCase(req.user, cid))) {
    res.status(403).json({ error: 'You do not have access to this case' });
    return null;
  }
  return cid;
}

// Latest non-deleted version per note_group for a case (optionally one evidence item)
async function fetchCurrentNotes(caseId, evidenceId) {
  let q = supabase
    .from('case_notes')
    .select('*')
    .eq('case_id', caseId)
    .order('id', { ascending: true });
  if (evidenceId != null) q = q.eq('evidence_id', evidenceId);
  const { data, error } = await q;
  if (error) throw error;
  const latest = new Map();
  for (const row of data || []) latest.set(row.note_group, row);
  return [...latest.values()].filter((r) => !r.is_deleted);
}

// GET /api/cases/:id/notes
const listCaseNotes = async (req, res) => {
  try {
    const cid = await checkCaseAccess(req, res, req.params.id);
    if (cid === null) return;
    const evidenceId = req.query.evidence_id != null ? parseInt(req.query.evidence_id, 10) : null;
    const notes = await fetchCurrentNotes(cid, isNaN(evidenceId) ? null : evidenceId);
    res.json({ success: true, notes });
  } catch (e) {
    console.error('listCaseNotes error:', e);
    res.status(500).json({ error: 'Failed to load notes' });
  }
};

// POST /api/cases/:id/notes  { content, evidence_id?, annotation? }
const addCaseNote = async (req, res) => {
  try {
    const cid = await checkCaseAccess(req, res, req.params.id);
    if (cid === null) return;
    // M12: closed cases are immutable - no new notes until reopened
    if (await isCaseClosed(cid)) {
      return res.status(409).json({ error: 'This case is closed. Reopen it before adding notes.' });
    }
    const { content, evidence_id, annotation } = req.body || {};
    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: 'Note content is required' });
    }
    if (String(content).length > 10000) {
      return res.status(400).json({ error: 'Note is too long (max 10000 characters)' });
    }
    let evId = null;
    if (evidence_id != null) {
      evId = parseInt(evidence_id, 10);
      if (isNaN(evId)) return res.status(400).json({ error: 'Invalid evidence id' });
      const { data: ev, error: evErr } = await supabase.from('evidence').select('*').eq('id', evId).single();
      if (evErr || !ev) return res.status(404).json({ error: 'Evidence not found' });
      if (parseInt(ev.case_id, 10) !== cid) {
        return res.status(400).json({ error: 'Evidence does not belong to this case' });
      }
      if (!(await canAccessEvidence(req.user, ev))) {
        return res.status(403).json({ error: 'You do not have access to this evidence' });
      }
    }
    const { author, author_name, author_role } = authorOf(req.user);
    const { data, error } = await supabase
      .from('case_notes')
      .insert({
        case_id: cid,
        evidence_id: evId,
        version: 1,
        content: String(content).trim(),
        author,
        author_name,
        author_role,
        annotation: annotation || null,
      })
      .select()
      .single();
    if (error) throw error;
    if (evId != null) {
      try {
        await logCustody({
          evidenceId: evId,
          caseId: cid,
          action: 'note_added',
          user: req.user,
          details: { note_group: data.note_group },
          req,
        });
      } catch (logErr) {
        console.error('custody log for note failed:', logErr);
      }
    }
    res.status(201).json({ success: true, note: data });
  } catch (e) {
    console.error('addCaseNote error:', e);
    res.status(500).json({ error: 'Failed to add note' });
  }
};

async function loadGroup(req, res, groupId) {
  const { data, error } = await supabase
    .from('case_notes')
    .select('*')
    .eq('note_group', groupId)
    .order('version', { ascending: true });
  if (error) throw error;
  if (!data || data.length === 0) {
    res.status(404).json({ error: 'Note not found' });
    return null;
  }
  const cid = data[0].case_id;
  if (!(await canAccessCase(req.user, cid))) {
    res.status(403).json({ error: 'You do not have access to this case' });
    return null;
  }
  return data;
}

// PUT /api/notes/group/:groupId  { content } -> new version
const editNote = async (req, res) => {
  try {
    const rows = await loadGroup(req, res, req.params.groupId);
    if (!rows) return;
    // M12: closed cases are immutable - notes are frozen until reopened
    if (await isCaseClosed(rows[0].case_id)) {
      return res.status(409).json({ error: 'This case is closed. Reopen it before editing notes.' });
    }
    const { content } = req.body || {};
    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: 'Note content is required' });
    }
    if (String(content).length > 10000) {
      return res.status(400).json({ error: 'Note is too long (max 10000 characters)' });
    }
    const latest = rows[rows.length - 1];
    if (latest.is_deleted) return res.status(400).json({ error: 'Note has been deleted' });
    const sid = stableUserId(req.user);
    if (latest.author !== sid && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the author can edit this note' });
    }
    const { author, author_name, author_role } = authorOf(req.user);
    const { data, error } = await supabase
      .from('case_notes')
      .insert({
        case_id: latest.case_id,
        evidence_id: latest.evidence_id,
        note_group: latest.note_group,
        version: latest.version + 1,
        content: String(content).trim(),
        author,
        author_name,
        author_role,
        annotation: latest.annotation,
      })
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, note: data });
  } catch (e) {
    console.error('editNote error:', e);
    res.status(500).json({ error: 'Failed to edit note' });
  }
};

// DELETE /api/notes/group/:groupId -> append is_deleted version (history kept)
const deleteNote = async (req, res) => {
  try {
    const rows = await loadGroup(req, res, req.params.groupId);
    if (!rows) return;
    // M12: closed cases are immutable - notes are frozen until reopened
    if (await isCaseClosed(rows[0].case_id)) {
      return res.status(409).json({ error: 'This case is closed. Reopen it before deleting notes.' });
    }
    const latest = rows[rows.length - 1];
    const sid = stableUserId(req.user);
    if (latest.author !== sid && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the author can delete this note' });
    }
    const { author, author_name, author_role } = authorOf(req.user);
    const { data, error } = await supabase
      .from('case_notes')
      .insert({
        case_id: latest.case_id,
        evidence_id: latest.evidence_id,
        note_group: latest.note_group,
        version: latest.version + 1,
        content: latest.content,
        author,
        author_name,
        author_role,
        annotation: latest.annotation,
        is_deleted: true,
      })
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, note: data });
  } catch (e) {
    console.error('deleteNote error:', e);
    res.status(500).json({ error: 'Failed to delete note' });
  }
};

// GET /api/notes/group/:groupId/history
const noteHistory = async (req, res) => {
  try {
    const rows = await loadGroup(req, res, req.params.groupId);
    if (!rows) return;
    res.json({ success: true, history: rows });
  } catch (e) {
    console.error('noteHistory error:', e);
    res.status(500).json({ error: 'Failed to load note history' });
  }
};

module.exports = { listCaseNotes, addCaseNote, editNote, deleteNote, noteHistory };
