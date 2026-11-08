const { supabase, allowedRoles } = require('../config');
const { validateWalletAddress } = require('../middleware/verifyAdmin');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const QRCode = require('qrcode');
const { generateTotpSecret, totpVerify } = require('../lib/totp');
const { logAudit, clientIp } = require('../lib/audit');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

// Account lockout policy: 5 consecutive failed logins locks the account for 15 minutes.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// Password policy: 10+ chars with upper, lower, digit and symbol.
const PASSWORD_MIN_LENGTH = 10;
function passwordPolicyError(password) {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`;
  }
  if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter';
  if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter';
  if (!/\d/.test(password)) return 'Password must include a number';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include a symbol';
  return null;
}

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
async function createUserSession(user, req, tokenJti) {
  try {
    const headers = (req && req.headers) || {};
    const ua = headers['user-agent'] || '';
    const { device, browser } = parseUserAgent(ua);
    await supabase.from('user_sessions').insert({
      user_id: user.id,
      // session_token is NOT NULL in the schema; store the JWT id (never the
      // raw token) so the row can be matched for revocation.
      session_token: tokenJti || crypto.randomUUID(),
      wallet_address: user.wallet_address || null,
      token_jti: tokenJti || null,
      ip_address:
        (headers['x-forwarded-for'] && headers['x-forwarded-for'].split(',')[0].trim()) ||
        (req && req.socket && req.socket.remoteAddress) ||
        null,
      user_agent: ua || null,
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
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7d

/**
 * Set the server-side session cookie. The same JWT is also returned in the
 * JSON body for the frontend's Bearer auth. The cookie is HttpOnly so it
 * cannot be read by client JS (protects privileged dashboard pages served
 * directly by the static layer) and is used by the page guard.
 */
function setSessionCookie(res, token, req) {
  if (!res || typeof res.cookie !== 'function') return;
  const headers = (req && req.headers) || {};
  const proto = headers['x-forwarded-proto'];
  const secure = Boolean(
    (req && req.secure) ||
      proto === 'https' ||
      (typeof proto === 'string' && proto.split(',').map((s) => s.trim()).includes('https')),
  );
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: Boolean(secure),
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

function clearSessionCookie(res) {
  if (res && typeof res.clearCookie === 'function') res.clearCookie(SESSION_COOKIE, { path: '/' });
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
    const { email, password, totp } = req.body;

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

    // Enforce temporary lockout after repeated failed attempts.
    if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
      const minutesLeft = Math.max(1, Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000));
      await logAudit(req, { userId: user.id, action: 'email_login_locked', result: 'denied', details: { auth_type: 'email' } });
      return res.status(423).json({
        error: `Account temporarily locked. Try again in ${minutesLeft} minute(s).`,
        lockedUntil: user.locked_until,
      });
    }

    // Verify password using bcrypt
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      // Track consecutive failures; lock the account after the threshold.
      const attempts = (user.failed_login_attempts || 0) + 1;
      const update = { failed_login_attempts: attempts };
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        update.failed_login_attempts = 0;
        update.locked_until = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
      }
      try {
        await supabase.from('users').update(update).eq('id', user.id);
      } catch (lockoutError) {
        // Lockout bookkeeping must never break the auth flow itself.
        console.error('Failed to record failed login attempt:', lockoutError);
      }
      await logAudit(req, {
        userId: user.id,
        action: 'email_login_failed',
        result: 'failure',
        details: { auth_type: 'email', locked: attempts >= MAX_FAILED_ATTEMPTS },
      });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Password correct: clear any stale lockout state.
    if (user.failed_login_attempts || user.locked_until) {
      try {
        await supabase
          .from('users')
          .update({ failed_login_attempts: 0, locked_until: null })
          .eq('id', user.id);
      } catch (resetError) {
        console.error('Failed to clear login lockout state:', resetError);
      }
    }

    // Two-factor authentication: require a TOTP code when the account has it enabled.
    if (user.totp_enabled && user.totp_secret) {
      if (!totp) {
        return res.status(401).json({
          error: 'Two-factor authentication code required',
          requiresTwoFactor: true,
        });
      }
      try {
        if (!totpVerify(user.totp_secret, totp)) {
          await logAudit(req, { userId: user.id, action: 'email_login_2fa_failed', result: 'failure', details: { auth_type: 'email' } });
          return res.status(401).json({
            error: 'Invalid two-factor authentication code',
            requiresTwoFactor: true,
          });
        }
      } catch (totpError) {
        console.error('TOTP verification error:', totpError);
        return res.status(500).json({ error: 'Two-factor verification failed' });
      }
    }

    // Log login activity with client IP and result (M16 audit trail)
    await logAudit(req, { userId: user.id, action: 'email_login', result: 'success', details: { auth_type: 'email' } });

    // Generate JWT and record the server-side session against its id so it
    // can be revoked later from the sessions page.
    const jti = crypto.randomUUID();
    await createUserSession(user, req, jti);

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, jti },
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
          // Persistently deactivate the recorded session row too.
          await supabase
            .from('user_sessions')
            .update({ is_active: false })
            .eq('token_jti', payload.jti);
        }
      } catch (_) {
        // Already invalid/expired token — nothing to revoke.
      }
    }

    clearSessionCookie(res);
    try {
      const { verifyRequestIdentity } = require('../middleware/authorization');
      const { user: identity } = verifyRequestIdentity(req);
      if (identity) {
        await logAudit(req, { userId: identity.id, action: 'logout', result: 'success' });
      }
    } catch (_) { /* logout stays quiet on logging problems */ }
    return res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, error: 'Logout failed' });
  }
};

// Get current authenticated user (for server-side auth verification)
const getCurrentUser = async (req, res) => {
  try {
    const { verifyRequestIdentity } = require('../middleware/authorization');
    const { user, error } = verifyRequestIdentity(req);
    if (!user || error) {
      return res.status(401).json({ success: false, error: error || 'Not authenticated' });
    }
    return res.json({ success: true, user });
  } catch (err) {
    console.error('getCurrentUser error:', err);
    return res.status(500).json({ success: false, error: 'Internal error' });
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
    const policyError = passwordPolicyError(password);
    if (policyError) {
      return res.status(400).json({ error: policyError });
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
    const newPolicyError = passwordPolicyError(newPassword);
    if (newPolicyError) {
      return res.status(400).json({ success: false, error: newPolicyError });
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
      result: 'success',
      ip_address: clientIp(req),
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
      .eq('is_active', true)
      .order('last_active', { ascending: false })
      .limit(50)) || {};
    if (error) throw error;

    const sessions = (rows || []).map((row) => ({
      id: row.id,
      current: Boolean(row.token_jti && row.token_jti === user.jti),
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

// Revoke one of the signed-in user's sessions (remote sign-out).
const revokeSession = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const sessionId = Number(req.params.id);
    if (!Number.isInteger(sessionId)) {
      return res.status(400).json({ success: false, error: 'Invalid session id' });
    }

    const { data: row, error } = (await supabase
      .from('user_sessions')
      .select('id, user_id, token_jti')
      .eq('id', sessionId)
      .single()) || {};
    if (error || !row || row.user_id !== user.id) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const { error: updateError } = (await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('id', sessionId)) || {};
    if (updateError) throw updateError;

    // Also revoke the JWT tied to the session so API access stops immediately.
    if (row.token_jti) {
      const { revokeToken } = require('../middleware/authorization');
      revokeToken(row.token_jti);
    }

    await logAudit(req, { userId: user.id, action: 'session_revoked', result: 'success', details: { session_id: sessionId } });
    res.json({ success: true, message: 'Session ended' });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({ success: false, error: 'Failed to end session' });
  }
};

// Revoke every session except the caller's current one.
const revokeOtherSessions = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { data: rows, error } = (await supabase
      .from('user_sessions')
      .select('id, token_jti')
      .eq('user_id', user.id)
      .eq('is_active', true)) || {};
    if (error) throw error;

    const { revokeToken } = require('../middleware/authorization');
    let revoked = 0;
    for (const row of rows || []) {
      if (row.token_jti && row.token_jti === user.jti) continue;
      await supabase.from('user_sessions').update({ is_active: false }).eq('id', row.id);
      if (row.token_jti) revokeToken(row.token_jti);
      revoked += 1;
    }

    await logAudit(req, { userId: user.id, action: 'sessions_revoked_others', result: 'success', details: { revoked } });
    res.json({ success: true, revoked, message: 'All other sessions have been ended' });
  } catch (error) {
    console.error('Revoke other sessions error:', error);
    res.status(500).json({ success: false, error: 'Failed to end other sessions' });
  }
};

// Whether the signed-in user has TOTP two-factor authentication enabled.
const getTwoFactorStatus = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { data: row, error } = (await supabase
      .from('users')
      .select('totp_enabled')
      .eq('id', user.id)
      .single()) || {};
    if (error) throw error;

    res.json({ success: true, totpEnabled: Boolean(row && row.totp_enabled) });
  } catch (error) {
    console.error('2FA status error:', error);
    res.status(500).json({ success: false, error: 'Failed to get two-factor status' });
  }
};

// Start TOTP enrollment: generate a pending secret and return a QR code.
const setupTwoFactor = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { data: row, error } = (await supabase
      .from('users')
      .select('totp_enabled')
      .eq('id', user.id)
      .single()) || {};
    if (error) throw error;
    if (row && row.totp_enabled) {
      return res.status(400).json({ success: false, error: 'Two-factor authentication is already enabled' });
    }

    const secret = generateTotpSecret();
    const { error: updateError } = (await supabase
      .from('users')
      .update({ totp_secret: secret, totp_enabled: false })
      .eq('id', user.id)) || {};
    if (updateError) throw updateError;

    const issuer = 'EVID-DGC';
    const label = user.email || String(user.id);
    const otpauthUrl =
      `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}` +
      `?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    res.json({ success: true, secret, otpauthUrl, qrCodeDataUrl });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ success: false, error: 'Failed to start two-factor setup' });
  }
};

// Finish TOTP enrollment: verify a code against the pending secret.
const enableTwoFactor = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { code } = req.body;
    const { data: row, error } = (await supabase
      .from('users')
      .select('totp_secret, totp_enabled')
      .eq('id', user.id)
      .single()) || {};
    if (error) throw error;
    if (row && row.totp_enabled) {
      return res.status(400).json({ success: false, error: 'Two-factor authentication is already enabled' });
    }
    if (!row || !row.totp_secret) {
      return res.status(400).json({ success: false, error: 'Start two-factor setup first' });
    }

    if (!totpVerify(row.totp_secret, code)) {
      return res.status(401).json({ success: false, error: 'Invalid authentication code' });
    }

    const { error: updateError } = (await supabase
      .from('users')
      .update({ totp_enabled: true })
      .eq('id', user.id)) || {};
    if (updateError) throw updateError;

    await logAudit(req, { userId: user.id, action: '2fa_enabled', result: 'success' });
    res.json({ success: true, message: 'Two-factor authentication enabled' });
  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({ success: false, error: 'Failed to enable two-factor authentication' });
  }
};

// Disable TOTP: requires a valid current code.
const disableTwoFactor = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { code } = req.body;
    const { data: row, error } = (await supabase
      .from('users')
      .select('totp_secret, totp_enabled')
      .eq('id', user.id)
      .single()) || {};
    if (error) throw error;
    if (!row || !row.totp_enabled || !row.totp_secret) {
      return res.status(400).json({ success: false, error: 'Two-factor authentication is not enabled' });
    }

    if (!totpVerify(row.totp_secret, code)) {
      return res.status(401).json({ success: false, error: 'Invalid authentication code' });
    }

    const { error: updateError } = (await supabase
      .from('users')
      .update({ totp_enabled: false, totp_secret: null })
      .eq('id', user.id)) || {};
    if (updateError) throw updateError;

    await logAudit(req, { userId: user.id, action: '2fa_disabled', result: 'success' });
    res.json({ success: true, message: 'Two-factor authentication disabled' });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ success: false, error: 'Failed to disable two-factor authentication' });
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
  revokeSession,
  revokeOtherSessions,
  getTwoFactorStatus,
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  logout,
  getCurrentUser,
};
