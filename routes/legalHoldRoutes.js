const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authorization');
const {
  getLegalHolds,
  createLegalHold,
  updateLegalHold,
  releaseLegalHold,
  getLegalHoldStats,
} = require('../controllers/legalHoldController');

const legalHoldGuard = requireRole('legal_professional', 'evidence_manager', 'court_official', 'admin');
router.get('/legal-holds', legalHoldGuard, getLegalHolds);
router.get('/legal-holds/stats', legalHoldGuard, getLegalHoldStats);
router.post('/legal-holds', legalHoldGuard, createLegalHold);
router.put('/legal-holds/:id', legalHoldGuard, updateLegalHold);
router.post('/legal-holds/:id/release', legalHoldGuard, releaseLegalHold);

module.exports = router;