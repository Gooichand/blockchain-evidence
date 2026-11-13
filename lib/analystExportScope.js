const { supabase } = require('../config');
const isAnalyst = user => user?.role === 'forensic_analyst';
// Identical identity alternatives to Analyst inventory; never match a missing
// wallet/email or user id against a task with no identity.
function assignmentFilter(user) {
  const clauses = [];
  if (/^[1-9][0-9]*$/.test(String(user.id))) clauses.push(`analyst_id.eq.${user.id}`);
  const identity = user.wallet_address || user.email;
  if (identity) {
    // Quote PostgREST filter values and escape its quoted-string metacharacters.
    const quoted = String(identity).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    clauses.push(`analyst_wallet.eq."${quoted}"`);
  }
  if (!clauses.length) throw new Error('Analyst identity missing');
  return clauses.join(',');
}
async function hasAssignment(user, target) {
  let query = supabase.from('analysis_tasks').select('id').or(assignmentFilter(user));
  for (const [key, value] of Object.entries(target)) query = query.eq(key, value);
  const { data, error } = await query.limit(1);
  if (error) throw error; // A source failure never becomes permission.
  return Boolean(data?.length);
}
module.exports = { isAnalyst, assignmentFilter, hasAssignment };
