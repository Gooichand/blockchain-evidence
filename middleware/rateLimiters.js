const rateLimit = require('express-rate-limit');

// Authentication rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs for auth
    message: { error: 'Too many authentication attempts, please try again later' }
});

// General API rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Admin rate limiting (stricter)
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50
});

// Evidence export rate limiting
const exportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100 // 100 downloads per hour
});

// Rate limiter for case timeline pages
const timelineLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per window for timeline pages
});

// Rate limiter for public policy pages
const policyPageLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200 // limit each IP to 200 requests per window for policy pages
});

module.exports = {
    authLimiter,
    limiter,
    adminLimiter,
    exportLimiter,
    timelineLimiter,
    policyPageLimiter
};
