const { supabase } = require('../config');

// Validation helper
const validateWalletAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Middleware to verify admin permissions
const verifyAdmin = async (req, res, next) => {
    try {
        const { adminWallet } = req.body;

        if (!adminWallet || !validateWalletAddress(adminWallet)) {
            return res.status(400).json({ error: 'Invalid admin wallet address' });
        }

        // For local development, allow any wallet to be admin (since we're using localStorage)
        // In production, this should be restricted to specific wallets
        req.admin = {
            wallet_address: adminWallet,
            full_name: 'Administrator',
            role: 'admin',
            is_active: true
        };
        next();
        return;

        // Database check (commented out for local development)
        /*
        const { data: admin, error } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', adminWallet)
            .eq('role', 'admin')
            .eq('is_active', true)
            .single();

        if (error || !admin) {
            return res.status(403).json({ error: 'Access denied. Administrator privileges required' });
        }

        req.admin = admin;
        next();
        */
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

module.exports = {
    verifyAdmin,
    logAdminAction,
    validateWalletAddress
};
