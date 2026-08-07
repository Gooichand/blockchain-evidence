const { supabase } = require('../config');

const AUDIT_ROLES = ['admin', 'auditor', 'evidence_manager', 'legal_professional'];

/**
 * Admin / audit activity log feed.
 * Frontend contract (public/audit-trail.html):
 *   { success: true, logs: [ { is_success, action_type, created_at, user_wallet,
 *                              users: { full_name }, details, resource_type,
 *                              resource_id, blockchain_tx } ] }
 */
const getAdminActivityLogs = async (req, res) => {
  try {
    const role = req.user?.role;
    if (!AUDIT_ROLES.includes(role)) {
      return res.status(403).json({ success: false, error: 'Forbidden: audit permissions required' });
    }

    const { userWallet, actionType, dateFrom, dateTo } = req.query;

    let query = supabase
      .from('activity_logs')
      .select('id, user_id, action, details, timestamp')
      .order('timestamp', { ascending: false })
      .limit(500);

    if (userWallet) query = query.eq('user_id', userWallet);
    if (actionType) query = query.ilike('action', `%${actionType}%`);
    if (dateFrom) query = query.gte('timestamp', dateFrom);
    if (dateTo) query = query.lte('timestamp', dateTo);

    const { data: rows, error } = await query;
    if (error) throw error;

    // Resolve user names (user_id may be an int id or a wallet string)
    const ids = [...new Set((rows || []).map((r) => r.user_id))];
    let userMap = {};
    if (ids.length) {
      const { data: users } = (await supabase
        .from('users')
        .select('id, wallet_address, full_name')
        .in('id', ids)) || {};
      const { data: walletUsers } = (await supabase
        .from('users')
        .select('wallet_address, full_name')
        .in('wallet_address', ids)) || {};
      (users || []).forEach((u) => { userMap[u.id] = u; });
      (walletUsers || []).forEach((u) => { userMap[u.wallet_address] = u; });
    }

    const logs = (rows || []).map((row) => {
      const resolved = userMap[row.user_id] || {};
      let detail = row.details;
      try { detail = typeof row.details === 'string' ? JSON.parse(row.details) : row.details; } catch (_) { /* keep raw */ }
      return {
        id: row.id,
        is_success: true,
        action_type: row.action,
        created_at: row.timestamp,
        user_wallet: resolved.wallet_address || row.user_id,
        users: { full_name: resolved.full_name || null },
        details: detail,
        resource_type: detail && typeof detail === 'object' ? (detail.resource_type || null) : null,
        resource_id: detail && typeof detail === 'object' ? (detail.resource_id ?? detail.evidence_id ?? detail.case_id ?? null) : null,
        blockchain_tx: detail && typeof detail === 'object' ? (detail.blockchain_tx_hash || detail.tx_hash || null) : null,
      };
    });

    res.json({ success: true, logs });
  } catch (error) {
    console.error('Get admin activity logs error:', error);
    res.status(500).json({ success: false, error: 'Failed to get activity logs' });
  }
};

/**
 * CSV export of the same activity feed.
 * Frontend contract: raw CSV text (downloaded as audit_log_*.csv).
 */
const exportAdminActivityLogs = async (req, res) => {
  try {
    const role = req.user?.role;
    if (!AUDIT_ROLES.includes(role)) {
      return res.status(403).json({ success: false, error: 'Forbidden: audit permissions required' });
    }

    const { userWallet, actionType, dateFrom, dateTo } = req.query;

    let query = supabase
      .from('activity_logs')
      .select('user_id, action, details, timestamp')
      .order('timestamp', { ascending: false })
      .limit(10000);

    if (userWallet) query = query.eq('user_id', userWallet);
    if (actionType) query = query.ilike('action', `%${actionType}%`);
    if (dateFrom) query = query.gte('timestamp', dateFrom);
    if (dateTo) query = query.lte('timestamp', dateTo);

    const { data: rows, error } = await query;
    if (error) throw error;

    const escapeCsv = (v) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const header = ['Timestamp', 'User', 'Action', 'Details'];
    const lines = (rows || []).map((r) =>
      [r.timestamp, r.user_id, r.action, escapeCsv(JSON.stringify(r.details))]
        .map((v, i) => (i === 3 ? escapeCsv(v) : escapeCsv(v)))
        .join(','),
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="audit_log_${new Date().toISOString().split('T')[0]}.csv"`,
    );
    res.send([header.join(','), ...lines].join('\n'));
  } catch (error) {
    console.error('Export admin activity logs error:', error);
    res.status(500).json({ success: false, error: 'Failed to export activity logs' });
  }
};

module.exports = { getAdminActivityLogs, exportAdminActivityLogs };