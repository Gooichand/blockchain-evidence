const { supabase, allowedRoles } = require('../config');
const { validateWalletAddress } = require('../middleware/verifyAdmin');
const crypto = require('crypto');
const { ethers } = require('ethers');

// SECURITY FIX: In-memory nonce store for wallet ownership proof
// Key: lowercased wallet address, Value: { nonce, message, expiresAt }
const walletNonces = new Map();

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
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Wallet address not registered' });
    }

    // Log login activity (check returned error since Supabase does not throw on DB failures)
    const { error: logError } = await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'wallet_login',
      details: JSON.stringify({ auth_type: 'wallet' }),
      timestamp: new Date().toISOString(),
    });
    if (logError) {
      console.error('Failed to log wallet login activity:', logError);
    }

    res.json({
      success: true,
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
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password using database function
    const { data: passwordValid, error: verifyError } = await supabase.rpc('verify_password', {
      password,
      hash: user.password_hash,
    });

    if (verifyError || !passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Block unverified email accounts (catches false, null, and undefined for legacy rows)
    // Intentionally returns the same generic error to prevent credential enumeration
    if (user.email_verified !== true) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Log login activity (check returned error since Supabase does not throw on DB failures)
    const { error: logError } = await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'email_login',
      details: JSON.stringify({ auth_type: 'email' }),
      timestamp: new Date().toISOString(),
    });
    if (logError) {
      console.error('Failed to log email login activity:', logError);
    }

    res.json({
      success: true,
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
    const { data: existingUser, error: lookupError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();

    if (lookupError && lookupError.code !== 'PGRST116') {
      console.error('Email lookup error:', lookupError);
      return res.status(500).json({ error: 'Unable to verify email availability' });
    }

    if (existingUser) {
      return res.status(409).json({ error: 'Email address already registered' });
    }

    // Hash password using database function
    const { data: hashedPassword, error: hashError } = await supabase.rpc('hash_password', {
      password,
    });

    if (hashError) {
      console.error('Password hashing error:', hashError);
      throw hashError;
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    // Create user
    const { data: newUser, error } = await supabase
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
        email_verified: false,
        verification_token: verificationToken,
        verification_token_expires: tokenExpires,
      })
      .select()
      .single();

    if (error) {
      console.error('User creation error:', error);
      throw error;
    }

    console.log('User created successfully:', newUser.id);

    // Log registration activity (check returned error since Supabase does not throw on DB failures)
    const { error: logError } = await supabase.from('activity_logs').insert({
      user_id: newUser.id,
      action: 'email_registration',
      details: JSON.stringify({
        role: role,
        auth_type: 'email',
        department: department || 'General',
      }),
      timestamp: new Date().toISOString(),
    });
    if (logError) {
      console.error('Failed to log email registration activity:', logError);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful — please verify your email before logging in.',
      email_verification_required: true,
      email_verified: false,
      instructions:
        'A verification link has been generated. Email delivery is not yet configured; contact an administrator to activate your account.',
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
    const { data: existingUser, error: lookupError } = await supabase
      .from('users')
      .select('wallet_address')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (lookupError && lookupError.code !== 'PGRST116') {
      console.error('Wallet lookup error:', lookupError);
      return res.status(500).json({ error: 'Unable to verify wallet availability' });
    }

    if (existingUser) {
      return res.status(409).json({ error: 'Wallet address already registered' });
    }

    // Create user
    const { data: newUser, error } = await supabase
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
      .single();

    if (error) {
      console.error('Wallet user creation error:', error);
      throw error;
    }

    console.log('Wallet user created successfully:', newUser.id);

    // Log registration activity (check returned error since Supabase does not throw on DB failures)
    const { error: logError } = await supabase.from('activity_logs').insert({
      user_id: newUser.id,
      action: 'wallet_registration',
      details: JSON.stringify({
        role: role,
        auth_type: 'wallet',
        department: department || 'General',
      }),
      timestamp: new Date().toISOString(),
    });
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
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email_verified, verification_token_expires')
      .eq('verification_token', token)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Check expiry
    if (new Date(user.verification_token_expires) < new Date()) {
      return res.status(400).json({ error: 'Verification token has expired' });
    }

    // Update user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        verification_token: null,
        verification_token_expires: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Verify email error:', updateError);
      return res.status(500).json({ error: 'Failed to verify email' });
    }

    // Audit log for email verification (check returned error since Supabase does not throw on DB failures)
    const { error: auditLogError } = await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'email_verified',
      details: JSON.stringify({ user_id: user.id, verified: true }),
      timestamp: new Date().toISOString(),
    });
    if (auditLogError) {
      console.error('Failed to log email verification:', auditLogError);
    }

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

module.exports = {
  emailLogin,
  emailRegister,
  walletLogin,
  walletRegister,
  walletNonce,
  verifyEmail,
};
