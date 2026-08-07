const { supabase, allowedRoles } = require('../config');
const { validateWalletAddress, logAdminAction } = require('../middleware/verifyAdmin');
const { createNotification } = require('../services/notificationService');
const bcrypt = require('bcryptjs');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Log an admin action (retention/legal-hold workstations fire-and-forget)
const logAdminActionEndpoint = async (req, res) => {
  try {
    const { adminWallet, action, targetId, details } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, error: 'action is required' });
    }

    const { error } = (await supabase.from('admin_actions').insert({
      admin_wallet: adminWallet || req.headers['x-user-wallet'] || req.authenticatedWallet || 'system',
      action_type: action,
      target_wallet: targetId ? String(targetId) : null,
      details: details || null,
      timestamp: new Date().toISOString(),
    })) || {};
    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Log admin action error:', error);
    res.status(500).json({ success: false, error: 'Failed to log admin action' });
  }
};

// SECURITY FIX: Helper to get the verified admin identity from verifyAdmin middleware.
// All admin routes MUST go through verifyAdmin middleware which sets req.admin.
// Email-first admins (no linked wallet) get a stable per-user handle.
const getAdminWallet = (req) => {
  if (!req.admin) return null;
  return req.admin.wallet_address || `user_${req.admin.id}`;
};

// Create regular user (Admin only)
const createUser = async (req, res) => {
  try {
    // SECURITY FIX: Use req.admin set by verifyAdmin middleware, not req.body.adminWallet
    const adminWallet = getAdminWallet(req);
    if (!adminWallet) {
      return res.status(403).json({ success: false, error: 'Admin verification required' });
    }

    const { userData } = req.body;
    if (!userData) {
      return res.status(400).json({ success: false, error: 'userData is required' });
    }

    const { walletAddress, email, password, fullName, role, department, jurisdiction, badgeNumber } =
      userData;

    // Validate input
    if (!fullName || !role) {
      return res.status(400).json({ success: false, error: 'Full name and role are required' });
    }

    if (!allowedRoles.includes(role) || role === 'admin') {
      return res.status(400).json({ success: false, error: 'Invalid role for regular user' });
    }

    const wallet = walletAddress ? String(walletAddress).toLowerCase() : null;
    if (wallet && !validateWalletAddress(wallet)) {
      return res.status(400).json({ success: false, error: 'Invalid wallet address format' });
    }

    const normalizedEmail = email ? String(email).toLowerCase() : null;
    if (normalizedEmail && !EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ success: false, error: 'Invalid email address format' });
    }

    if (!wallet && !normalizedEmail) {
      return res.status(400).json({ success: false, error: 'A wallet address or email address is required' });
    }

    // Check uniqueness
    if (wallet) {
      const { data: existingByWallet } = (await supabase
        .from('users')
        .select('wallet_address')
        .eq('wallet_address', wallet)
        .single()) || {};
      if (existingByWallet) {
        return res.status(409).json({ success: false, error: 'Wallet address already registered' });
      }
    }

    if (normalizedEmail) {
      const { data: existingByEmail } = (await supabase
        .from('users')
        .select('email')
        .eq('email', normalizedEmail)
        .single()) || {};
      if (existingByEmail) {
        return res.status(409).json({ success: false, error: 'Email address already registered' });
      }
    }

    const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

    // Create user
    const { data: newUser, error } = (await supabase
      .from('users')
      .insert({
        wallet_address: wallet,
        email: normalizedEmail,
        password_hash: hashedPassword,
        full_name: fullName,
        role: role,
        department: department || 'General',
        jurisdiction: jurisdiction || 'General',
        badge_number: badgeNumber || '',
        auth_type: normalizedEmail ? 'email' : 'wallet',
        account_type: 'real',
        email_verified: normalizedEmail ? true : null,
        created_by: adminWallet, // SECURITY FIX: Use verified admin identity
        is_active: true,
      })
      .select()
      .single()) || {};

    if (error) {
      throw error;
    }

    // Log admin action
    await logAdminAction(adminWallet, 'create_user', wallet || String(newUser.id), {
      user_name: fullName,
      user_role: role,
      department: department,
    });

    // Send welcome notification to new user
    if (wallet) {
      await createNotification(
        wallet,
        'Welcome to EVID-DGC',
        `Your ${role} account has been created successfully. You can now access the system.`,
        'system',
        { role, department },
      );
    }

    // Notify admin of successful user creation
    await createNotification(
      adminWallet,
      'User Created Successfully',
      `New ${role} account created for ${fullName}`,
      'system',
      { action: 'user_created', targetUser: fullName, role },
    );

    res.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
};

// Create admin user (Admin only)
const createAdmin = async (req, res) => {
  try {
    // SECURITY FIX: Use req.admin set by verifyAdmin middleware
    const adminWallet = getAdminWallet(req);
    if (!adminWallet) {
      return res.status(403).json({ success: false, error: 'Admin verification required' });
    }

    const { adminData } = req.body;
    if (!adminData) {
      return res.status(400).json({ success: false, error: 'adminData is required' });
    }

    const { walletAddress, email, password, fullName } = adminData;

    // Validate input
    const wallet = walletAddress ? String(walletAddress).toLowerCase() : null;
    if (wallet && !validateWalletAddress(wallet)) {
      return res.status(400).json({ success: false, error: 'Invalid wallet address format' });
    }

    const normalizedEmail = email ? String(email).toLowerCase() : null;
    if (normalizedEmail && !EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ success: false, error: 'Invalid email address format' });
    }

    if (!wallet && !normalizedEmail) {
      return res.status(400).json({ success: false, error: 'A wallet address or email address is required' });
    }

    if (!fullName) {
      return res.status(400).json({ success: false, error: 'Full name is required' });
    }

    // Check admin limit
    const { count } = (await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin')
      .eq('is_active', true)) || {};

    if (count >= 10) {
      return res.status(400).json({ success: false, error: 'Maximum admin limit (10) reached' });
    }

    // Check uniqueness
    if (wallet) {
      const { data: existingByWallet } = (await supabase
        .from('users')
        .select('wallet_address')
        .eq('wallet_address', wallet)
        .single()) || {};
      if (existingByWallet) {
        return res.status(409).json({ success: false, error: 'Wallet address already registered' });
      }
    }

    if (normalizedEmail) {
      const { data: existingByEmail } = (await supabase
        .from('users')
        .select('email')
        .eq('email', normalizedEmail)
        .single()) || {};
      if (existingByEmail) {
        return res.status(409).json({ success: false, error: 'Email address already registered' });
      }
    }

    const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

    // Create admin
    const { data: newAdmin, error } = (await supabase
      .from('users')
      .insert({
        wallet_address: wallet,
        email: normalizedEmail,
        password_hash: hashedPassword,
        full_name: fullName,
        role: 'admin',
        department: 'Administration',
        jurisdiction: 'System',
        auth_type: normalizedEmail ? 'email' : 'wallet',
        account_type: 'real',
        email_verified: normalizedEmail ? true : null,
        created_by: adminWallet, // SECURITY FIX: Use verified admin identity
        is_active: true,
      })
      .select()
      .single()) || {};

    if (error) {
      throw error;
    }

    // Log admin action
    await logAdminAction(adminWallet, 'create_admin', wallet || String(newAdmin.id), {
      admin_name: fullName,
    });

    // Send welcome notification to new admin
    if (wallet) {
      await createNotification(
        wallet,
        'Admin Access Granted',
        `Your administrator account has been created. You now have full system access.`,
        'system',
        { role: 'admin' },
      );
    }

    // Notify creating admin
    await createNotification(
      adminWallet,
      'New Administrator Created',
      `Administrator account created for ${fullName}`,
      'system',
      { action: 'admin_created', targetAdmin: fullName },
    );

    res.json({ success: true, admin: newAdmin });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ success: false, error: 'Failed to create admin' });
  }
};

// Delete user (Admin only)
const deleteUser = async (req, res) => {
  try {
    // SECURITY FIX: Use req.admin set by verifyAdmin middleware
    const adminWallet = getAdminWallet(req);
    if (!adminWallet) {
      return res.status(403).json({ success: false, error: 'Admin verification required' });
    }

    const { targetWallet } = req.body;

    if (!validateWalletAddress(targetWallet)) {
      return res.status(400).json({ success: false, error: 'Invalid target wallet address' });
    }

    // Prevent self-deletion
    if (adminWallet.toLowerCase() === targetWallet.toLowerCase()) {
      return res.status(400).json({ success: false, error: 'Administrators cannot delete their own account' });
    }

    // Get target user info for logging
    const { data: targetUser } = (await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', targetWallet)
      .single()) || {};

    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Target user not found' });
    }

    // Soft delete user
    const { error } = (await supabase
      .from('users')
      .update({
        is_active: false,
        last_updated: new Date().toISOString(),
      })
      .eq('wallet_address', targetWallet)) || {};

    if (error) {
      throw error;
    }

    // Log admin action
    await logAdminAction(adminWallet, 'delete_user', targetWallet, {
      action: 'soft_delete',
      target_user_name: targetUser.full_name,
      target_user_role: targetUser.role,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
};

// Get all users with enhanced filtering and pagination
const getAllUsers = async (req, res) => {
  try {
    // SECURITY FIX: Identity verified by verifyAdmin middleware (JWT or crypto signature)
    if (!req.admin) {
      return res.status(403).json({ success: false, error: 'Admin privileges required' });
    }

    const { limit = 50, offset = 0, role, active_only = 'true' } = req.query;

    // Use database function for efficient user retrieval
    const { data: result, error } = (await supabase.rpc('get_all_users', {
      p_limit: parseInt(limit),
      p_offset: parseInt(offset),
      p_role_filter: role || null,
      p_active_only: active_only === 'true',
    })) || {};

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Failed to get users' });
  }
};

// Request role change (Admin only)
const roleChangeRequest = async (req, res) => {
  try {
    // SECURITY FIX: Use req.admin set by verifyAdmin middleware
    const adminWallet = getAdminWallet(req);
    if (!adminWallet) {
      return res.status(403).json({ success: false, error: 'Admin verification required' });
    }

    const { targetWallet, newRole, reason } = req.body;

    if (!validateWalletAddress(targetWallet) || !allowedRoles.includes(newRole)) {
      return res.status(400).json({ success: false, error: 'Invalid target wallet or role' });
    }

    if (adminWallet.toLowerCase() === targetWallet.toLowerCase()) {
      return res.status(400).json({ success: false, error: 'Cannot change own role' });
    }

    const { data: targetUser } = (await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', targetWallet)
      .single()) || {};

    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Target user not found' });
    }

    const { data: request, error } = (await supabase
      .from('role_change_requests')
      .insert({
        requesting_admin: adminWallet,
        target_wallet: targetWallet,
        old_role: targetUser.role,
        new_role: newRole,
        reason: reason || '',
        status: 'pending',
      })
      .select()
      .single()) || {};

    if (error) throw error;

    res.json({ success: true, request });
  } catch (error) {
    console.error('Role change request error:', error);
    res.status(500).json({ success: false, error: 'Failed to create role change request' });
  }
};

// Get pending role change requests
const getRoleChangeRequests = async (req, res) => {
  try {
    // SECURITY FIX: Identity verified by verifyAdmin middleware
    if (!req.admin) {
      return res.status(403).json({ success: false, error: 'Admin privileges required' });
    }

    const adminIdentity = getAdminWallet(req);

    const { data: requests, error } = (await supabase
      .from('role_change_requests')
      .select('*')
      .eq('status', 'pending')
      .neq('requesting_admin', adminIdentity)
      .order('created_at', { ascending: false })) || {};

    if (error) throw error;

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Get role change requests error:', error);
    res.status(500).json({ success: false, error: 'Failed to get role change requests' });
  }
};

// Approve role change request
const approveRoleChange = async (req, res) => {
  try {
    // SECURITY FIX: Use req.admin set by verifyAdmin middleware
    const adminWallet = getAdminWallet(req);
    if (!adminWallet) {
      return res.status(403).json({ success: false, error: 'Admin verification required' });
    }

    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ success: false, error: 'requestId is required' });
    }

    const { data: request } = (await supabase
      .from('role_change_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single()) || {};

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found or already processed' });
    }

    if (request.requesting_admin.toLowerCase() === adminWallet.toLowerCase()) {
      return res.status(400).json({ success: false, error: 'Cannot approve own request' });
    }

    // Update user role
    const { error: userError } = (await supabase
      .from('users')
      .update({ role: request.new_role })
      .eq('wallet_address', request.target_wallet)) || {};

    if (userError) throw userError;

    // Update request status
    const { error: requestError } = (await supabase
      .from('role_change_requests')
      .update({
        status: 'approved',
        approved_by: adminWallet,
        approved_at: new Date().toISOString(),
      })
      .eq('id', requestId)) || {};

    if (requestError) throw requestError;

    await logAdminAction(adminWallet, 'role_change_approved', request.target_wallet, {
      old_role: request.old_role,
      new_role: request.new_role,
      request_id: requestId,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Approve role change error:', error);
    res.status(500).json({ success: false, error: 'Failed to approve role change' });
  }
};

// Reject role change request
const rejectRoleChange = async (req, res) => {
  try {
    // SECURITY FIX: Use req.admin set by verifyAdmin middleware
    const adminWallet = getAdminWallet(req);
    if (!adminWallet) {
      return res.status(403).json({ success: false, error: 'Admin verification required' });
    }

    const { requestId, reason } = req.body;

    if (!requestId) {
      return res.status(400).json({ success: false, error: 'requestId is required' });
    }

    const { data: request } = (await supabase
      .from('role_change_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single()) || {};

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found or already processed' });
    }

    const { error } = (await supabase
      .from('role_change_requests')
      .update({
        status: 'rejected',
        rejected_by: adminWallet,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason || '',
      })
      .eq('id', requestId)) || {};

    if (error) throw error;

    await logAdminAction(adminWallet, 'role_change_rejected', request.target_wallet, {
      old_role: request.old_role,
      new_role: request.new_role,
      request_id: requestId,
      reason,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Reject role change error:', error);
    res.status(500).json({ success: false, error: 'Failed to reject role change' });
  }
};

// Update user active status (Admin only)
const updateUserStatus = async (req, res) => {
  try {
    const adminWallet = getAdminWallet(req);
    if (!adminWallet) {
      return res.status(403).json({ success: false, error: 'Admin verification required' });
    }

    const { id: userId } = req.params;
    const { isActive } = req.body;

    if (!userId || typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, error: 'userId and isActive are required' });
    }

    if (parseInt(userId, 10) === req.admin.id) {
      return res.status(400).json({ success: false, error: 'Cannot deactivate your own account' });
    }

    const { data: target } = (await supabase
      .from('users')
      .select('wallet_address, full_name, role')
      .eq('id', userId)
      .single()) || {};

    if (!target) {
      return res.status(404).json({ success: false, error: 'Target user not found' });
    }

    const { error } = (await supabase
      .from('users')
      .update({
        is_active: isActive,
        last_updated: new Date().toISOString(),
      })
      .eq('id', userId)) || {};

    if (error) throw error;

    await logAdminAction(adminWallet, isActive ? 'user_activated' : 'user_deactivated', target.wallet_address || String(userId), {
      target_user_name: target.full_name,
      target_user_role: target.role,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user status' });
  }
};

// Update user role (Admin only)
const updateUserRole = async (req, res) => {
  try {
    const adminWallet = getAdminWallet(req);
    if (!adminWallet) {
      return res.status(403).json({ success: false, error: 'Admin verification required' });
    }

    const { id: userId } = req.params;
    const { newRole } = req.body;

    if (!userId || !allowedRoles.includes(newRole)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID or role' });
    }

    if (parseInt(userId, 10) === req.admin.id) {
      return res.status(400).json({ success: false, error: 'Cannot change your own role' });
    }

    const { data: target } = (await supabase
      .from('users')
      .select('wallet_address, full_name, role')
      .eq('id', userId)
      .single()) || {};

    if (!target) {
      return res.status(404).json({ success: false, error: 'Target user not found' });
    }

    const { error } = (await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)) || {};

    if (error) throw error;

    await logAdminAction(adminWallet, 'role_change', target.wallet_address || String(userId), {
      target_user_name: target.full_name,
      old_role: target.role,
      new_role: newRole,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user role' });
  }
};

// Block unauthorized admin operations (catch-all)
const blockUnauthorizedAdmin = (req, res) => {
  res.status(403).json({
    success: false,
    error: 'Forbidden: Administrator privileges required',
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
  updateUserStatus,
  updateUserRole,
  blockUnauthorizedAdmin,
  logAdminActionEndpoint,
};
