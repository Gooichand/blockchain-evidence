const { supabase } = require('../config');
const { stableUserId, canAccessEvidence } = require('../middleware/caseAccess');
const { logCustody } = require('./custodyController');

/**
 * Evidence transfer with acceptance (roadmap S6).
 *
 * The current custodian of an evidence item hands it to another user with a
 * reason. The receiver must explicitly accept: acceptance writes hash-chained
 * custody entries (transfer_initiated by the sender, transfer_accepted by the
 * receiver) so both sides of the handoff are recorded. The item's current
 * custodian is the latest accepted transfer's receiver, or the original
 * uploader when no transfer has been accepted.
 */

const RECIPIENT_ROLES = ['admin', 'investigator', 'evidence_manager', 'legal_professional', 'court_official', 'forensic_analyst'];

function nameOf(u) {
  return u.full_name || u.name || u.email || null;
}

/** Resolve a recipient given as `user_<id>` or a wallet address. */
async function resolveUser(ref) {
  if (!ref) return null;
  const s = String(ref).trim();
  let q = supabase.from('users').select('id, full_name, email, role, wallet_address');
  if (/^user_\d+$/.test(s)) q = q.eq('id', parseInt(s.slice(5), 10));
  else q = q.eq('wallet_address', s);
  const { data, error } = await q.maybeSingle();
  if (error || !data) return null;
  return { sid: data.wallet_address || `user_${data.id}`, name: nameOf(data), role: data.role };
}

/** Latest accepted transfer for an item, or null. */
async function acceptedTransfer(evidenceId) {
  const { data, error } = await supabase
    .from('evidence_transfers')
    .select('*')
    .eq('evidence_id', evidenceId)
    .eq('status', 'accepted')
    .order('id', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data && data[0] ? data[0] : null;
}

async function loadEvidence(id) {
  const { data, error } = await supabase.from('evidence').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

async function notify(userSid, title, message, data) {
  try {
    await supabase.from('notifications').insert({
      user_wallet: userSid, title, message, type: 'evidence_transfer', data: data || {}, is_read: false,
    });
  } catch (e) {
    console.error('transfer notification failed:', e);
  }
}

// POST /api/evidence/:id/transfer { to_user, reason }
const initiateTransfer = async (req, res) => {
  try {
    const evId = parseInt(req.params.id, 10);
    if (isNaN(evId)) return res.status(400).json({ error: 'Invalid evidence id' });
    const { to_user, reason } = req.body || {};
    if (!to_user || !reason || !String(reason).trim()) {
      return res.status(400).json({ error: 'Recipient and reason are required' });
    }
    const ev = await loadEvidence(evId);
    if (!ev) return res.status(404).json({ error: 'Evidence not found' });
    if (!(await canAccessEvidence(req.user, ev))) {
      return res.status(403).json({ error: 'You do not have access to this evidence' });
    }
    const fromSid = stableUserId(req.user);
    const cust = await acceptedTransfer(evId);
    const currentCustodian = cust ? cust.to_user : ev.submitted_by;
    if (currentCustodian && currentCustodian !== fromSid) {
      return res.status(403).json({ error: 'Only the current custodian can transfer this item' });
    }
    const recipient = await resolveUser(to_user);
    if (!recipient) return res.status(404).json({ error: 'Recipient user not found' });
    if (recipient.sid === fromSid) return res.status(400).json({ error: 'Cannot transfer evidence to yourself' });
    if (recipient.role && !RECIPIENT_ROLES.includes(recipient.role)) {
      return res.status(400).json({ error: 'That user cannot receive evidence' });
    }
    const { data: pendingRows, error: pendErr } = await supabase
      .from('evidence_transfers')
      .select('id')
      .eq('evidence_id', evId)
      .eq('status', 'pending');
    if (pendErr) throw pendErr;
    if (pendingRows && pendingRows.length) {
      return res.status(409).json({ error: 'A transfer for this item is already pending' });
    }

    const fromName = nameOf(req.user);
    const { data: transfer, error } = await supabase
      .from('evidence_transfers')
      .insert({
        evidence_id: evId,
        case_id: ev.case_id != null && ev.case_id !== '' ? parseInt(ev.case_id, 10) || null : null,
        from_user: fromSid,
        from_name: fromName,
        to_user: recipient.sid,
        to_name: recipient.name,
        reason: String(reason).trim(),
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;

    await logCustody({
      evidenceId: evId,
      caseId: transfer.case_id,
      action: 'transfer_initiated',
      user: req.user,
      details: { transfer_id: transfer.id, to_user: recipient.sid, to_name: recipient.name, reason: transfer.reason },
      req,
    });
    await notify(recipient.sid, 'Evidence transfer pending',
      `${fromName || fromSid} transferred evidence #${evId} (${ev.title || 'untitled'}) to you. Accept or decline it from the Transfers inbox.`,
      { transfer_id: transfer.id, evidence_id: evId });

    res.status(201).json({ success: true, transfer });
  } catch (e) {
    console.error('initiateTransfer error:', e);
    res.status(500).json({ error: 'Failed to initiate transfer' });
  }
};

// Shared accept/decline handler
async function respond(req, res, decision) {
  try {
    const tid = parseInt(req.params.id, 10);
    if (isNaN(tid)) return res.status(400).json({ error: 'Invalid transfer id' });
    const { data: transfer, error } = await supabase
      .from('evidence_transfers').select('*').eq('id', tid).maybeSingle();
    if (error) throw error;
    if (!transfer) return res.status(404).json({ error: 'Transfer not found' });
    const sid = stableUserId(req.user);
    if (transfer.to_user !== sid) {
      return res.status(403).json({ error: 'Only the intended recipient can respond to this transfer' });
    }
    if (transfer.status !== 'pending') {
      return res.status(409).json({ error: `Transfer already ${transfer.status}` });
    }
    const { data: updated, error: upErr } = await supabase
      .from('evidence_transfers')
      .update({ status: decision, responded_at: new Date().toISOString() })
      .eq('id', tid)
      .select()
      .single();
    if (upErr) throw upErr;

    await logCustody({
      evidenceId: transfer.evidence_id,
      caseId: transfer.case_id,
      action: decision === 'accepted' ? 'transfer_accepted' : 'transfer_declined',
      user: req.user,
      details: { transfer_id: tid, from_user: transfer.from_user, from_name: transfer.from_name, reason: transfer.reason },
      req,
    });
    await notify(transfer.from_user, `Evidence transfer ${decision}`,
      `${nameOf(req.user) || sid} ${decision} the transfer of evidence #${transfer.evidence_id}.`,
      { transfer_id: tid, evidence_id: transfer.evidence_id });

    res.json({ success: true, transfer: updated });
  } catch (e) {
    console.error('respondTransfer error:', e);
    res.status(500).json({ error: 'Failed to respond to transfer' });
  }
}

const acceptTransfer = (req, res) => respond(req, res, 'accepted');
const declineTransfer = (req, res) => respond(req, res, 'declined');

// GET /api/transfers/mine - incoming and outgoing transfers for the caller
const myTransfers = async (req, res) => {
  try {
    const sid = stableUserId(req.user);
    const { data, error } = await supabase
      .from('evidence_transfers')
      .select('*')
      .or(`from_user.eq.${sid},to_user.eq.${sid}`)
      .order('id', { ascending: false })
      .limit(100);
    if (error) throw error;
    const rows = data || [];
    res.json({
      success: true,
      incoming: rows.filter(t => t.to_user === sid),
      outgoing: rows.filter(t => t.from_user === sid),
    });
  } catch (e) {
    console.error('myTransfers error:', e);
    res.status(500).json({ error: 'Failed to load transfers' });
  }
};

// GET /api/transfers/recipients - users evidence can be handed to
const recipients = async (req, res) => {
  try {
    const sid = stableUserId(req.user);
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, wallet_address')
      .in('role', RECIPIENT_ROLES)
      .order('id', { ascending: true })
      .limit(200);
    if (error) throw error;
    const users = (data || [])
      .map(u => ({ user: u.wallet_address || `user_${u.id}`, name: nameOf(u), role: u.role }))
      .filter(u => u.user !== sid);
    res.json({ success: true, recipients: users });
  } catch (e) {
    console.error('recipients error:', e);
    res.status(500).json({ error: 'Failed to load recipients' });
  }
};

// GET /api/cases/:id/custodians - current custodian per evidence item of a case
const caseCustodians = async (req, res) => {
  try {
    const cid = String(req.params.id);
    const { data: evidence, error } = await supabase
      .from('evidence').select('id, submitted_by').eq('case_id', cid);
    if (error) throw error;
    const rows = evidence || [];
    const ids = rows.map(r => r.id);
    let accepted = [];
    if (ids.length) {
      const { data: tr, error: trErr } = await supabase
        .from('evidence_transfers')
        .select('evidence_id, to_user, to_name, id')
        .in('evidence_id', ids)
        .eq('status', 'accepted')
        .order('id', { ascending: true });
      if (trErr) throw trErr;
      accepted = tr || [];
    }
    const latest = {};
    accepted.forEach(t => { latest[t.evidence_id] = t; });
    const custodians = {};
    rows.forEach(r => {
      const t = latest[r.id];
      custodians[r.id] = t
        ? { custodian: t.to_user, custodian_name: t.to_name, via: 'transfer' }
        : { custodian: r.submitted_by, custodian_name: null, via: 'uploader' };
    });
    res.json({ success: true, custodians });
  } catch (e) {
    console.error('caseCustodians error:', e);
    res.status(500).json({ error: 'Failed to load custodians' });
  }
};

module.exports = { initiateTransfer, acceptTransfer, declineTransfer, myTransfers, recipients, caseCustodians };
