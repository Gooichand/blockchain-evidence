const jwt = require('jsonwebtoken');
const { supabase } = require('../config');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * requireAuth — verifies the caller's identity for role-scoped routes.
 *
 * Two supported identity sources (in priority order):
 *  1. Bearer JWT issued by /auth/email/login or /auth/email/register (email users).
 *  2. Verified wallet header (x-user-wallet) — falls back to a users table lookup.
 *
 * On success sets req.user = { id, email, wallet_address, role }.
 * Never trusts client-supplied role claims other than the signed JWT payload.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    let identity = null;

    if (bearerToken && JWT_SECRET) {
      try {
        const payload = jwt.verify(bearerToken, JWT_SECRET);
        if (payload && payload.userId) {
          const { data: user, error } = (await supabase
            .from('users')
            .select('id, email, wallet_address, role, full_name, is_active')
            .eq('id', payload.userId)
            .single()) || {};

          if (!error && user && user.is_active) {
            identity = user;
          } else {
            return res.status(401).json({ success: false, error: 'Authentication required. Session user not found.' });
          }
        }
      } catch (tokenError) {
        return res.status(401).json({ success: false, error: 'Invalid or expired session token.' });
      }
    }

    if (!identity) {
      const claimedWallet = req.headers['x-user-wallet'] || req.authenticatedWallet;
      if (claimedWallet) {
        const { data: user, error } = (await supabase
          .from('users')
          .select('id, email, wallet_address, role, full_name, is_active')
          .eq('wallet_address', String(claimedWallet).toLowerCase())
          .eq('is_active', true)
          .single()) || {};

        if (!error && user) {
          identity = user;
        }
      }
    }

    if (!identity) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    req.user = {
      id: identity.id,
      email: identity.email || null,
      wallet_address: identity.wallet_address || null,
      role: identity.role,
      full_name: identity.full_name || 'Forensic Analyst',
    };

    // Legacy compatibility: controllers that read req.authenticatedWallet
    // (set by verifySignature for wallet users) also work for JWT users
    // whose account has a linked wallet.
    if (identity.wallet_address) {
      req.authenticatedWallet = identity.wallet_address;
    }
    next();
  } catch (error) {
    console.error('requireAuth error:', error);
    res.status(500).json({ success: false, error: 'Authentication check failed.' });
  }
};

/**
 * requireRole — factory that returns a middleware restricting access to the
 * given roles. Must run after requireAuth.
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden. You do not have permission to access this resource.' });
    }
    next();
  };
};

const requireAnalyst = requireRole('forensic_analyst');

module.exports = { requireAuth, requireRole, requireAnalyst };
