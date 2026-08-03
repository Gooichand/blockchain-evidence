const express = require('express');
const router = express.Router();
const { verificationLimiter } = require('../middleware/rateLimiters');
const {
  getStatistics,
  getPublicCases,
  getPublicCaseById,
  getPublicCaseEvidence,
  verifyEvidence,
} = require('../controllers/publicController');

// Public Viewer transparency endpoints (read-only, anonymous-safe)
router.get('/public/statistics', getStatistics);
router.get('/public/cases', getPublicCases);
router.get('/public/cases/:id', getPublicCaseById);
router.get('/public/cases/:id/evidence', getPublicCaseEvidence);
router.post('/public/verify', verificationLimiter, verifyEvidence);

module.exports = router;
