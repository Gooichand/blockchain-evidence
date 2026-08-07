const express = require('express');
const router = express.Router();
const { requireOptionalAuth } = require('../middleware/requireOptionalAuth');
const {
  getLegalHolds,
  createLegalHold,
  updateLegalHold,
  releaseLegalHold,
  getLegalHoldStats,
} = require('../controllers/legalHoldController');

router.get('/legal-holds', requireOptionalAuth, getLegalHolds);
router.get('/legal-holds/stats', requireOptionalAuth, getLegalHoldStats);
router.post('/legal-holds', requireOptionalAuth, createLegalHold);
router.put('/legal-holds/:id', requireOptionalAuth, updateLegalHold);
router.post('/legal-holds/:id/release', requireOptionalAuth, releaseLegalHold);

module.exports = router;