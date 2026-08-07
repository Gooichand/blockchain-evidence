const { supabase } = require('../config');

/**
 * Evidence Manager dashboard statistics.
 * Frontend contract: GET /api/evidence/manager-stats → { success: true, data: {...} }
 * Phase 4 wires the dashboard hero cards to this payload.
 */
const getManagerStats = async (req, res) => {
  try {
    const role = req.user?.role;
    if (!['admin', 'evidence_manager', 'investigator', 'legal_professional', 'court_official', 'auditor'].includes(role)) {
      return res.status(403).json({ success: false, error: 'Forbidden: manager statistics require a manager role' });
    }

    const { count: totalCount } = (await supabase
      .from('evidence')
      .select('*', { count: 'exact', head: true })) || {};

    const { count: pendingCount } = (await supabase
      .from('evidence')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'submitted'])) || {};

    const { count: disposalCount } = (await supabase
      .from('evidence')
      .select('*', { count: 'exact', head: true })
      .eq('archived', true)) || {};

    const { count: holdCount } = (await supabase
      .from('evidence')
      .select('*', { count: 'exact', head: true })
      .eq('legal_hold', true)) || {};

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const { count: expiringCount } = (await supabase
      .from('evidence')
      .select('*', { count: 'exact', head: true })
      .not('expiry_date', 'is', null)
      .lte('expiry_date', thirtyDaysFromNow.toISOString())
      .eq('legal_hold', false)) || {};

    // Per-type breakdown
    const { data: typeRows } = (await supabase
      .from('evidence')
      .select('file_type')
      .limit(500)) || {};
    const byType = {};
    (typeRows || []).forEach((row) => {
      const key = row.file_type || 'unknown';
      byType[key] = (byType[key] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        total: totalCount || 0,
        pending_intake: pendingCount || 0,
        ready_for_disposal: disposalCount || 0,
        legal_hold: holdCount || 0,
        expiring_30_days: expiringCount || 0,
        by_type: byType,
      },
    });
  } catch (error) {
    console.error('Get manager stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get manager statistics' });
  }
};

module.exports = { getManagerStats };