const crypto = require('crypto');
const { supabase } = require('../config');
const {
  stableUserId,
  canAccessCase,
  canAccessEvidence,
} = require('../middleware/caseAccess');

/**
 * Chain-of-custody ledger (roadmap M4 / spec: initiate chain of custody).
 *
 * Every significant action on an evidence item or case appends an entry to
 * custody_log. Each entry stores the SHA-256 of the previous entry for the
 * same evidence item, forming a hash chain so tampering with history is
 * detectable. Entries are append-only: there is no update or delete route.
 */

/** Canonical JSON: sorted keys so JSONB round-trips hash identically. */
function canonical(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonical).join(',') + ']';
  return '{' + Object.keys(obj).sort().map((k) => JSON.stringify(k) + ':' + canonical(obj[k])).join(',') + '}';
}

/** Hash payload uses only DB-stable fields; created_at is stored, not hashed,
 *  because TIMESTAMPTZ normalization would break recomputation. */
function custodyPayload({ evidenceId, caseId, action, actor, details, prevHash }) {
  return canonical({
    action,
    actor,
    case_id: caseId,
    details: details || {},
    evidence_id: evidenceId,
    prev_hash: prevHash,
  });
}

function actorOf(user) {
  return {
    actor: stableUserId(user) || 'unknown',
    actor_name: user.full_name || user.name || user.email || null,
    actor_role: user.role || null,
  };
}

function clientIp(req) {
  return (req && (req.ip || (req.headers && req.headers['x-forwarded-for']))) || null;
}

/**
 * Append a custody entry. Throws on database error so callers can decide
 * whether the action itself should fail (downloads) or just log (uploads).
 */
async function logCustody({ evidenceId = null, caseId = null, action, user, details = {}, req = null }) {
  const { actor, actor_name, actor_role } = actorOf(user || {});
  let prevHash = null;
  if (evidenceId != null) {
    const { data: last, error: lastErr } = await supabase
      .from('custody_log')
      .select('entry_hash')
      .eq('evidence_id', evidenceId)
      .order('id', { ascending: false })
      .limit(1);
    if (lastErr) throw lastErr;
    if (last && last.length > 0) prevHash = last[0].entry_hash;
  }
  const createdAt = new Date().toISOString();
  const entryHash = crypto
    .createHash('sha256')
    .update(custodyPayload({ evidenceId, caseId, action, actor, details, prevHash }))
    .digest('hex');

  const { data, error } = await supabase
    .from('custody_log')
    .insert({
      evidence_id: evidenceId,
      case_id: caseId,
      action,
      actor,
      actor_name,
      actor_role,
      details,
      ip_address: req ? String(clientIp(req) || '') : null,
      prev_hash: prevHash,
      entry_hash: entryHash,
      created_at: createdAt,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function loadEvidenceOr404(req, res, evidenceId) {
  const id = parseInt(evidenceId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid evidence id' });
    return null;
  }
  const { data: ev, error } = await supabase.from('evidence').select('*').eq('id', id).single();
  if (error || !ev) {
    res.status(404).json({ error: 'Evidence not found' });
    return null;
  }
  if (!(await canAccessEvidence(req.user, ev))) {
    res.status(403).json({ error: 'You do not have access to this evidence' });
    return null;
  }
  return ev;
}

// GET /api/custody/evidence/:id - full custody trail for one item
const getEvidenceCustody = async (req, res) => {
  try {
    const ev = await loadEvidenceOr404(req, res, req.params.id);
    if (!ev) return;
    const { data, error } = await supabase
      .from('custody_log')
      .select('*')
      .eq('evidence_id', ev.id)
      .order('id', { ascending: true });
    if (error) throw error;
    res.json({ success: true, evidence_id: ev.id, entries: data || [] });
  } catch (e) {
    console.error('getEvidenceCustody error:', e);
    res.status(500).json({ error: 'Failed to load custody log' });
  }
};

// GET /api/custody/case/:id - custody trail for a whole case
const getCaseCustody = async (req, res) => {
  try {
    const cid = parseInt(req.params.id, 10);
    if (isNaN(cid)) return res.status(400).json({ error: 'Invalid case id' });
    if (!(await canAccessCase(req.user, cid))) {
      return res.status(403).json({ error: 'You do not have access to this case' });
    }
    const { data, error } = await supabase
      .from('custody_log')
      .select('*')
      .eq('case_id', cid)
      .order('id', { ascending: true });
    if (error) throw error;
    res.json({ success: true, case_id: cid, entries: data || [] });
  } catch (e) {
    console.error('getCaseCustody error:', e);
    res.status(500).json({ error: 'Failed to load custody log' });
  }
};

// GET /api/custody/evidence/:id/verify-chain - recompute the hash chain
const verifyCustodyChain = async (req, res) => {
  try {
    const ev = await loadEvidenceOr404(req, res, req.params.id);
    if (!ev) return;
    const { data: entries, error } = await supabase
      .from('custody_log')
      .select('*')
      .eq('evidence_id', ev.id)
      .order('id', { ascending: true });
    if (error) throw error;

    let prevHash = null;
    let brokenAt = null;
    for (const entry of entries || []) {
      if (entry.prev_hash !== prevHash) {
        brokenAt = entry.id;
        break;
      }
      const recomputed = crypto
        .createHash('sha256')
        .update(
          custodyPayload({
            evidenceId: entry.evidence_id,
            caseId: entry.case_id,
            action: entry.action,
            actor: entry.actor,
            details: entry.details,
            prevHash: entry.prev_hash,
          }),
        )
        .digest('hex');
      if (recomputed !== entry.entry_hash) {
        brokenAt = entry.id;
        break;
      }
      prevHash = entry.entry_hash;
    }
    res.json({
      success: true,
      evidence_id: ev.id,
      entries: (entries || []).length,
      chain_valid: brokenAt === null,
      broken_at_entry: brokenAt,
    });
  } catch (e) {
    console.error('verifyCustodyChain error:', e);
    res.status(500).json({ error: 'Failed to verify custody chain' });
  }
};

module.exports = { logCustody, getEvidenceCustody, getCaseCustody, verifyCustodyChain };
