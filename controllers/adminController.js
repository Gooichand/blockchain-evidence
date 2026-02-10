const { supabase, allowedRoles } = require('../config');
const { validateWalletAddress, logAdminAction } = require('../middleware/verifyAdmin');
const { createNotification } = require('../services/notificationService');

// Create regular user (Admin only)
const createUser = async (req, res) => {
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

        // Send welcome notification to new user
        await createNotification(
            walletAddress,
            'Welcome to EVID-DGC',
            `Your ${role} account has been created successfully. You can now access the system.`,
            'system',
            { role, department }
        );

        // Notify admin of successful user creation
        await createNotification(
            adminWallet,
            'User Created Successfully',
            `New ${role} account created for ${fullName}`,
            'system',
            { action: 'user_created', targetUser: fullName, role }
        );

        res.json({ success: true, user: newUser });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

// Create admin user (Admin only)
const createAdmin = async (req, res) => {
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

        // Send welcome notification to new admin
        await createNotification(
            walletAddress,
            'Admin Access Granted',
            `Your administrator account has been created. You now have full system access.`,
            'system',
            { role: 'admin' }
        );

        // Notify creating admin
        await createNotification(
            adminWallet,
            'New Administrator Created',
            `Administrator account created for ${fullName}`,
            'system',
            { action: 'admin_created', targetAdmin: fullName }
        );

        res.json({ success: true, admin: newAdmin });
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ error: 'Failed to create admin' });
    }
};

// Delete user (Admin only)
const deleteUser = async (req, res) => {
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
};

// Get all users with enhanced filtering and pagination
const getAllUsers = async (req, res) => {
    try {
        const { adminWallet } = req.query;
        const { limit = 50, offset = 0, role, active_only = 'true' } = req.query;

        if (!validateWalletAddress(adminWallet)) {
            return res.status(400).json({ error: 'Invalid admin wallet address' });
        }

        // Verify admin permissions
        const { data: admin } = await supabase
            .from('users')
            .select('role')
            .eq('wallet_address', adminWallet)
            .eq('is_active', true)
            .single();

        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ error: 'Admin privileges required' });
        }

        // Use database function for efficient user retrieval
        const { data: result, error } = await supabase
            .rpc('get_all_users', {
                p_limit: parseInt(limit),
                p_offset: parseInt(offset),
                p_role_filter: role || null,
                p_active_only: active_only === 'true'
            });

        if (error) {
            throw error;
        }

        res.json({ 
            success: true, 
            ...result
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
};

// Request role change (Admin only)
const roleChangeRequest = async (req, res) => {
    try {
        const { adminWallet, targetWallet, newRole, reason } = req.body;

        if (!validateWalletAddress(targetWallet) || !allowedRoles.includes(newRole)) {
            return res.status(400).json({ error: 'Invalid target wallet or role' });
        }

        if (adminWallet === targetWallet) {
            return res.status(400).json({ error: 'Cannot change own role' });
        }

        const { data: targetUser } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', targetWallet)
            .single();

        if (!targetUser) {
            return res.status(404).json({ error: 'Target user not found' });
        }

        const { data: request, error } = await supabase
            .from('role_change_requests')
            .insert({
                requesting_admin: adminWallet,
                target_wallet: targetWallet,
                old_role: targetUser.role,
                new_role: newRole,
                reason: reason || '',
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, request });
    } catch (error) {
        console.error('Role change request error:', error);
        res.status(500).json({ error: 'Failed to create role change request' });
    }
};

// Get pending role change requests
const getRoleChangeRequests = async (req, res) => {
    try {
        const { adminWallet } = req.query;

        if (!validateWalletAddress(adminWallet)) {
            return res.status(400).json({ error: 'Invalid admin wallet' });
        }

        const { data: requests, error } = await supabase
            .from('role_change_requests')
            .select('*')
            .eq('status', 'pending')
            .neq('requesting_admin', adminWallet)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, requests });
    } catch (error) {
        console.error('Get role change requests error:', error);
        res.status(500).json({ error: 'Failed to get role change requests' });
    }
};

// Approve role change request
const approveRoleChange = async (req, res) => {
    try {
        const { adminWallet, requestId } = req.body;

        const { data: request } = await supabase
            .from('role_change_requests')
            .select('*')
            .eq('id', requestId)
            .eq('status', 'pending')
            .single();

        if (!request) {
            return res.status(404).json({ error: 'Request not found or already processed' });
        }

        if (request.requesting_admin === adminWallet) {
            return res.status(400).json({ error: 'Cannot approve own request' });
        }

        // Update user role
        const { error: userError } = await supabase
            .from('users')
            .update({ role: request.new_role })
            .eq('wallet_address', request.target_wallet);

        if (userError) throw userError;

        // Update request status
        const { error: requestError } = await supabase
            .from('role_change_requests')
            .update({
                status: 'approved',
                approved_by: adminWallet,
                approved_at: new Date().toISOString()
            })
            .eq('id', requestId);

        if (requestError) throw requestError;

        await logAdminAction(adminWallet, 'role_change_approved', request.target_wallet, {
            old_role: request.old_role,
            new_role: request.new_role,
            request_id: requestId
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Approve role change error:', error);
        res.status(500).json({ error: 'Failed to approve role change' });
    }
};

// Reject role change request
const rejectRoleChange = async (req, res) => {
    try {
        const { adminWallet, requestId, reason } = req.body;

        const { data: request } = await supabase
            .from('role_change_requests')
            .select('*')
            .eq('id', requestId)
            .eq('status', 'pending')
            .single();

        if (!request) {
            return res.status(404).json({ error: 'Request not found or already processed' });
        }

        const { error } = await supabase
            .from('role_change_requests')
            .update({
                status: 'rejected',
                rejected_by: adminWallet,
                rejected_at: new Date().toISOString(),
                rejection_reason: reason || ''
            })
            .eq('id', requestId);

        if (error) throw error;

        await logAdminAction(adminWallet, 'role_change_rejected', request.target_wallet, {
            old_role: request.old_role,
            new_role: request.new_role,
            request_id: requestId,
            reason
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Reject role change error:', error);
        res.status(500).json({ error: 'Failed to reject role change' });
    }
};

// Block unauthorized admin operations (catch-all)
const blockUnauthorizedAdmin = (req, res) => {
    res.status(403).json({
        error: 'Forbidden: Administrator privileges required'
    });
};

module.exports = {
    createUser,
    createAdmin,
    deleteUser,
    getAllUsers,
    roleChangeRequest,
    getRoleChangeRequests,
    approveRoleChange,
    rejectRoleChange,
    blockUnauthorizedAdmin
};
