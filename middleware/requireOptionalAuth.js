const jwt = require('jsonwebtoken');
const { supabase } = require('../config');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * requireOptionalAuth — attaches req.user when a valid JWT (or verified
 * wallet header) is present, but does NOT block anonymous/legacy callers.
 * Used by workstations that historically called with raw fetch and no auth.
 */
const requireOptionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

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
            req.user = {
              id: user.id,
              email: user.email || null,
              wallet_address: user.wallet_address || null,
              role: user.role,
              full_name: user.full_name || null,
            };
          }
        }
      } catch (_) {
        // Invalid token — proceed unauthenticated (legacy flow)
      }
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = { requireOptionalAuth };