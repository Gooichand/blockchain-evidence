const { supabase } = require('../config');
const { canAccessCase } = require('../middleware/caseAccess');

/**
 * Real case timeline (roadmap S5).
 *
 * Aggregates every real event of a case into one chronological feed:
 *   - custody events (custody_log: uploads, views, downloads, verifications,
 *     transfers, status changes - hash-chained, append-only)
 *   - evidence items added to the case (evidence.created_at)
 *   - case notes (case_notes.created_at)
 *   - analysis steps (analysis_tasks: assigned / started / completed)
 *
 * Each event is typed so the UI can filter by type and group (zoom) by
 * day, week or month. No synthetic or demo events are ever generated.
 */

function custodyEvent(row) {
  return {
    type: 'custody',
    ts: row.created_at || row.timestamp || null,
    action: row.action || 'event',
    title: String(row.action || 'custody event').replace(/_/g, ' '),
    actor_name: row.actor_name || row.actor || null,
    actor_role: row.actor_role || null,
    evidence_id: row.evidence_id != null ? row.evidence_id : null,
    details: row.details || null,
    entry_hash: row.entry_hash || null,
  };
}

function evidenceEvent(row) {
  return {
    type: 'evidence',
    // evidence.timestamp is the upload time in this schema (no created_at)
    ts: row.created_at || row.timestamp || row.uploaded_at || null,
    action: 'evidence_added',
    title: `Evidence added: ${row.title || row.file_name || ('item #' + row.id)}`,
    actor_name: row.uploaded_by_name || row.uploaded_by || null,
    actor_role: null,
    evidence_id: row.id,
    exhibit_id: row.exhibit_id || null,
    details: row.file_name ? { file: row.file_name, hash: row.sha256_hash || row.hash || null } : null,
  };
}

function noteEvent(row) {
  const body = typeof row.content === 'string' ? row.content
    : (row.annotation ? JSON.stringify(row.annotation) : '');
  return {
    type: 'note',
    ts: row.created_at || row.updated_at || null,
    action: 'note_added',
    title: body.length > 90 ? body.slice(0, 90) + '...' : (body || 'Case note'),
    actor_name: row.author_name || row.author || null,
    actor_role: row.author_role || null,
    evidence_id: row.evidence_id != null ? row.evidence_id : null,
    details: body.length > 90 ? { note: body } : null,
  };
}

function analysisEvents(row) {
  const base = {
    type: 'analysis',
    actor_name: row.analyst_wallet || row.requested_by || null,
    actor_role: 'analyst',
    evidence_id: row.evidence_id != null ? row.evidence_id : null,
  };
  const events = [];
  if (row.assigned_at) {
    events.push({ ...base, ts: row.assigned_at, action: 'analysis_assigned', title: `Analysis task assigned (${row.priority || 'medium'} priority)` });
  }
  if (row.started_at) {
    events.push({ ...base, ts: row.started_at, action: 'analysis_started', title: 'Analysis started' });
  }
  if (row.completed_at) {
    events.push({ ...base, ts: row.completed_at, action: 'analysis_completed', title: `Analysis completed${row.status ? ' (' + row.status + ')' : ''}` });
  }
  if (!events.length && row.created_at) {
    events.push({ ...base, ts: row.created_at, action: 'analysis_task', title: `Analysis task (${row.status || 'pending'})` });
  }
  return events;
}

// GET /api/cases/:id/timeline - merged real event feed for one case
const getCaseTimeline = async (req, res) => {
  try {
    const cid = parseInt(req.params.id, 10);
    if (isNaN(cid)) return res.status(400).json({ error: 'Invalid case id' });
    if (!(await canAccessCase(req.user, cid))) {
      return res.status(403).json({ error: 'You do not have access to this case' });
    }

    const [custody, evidence, notes, tasks] = await Promise.all([
      supabase.from('custody_log').select('*').eq('case_id', cid).order('id', { ascending: true }),
      // evidence.case_id is TEXT in this schema
      supabase.from('evidence').select('*').eq('case_id', String(cid)).order('id', { ascending: true }),
      supabase.from('case_notes').select('*').eq('case_id', cid).order('id', { ascending: true }),
      supabase.from('analysis_tasks').select('*').eq('case_id', cid).order('id', { ascending: true }),
    ]);

    const events = [];
    if (!custody.error) events.push(...(custody.data || []).map(custodyEvent));
    if (!evidence.error) events.push(...(evidence.data || []).map(evidenceEvent));
    if (!notes.error) events.push(...(notes.data || []).map(noteEvent));
    if (!tasks.error) events.push(...(tasks.data || []).flatMap(analysisEvents));

    events.sort((a, b) => new Date(b.ts || 0) - new Date(a.ts || 0));

    res.json({
      success: true,
      case_id: cid,
      counts: {
        custody: (custody.data || []).length,
        evidence: (evidence.data || []).length,
        notes: (notes.data || []).length,
        analysis_tasks: (tasks.data || []).length,
      },
      events,
    });
  } catch (e) {
    console.error('getCaseTimeline error:', e);
    res.status(500).json({ error: 'Failed to load case timeline' });
  }
};

module.exports = { getCaseTimeline };
