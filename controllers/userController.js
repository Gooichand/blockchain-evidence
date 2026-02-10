const { supabase } = require('../config');
const { validateWalletAddress } = require('../middleware/verifyAdmin');

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, department, jurisdiction, badgeNumber, updatedBy } = req.body;

        if (!validateWalletAddress(updatedBy)) {
            return res.status(400).json({ error: 'Invalid updater wallet address' });
        }

        // Get updater info
        const { data: updater } = await supabase
            .from('users')
            .select('id, role')
            .eq('wallet_address', updatedBy)
            .single();

        if (!updater) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Check if user can update this profile (self or admin)
        const { data: targetUser } = await supabase
            .from('users')
            .select('wallet_address')
            .eq('id', id)
            .single();

        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (targetUser.wallet_address !== updatedBy && updater.role !== 'admin') {
            return res.status(403).json({ error: 'Can only update own profile or admin required' });
        }

        // Use database function to update profile
        const { data: result, error } = await supabase
            .rpc('update_user_profile', {
                p_user_id: parseInt(id),
                p_full_name: fullName,
                p_department: department,
                p_jurisdiction: jurisdiction,
                p_badge_number: badgeNumber,
                p_updated_by: updater.id
            });

        if (error) {
            throw error;
        }

        res.json(result);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

// Get user by wallet address with enhanced data
const getUserByWallet = async (req, res) => {
    try {
        const { wallet } = req.params;

        if (!validateWalletAddress(wallet)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        // Use database function to get user
        const { data: result, error } = await supabase
            .rpc('get_user_by_identifier', {
                p_identifier: wallet
            });

        if (error) {
            throw error;
        }

        res.json({ user: result });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Prevent user self-deletion
const preventSelfDeletion = (req, res) => {
    res.status(403).json({
        error: 'Users cannot delete their own accounts. Contact administrator.'
    });
};

module.exports = {
    updateProfile,
    getUserByWallet,
    preventSelfDeletion
};
