const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { sendContact } = require('../controllers/contactController');

// Dedicated strict limiter for the public contact form (anti-spam)
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many contact attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Express 5 compatibility: handle async errors thrown by the controller
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post('/contact', contactLimiter, wrap(sendContact));

module.exports = router;
