const { supabase } = require('../config');
const jwt = require('jsonwebtoken');

/**
 * Shared identity resolution for API controllers.
 *
 * Priority order:
 *  1. req.user — set by requireAuth (verified JWT email user or verified wallet)
 *  2. req.authenticatedWallet — set by verifySignature (crypto signature)
 *  3. x-user-wallet header claim (legacy clients)
 *  4. body.userWallet / body.walletAddress (legacy clients)
 */
const resolveIdentity = (req) => {
  if (req.user) {
    return {
      id: req.user.id,
      wallet: req.user.wallet_address || null,
      email: req.user.email || null,
      role: req.user.role || null,
      display: req.user.wallet_address || req.user.email || `user-${req.user.id}`,
    };
  }

  const claimed =
    req.authenticatedWallet ||
    req.headers['x-user-wallet'] ||
    req.body?.userWallet ||
    req.body?.walletAddress ||
    req.body?.wallet ||
    null;

  if (claimed) {
    return {
      id: claimed,
      wallet: claimed,
      email: null,
      role: null,
      display: claimed,
    };
  }

  return null;
};

/**
 * Stable wallet-like identifier used by legacy controllers.
 * Falls back to a per-user handle for email-only accounts.
 */
const getStableWallet = (req) => {
  if (req.authenticatedWallet) return req.authenticatedWallet;
  if (req.user?.wallet_address) return req.user.wallet_address;
  if (req.user?.id) return `user_${req.user.id}`;
  return null;
};

/**
 * Resolves the full users row for the current request.
 * - JWT path: re-fetches by user id (requireAuth only selects a subset).
 * - Wallet path: looks up by req.authenticatedWallet / x-user-wallet.
 */
const getAuthUser = async (req) => {
  if (req.user && req.user.id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .eq('is_active', true)
      .single();
    if (!error && data) return data;
    return req.user;
  }

  const claimed = req.authenticatedWallet || req.headers['x-user-wallet'];
  if (!claimed) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', String(claimed).toLowerCase())
    .eq('is_active', true)
    .single();
  return error || !data ? null : data;
};

module.exports = { resolveIdentity, getStableWallet, getAuthUser };
