const { supabase } = require('../config');
const { stableUserId, canAccessCase } = require('../middleware/caseAccess');

/**
 * Case team and collaboration (roadmap S7).
 *
 * The case owner (cases.created_by) or an admin adds co-investigators with a
 * role on the case. Membership lives in case_assignments (is_active rows),
 * which getAccessibleCaseIds already honors, so added members immediately see
 * the case. Comments support @mentions (against team display names or stable
 * user ids); mentioned users get an in-app notification. Team changes and
 * comments appear in the case timeline (S5) via timelineController.
 */

const TEAM_ROLES = ['lead', 'co-investigator', 'analyst', 'viewer'];
// case_assignments.assignment_type is CHECK-constrained to these three values.
const ASSIGNMENT_TYPE = { lead: 'primary', 'co-investigator': 'secondary', analyst: 'secondary', viewer: 'observer' };

function nameOf(u) {
  return u.full_name || u.name || u.email || null;
}

async function loadCase(cid) {
  const { data, error } = await supabase.from('cases').select('*').eq('id', cid).maybeSingle();
  if (error) throw error;
  return data;
}

function isOwnerOrAdmin(user, caseRow) {
  return user.role === 'admin' || (caseRow && caseRow.created_by === stableUserId(user));
}

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

async function notify(userSid, title, message, data, type) {
  try {
    const { notifyUser } = require('../services/notificationService');
    await notifyUser(userSid, title, message, type || 'case_team', data || {});
  } catch (e) {
    console.error('team notification failed:', e);
  }
}

async function resolveNames(sids) {
  const ids = sids.filter(s => /^user_\d+$/.test(s)).map(s => parseInt(s.slice(5), 10));
  const wallets = sids.filter(s => !/^user_\d+$/.test(s));
  const names = {};
  if (!ids.length && !wallets.length) return names;
  let q = supabase.from('users').select('id, full_name, email, role, wallet_address');
  q = ids.length && wallets.length
    ? q.or(`id.in.(${ids.join(',')}),wallet_address.in.(${wallets.join(',')})`)
    : ids.length ? q.in('id', ids) : q.in('wallet_address', wallets);
  const { data } = await q;
  (data || []).forEach(u => { names[u.wallet_address || `user_${u.id}`] = { name: nameOf(u), role: u.role }; });
  return names;
}

// GET /api/cases/:id/team - owner plus active members
const getTeam = async (req, res) => {
  try {
    const cid = parseInt(req.params.id, 10);
    if (isNaN(cid)) return res.status(400).json({ error: 'Invalid case id' });
    if (!(await canAccessCase(req.user, cid))) {
      return res.status(403).json({ error: 'You do not have access to this case' });
    }
    const caseRow = await loadCase(cid);
    if (!caseRow) return res.status(404).json({ error: 'Case not found' });
    const { data: rows, error } = await supabase
      .from('case_assignments')
      .select('*')
      .eq('case_id', cid)
      .eq('is_active', true)
      .order('id', { ascending: true });
    if (error) throw error;
    const sids = [caseRow.created_by, ...(rows || []).map(r => r.assigned_to)].filter(Boolean);
    const names = await resolveNames([...new Set(sids)]);
    res.json({
      success: true,
      owner: caseRow.created_by
        ? { user: caseRow.created_by, name: (names[caseRow.created_by] || {}).name || null, role: 'owner' }
        : null,
      members: (rows || []).map(r => ({
        user: r.assigned_to,
        name: (names[r.assigned_to] || {}).name || null,
        system_role: (names[r.assigned_to] || {}).role || null,
        case_role: r.role_type,
        notes: r.notes || '',
        assigned_by: r.assigned_by,
        assigned_at: r.assigned_at,
      })),
      can_manage: isOwnerOrAdmin(req.user, caseRow),
    });
  } catch (e) {
    console.error('getTeam error:', e);
    res.status(500).json({ error: 'Failed to load case team' });
  }
};

// POST /api/cases/:id/team { user, role } - owner/admin only
const addMember = async (req, res) => {
  try {
    const cid = parseInt(req.params.id, 10);
    if (isNaN(cid)) return res.status(400).json({ error: 'Invalid case id' });
    const caseRow = await loadCase(cid);
    if (!caseRow) return res.status(404).json({ error: 'Case not found' });
    if (!isOwnerOrAdmin(req.user, caseRow)) {
      return res.status(403).json({ error: 'Only the case owner can manage the team' });
    }
    const { user, role } = req.body || {};
    const caseRole = TEAM_ROLES.includes(role) ? role : 'co-investigator';
    const target = await resolveUser(user);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.sid === caseRow.created_by) {
      return res.status(400).json({ error: 'That user already owns the case' });
    }
    const sid = stableUserId(req.user);
    await supabase
      .from('case_assignments')
      .update({ is_active: false, unassigned_at: new Date().toISOString() })
      .eq('case_id', cid)
      .eq('assigned_to', target.sid)
      .eq('is_active', true);
    const { data, error } = await supabase
      .from('case_assignments')
      .insert({
        case_id: cid,
        assigned_to: target.sid,
        assigned_by: sid,
        role_type: caseRole,
        assignment_type: ASSIGNMENT_TYPE[caseRole] || 'secondary',
        notes: '',
      })
      .select()
      .single();
    if (error) throw error;
    await notify(target.sid, 'Added to case team',
      `${nameOf(req.user) || sid} added you to case ${caseRow.case_number || '#' + cid} (${caseRow.title || 'untitled'}) as ${caseRole}.`,
      { case_id: cid, case_role: caseRole });
    res.status(201).json({ success: true, member: data });
  } catch (e) {
    console.error('addMember error:', e);
    res.status(500).json({ error: 'Failed to add team member' });
  }
};

// DELETE /api/cases/:id/team/:userRef - owner/admin only
const removeMember = async (req, res) => {
  try {
    const cid = parseInt(req.params.id, 10);
    if (isNaN(cid)) return res.status(400).json({ error: 'Invalid case id' });
    const caseRow = await loadCase(cid);
    if (!caseRow) return res.status(404).json({ error: 'Case not found' });
    if (!isOwnerOrAdmin(req.user, caseRow)) {
      return res.status(403).json({ error: 'Only the case owner can manage the team' });
    }
    const target = await resolveUser(req.params.userRef);
    if (!target) return res.status(404).json({ error: 'User not found' });
    const { data, error } = await supabase
      .from('case_assignments')
      .update({ is_active: false, unassigned_at: new Date().toISOString() })
      .eq('case_id', cid)
      .eq('assigned_to', target.sid)
      .eq('is_active', true)
      .select();
    if (error) throw error;
    if (!data || !data.length) return res.status(404).json({ error: 'That user is not on the case team' });
    res.json({ success: true, removed: target.sid });
  } catch (e) {
    console.error('removeMember error:', e);
    res.status(500).json({ error: 'Failed to remove team member' });
  }
};

// GET /api/cases/:id/comments
const getComments = async (req, res) => {
  try {
    const cid = parseInt(req.params.id, 10);
    if (isNaN(cid)) return res.status(400).json({ error: 'Invalid case id' });
    if (!(await canAccessCase(req.user, cid))) {
      return res.status(403).json({ error: 'You do not have access to this case' });
    }
    const { data, error } = await supabase
      .from('case_comments')
      .select('*')
      .eq('case_id', cid)
      .order('id', { ascending: true })
      .limit(500);
    if (error) throw error;
    res.json({ success: true, comments: data || [] });
  } catch (e) {
    console.error('getComments error:', e);
    res.status(500).json({ error: 'Failed to load comments' });
  }
};

/** Pull @mentions out of comment text: @user_58 or @"Display Name" or @Display Name. */
function parseMentions(content) {
  const found = new Set();
  for (const m of content.matchAll(/@user_\d+/g)) found.add(m[0].slice(1));
  for (const m of content.matchAll(/@([A-Za-z][A-Za-z]+(?:\s+[A-Za-z]+)?)/g)) found.add(m[1].trim());
  return [...found];
}

// POST /api/cases/:id/comments { content }
const addComment = async (req, res) => {
  try {
    const cid = parseInt(req.params.id, 10);
    if (isNaN(cid)) return res.status(400).json({ error: 'Invalid case id' });
    if (!(await canAccessCase(req.user, cid))) {
      return res.status(403).json({ error: 'You do not have access to this case' });
    }
    const content = String((req.body || {}).content || '').trim();
    if (!content) return res.status(400).json({ error: 'Comment text is required' });
    if (content.length > 4000) return res.status(400).json({ error: 'Comment is too long (4000 chars max)' });
    const sid = stableUserId(req.user);
    const mentions = parseMentions(content);
    const { data, error } = await supabase
      .from('case_comments')
      .insert({
        case_id: cid,
        author: sid,
        author_name: nameOf(req.user),
        author_role: req.user.role || null,
        content,
        mentions,
      })
      .select()
      .single();
    if (error) throw error;

    // Notify mentioned users: match @user_N directly, and @Name against the team.
    const caseRow = await loadCase(cid);
    const { data: teamRows } = await supabase
      .from('case_assignments').select('assigned_to').eq('case_id', cid).eq('is_active', true);
    const teamSids = [...new Set([caseRow && caseRow.created_by, ...(teamRows || []).map(r => r.assigned_to)].filter(Boolean))];
    const names = await resolveNames(teamSids);
    const direct = mentions.filter(m => /^user_\d+$/.test(m));
    const byName = mentions.filter(m => !/^user_\d+$/.test(m));
    const targets = new Set(direct.filter(s => teamSids.includes(s) || true));
    teamSids.forEach(tsid => {
      const nm = ((names[tsid] || {}).name || '').toLowerCase();
      if (nm && byName.some(m => nm === m.toLowerCase() || nm.startsWith(m.toLowerCase()))) targets.add(tsid);
    });
    targets.delete(sid);
    for (const t of targets) {
      await notify(t, `Mentioned in case ${(caseRow && caseRow.case_number) || '#' + cid}`,
        `${nameOf(req.user) || sid}: ${content.slice(0, 140)}${content.length > 140 ? '...' : ''}`,
        { case_id: cid, comment_id: data.id }, 'mention');
    }
    res.status(201).json({ success: true, comment: data });
  } catch (e) {
    console.error('addComment error:', e);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

module.exports = { getTeam, addMember, removeMember, getComments, addComment };
