const crypto = require('crypto');
const supabase = require('../config/supabase');
const { validateWalletAddress } = require('../utils/validation');

// Get cases visible to current user
exports.getCases = async (req, res) => {
    try {
        const userWallet = req.headers['x-user-wallet'];

        if (!userWallet || !validateWalletAddress(userWallet)) {
            return res.status(401).json({ error: 'Invalid user wallet' });
        }

        // Get user info
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', userWallet)
            .eq('is_active', true)
            .single();

        if (!user) {
            return res.status(401).json({ error: 'User not found or inactive' });
        }

        let query = supabase.from('cases').select(`
            *,
            investigator:investigator_id(full_name),
            assigned_analyst:assigned_analyst_id(full_name),
            assigned_legal_pro:assigned_legal_pro_id(full_name),
            assigned_evidence_manager:assigned_evidence_manager_id(full_name),
            assigned_court_official:assigned_court_official_id(full_name)
        `);

        // Filter cases based on role
        if (user.role === 'public_viewer') {
            // Only closed public cases
            query = query.eq('status', 'CLOSED').eq('is_public', true);
        } else if (user.role === 'investigator') {
            // Only cases where user is the investigator
            query = query.eq('investigator_id', user.id);
        } else if (user.role === 'forensic_analyst') {
            // Cases assigned to this analyst
            query = query.eq('assigned_analyst_id', user.id);
        } else if (user.role === 'legal_professional') {
            // Cases assigned to this legal professional
            query = query.eq('assigned_legal_pro_id', user.id);
        } else if (user.role === 'court_official') {
            // Cases assigned to this court official
            query = query.eq('assigned_court_official_id', user.id);
        } else if (user.role === 'evidence_manager') {
            // Cases assigned to this evidence manager
            query = query.eq('assigned_evidence_manager_id', user.id);
        }
        // Admin and auditor can see all cases

        const { data: cases, error } = await query.order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        res.json({ cases: cases || [] });
    } catch (error) {
        console.error('Get cases error:', error);
        res.status(500).json({ error: 'Failed to get cases' });
    }
};

// Get specific case details
exports.getCaseById = async (req, res) => {
    try {
        const { caseId } = req.params;

        const { data: caseData, error } = await supabase
            .from('cases')
            .select(`
                *,
                investigator:investigator_id(full_name),
                assigned_analyst:assigned_analyst_id(full_name),
                assigned_legal_pro:assigned_legal_pro_id(full_name),
                assigned_evidence_manager:assigned_evidence_manager_id(full_name),
                assigned_court_official:assigned_court_official_id(full_name),
                evidence(*, uploaded_by:uploaded_by(full_name))
            `)
            .eq('case_id', caseId)
            .single();

        if (error) {
            throw error;
        }

        res.json({ case: caseData });
    } catch (error) {
        console.error('Get case error:', error);
        res.status(500).json({ error: 'Failed to get case details' });
    }
};

// Create new case (Investigators only)
exports.createCase = async (req, res) => {
    try {
        const userWallet = req.headers['x-user-wallet'];
        const { title, description, crimeType, location, suspects } = req.body;

        if (!userWallet || !validateWalletAddress(userWallet)) {
            return res.status(401).json({ error: 'Invalid user wallet' });
        }

        // Get user info
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', userWallet)
            .eq('is_active', true)
            .single();

        if (!user) {
            return res.status(401).json({ error: 'User not found or inactive' });
        }

        if (user.role !== 'investigator' && user.role !== 'admin') {
            return res.status(403).json({ error: 'Only investigators can create cases' });
        }

        if (!title) {
            return res.status(400).json({ error: 'Case title is required' });
        }

        // Generate case ID using a more robust method to avoid collisions
        const caseId = `CASE-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        const { data: newCase, error } = await supabase
            .from('cases')
            .insert({
                case_id: caseId,
                title,
                description,
                status: 'CREATED',
                investigator_id: user.id,
                crime_type: crimeType,
                location,
                suspects,
                is_public: false
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.json({ success: true, case: newCase });
    } catch (error) {
        console.error('Create case error:', error);
        res.status(500).json({ error: 'Failed to create case' });
    }
};

// Update case status (Role-based permissions)
exports.updateCaseStatus = async (req, res) => {
    try {
        const { caseId } = req.params;
        const { newStatus, notes } = req.body;
        const user = req.user;
        const caseData = req.caseData;

        const validStatuses = ['CREATED', 'OPEN', 'ANALYZING', 'LEGAL_REVIEW', 'APPROVED', 'IN_CUSTODY', 'READY_TRIAL', 'IN_TRIAL', 'CLOSED'];
        if (!validStatuses.includes(newStatus)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Check if user can change status to this value
        const { data: permission } = await supabase
            .from('role_case_permissions')
            .select('*')
            .eq('role', user.role)
            .eq('case_status', newStatus)
            .single();

        if (!permission || !permission.can_edit) {
            return res.status(403).json({ error: 'Cannot change case to this status' });
        }

        const { data: updatedCase, error } = await supabase
            .from('cases')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('case_id', caseId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Log the status change
        await supabase
            .from('audit_logs')
            .insert({
                user_id: user.id,
                action_type: 'CASE_STATUS_CHANGE',
                entity_type: 'case',
                entity_id: caseData.id,
                old_values: { status: caseData.status },
                new_values: { status: newStatus, notes }
            });

        res.json({ success: true, case: updatedCase });
    } catch (error) {
        console.error('Update case status error:', error);
        res.status(500).json({ error: 'Failed to update case status' });
    }
};

// Assign case to role (Permission-based)
exports.assignCase = async (req, res) => {
    try {
        const { caseId } = req.params;
        const { role, userId } = req.body;
        const user = req.user;

        // Check if user can delegate
        const { data: permission } = await supabase
            .from('role_case_permissions')
            .select('*')
            .eq('role', user.role)
            .eq('case_status', req.caseData.status)
            .single();

        if (!permission || !permission.can_delegate) {
            return res.status(403).json({ error: 'Cannot assign cases' });
        }

        // Get target user
        const { data: targetUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .eq('role', role)
            .eq('is_active', true)
            .single();

        if (!targetUser) {
            return res.status(404).json({ error: 'Target user not found' });
        }

        // Update case assignment
        let updateData = {};
        switch (role) {
            case 'forensic_analyst':
                updateData.assigned_analyst_id = userId;
                break;
            case 'legal_professional':
                updateData.assigned_legal_pro_id = userId;
                break;
            case 'court_official':
                updateData.assigned_court_official_id = userId;
                break;
            case 'evidence_manager':
                updateData.assigned_evidence_manager_id = userId;
                break;
            default:
                return res.status(400).json({ error: 'Invalid role for assignment' });
        }

        const { data: updatedCase, error } = await supabase
            .from('cases')
            .update(updateData)
            .eq('case_id', caseId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Deactivate previous active assignments for this role to avoid duplicates
        await supabase
            .from('case_assignments')
            .update({ status: 'INACTIVE' })
            .eq('case_id', req.caseData.id)
            .eq('assigned_role', role)
            .eq('status', 'ACTIVE');

        // Create assignment record
        await supabase
            .from('case_assignments')
            .insert({
                case_id: req.caseData.id,
                assigned_role: role,
                assigned_user_id: userId,
                status: 'ACTIVE'
            });

        // Log assignment
        await supabase
            .from('audit_logs')
            .insert({
                user_id: user.id,
                action_type: 'CASE_ASSIGNED',
                entity_type: 'case',
                entity_id: req.caseData.id,
                new_values: { assigned_role: role, assigned_user_id: userId }
            });

        res.json({ success: true, case: updatedCase });
    } catch (error) {
        console.error('Assign case error:', error);
        res.status(500).json({ error: 'Failed to assign case' });
    }
};
