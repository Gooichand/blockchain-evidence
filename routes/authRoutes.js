const express = require('express');
const router = express.Router();
const { authLimiter } = require('../middleware/rateLimiters');
const {
  emailLogin,
  emailRegister,
  walletLogin,
  walletRegister,
  walletNonce,
  verifyEmail,
} = require('../controllers/authController');

// SECURITY FIX: Nonce endpoint for wallet ECDSA challenge (must be before registration)
router.get('/auth/wallet/nonce', authLimiter, walletNonce);
router.post('/auth/email/login', authLimiter, emailLogin);
router.post('/auth/email/register', authLimiter, emailRegister);
router.post('/auth/wallet/login', authLimiter, walletLogin);
router.post('/auth/wallet/register', authLimiter, walletRegister);
router.get('/auth/email/verify', authLimiter, verifyEmail);

module.exports = router;
