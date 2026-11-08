const { supabase } = require('../config');

/**
 * Per-user case/evidence scoping (audit finding C2 / roadmap M2).
 *
 * Investigators may only see and touch cases they created or are assigned to,
 * plus evidence they submitted or that belongs to those cases. Administrative
 * and oversight roles keep their wider views. Every case/evidence route must
 * go through these helpers so the policy lives in exactly one place.
 */

// Roles with an unrestricted (wide) view of cases and evidence.
const WIDE_ROLES = [
  'admin',
  'evidence_manager',
  'legal_professional',
  'court_official',
  'auditor',
  'forensic_analyst',
];

/** Stable per-user identifier matching what controllers store in created_by / submitted_by. */
function stableUserId(user) {
  if (!user) return null;
  return user.wallet_address || `user_${user.id}`;
}

/** True when this role must be scoped to its own cases. */
function isScopedRole(role) {
  return !WIDE_ROLES.includes(role);
}

/**
 * Returns null when the user has a wide view, otherwise an array of case ids
 * (numbers) the user may access.
 */
async function getAccessibleCaseIds(user) {
  if (!isScopedRole(user.role)) return null;
  const sid = stableUserId(user);
  const ids = new Set();

  const { data: own, error: ownErr } = await supabase
    .from('cases')
    .select('id')
    .or(`created_by.eq.${sid},assigned_investigator.eq.${sid}`);
  if (ownErr) throw ownErr;
  (own || []).forEach((c) => ids.add(c.id));

  const { data: assigned, error: asgErr } = await supabase
    .from('case_assignments')
    .select('case_id')
    .eq('assigned_to', sid)
    .eq('is_active', true);
  if (asgErr) throw asgErr;
  (assigned || []).forEach((a) => ids.add(a.case_id));

  return [...ids];
}

/** True when the user may access this specific case. */
async function canAccessCase(user, caseId) {
  const ids = await getAccessibleCaseIds(user);
  if (ids === null) return true;
  return ids.includes(parseInt(caseId, 10));
}

/**
 * Restricts a Supabase query on the `cases` table to the user's accessible
 * cases. Wide-view roles get the query back unchanged. A scoped user with no
 * accessible cases gets a query guaranteed to match nothing.
 */
// NOTE: returns { query } in a wrapper object. A Supabase query builder is a
// thenable, so `return query` (or Promise.resolve(query)) from an async
// function would EXECUTE the query and resolve to the response object -
// callers that then chain .order()/.eq() crashed with "query.order is not a
// function" (the /cases/enhanced and /cases/search 500s). The wrapper keeps
// the builder intact; callers must read .query from the result.
async function scopeCaseQuery(query, user) {
  const ids = await getAccessibleCaseIds(user);
  if (ids === null) return { query };
  if (ids.length === 0) return { query: query.in('id', [-1]) };
  return { query: query.in('id', ids) };
}

/**
 * Restricts a Supabase query on the `evidence` table. Investigators see
 * evidence they submitted themselves plus evidence in their accessible cases.
 * (evidence.case_id is TEXT in the schema, so ids are compared as strings.)
 */
async function scopeEvidenceQuery(query, user) {
  if (!isScopedRole(user.role)) return { query };
  const sid = stableUserId(user);
  const ids = await getAccessibleCaseIds(user);
  const clauses = [`submitted_by.eq.${sid}`];
  if (ids && ids.length > 0) {
    clauses.push(`case_id.in.(${ids.map(String).join(',')})`);
  }
  // Wrapped for the same thenable reason as scopeCaseQuery above.
  return { query: query.or(clauses.join(',')) };
}

/** True when the user may access this evidence row (already fetched). */
async function canAccessEvidence(user, evidenceRow) {
  if (!isScopedRole(user.role)) return true;
  const sid = stableUserId(user);
  if (evidenceRow.submitted_by === sid) return true;
  const cid = parseInt(evidenceRow.case_id, 10);
  if (isNaN(cid)) return false;
  return canAccessCase(user, cid);
}

module.exports = {
  WIDE_ROLES,
  stableUserId,
  isScopedRole,
  getAccessibleCaseIds,
  canAccessCase,
  scopeCaseQuery,
  scopeEvidenceQuery,
  canAccessEvidence,
};
