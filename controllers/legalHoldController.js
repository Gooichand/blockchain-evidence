const { supabase } = require('../config');
const { resolveIdentity } = require('../middleware/identity');

const HOLD_ROLES = ['admin', 'investigator', 'evidence_manager', 'legal_professional', 'court_official'];

/** DB row → frontend camelCase DTO (legal-hold-management contract). */
function mapHold(row) {
  if (!row) return null;
  return {
    id: row.id,
    caseId: row.case_id || null,
    evidenceIds: Array.isArray(row.evidence_ids) ? row.evidence_ids : (row.evidence_ids || []),
    reason: row.reason,
    legalBasis: row.legal_basis || null,
    courtOrder: row.court_order || null,
    startDate: row.start_date || null,
    endDate: row.end_date || null,
    createdBy: row.created_by || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at || null,
    releasedAt: row.released_at || null,
    releaseReason: row.release_reason || null,
    isActive: Boolean(row.is_active),
  };
}

/** List legal holds. Frontend expects a raw array. */
const getLegalHolds = async (req, res) => {
  try {
    const { data: rows, error } = (await supabase
      .from('legal_holds')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)) || {};
    if (error) throw error;
    res.json((rows || []).map(mapHold));
  } catch (error) {
    console.error('Get legal holds error:', error);
    res.status(500).json({ success: false, error: 'Failed to get legal holds' });
  }
};

/** Create a legal hold. Frontend sends a full camelCase object. */
const createLegalHold = async (req, res) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const {
      caseId, evidenceIds = [], reason, legalBasis, courtOrder,
      startDate, endDate, createdBy, notifications,
    } = req.body;

    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({ success: false, error: 'reason is required' });
    }
    if (!Array.isArray(evidenceIds)) {
      return res.status(400).json({ success: false, error: 'evidenceIds must be an array' });
    }

    const { data: record, error } = (await supabase
      .from('legal_holds')
      .insert({
        case_id: caseId || null,
        evidence_ids: evidenceIds,
        reason,
        legal_basis: legalBasis || null,
        court_order: courtOrder || null,
        start_date: startDate || null,
        end_date: endDate || null,
        created_by: identity.display || createdBy || null,
        is_active: true,
      })
      .select()
      .single()) || {};
    if (error) throw error;

    // Apply the hold flag to referenced evidence
    if (evidenceIds.length) {
      const { error: holdError } = (await supabase
        .from('evidence')
        .update({ legal_hold: true })
        .in('id', evidenceIds)) || {};
      if (holdError) console.error('Failed to flag evidence as held:', holdError);
    }

    // Audit trail entry
    const { error: logError } = (await supabase.from('activity_logs').insert({
      user_id: identity.display,
      action: 'legal_hold_created',
      details: JSON.stringify({ hold_id: record.id, case_id: caseId || null, evidence_ids: evidenceIds }),
      timestamp: new Date().toISOString(),
    })) || {};
    if (logError) console.error('Failed to log legal hold creation:', logError);

    res.json({ success: true, hold: mapHold(record) });
  } catch (error) {
    console.error('Create legal hold error:', error);
    res.status(500).json({ success: false, error: 'Failed to create legal hold' });
  }
};

/** Update a legal hold. Frontend sends the full merged object. */
const updateLegalHold = async (req, res) => {
  try {
    const { id } = req.params;
    const safeId = parseInt(id, 10);
    if (isNaN(safeId)) {
      return res.status(400).json({ success: false, error: 'Invalid hold ID' });
    }

    const identity = resolveIdentity(req);
    if (!identity) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const {
      caseId, evidenceIds, reason, legalBasis, courtOrder,
      startDate, endDate, isActive, updatedBy,
    } = req.body;

    const patch = {
      updated_at: new Date().toISOString(),
    };
    if (caseId !== undefined) patch.case_id = caseId;
    if (evidenceIds !== undefined) {
      if (!Array.isArray(evidenceIds)) {
        return res.status(400).json({ success: false, error: 'evidenceIds must be an array' });
      }
      patch.evidence_ids = evidenceIds;
    }
    if (reason !== undefined) patch.reason = reason;
    if (legalBasis !== undefined) patch.legal_basis = legalBasis;
    if (courtOrder !== undefined) patch.court_order = courtOrder;
    if (startDate !== undefined) patch.start_date = startDate;
    if (endDate !== undefined) patch.end_date = endDate;
    if (isActive !== undefined) patch.is_active = Boolean(isActive);

    const { data: record, error } = (await supabase
      .from('legal_holds')
      .update(patch)
      .eq('id', safeId)
      .select()
      .single()) || {};
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Legal hold not found' });
      }
      throw error;
    }

    // Sync hold flag on evidence
    if (evidenceIds !== undefined && Array.isArray(evidenceIds)) {
      const { error: holdError } = (await supabase
        .from('evidence')
        .update({ legal_hold: Boolean(isActive ?? record.is_active) })
        .in('id', evidenceIds)) || {};
      if (holdError) console.error('Failed to sync evidence hold flag:', holdError);
    }

    const { error: logError } = (await supabase.from('activity_logs').insert({
      user_id: identity.display || updatedBy || null,
      action: 'legal_hold_updated',
      details: JSON.stringify({ hold_id: safeId }),
      timestamp: new Date().toISOString(),
    })) || {};
    if (logError) console.error('Failed to log legal hold update:', logError);

    res.json({ success: true, hold: mapHold(record) });
  } catch (error) {
    console.error('Update legal hold error:', error);
    res.status(500).json({ success: false, error: 'Failed to update legal hold' });
  }
};

/** Release a legal hold. Frontend: POST /api/legal-holds/:id/release { releaseReason } */
const releaseLegalHold = async (req, res) => {
  try {
    const { id } = req.params;
    const safeId = parseInt(id, 10);
    if (isNaN(safeId)) {
      return res.status(400).json({ success: false, error: 'Invalid hold ID' });
    }

    const identity = resolveIdentity(req);
    if (!identity) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { releaseReason } = req.body;

    const { data: record, error } = (await supabase
      .from('legal_holds')
      .update({
        is_active: false,
        released_at: new Date().toISOString(),
        release_reason: releaseReason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', safeId)
      .select()
      .single()) || {};
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Legal hold not found' });
      }
      throw error;
    }

    // Release hold flag on referenced evidence
    const evidenceIds = Array.isArray(record.evidence_ids) ? record.evidence_ids : [];
    if (evidenceIds.length) {
      const { error: releaseError } = (await supabase
        .from('evidence')
        .update({ legal_hold: false })
        .in('id', evidenceIds)) || {};
      if (releaseError) console.error('Failed to release evidence hold flag:', releaseError);
    }

    const { error: logError } = (await supabase.from('activity_logs').insert({
      user_id: identity.display,
      action: 'legal_hold_released',
      details: JSON.stringify({ hold_id: safeId, reason: releaseReason || null }),
      timestamp: new Date().toISOString(),
    })) || {};
    if (logError) console.error('Failed to log legal hold release:', logError);

    res.json({ success: true, hold: mapHold(record) });
  } catch (error) {
    console.error('Release legal hold error:', error);
    res.status(500).json({ success: false, error: 'Failed to release legal hold' });
  }
};

/** Hold statistics. */
const getLegalHoldStats = async (req, res) => {
  try {
    const { count: activeCount } = (await supabase
      .from('legal_holds')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)) || {};
    const { count: totalCount } = (await supabase
      .from('legal_holds')
      .select('*', { count: 'exact', head: true })) || {};
    const { count: heldEvidence } = (await supabase
      .from('evidence')
      .select('*', { count: 'exact', head: true })
      .eq('legal_hold', true)) || {};

    res.json({
      success: true,
      stats: {
        active: activeCount || 0,
        total: totalCount || 0,
        held_evidence: heldEvidence || 0,
      },
    });
  } catch (error) {
    console.error('Get legal hold stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get legal hold stats' });
  }
};

module.exports = {
  getLegalHolds,
  createLegalHold,
  updateLegalHold,
  releaseLegalHold,
  getLegalHoldStats,
};