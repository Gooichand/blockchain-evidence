const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://vkqswulxmuuganmjqumb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcXN3dWx4bXV1Z2FubWpxdW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3ODc3OTQsImV4cCI6MjA4MjM2Mzc5NH0.LsZKX2aThok0APCNXr9yQ8FnuJnIw6v8RsTIxVLFB4U';
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
app.use('/api/auth', authRoutes);

// Admin rate limiting (stricter)
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50
});

// Validation helpers
const validateWalletAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const allowedRoles = ['public_viewer', 'investigator', 'forensic_analyst', 'legal_professional', 'court_official', 'evidence_manager', 'auditor', 'admin'];

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

// Log admin actions
const logAdminAction = async (adminWallet, actionType, targetWallet, details) => {
    try {
        await supabase
            .from('admin_actions')
            .insert({
                admin_wallet: adminWallet,
                action_type: actionType,
                target_wallet: targetWallet,
                details: details
            });
    } catch (error) {
        console.error('Error logging admin action:', error);
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

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get user by wallet address
app.get('/api/user/:wallet', async (req, res) => {
    try {
        const { wallet } = req.params;
        
        if (!validateWalletAddress(wallet)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', wallet)
            .eq('is_active', true)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        res.json({ user: user || null });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create regular user (Admin only)
app.post('/api/admin/create-user', adminLimiter, verifyAdmin, async (req, res) => {
    try {
        const { adminWallet, userData } = req.body;
        const { walletAddress, fullName, role, department, jurisdiction, badgeNumber } = userData;

        // Validate input
        if (!validateWalletAddress(walletAddress)) {
            return res.status(400).json({ error: 'Invalid wallet address format' });
        }

        if (!fullName || !role) {
            return res.status(400).json({ error: 'Full name and role are required' });
        }

        if (!allowedRoles.includes(role) || role === 'admin') {
            return res.status(400).json({ error: 'Invalid role for regular user' });
        }

        // Check if wallet already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('wallet_address')
            .eq('wallet_address', walletAddress)
            .single();

        if (existingUser) {
            return res.status(409).json({ error: 'Wallet address already registered' });
        }

        // Create user
        const { data: newUser, error } = await supabase
            .from('users')
            .insert({
                wallet_address: walletAddress,
                full_name: fullName,
                role: role,
                department: department || 'General',
                jurisdiction: jurisdiction || 'General',
                badge_number: badgeNumber || '',
                account_type: 'real',
                created_by: adminWallet,
                is_active: true
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Log admin action
        await logAdminAction(adminWallet, 'create_user', walletAddress, {
            user_name: fullName,
            user_role: role,
            department: department
        });

        res.json({ success: true, user: newUser });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Create admin user (Admin only)
app.post('/api/admin/create-admin', adminLimiter, verifyAdmin, async (req, res) => {
    try {
        const { adminWallet, adminData } = req.body;
        const { walletAddress, fullName } = adminData;

        // Validate input
        if (!validateWalletAddress(walletAddress)) {
            return res.status(400).json({ error: 'Invalid wallet address format' });
        }

        if (!fullName) {
            return res.status(400).json({ error: 'Full name is required' });
        }

        // Check admin limit
        const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'admin')
            .eq('is_active', true);

        if (count >= 10) {
            return res.status(400).json({ error: 'Maximum admin limit (10) reached' });
        }

        // Check if wallet already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('wallet_address')
            .eq('wallet_address', walletAddress)
            .single();

        if (existingUser) {
            return res.status(409).json({ error: 'Wallet address already registered' });
        }

        // Create admin
        const { data: newAdmin, error } = await supabase
            .from('users')
            .insert({
                wallet_address: walletAddress,
                full_name: fullName,
                role: 'admin',
                department: 'Administration',
                jurisdiction: 'System',
                account_type: 'real',
                created_by: adminWallet,
                is_active: true
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Log admin action
        await logAdminAction(adminWallet, 'create_admin', walletAddress, {
            admin_name: fullName
        });

        res.json({ success: true, admin: newAdmin });
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ error: 'Failed to create admin' });
    }
});

// Delete user (Admin only)
app.post('/api/admin/delete-user', adminLimiter, verifyAdmin, async (req, res) => {
    try {
        const { adminWallet, targetWallet } = req.body;

        if (!validateWalletAddress(targetWallet)) {
            return res.status(400).json({ error: 'Invalid target wallet address' });
        }

        // Prevent self-deletion
        if (adminWallet === targetWallet) {
            return res.status(400).json({ error: 'Administrators cannot delete their own account' });
        }

        // Get target user info for logging
        const { data: targetUser } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', targetWallet)
            .single();

        if (!targetUser) {
            return res.status(404).json({ error: 'Target user not found' });
        }

        // Soft delete user
        const { error } = await supabase
            .from('users')
            .update({ 
                is_active: false,
                last_updated: new Date().toISOString()
            })
            .eq('wallet_address', targetWallet);

        if (error) {
            throw error;
        }

        // Log admin action
        await logAdminAction(adminWallet, 'delete_user', targetWallet, {
            action: 'soft_delete',
            target_user_name: targetUser.full_name,
            target_user_role: targetUser.role
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Get all users (Admin only)
app.post('/api/admin/users', adminLimiter, verifyAdmin, async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// Prevent user self-deletion
app.post('/api/user/delete-self', (req, res) => {
    res.status(403).json({ 
        error: 'Users cannot delete their own accounts. Contact administrator.' 
    });
});

// Case Management APIs

// Get cases visible to user based on role and permissions
app.get('/api/cases', async (req, res) => {
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
});

// Get specific case details
app.get('/api/cases/:caseId', checkCasePermission, async (req, res) => {
    try {
        const { caseId } = req.params;
        const userWallet = req.headers['x-user-wallet'];

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
});

// Create new case (Investigators only)
app.post('/api/cases', async (req, res) => {
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

        // Generate case ID
        const caseId = `CASE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

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
});

// Update case status (Role-based permissions)
app.put('/api/cases/:caseId/status', checkCasePermission, async (req, res) => {
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
});

// Assign case to role (Permission-based)
app.post('/api/cases/:caseId/assign', checkCasePermission, async (req, res) => {
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
});

// Evidence Management APIs

// Get evidence for a case
app.get('/api/cases/:caseId/evidence', checkCasePermission, async (req, res) => {
    try {
        const { caseId } = req.params;

        const { data: evidence, error } = await supabase
            .from('evidence')
            .select(`
                *,
                uploaded_by:uploaded_by(full_name),
                current_holder:current_holder(full_name)
            `)
            .eq('case_id', req.caseData.id)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        res.json({ evidence: evidence || [] });
    } catch (error) {
        console.error('Get evidence error:', error);
        res.status(500).json({ error: 'Failed to get evidence' });
    }
});

// Upload evidence
app.post('/api/cases/:caseId/evidence', checkCasePermission, async (req, res) => {
    try {
        const { caseId } = req.params;
        const { title, description, evidenceType, fileHash, blockchainTxHash } = req.body;
        const user = req.user;

        // Generate evidence ID
        const evidenceId = `EVID-${caseId.split('-').pop()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

        const { data: newEvidence, error } = await supabase
            .from('evidence')
            .insert({
                evidence_id: evidenceId,
                case_id: req.caseData.id,
                title,
                description,
                evidence_type: evidenceType,
                file_hash: fileHash,
                blockchain_tx_hash: blockchainTxHash,
                uploaded_by: user.id,
                status: 'UPLOADED'
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Log evidence upload
        await supabase
            .from('audit_logs')
            .insert({
                user_id: user.id,
                action_type: 'EVIDENCE_UPLOADED',
                entity_type: 'evidence',
                entity_id: newEvidence.id,
                new_values: { evidence_id: evidenceId, title, evidence_type: evidenceType }
            });

        res.json({ success: true, evidence: newEvidence });
    } catch (error) {
        console.error('Upload evidence error:', error);
        res.status(500).json({ error: 'Failed to upload evidence' });
    }
});

// Get dashboard statistics for user
app.get('/api/dashboard/stats', async (req, res) => {
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

        let stats = {};

        // Get case counts based on role
        if (user.role === 'investigator') {
            const { count: activeCases } = await supabase
                .from('cases')
                .select('*', { count: 'exact', head: true })
                .eq('investigator_id', user.id)
                .in('status', ['CREATED', 'OPEN', 'ANALYZING']);

            const { count: totalCases } = await supabase
                .from('cases')
                .select('*', { count: 'exact', head: true })
                .eq('investigator_id', user.id);

            stats = {
                activeCases: activeCases || 0,
                totalCases: totalCases || 0,
                pendingAnalysis: 0,
                awaitingLegal: 0
            };
        } else if (user.role === 'forensic_analyst') {
            const { count: assignedCases } = await supabase
                .from('cases')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_analyst_id', user.id)
                .eq('status', 'ANALYZING');

            stats = {
                assignedCases: assignedCases || 0,
                completedThisMonth: 0
            };
        } else if (user.role === 'admin') {
            const { count: totalUsers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            const { count: totalCases } = await supabase
                .from('cases')
                .select('*', { count: 'exact', head: true });

            const { count: totalEvidence } = await supabase
                .from('evidence')
                .select('*', { count: 'exact', head: true });

            stats = {
                totalUsers: totalUsers || 0,
                totalCases: totalCases || 0,
                totalEvidence: totalEvidence || 0,
                serverStatus: 'operational'
            };
        }

        res.json({ stats });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to get dashboard statistics' });
    }
});

// Block unauthorized admin operations
app.post('/api/admin/*', (req, res) => {
    res.status(403).json({
        error: 'Forbidden: Administrator privileges required'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
    console.log(`🔐 EVID-DGC API Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;