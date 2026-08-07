const { supabase } = require('../config');
const { resolveIdentity } = require('../middleware/identity');

const LEGAL_ROLES = ['admin', 'legal_professional'];

/**
 * Issue a legal opinion on evidence (Legal dashboard).
 * Frontend contract: POST /api/legal/opinion { evidenceId, opinion, action }
 *   → { success: true }
 */
const issueLegalOpinion = async (req, res) => {
  try {
    const { evidenceId, opinion, action } = req.body;

    if (!evidenceId) {
      return res.status(400).json({ success: false, error: 'evidenceId is required' });
    }
    if (!opinion || typeof opinion !== 'string') {
      return res.status(400).json({ success: false, error: 'opinion text is required' });
    }

    const identity = resolveIdentity(req);
    if (!identity) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Ensure evidence exists
    const { data: evidence, error: fetchError } = (await supabase
      .from('evidence')
      .select('id, case_id')
      .eq('id', evidenceId)
      .single()) || {};
    if (fetchError || !evidence) {
      return res.status(404).json({ success: false, error: 'Evidence not found' });
    }

    const { data: record, error } = (await supabase
      .from('legal_opinions')
      .insert({
        evidence_id: evidenceId,
        case_id: evidence.case_id || null,
        opinion,
        action: action || 'VERIFIED',
        created_by: identity.display,
      })
      .select()
      .single()) || {};
    if (error) throw error;

    // Audit trail entry
    const { error: logError } = (await supabase.from('activity_logs').insert({
      user_id: identity.display,
      action: 'legal_opinion_issued',
      details: JSON.stringify({
        evidence_id: evidenceId,
        case_id: evidence.case_id || null,
        opinion_action: action || 'VERIFIED',
        opinion_id: record.id,
      }),
      timestamp: new Date().toISOString(),
    })) || {};
    if (logError) console.error('Failed to log legal opinion:', logError);

    res.json({ success: true, opinion: record });
  } catch (error) {
    console.error('Issue legal opinion error:', error);
    res.status(500).json({ success: false, error: 'Failed to issue legal opinion' });
  }
};

module.exports = { issueLegalOpinion };