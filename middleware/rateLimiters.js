const rateLimit = require('express-rate-limit');
const { rateLimits } = require('../config');

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
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { success: false, error: 'Upload limit exceeded. Maximum 50 uploads per hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Verification rate limiting
const verificationLimiter = rateLimit({
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
  verificationLimiter,
  analystLimiter,
};
