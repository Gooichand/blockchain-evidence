const { supabase } = require('../config');
const { notifyUser } = require('./notificationService');

// Helper function to create status change notifications
async function createStatusChangeNotification(caseId, fromStatusId, toStatusId, changedBy) {
  try {
    // Get case details
    const { data: caseData } = (await supabase
      .from('cases')
      .select('title, case_number, created_by, assigned_investigator, assigned_prosecutor, assigned_judge')
      .eq('id', caseId)
      .single()) || {};

    // Get status names
    const { data: fromStatus } = (await supabase
      .from('case_statuses')
      .select('status_name')
      .eq('id', fromStatusId)
      .single()) || {};

    const { data: toStatus } = (await supabase
      .from('case_statuses')
      .select('status_name')
      .eq('id', toStatusId)
      .single()) || {};

    if (!caseData || !toStatus) return;

    const message = `Case "${caseData.title}" (${caseData.case_number}) status changed to ${toStatus.status_name}`;

    // S8: notify the owner, assigned staff and active team members (S7),
    // keyed by stable user id, in-app plus email ('case_status' type).
    const { data: teamRows } = (await supabase
      .from('case_assignments')
      .select('assigned_to')
      .eq('case_id', caseId)
      .eq('is_active', true)) || {};

    const assignedUsers = [...new Set([
      caseData.created_by,
      caseData.assigned_investigator,
      caseData.assigned_prosecutor,
      caseData.assigned_judge,
      ...(teamRows || []).map((r) => r.assigned_to),
    ].filter((user) => user && user !== changedBy))];

    for (const userWallet of assignedUsers) {
      await notifyUser(userWallet, 'Case status update', message, 'case_status', {
        case_id: caseId,
        from_status: fromStatus?.status_name,
        to_status: toStatus.status_name,
      });
    }
  } catch (error) {
    console.error('Create status change notification error:', error);
  }
}


// M12: resolve a case's current status code (e.g. 'open', 'closed').
// Returns null when the case or status is missing or the lookup fails, so a
// transient error never blocks legitimate work - the status transition
// endpoint remains the authoritative gate for lifecycle changes.
async function getCaseStatusCode(caseId) {
  try {
    const { data } = (await supabase
      .from('cases')
      .select('case_statuses(status_code)')
      .eq('id', caseId)
      .single()) || {};
    return (data && data.case_statuses && data.case_statuses.status_code) || null;
  } catch (error) {
    console.error('getCaseStatusCode error:', error);
    return null;
  }
}

// M12: closed cases are immutable - no new evidence, notes or analysis requests.
async function isCaseClosed(caseId) {
  return (await getCaseStatusCode(caseId)) === 'closed';
}

module.exports = {
  createStatusChangeNotification,
  getCaseStatusCode,
  isCaseClosed,
};
