const supabase = require('../config/supabase');
const { validateWalletAddress } = require('../utils/validation');

// Middleware to verify admin permissions
const verifyAdmin = async (req, res, next) => {
    try {
        const { adminWallet } = req.body;

        if (!adminWallet || !validateWalletAddress(adminWallet)) {
            return res.status(400).json({ error: 'Invalid admin wallet address' });
        }

        const { data: admin, error } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', adminWallet)
            .eq('role', 'admin')
            .eq('is_active', true)
            .single();

        if (error || !admin) {
            return res.status(403).json({ error: 'Unauthorized: Admin privileges required' });
        }

        req.admin = admin;
        next();
    } catch (error) {
        console.error('Admin verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Case Access Control Middleware
const checkCasePermission = async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const { action } = req.query; // view, edit, approve, delete
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

        // Admin and auditor have special permissions
        if (user.role === 'admin') {
            req.user = user;
            return next();
        }

        if (user.role === 'auditor') {
            if (action === 'view') {
                req.user = user;
                return next();
            }
            return res.status(403).json({ error: 'Auditors have read-only access' });
        }

        // Get case info
        const { data: caseData } = await supabase
            .from('cases')
            .select('*')
            .eq('case_id', caseId)
            .single();

        if (!caseData) {
            return res.status(404).json({ error: 'Case not found' });
        }

        // Check permission matrix
        const { data: permission } = await supabase
            .from('role_case_permissions')
            .select('*')
            .eq('role', user.role)
            .eq('case_status', caseData.status)
            .single();

        if (!permission) {
            return res.status(403).json({ error: 'No permission defined for this role and case status' });
        }

        // Check basic permission
        let hasPermission = false;
        switch (action) {
            case 'view':
                hasPermission = permission.can_view;
                break;
            case 'edit':
                hasPermission = permission.can_edit;
                break;
            case 'approve':
                hasPermission = permission.can_approve;
                break;
            default:
                hasPermission = false;
        }

        if (!hasPermission) {
            return res.status(403).json({ error: 'Insufficient permissions for this action' });
        }

        // Check assignment requirement
        if (permission.requires_assignment) {
            let assignedUserId = null;
            switch (user.role) {
                case 'forensic_analyst':
                    assignedUserId = caseData.assigned_analyst_id;
                    break;
                case 'legal_professional':
                    assignedUserId = caseData.assigned_legal_pro_id;
                    break;
                case 'court_official':
                    assignedUserId = caseData.assigned_court_official_id;
                    break;
                case 'evidence_manager':
                    assignedUserId = caseData.assigned_evidence_manager_id;
                    break;
            }

            if (assignedUserId !== user.id) {
                return res.status(403).json({ error: 'You are not assigned to this case' });
            }
        }

        // Check ownership for investigators
        if (user.role === 'investigator' && caseData.investigator_id !== user.id) {
            return res.status(403).json({ error: 'You can only access your own cases' });
        }

        req.user = user;
        req.caseData = caseData;
        next();
    } catch (error) {
        console.error('Permission check error:', error);
        res.status(500).json({ error: 'Permission check failed' });
    }
};

module.exports = {
    verifyAdmin,
    checkCasePermission
};
