const { supabase } = require('../config');
const { resolveIdentity } = require('../middleware/identity');

const COURT_ROLES = ['admin', 'court_official', 'legal_professional'];

/**
 * Issue a court order on a case (Court dashboard).
 * Frontend contract: POST /api/court/order { caseId, order }
 *   → { success: true }
 */
const issueCourtOrder = async (req, res) => {
  try {
    const { caseId, order } = req.body;

    if (!caseId) {
      return res.status(400).json({ success: false, error: 'caseId is required' });
    }
    if (!order || typeof order !== 'string') {
      return res.status(400).json({ success: false, error: 'order content is required' });
    }

    const identity = resolveIdentity(req);
    if (!identity) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Ensure case exists — accepts numeric id or case_number string
    const numericId = parseInt(caseId, 10);
    let caseQuery = supabase.from('cases').select('id, case_number');
    if (!isNaN(numericId)) {
      caseQuery = caseQuery.eq('id', numericId);
    } else {
      caseQuery = caseQuery.eq('case_number', String(caseId));
    }
    const { data: caseRecord, error: fetchError } = (await caseQuery.single()) || {};
    if (fetchError || !caseRecord) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }

    const { data: record, error } = (await supabase
      .from('court_orders')
      .insert({
        case_id: String(caseRecord.case_number || caseRecord.id),
        order_content: order,
        created_by: identity.display,
      })
      .select()
      .single()) || {};
    if (error) throw error;

    // Audit trail entry
    const { error: logError } = (await supabase.from('activity_logs').insert({
      user_id: identity.display,
      action: 'court_order_issued',
      details: JSON.stringify({ case_id: caseId, order_id: record.id }),
      timestamp: new Date().toISOString(),
    })) || {};
    if (logError) console.error('Failed to log court order:', logError);

    res.json({ success: true, order: record });
  } catch (error) {
    console.error('Issue court order error:', error);
    res.status(500).json({ success: false, error: 'Failed to issue court order' });
  }
};

module.exports = { issueCourtOrder };