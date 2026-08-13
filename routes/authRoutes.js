const express = require('express');
const router = express.Router();
const { authLimiter } = require('../middleware/rateLimiters');
const { requireAuth } = require('../middleware/requireAuth');
const {
  emailLogin,
  emailRegister,
  walletLogin,
  walletRegister,
  walletNonce,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  getSessions,
  logout,
} = require('../controllers/authController');

// SECURITY FIX: Nonce endpoint for wallet ECDSA challenge (must be before registration)
router.get('/auth/wallet/nonce', authLimiter, walletNonce);
router.post('/auth/email/login', authLimiter, emailLogin);
router.post('/auth/email/register', authLimiter, emailRegister);
router.post('/auth/wallet/login', authLimiter, walletLogin);
router.post('/auth/wallet/register', authLimiter, walletRegister);
router.get('/auth/email/verify', authLimiter, verifyEmail);

// Account & recovery endpoints (JWT-protected where identity is required)
router.post('/auth/forgot-password', authLimiter, forgotPassword);
router.post('/auth/reset-password', authLimiter, resetPassword);
router.post('/auth/update-profile', requireAuth, updateProfile);
router.post('/auth/change-password', requireAuth, changePassword);
router.get('/auth/sessions', requireAuth, getSessions);
router.post('/auth/logout', logout);

module.exports = router;
