const { supabase, allowedRoles } = require('../config');
const { validateWalletAddress } = require('../middleware/verifyAdmin');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h';

// Guard: fail loudly if JWT is misconfigured instead of crashing mid-request
if (!JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET environment variable is not set. Authentication will fail.');
}

/** Parse a User-Agent string into device/browser labels for the sessions UI. */
function parseUserAgent(ua = '') {
  const lower = ua.toLowerCase();
  let device = 'Unknown device';
  if (/mobile|android|iphone|ipad/i.test(lower)) device = 'Mobile';
  else if (/tablet|ipad/i.test(lower)) device = 'Tablet';
  else if (/macintosh|windows|linux/i.test(lower)) device = 'Desktop';

  let browser = 'Unknown browser';
  if (lower.includes('edg')) browser = 'Edge';
  else if (lower.includes('opr') || lower.includes('opera')) browser = 'Opera';
  else if (lower.includes('firefox')) browser = 'Firefox';
  else if (lower.includes('safari') && !lower.includes('chrome')) browser = 'Safari';
  else if (lower.includes('chrome')) browser = 'Chrome';

  return { device, browser };
}

/** Record a server-side session row for the signed-in user. */
async function createUserSession(user, req) {
  try {
    const { device, browser } = parseUserAgent(req.headers['user-agent']);
    await supabase.from('user_sessions').insert({
      user_id: user.id,
      wallet_address: user.wallet_address || null,
      ip_address: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null,
      user_agent: req.headers['user-agent'] || null,
      device,
      browser,
      location: 'Unknown',
      is_active: true,
    });
  } catch (error) {
    console.error('Failed to record user session:', error);
  }
}

// SECURITY FIX: In-memory nonce store for wallet ownership proof
// Key: lowercased wallet address, Value: { nonce, message, expiresAt }
const walletNonces = new Map();

const SESSION_COOKIE = 'evid_token';
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24h

/**
 * Set the server-side session cookie. The same JWT is also returned in the
 * JSON body for the frontend's Bearer auth. The cookie is HttpOnly so it
 * cannot be read by client JS (protects privileged dashboard pages served
 * directly by the static layer) and is used by the page guard.
 */
function setSessionCookie(res, token, req) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: Boolean(secure),
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

// Clean up expired nonces every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [addr, data] of walletNonces.entries()) {
    if (now > data.expiresAt) walletNonces.delete(addr);
  }
}, 5 * 60 * 1000).unref();

// SECURITY FIX: Generate nonce for wallet ownership proof (ECDSA challenge)
const walletNonce = async (req, res) => {
  try {
    const { address } = req.query;

    if (!address || !validateWalletAddress(address)) {
      return res.status(400).json({ success: false, error: 'Valid wallet address is required' });
    }

    const nonce = crypto.randomBytes(32).toString('hex');
    const message = `EVID-DGC Wallet Verification\nAddress: ${address.toLowerCase()}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;

    walletNonces.set(address.toLowerCase(), {
      nonce,
      message,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5-minute expiry
    });

    res.json({ success: true, message, nonce });
  } catch (error) {
    console.error('Nonce generation error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate nonce' });
  }
};

// Wallet login
const walletLogin = async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (!validateWalletAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    // Get user by wallet address
    const { data: user, error } = (await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('is_active', true)
      .single()) || {};

    if (error || !user) {
      return res.status(401).json({ error: 'Wallet address not registered' });
    }

    // Log login activity (check returned error since Supabase does not throw on DB failures)
    const { error: logError } = (await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'wallet_login',
      details: JSON.stringify({ auth_type: 'wallet' }),
      timestamp: new Date().toISOString(),
    })) || {};
    if (logError) {
      console.error('Failed to log wallet login activity:', logError);
    }

    // Record server-side session
    await createUserSession(user, req);

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, walletAddress: user.wallet_address, role: user.role, jti: crypto.randomUUID() },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    setSessionCookie(res, token, req);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        wallet_address: user.wallet_address,
        full_name: user.full_name,
        role: user.role,
        department: user.department,
        jurisdiction: user.jurisdiction,
        badge_number: user.badge_number,
        auth_type: user.auth_type,
      },
    });
  } catch (error) {
    console.error('Wallet login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Email login
const emailLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user by email
    const { data: user, error } = (await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single()) || {};

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password using bcrypt
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Log login activity (check returned error since Supabase does not throw on DB failures)
    const { error: logError } = (await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'email_login',
      details: JSON.stringify({ auth_type: 'email' }),
      timestamp: new Date().toISOString(),
    })) || {};
    if (logError) {
      console.error('Failed to log email login activity:', logError);
    }

    // Record server-side session
    await createUserSession(user, req);

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, jti: crypto.randomUUID() },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    setSessionCookie(res, token, req);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        department: user.department,
        jurisdiction: user.jurisdiction,
        auth_type: user.auth_type,
      },
    });
  } catch (error) {
    console.error('Email login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Server-side logout: revoke the active token and clear the session cookie.
const logout = async (req, res) => {
  try {
    const token =
      (req.headers.cookie || '')
        .split(';')
        .map((p) => p.trim())
        .find((p) => p.startsWith('evid_token='))
        ?.split('=')
        .slice(1)
        .join('=') ||
      (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');

    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (payload && payload.jti) {
          const { revokeToken } = require('../middleware/authorization');
          revokeToken(payload.jti);
        }
      } catch (_) {
        // Already invalid/expired token — nothing to revoke.
      }
    }

    clearSessionCookie(res);
    return res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, error: 'Logout failed' });
  }
};

// Email registration
const emailRegister = async (req, res) => {
  try {
    const { email, password, fullName, role, department, jurisdiction } = req.body;

    // Avoid logging PII (email) in production
    console.log('Email registration request:', { role, department, jurisdiction });

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: 'Email, password, full name, and role are required' });
    }

    // TODO: integrate breached-password check (e.g., HaveIBeenPwned API / zxcvbn scoring)
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Lightweight email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }

    if (role === 'admin') {
      return res
        .status(403)
        .json({ error: 'Administrator registration is not allowed via public registration.' });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role selected' });
    }

    // Check if email already exists
    const { data: existingUser, error: lookupError } = (await supabase
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase())
      .single()) || {};

    if (lookupError && lookupError.code !== 'PGRST116') {
      console.error('Email lookup error:', lookupError);
      return res.status(500).json({ error: 'Unable to verify email availability' });
    }

    if (existingUser) {
      return res.status(409).json({ error: 'Email address already registered' });
    }

    // Hash password using bcrypt (12 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Accounts are activated immediately — no email verification step (per project decision)
    const verificationToken = null;
    const tokenExpires = null;

    // Create user
    const { data: newUser, error } = (await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        full_name: fullName,
        role: role,
        department: department || 'General',
        jurisdiction: jurisdiction || 'General',
        auth_type: 'email',
        account_type: 'real',
        created_by: 'self_registration',
        is_active: true,
        email_verified: true,
        verification_token: verificationToken,
        verification_token_expires: tokenExpires,
      })
      .select()
      .single()) || {};

    if (error) {
      console.error('User creation error:', error);
      throw error;
    }

    console.log('User created successfully:', newUser.id);

    // Log registration activity (check returned error since Supabase does not throw on DB failures)
    const { error: logError } = (await supabase.from('activity_logs').insert({
      user_id: newUser.id,
      action: 'email_registration',
      details: JSON.stringify({
        role: role,
        auth_type: 'email',
        department: department || 'General',
      }),
      timestamp: new Date().toISOString(),
    })) || {};
    if (logError) {
      console.error('Failed to log email registration activity:', logError);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful — you can now log in with your email.',
      email_verification_required: false,
      email_verified: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        department: newUser.department,
        jurisdiction: newUser.jurisdiction,
        auth_type: newUser.auth_type,
      },
    });
  } catch (error) {
    console.error('Email registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again later.' });
  }
};

// Wallet registration
const walletRegister = async (req, res) => {
  try {
    const { walletAddress, fullName, role, department, jurisdiction, badgeNumber, signature } = req.body;

    console.log('Wallet registration request:', {
      role,
      department,
      jurisdiction,
      walletSuffix: walletAddress?.slice(-6),
    });

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (!validateWalletAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    // SECURITY FIX: Verify wallet ownership via ECDSA signature
    if (!signature) {
      return res.status(400).json({
        error: 'Wallet signature is required. Request a nonce first via GET /api/auth/wallet/nonce',
      });
    }

    const storedNonce = walletNonces.get(walletAddress.toLowerCase());
    if (!storedNonce) {
      return res.status(400).json({
        error: 'No nonce found. Request a nonce first via GET /api/auth/wallet/nonce',
      });
    }

    if (Date.now() > storedNonce.expiresAt) {
      walletNonces.delete(walletAddress.toLowerCase());
      return res.status(400).json({ error: 'Nonce expired. Please request a new one.' });
    }

    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(storedNonce.message, signature);
    } catch (_sigErr) {
      return res.status(403).json({ error: 'Invalid wallet signature format.' });
    }

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(403).json({ error: 'Wallet signature verification failed.' });
    }

    // Consume the nonce to prevent replay
    walletNonces.delete(walletAddress.toLowerCase());

    if (!fullName || !role) {
      return res.status(400).json({ error: 'Full name and role are required' });
    }

    if (role === 'admin') {
      return res
        .status(403)
        .json({ error: 'Administrator registration is not allowed via public registration.' });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role selected' });
    }

    // Check if wallet already exists
    const { data: existingUser, error: lookupError } = (await supabase
      .from('users')
      .select('wallet_address')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single()) || {};

    if (lookupError && lookupError.code !== 'PGRST116') {
      console.error('Wallet lookup error:', lookupError);
      return res.status(500).json({ error: 'Unable to verify wallet availability' });
    }

    if (existingUser) {
      return res.status(409).json({ error: 'Wallet address already registered' });
    }

    // Create user
    const { data: newUser, error } = (await supabase
      .from('users')
      .insert({
        wallet_address: walletAddress.toLowerCase(),
        full_name: fullName,
        role: role,
        department: department || 'General',
        jurisdiction: jurisdiction || 'General',
        badge_number: badgeNumber || '',
        auth_type: 'wallet',
        account_type: 'real',
        created_by: 'self_registration',
        is_active: true,
      })
      .select()
      .single()) || {};

    if (error) {
      console.error('Wallet user creation error:', error);
      throw error;
    }

    console.log('Wallet user created successfully:', newUser.id);

    // Log registration activity (check returned error since Supabase does not throw on DB failures)
    const { error: logError } = (await supabase.from('activity_logs').insert({
      user_id: newUser.id,
      action: 'wallet_registration',
      details: JSON.stringify({
        role: role,
        auth_type: 'wallet',
        department: department || 'General',
      }),
      timestamp: new Date().toISOString(),
    })) || {};
    if (logError) {
      console.error('Failed to log wallet registration activity:', logError);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: newUser.id,
        wallet_address: newUser.wallet_address,
        full_name: newUser.full_name,
        role: newUser.role,
        department: newUser.department,
        jurisdiction: newUser.jurisdiction,
        badge_number: newUser.badge_number,
        auth_type: newUser.auth_type,
      },
    });
  } catch (error) {
    console.error('Wallet registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again later.' });
  }
};

// Verify Email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Get user by token (only fetch needed fields to avoid exposing password_hash)
    const { data: user, error } = (await supabase
      .from('users')
      .select('id, email_verified, verification_token_expires')
      .eq('verification_token', token)
      .single()) || {};

    if (error || !user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Check expiry
    if (new Date(user.verification_token_expires) < new Date()) {
      return res.status(400).json({ error: 'Verification token has expired' });
    }

    // Update user
    const { error: updateError } = (await supabase
      .from('users')
      .update({
        email_verified: true,
        verification_token: null,
        verification_token_expires: null,
      })
      .eq('id', user.id)) || {};

    if (updateError) {
      console.error('Verify email error:', updateError);
      return res.status(500).json({ error: 'Failed to verify email' });
    }

    // Audit log for email verification (check returned error since Supabase does not throw on DB failures)
    const { error: auditLogError } = (await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'email_verified',
      details: JSON.stringify({ user_id: user.id, verified: true }),
      timestamp: new Date().toISOString(),
    })) || {};
    if (auditLogError) {
      console.error('Failed to log email verification:', auditLogError);
    }

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// Request a password reset token
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Always answer the same way whether or not the account exists (no user enumeration)
    const { data: user } = (await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single()) || {};

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      await supabase.from('password_resets').insert({
        email: user.email,
        token,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      });

      // Audit trail
      const { error: logError } = (await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'password_reset_requested',
        details: JSON.stringify({ auth_type: 'email' }),
        timestamp: new Date().toISOString(),
      })) || {};
      if (logError) console.error('Failed to log password reset request:', logError);

      // In production this link would be emailed (EmailJS is wired client-side).
      // Returned here so the demo flow can complete end-to-end.
      return res.json({
        success: true,
        message: 'If that email is registered, a reset link has been sent.',
        resetLink: `/reset-password.html?token=${token}&email=${encodeURIComponent(user.email)}`,
      });
    }

    res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Failed to process password reset request' });
  }
};

// Update the signed-in user's profile
const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { fullName, department, jurisdiction, badgeNumber } = req.body;

    const patch = {};
    if (fullName !== undefined) patch.full_name = fullName;
    if (department !== undefined) patch.department = department;
    if (jurisdiction !== undefined) patch.jurisdiction = jurisdiction;
    if (badgeNumber !== undefined) patch.badge_number = badgeNumber;

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ success: false, error: 'No profile fields to update' });
    }

    const { data: updated, error } = (await supabase
      .from('users')
      .update(patch)
      .eq('id', user.id)
      .select('id, email, wallet_address, full_name, role, department, jurisdiction, badge_number')
      .single()) || {};
    if (error) throw error;

    const { error: logError } = (await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'profile_updated',
      details: JSON.stringify({ fields: Object.keys(patch) }),
      timestamp: new Date().toISOString(),
    })) || {};
    if (logError) console.error('Failed to log profile update:', logError);

    res.json({ success: true, user: updated });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
};

// Change the signed-in user's password
const changePassword = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters long' });
    }

    const { data: account } = (await supabase
      .from('users')
      .select('id, password_hash')
      .eq('id', user.id)
      .single()) || {};

    if (!account?.password_hash) {
      return res.status(400).json({ success: false, error: 'This account uses wallet authentication and has no password' });
    }

    const isValid = await bcrypt.compare(currentPassword, account.password_hash);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const { error } = (await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('id', user.id)) || {};
    if (error) throw error;

    const { error: logError } = (await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'password_changed',
      details: JSON.stringify({ auth_type: 'email' }),
      timestamp: new Date().toISOString(),
    })) || {};
    if (logError) console.error('Failed to log password change:', logError);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
};

// List the signed-in user's active sessions
const getSessions = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { data: rows, error } = (await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('last_active', { ascending: false })
      .limit(50)) || {};
    if (error) throw error;

    const sessions = (rows || []).map((row) => ({
      id: row.id,
      current: false,
      device: row.device || 'Unknown device',
      browser: row.browser || 'Unknown browser',
      location: row.location || 'Unknown',
      lastActive: row.last_active,
      createdAt: row.created_at,
      isActive: Boolean(row.is_active),
    }));

    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ success: false, error: 'Failed to get sessions' });
  }
};

// Complete a password reset using a token from password_resets
const resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: 'Token and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long' });
    }

    const { data: reset, error: lookupError } = (await supabase
      .from('password_resets')
      .select('*')
      .eq('token', token)
      .single()) || {};

    if (lookupError || !reset) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }
    if (reset.used) {
      return res.status(400).json({ success: false, error: 'Reset token has already been used' });
    }
    if (new Date(reset.expires_at) < new Date()) {
      return res.status(400).json({ success: false, error: 'Reset token has expired' });
    }
    if (email && reset.email.toLowerCase() !== String(email).toLowerCase()) {
      return res.status(400).json({ success: false, error: 'Reset token does not match this email' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const { error: updateError } = (await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('email', reset.email)) || {};
    if (updateError) throw updateError;

    await supabase.from('password_resets').update({ used: true }).eq('id', reset.id);

    const { error: logError } = (await supabase.from('activity_logs').insert({
      user_id: reset.email,
      action: 'password_reset_completed',
      details: JSON.stringify({ auth_type: 'email' }),
      timestamp: new Date().toISOString(),
    })) || {};
    if (logError) console.error('Failed to log password reset completion:', logError);

    res.json({ success: true, message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
};

module.exports = {
  emailLogin,
  emailRegister,
  walletLogin,
  walletRegister,
  walletNonce,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  getSessions,
  logout,
};
