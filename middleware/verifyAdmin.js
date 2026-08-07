const { supabase } = require('../config');

// Validation helper
const validateWalletAddress = (address) => {
  return typeof address === 'string' && /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * SECURITY FIX: verifyAdmin now uses a verified identity:
 *  1. req.user (JWT email user verified by requireAuth) — checked against DB
 *  2. The cryptographically verified wallet from the verifySignature middleware.
 * It NO LONGER trusts req.body.adminWallet.
 * This prevents authentication bypass by simply knowing an admin wallet address.
 */
const verifyAdmin = async (req, res, next) => {
  try {
    // Path 1: JWT identity (email users) already verified by requireAuth
    if (req.user) {
      const { data: admin, error } = await supabase
        .from('users')
        .select('id, wallet_address, full_name, role, is_active, department, jurisdiction, email')
        .eq('id', req.user.id)
        .eq('role', 'admin')
        .eq('is_active', true)
        .single();

      if (!error && admin) {
        req.admin = admin;
        return next();
      }
      return res.status(403).json({
        success: false,
        error: 'Access denied. Administrator privileges required.',
      });
    }

    // Path 2: wallet signature identity established by verifySignature
    const adminWallet = req.authenticatedWallet;

    if (!adminWallet) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid cryptographic signature.',
      });
    }

    // Verify role and status in database
    const { data: admin, error } = await supabase
      .from('users')
      .select('id, wallet_address, full_name, role, is_active, department, jurisdiction, email')
      .eq('wallet_address', adminWallet)
      .eq('role', 'admin')
      .eq('is_active', true)
      .single();

    if (error || !admin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Administrator privileges required.',
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// Log admin actions
const logAdminAction = async (adminWallet, actionType, targetWallet, details) => {
  try {
    // Use the verified wallet for logging
    await supabase.from('admin_actions').insert({
      admin_wallet: adminWallet,
      action_type: actionType,
      target_wallet: targetWallet,
      details: details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

module.exports = {
  verifyAdmin,
  logAdminAction,
  validateWalletAddress,
};
