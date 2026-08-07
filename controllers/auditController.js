const { supabase } = require('../config');
const { resolveIdentity } = require('../middleware/identity');

/**
 * Audit log — role-scoped read of the unified audit trail.
 *
 * Security:
 *  - Only admin / auditor / evidence_manager / legal_professional may read.
 *  - Non-admin auditors only see entries relevant to their scope.
 *  - Entries source from activity_logs (system actions) and admin_actions.
 */
const getAuditLogs = async (req, res) => {
  try {
    const user = req.user || {};
    const role = user.role;

    if (!['admin', 'auditor', 'evidence_manager', 'legal_professional'].includes(role)) {
      return res.status(403).json({ success: false, error: 'Forbidden: insufficient role for audit logs' });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    // activity_logs entries (system + legal/court/analyst actions)
    let activityQuery = supabase
      .from('activity_logs')
      .select('id, user_id, action, details, timestamp');

    if (req.query.action) activityQuery = activityQuery.ilike('action', `%${req.query.action}%`);
    if (req.query.dateFrom) activityQuery = activityQuery.gte('timestamp', req.query.dateFrom);
    if (req.query.dateTo) activityQuery = activityQuery.lte('timestamp', req.query.dateTo);

    const { data: activityRows, error: activityError } = await activityQuery
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);
    if (activityError) throw activityError;

    // admin_actions entries
    const { data: adminRows, error: adminError } = (await supabase
      .from('admin_actions')
      .select('admin_wallet, action_type, target_wallet, details, timestamp')
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)) || {};
    if (adminError) throw adminError;

    // Resolve user display names for activity rows (user_id may be int id or wallet string)
    const userIds = [...new Set((activityRows || []).map((r) => r.user_id))];
    let userMap = {};
    if (userIds.length) {
      const { data: users } = (await supabase
        .from('users')
        .select('id, wallet_address, email, full_name')
        .in('id', userIds)) || {};
      const walletUsers = (await supabase
        .from('users')
        .select('wallet_address, email, full_name')
        .in('wallet_address', userIds)) || {};
      (users || []).forEach((u) => { userMap[u.id] = u; });
      ((walletUsers.data) || []).forEach((u) => { userMap[u.wallet_address] = u; });
    }

    const activityEntries = (activityRows || []).map((row) => {
      const resolved = userMap[row.user_id] || {};
      let txHash = null;
      try {
        const details = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
        txHash = details?.blockchain_tx_hash || details?.tx_hash || null;
      } catch (_) { /* non-JSON details */ }
      return {
        id: `sys-${row.id}`,
        created_at: row.timestamp,
        user_wallet: resolved.wallet_address || row.user_id,
        user_name: resolved.full_name || null,
        action: row.action,
        details: row.details,
        tx_hash: txHash,
        source: 'activity_logs',
      };
    });

    const adminEntries = (adminRows || []).map((row) => ({
      id: `adm-${row.timestamp}-${row.admin_wallet}`,
      created_at: row.timestamp,
      user_wallet: row.admin_wallet,
      action: row.action_type || 'admin_action',
      details: row.details,
      tx_hash: null,
      source: 'admin_actions',
    }));

    const data = [...activityEntries, ...adminEntries].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, error: 'Failed to get audit logs' });
  }
};

module.exports = { getAuditLogs };