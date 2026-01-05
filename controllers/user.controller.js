const supabase = require('../config/supabase');
const { validateWalletAddress, allowedRoles } = require('../utils/validation');
const { logAdminAction } = require('../services/admin.service');

// Get user by wallet address
exports.getUserByWallet = async (req, res) => {
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
};

// Create regular user (Admin only)
exports.createUser = async (req, res) => {
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
};

// Create admin user (Admin only)
exports.createAdmin = async (req, res) => {
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
};

// Delete user (Admin only)
exports.deleteUser = async (req, res) => {
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

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
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
};

// Prevent user self-deletion
exports.deleteSelf = (req, res) => {
    res.status(403).json({
        error: 'Users cannot delete their own accounts. Contact administrator.'
    });
};
