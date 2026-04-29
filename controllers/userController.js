const { supabase } = require('../config');
const { validateWalletAddress } = require('../middleware/verifyAdmin');

// SECURITY FIX: Helper to get the verified wallet address from the request.
// Prefers the cryptographically-verified wallet set by verifySignature middleware.
// Falls back to body/query param only when middleware hasn't run (should not happen on protected routes).
const getVerifiedWallet = (req) => {
  return req.authenticatedWallet || null;
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, department, jurisdiction, badgeNumber } = req.body;

    // SECURITY FIX: Use cryptographically verified wallet instead of req.body.updatedBy
    const verifiedWallet = getVerifiedWallet(req);
    if (!verifiedWallet) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Get updater info using verified identity
    const { data: updater } = await supabase
      .from('users')
      .select('id, role')
      .eq('wallet_address', verifiedWallet)
      .eq('is_active', true)
      .single();

    if (!updater) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Check if user can update this profile (self or admin)
    const { data: targetUser } = await supabase
      .from('users')
      .select('wallet_address')
      .eq('id', id)
      .single();

    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // SECURITY FIX: Compare against verified wallet, not a body-supplied field
    if (targetUser.wallet_address !== verifiedWallet && updater.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Can only update own profile or admin required' });
    }

    // BUG FIX: Validate the user ID parameter
    const userId = parseInt(id, 10);
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    // Use database function to update profile
    const { data: result, error } = await supabase.rpc('update_user_profile', {
      p_user_id: userId,
      p_full_name: fullName,
      p_department: department,
      p_jurisdiction: jurisdiction,
      p_badge_number: badgeNumber,
      p_updated_by: updater.id,
    });

    if (error) {
      throw error;
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
};

// Get user by wallet address with enhanced data
const getUserByWallet = async (req, res) => {
  try {
    const { wallet } = req.params;

    if (!validateWalletAddress(wallet)) {
      return res.status(400).json({ success: false, error: 'Invalid wallet address' });
    }

    // Use database function to get user
    const { data: result, error } = await supabase.rpc('get_user_by_identifier', {
      p_identifier: wallet,
    });

    if (error) {
      throw error;
    }

    res.json({ success: true, user: result });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Prevent user self-deletion
const preventSelfDeletion = (req, res) => {
  res.status(403).json({
    success: false,
    error: 'Users cannot delete their own accounts. Contact administrator.',
  });
};

module.exports = {
  updateProfile,
  getUserByWallet,
  preventSelfDeletion,
};
