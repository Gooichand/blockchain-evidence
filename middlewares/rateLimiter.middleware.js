const rateLimit = require('express-rate-limit');

// General rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Admin rate limiting (stricter)
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50
});

module.exports = {
    limiter,
    adminLimiter
};
