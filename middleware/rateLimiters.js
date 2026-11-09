const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { rateLimits } = require('../config');

// M14: key rate limits per authenticated user where possible, not per shared
// IP - offices and mobile carriers NAT many users behind one address, and one
// noisy neighbour used to throttle everyone. Falls back to the IP for
// anonymous traffic. The user id comes only from a verified JWT, never from a
// client-supplied header.
function userOrIpKey(req) {
  try {
    const auth = req.headers['authorization'] || '';
    let token = null;
    if (auth.startsWith('Bearer ')) token = auth.slice(7).trim();
    if (!token) {
      const pair = (req.headers.cookie || '')
        .split(';')
        .map((p) => p.trim())
        .find((p) => p.startsWith('evid_token='));
      if (pair) token = pair.slice('evid_token='.length);
    }
    if (token && process.env.JWT_SECRET) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload && payload.userId) return 'user:' + payload.userId;
    }
  } catch (_) {
    // invalid or expired token - fall through to the IP key
  }
  return ipFallbackKey(req);
}

// IP fallback for anonymous traffic. IPv6 users can rotate through a /64, so
// bucket IPv6 addresses by their first four hextets (a /64 prefix) instead of
// keying on the full address.
function ipFallbackKey(req) {
  const ip = req.ip || '';
  if (ip.includes(':')) return 'ip6:' + ip.split(':').slice(0, 4).join(':');
  return 'ip:' + ip;
}

/**
 * SECURITY FIX: Rate limiters hardened to prevent brute force and DDoS.
 * Standardized response format and removed skipSuccessfulRequests for auth.
 */

// Authentication rate limiting
const authLimiter = rateLimit({
  windowMs: rateLimits.auth.windowMs,
  max: rateLimits.auth.max,
  message: { success: false, error: 'Too many authentication attempts. Please try again in a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
});

// General API rate limiting
const limiter = rateLimit({
  keyGenerator: userOrIpKey,
  windowMs: rateLimits.api.windowMs,
  max: rateLimits.api.max,
  message: { success: false, error: 'Too many requests to the API. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin rate limiting (High sensitivity)
const adminLimiter = rateLimit({
  windowMs: rateLimits.admin.windowMs,
  max: rateLimits.admin.max,
  message: { success: false, error: 'Too many administrative requests. Access throttled.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Evidence export rate limiting
const exportLimiter = rateLimit({
  keyGenerator: userOrIpKey,
  windowMs: rateLimits.export.windowMs,
  max: rateLimits.export.max,
  message: { success: false, error: 'Export limit reached. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for case timeline pages
const timelineLimiter = rateLimit({
  windowMs: rateLimits.timeline.windowMs,
  max: rateLimits.timeline.max,
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for public policy pages
const policyPageLimiter = rateLimit({
  windowMs: rateLimits.policy.windowMs,
  max: rateLimits.policy.max,
  standardHeaders: true,
  legacyHeaders: false,
});

// Blockchain operations rate limiting
const blockchainLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: 'Blockchain operation limit exceeded. Maximum 10 operations per minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Evidence upload rate limiting
const uploadLimiter = rateLimit({
  keyGenerator: userOrIpKey,
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { success: false, error: 'Upload limit exceeded. Maximum 50 uploads per hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// S10: chunked-upload session creation (one session = one eventual file;
// chunk writes themselves are bounded by the session's declared size)
const chunkInitLimiter = rateLimit({
  keyGenerator: userOrIpKey,
  windowMs: 60 * 60 * 1000,
  max: 60,
  message: { success: false, error: 'Upload session limit exceeded. Maximum 60 upload sessions per hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Verification rate limiting
const verificationLimiter = rateLimit({
  keyGenerator: userOrIpKey,
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, error: 'Verification limit exceeded. Maximum 30 verifications per minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Analyst module rate limiting
const analystLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, error: 'Too many analyst requests. Access throttled.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  limiter,
  adminLimiter,
  exportLimiter,
  timelineLimiter,
  policyPageLimiter,
  blockchainLimiter,
  uploadLimiter,
  chunkInitLimiter,
  verificationLimiter,
  analystLimiter,
};
