const { supabase } = require('../config');
const { createNotification } = require('./notificationService');

// Helper function to create status change notifications
async function createStatusChangeNotification(caseId, fromStatusId, toStatusId, changedBy) {
    try {
        // Get case details
        const { data: caseData } = await supabase
            .from('cases')
            .select('title, case_number, assigned_investigator, assigned_prosecutor, assigned_judge')
            .eq('id', caseId)
            .single();

        // Get status names
        const { data: fromStatus } = await supabase
            .from('case_statuses')
            .select('status_name')
            .eq('id', fromStatusId)
            .single();

        const { data: toStatus } = await supabase
            .from('case_statuses')
            .select('status_name')
            .eq('id', toStatusId)
            .single();

        if (!caseData || !toStatus) return;

        const message = `Case "${caseData.title}" (${caseData.case_number}) status changed to ${toStatus.status_name}`;
        
        // Notify assigned users
        const assignedUsers = [
            caseData.assigned_investigator,
            caseData.assigned_prosecutor,
            caseData.assigned_judge
        ].filter(user => user && user !== changedBy);

        for (const userWallet of assignedUsers) {
            await createNotification(
                userWallet,
                'Case Status Update',
                message,
                'system',
                {
                    case_id: caseId,
                    from_status: fromStatus?.status_name,
                    to_status: toStatus.status_name
                }
            );
        }
    } catch (error) {
        console.error('Create status change notification error:', error);
    }
}

module.exports = {
    createStatusChangeNotification
};
