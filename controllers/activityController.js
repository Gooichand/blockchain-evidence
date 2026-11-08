const { supabase } = require('../config');

// Client-initiated activity write. Authenticated callers may only log
// activity for themselves — the audit trail must not be forgeable.
const logActivity = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const { action, details } = req.body;
    if (!action || typeof action !== 'string' || action.length > 200) {
      return res.status(400).json({ success: false, error: 'A valid action is required' });
    }
    const { clientIp } = require('../lib/audit');
    const { error } = (await supabase.from('activity_logs').insert({
      user_id: req.user.id,
      action,
      result: 'success',
      ip_address: clientIp(req),
      details: typeof details === 'string' ? details : JSON.stringify(details || null),
      timestamp: new Date().toISOString(),
    })) || {};
    if (error) throw error;
    res.json({ success: true, message: 'Activity logged successfully' });
  } catch (error) {
    console.error('Activity logging error:', error);
    res.status(500).json({ success: false, error: 'Failed to log activity' });
  }
};

// The signed-in user's own activity history (M16: investigator self-review).
const getMyActivity = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    let query = supabase
      .from('activity_logs')
      .select('id, action, result, ip_address, details, timestamp')
      .eq('user_id', req.user.id)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (req.query.action) query = query.ilike('action', `%${String(req.query.action).slice(0, 100)}%`);
    if (req.query.result && ['success', 'failure', 'denied'].includes(req.query.result)) {
      query = query.eq('result', req.query.result);
    }

    const { data: rows, error } = await query;
    if (error) throw error;

    const activity = (rows || []).map((row) => ({
      id: row.id,
      action: row.action,
      result: row.result || 'success',
      ipAddress: row.ip_address || null,
      details: row.details,
      timestamp: row.timestamp,
    }));

    res.json({ success: true, activity, limit, offset });
  } catch (error) {
    console.error('Get my activity error:', error);
    res.status(500).json({ success: false, error: 'Failed to load activity' });
  }
};

module.exports = { logActivity, getMyActivity };
