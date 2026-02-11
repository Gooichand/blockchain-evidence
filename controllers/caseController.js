const { supabase } = require('../config');
const { validateWalletAddress } = require('../middleware/verifyAdmin');
const { createNotification } = require('../services/notificationService');
const { createStatusChangeNotification } = require('../services/caseHelpers');

// Get cases for timeline
const getCases = async (req, res) => {
    try {
        const { data: cases, error } = await supabase
            .from('cases')
            .select('id, title, description, status, created_date')
            .order('created_date', { ascending: false });
        if (error) throw error;
        res.json({ success: true, cases });
    } catch (error) {
        console.error('Get cases error:', error);
        res.status(500).json({ error: 'Failed to get cases' });
    }
};

// Get all case statuses
const getCaseStatuses = async (req, res) => {
    try {
        const { data: statuses, error } = await supabase
            .from('case_statuses')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
        if (error) throw error;
        res.json({ success: true, statuses });
    } catch (error) {
        console.error('Get case statuses error:', error);
        res.status(500).json({ error: 'Failed to get case statuses' });
    }
};

// Get cases with enhanced filtering
const getEnhancedCases = async (req, res) => {
    try {
        const { status, priority, assignedTo, caseType, jurisdiction, dateFrom, dateTo, search, page = 1, limit = 20, sortBy = 'created_date', sortOrder = 'desc' } = req.query;

        let query = supabase.from('cases').select(`*, case_statuses!inner(status_code, status_name, color_code, icon), case_assignments!left(assigned_to, role_type, assignment_type, assigned_at)`);

        if (status) query = query.eq('case_statuses.status_code', status);
        if (priority) query = query.eq('priority_level', priority);
        if (assignedTo) query = query.or(`assigned_investigator.eq.${assignedTo},assigned_prosecutor.eq.${assignedTo},assigned_judge.eq.${assignedTo}`);
        if (caseType) query = query.eq('case_type', caseType);
        if (jurisdiction) query = query.eq('jurisdiction', jurisdiction);
        if (dateFrom) query = query.gte('created_date', dateFrom);
        if (dateTo) query = query.lte('created_date', dateTo);
        if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,case_number.ilike.%${search}%`);

        const offset = (page - 1) * limit;
        query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(offset, offset + limit - 1);

        const { data: cases, error } = await query;
        if (error) throw error;

        const { count: totalCount } = await supabase.from('cases').select('*', { count: 'exact', head: true });

        res.json({ success: true, cases, pagination: { page: parseInt(page), limit: parseInt(limit), total: totalCount, pages: Math.ceil(totalCount / limit) } });
    } catch (error) {
        console.error('Get enhanced cases error:', error);
        res.status(500).json({ error: 'Failed to get cases' });
    }
};

// Create new case
const createCase = async (req, res) => {
    try {
        const { title, description, priority_level, case_type, jurisdiction, estimated_completion, created_by } = req.body;

        if (!validateWalletAddress(created_by)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }
        if (!title) {
            return res.status(400).json({ error: 'Case title is required' });
        }

        const { data: defaultStatus } = await supabase.from('case_statuses').select('id').eq('status_code', 'open').single();

        const { data: newCase, error } = await supabase
            .from('cases')
            .insert({ title, description, priority_level: priority_level || 3, case_type: case_type || 'criminal', jurisdiction: jurisdiction || 'local', estimated_completion, created_by, status_id: defaultStatus?.id || 1, status_changed_by: created_by })
            .select().single();
        if (error) throw error;

        await supabase.from('activity_logs').insert({ user_id: created_by, action: 'case_created', details: JSON.stringify({ case_id: newCase.id, case_title: title, case_type }) });

        res.json({ success: true, case: newCase });
    } catch (error) {
        console.error('Create case error:', error);
        res.status(500).json({ error: 'Failed to create case' });
    }
};

// Get case details with full status history
const getCaseDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: caseData, error: caseError } = await supabase
            .from('cases')
            .select(`*, case_statuses(status_code, status_name, color_code, icon, description)`)
            .eq('id', id).single();
        if (caseError) throw caseError;

        const { data: statusHistory, error: historyError } = await supabase
            .from('case_status_history')
            .select(`*, from_status:case_statuses!case_status_history_from_status_id_fkey(status_name, color_code), to_status:case_statuses!case_status_history_to_status_id_fkey(status_name, color_code)`)
            .eq('case_id', id).order('created_at', { ascending: false });
        if (historyError) throw historyError;

        const { data: assignments, error: assignmentError } = await supabase
            .from('case_assignments').select('*').eq('case_id', id).eq('is_active', true);
        if (assignmentError) throw assignmentError;

        const { count: evidenceCount } = await supabase.from('evidence').select('*', { count: 'exact', head: true }).eq('case_id', id);

        res.json({ success: true, case: { ...caseData, status_history: statusHistory, assignments, evidence_count: evidenceCount } });
    } catch (error) {
        console.error('Get case details error:', error);
        res.status(500).json({ error: 'Failed to get case details' });
    }
};

// Update case status with validation
const updateCaseStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { newStatusCode, userWallet, reason, metadata = {} } = req.body;

        if (!validateWalletAddress(userWallet)) return res.status(400).json({ error: 'Invalid wallet address' });

        const { data: user, error: userError } = await supabase.from('users').select('role').eq('wallet_address', userWallet).eq('is_active', true).single();
        if (userError || !user) return res.status(403).json({ error: 'User not found or inactive' });

        const { data: currentCase, error: caseError } = await supabase.from('cases').select('status_id, case_statuses(status_code)').eq('id', id).single();
        if (caseError || !currentCase) return res.status(404).json({ error: 'Case not found' });

        const { data: newStatus, error: statusError } = await supabase.from('case_statuses').select('id').eq('status_code', newStatusCode).single();
        if (statusError || !newStatus) return res.status(400).json({ error: 'Invalid status code' });

        const { data: transition, error: transitionError } = await supabase.from('case_status_transitions').select('*').eq('from_status_id', currentCase.status_id).eq('to_status_id', newStatus.id).eq('required_role', user.role).eq('is_active', true).single();
        if (transitionError || !transition) return res.status(403).json({ error: `Status transition not allowed for role: ${user.role}`, currentStatus: currentCase.case_statuses.status_code, requestedStatus: newStatusCode });

        const { error: updateError } = await supabase.from('cases').update({ status_id: newStatus.id, status_changed_by: userWallet, last_status_change: new Date().toISOString() }).eq('id', id);
        if (updateError) throw updateError;

        await supabase.from('case_status_history').insert({ case_id: id, from_status_id: currentCase.status_id, to_status_id: newStatus.id, changed_by: userWallet, change_reason: reason || 'Status updated via API', metadata: { ...metadata, user_role: user.role, transition_name: transition.transition_name } });

        await createStatusChangeNotification(id, currentCase.status_id, newStatus.id, userWallet);

        await supabase.from('activity_logs').insert({ user_id: userWallet, action: 'case_status_change', details: JSON.stringify({ case_id: id, from_status: currentCase.case_statuses.status_code, to_status: newStatusCode, reason }) });

        res.json({ success: true, message: 'Case status updated successfully', newStatus: newStatusCode });
    } catch (error) {
        console.error('Update case status error:', error);
        res.status(500).json({ error: 'Failed to update case status' });
    }
};

// Get available status transitions for a case
const getAvailableTransitions = async (req, res) => {
    try {
        const { id } = req.params;
        const { userWallet } = req.query;

        if (!validateWalletAddress(userWallet)) return res.status(400).json({ error: 'Invalid wallet address' });

        const { data: user, error: userError } = await supabase.from('users').select('role').eq('wallet_address', userWallet).single();
        if (userError || !user) return res.status(403).json({ error: 'User not found' });

        const { data: currentCase, error: caseError } = await supabase.from('cases').select('status_id').eq('id', id).single();
        if (caseError || !currentCase) return res.status(404).json({ error: 'Case not found' });

        const { data: transitions, error: transitionError } = await supabase
            .from('case_status_transitions')
            .select(`*, to_status:case_statuses!case_status_transitions_to_status_id_fkey(status_code, status_name, color_code, icon)`)
            .eq('from_status_id', currentCase.status_id).eq('required_role', user.role).eq('is_active', true);
        if (transitionError) throw transitionError;

        res.json({ success: true, transitions });
    } catch (error) {
        console.error('Get available transitions error:', error);
        res.status(500).json({ error: 'Failed to get available transitions' });
    }
};

// Assign user to case
const assignCase = async (req, res) => {
    try {
        const { id } = req.params;
        const { assignToWallet, roleType, assignmentType = 'primary', assignedByWallet, notes } = req.body;

        if (!validateWalletAddress(assignToWallet) || !validateWalletAddress(assignedByWallet)) return res.status(400).json({ error: 'Invalid wallet addresses' });

        const { data: assigner, error: assignerError } = await supabase.from('users').select('role').eq('wallet_address', assignedByWallet).single();
        if (assignerError || !assigner || !['admin', 'court_official', 'evidence_manager'].includes(assigner.role)) return res.status(403).json({ error: 'Insufficient permissions to assign cases' });

        const { data: assignee, error: assigneeError } = await supabase.from('users').select('role, full_name').eq('wallet_address', assignToWallet).single();
        if (assigneeError || !assignee) return res.status(404).json({ error: 'Assignee not found' });

        await supabase.from('case_assignments').update({ is_active: false, unassigned_at: new Date().toISOString() }).eq('case_id', id).eq('role_type', roleType).eq('assignment_type', assignmentType);

        const { error: assignError } = await supabase.from('case_assignments').insert({ case_id: id, assigned_to: assignToWallet, assigned_by: assignedByWallet, role_type: roleType, assignment_type: assignmentType, notes });
        if (assignError) throw assignError;

        const updateData = {};
        if (roleType === 'investigator') updateData.assigned_investigator = assignToWallet;
        if (roleType === 'legal_professional') updateData.assigned_prosecutor = assignToWallet;
        if (roleType === 'court_official') updateData.assigned_judge = assignToWallet;
        if (Object.keys(updateData).length > 0) await supabase.from('cases').update(updateData).eq('id', id);

        await createNotification(assignToWallet, 'Case Assignment', `You have been assigned to case as ${roleType}`, 'system', { case_id: id, role_type: roleType });

        await supabase.from('activity_logs').insert({ user_id: assignedByWallet, action: 'case_assignment', details: JSON.stringify({ case_id: id, assigned_to: assignToWallet, role_type: roleType, assignee_name: assignee.full_name }) });

        res.json({ success: true, message: 'Case assigned successfully' });
    } catch (error) {
        console.error('Assign case error:', error);
        res.status(500).json({ error: 'Failed to assign case' });
    }
};

// Get case statistics by status
const getCaseStatistics = async (req, res) => {
    try {
        const { timeframe = '30d' } = req.query;
        const now = new Date();
        let dateFilter = '';

        switch (timeframe) {
            case '7d': dateFilter = new Date(now.getTime() - 7*24*60*60*1000).toISOString(); break;
            case '30d': dateFilter = new Date(now.getTime() - 30*24*60*60*1000).toISOString(); break;
            case '90d': dateFilter = new Date(now.getTime() - 90*24*60*60*1000).toISOString(); break;
            case '1y': dateFilter = new Date(now.getTime() - 365*24*60*60*1000).toISOString(); break;
        }

        const { data: statusStats, error: statusError } = await supabase.from('cases').select(`status_id, case_statuses(status_code, status_name, color_code)`).gte('created_date', dateFilter);
        if (statusError) throw statusError;

        const statusCounts = statusStats.reduce((acc, c) => {
            const s = c.case_statuses;
            if (!acc[s.status_code]) acc[s.status_code] = { ...s, count: 0 };
            acc[s.status_code].count++;
            return acc;
        }, {});

        const { data: priorityStats, error: priorityError } = await supabase.from('cases').select('priority_level').gte('created_date', dateFilter);
        if (priorityError) throw priorityError;

        const priorityCounts = priorityStats.reduce((acc, c) => { const p = c.priority_level || 3; acc[p] = (acc[p] || 0) + 1; return acc; }, {});

        const { data: recentActivity, error: activityError } = await supabase.from('case_status_history').select(`*, cases(title, case_number), to_status:case_statuses!case_status_history_to_status_id_fkey(status_name, color_code)`).gte('created_at', dateFilter).order('created_at', { ascending: false }).limit(10);
        if (activityError) throw activityError;

        res.json({ success: true, statistics: { by_status: Object.values(statusCounts), by_priority: priorityCounts, recent_activity: recentActivity, timeframe } });
    } catch (error) {
        console.error('Get case statistics error:', error);
        res.status(500).json({ error: 'Failed to get case statistics' });
    }
};

// Export cases as CSV
const exportCases = async (req, res) => {
    try {
        const { status, priority, assignedTo, caseType, jurisdiction, dateFrom, dateTo, search } = req.query;
        let query = supabase.from('cases').select(`*, case_statuses(status_name)`);

        if (status) query = query.eq('case_statuses.status_code', status);
        if (priority) query = query.eq('priority_level', priority);
        if (assignedTo) query = query.or(`assigned_investigator.eq.${assignedTo},assigned_prosecutor.eq.${assignedTo},assigned_judge.eq.${assignedTo}`);
        if (caseType) query = query.eq('case_type', caseType);
        if (jurisdiction) query = query.eq('jurisdiction', jurisdiction);
        if (dateFrom) query = query.gte('created_date', dateFrom);
        if (dateTo) query = query.lte('created_date', dateTo);
        if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,case_number.ilike.%${search}%`);

        const { data: cases, error } = await query.order('created_date', { ascending: false });
        if (error) throw error;

        const csvHeaders = 'Case Number,Title,Status,Priority,Type,Jurisdiction,Created Date,Created By\n';
        const csvRows = cases.map(c => `"${c.case_number || ''}","${c.title}","${c.case_statuses?.status_name || ''}","${c.priority_level || 3}","${c.case_type || ''}","${c.jurisdiction || ''}","${new Date(c.created_date).toLocaleDateString()}","${c.created_by.substring(0, 8)}..."`).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="cases_export_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvHeaders + csvRows);
    } catch (error) {
        console.error('Export cases error:', error);
        res.status(500).json({ error: 'Failed to export cases' });
    }
};

module.exports = {
    getCases, getCaseStatuses, getEnhancedCases, createCase,
    getCaseDetails, updateCaseStatus, getAvailableTransitions,
    assignCase, getCaseStatistics, exportCases
};
