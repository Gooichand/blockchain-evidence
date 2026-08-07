const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const {
  getCases,
  getCaseStatuses,
  getEnhancedCases,
  createCase,
  getCaseDetails,
  updateCaseStatus,
  getAvailableTransitions,
  assignCase,
  getCaseStatistics,
  exportCases,
} = require('../controllers/caseController');

// Note: /statistics and /export must be before /:id routes to avoid param conflicts
router.get('/cases/statistics', requireAuth, getCaseStatistics);
router.get('/cases/export', requireAuth, exportCases);
router.get('/cases/enhanced', requireAuth, getEnhancedCases);
router.get('/cases', requireAuth, getCases);
router.post('/cases', requireAuth, createCase);
router.get('/case-statuses', requireAuth, getCaseStatuses);
router.get('/cases/:id/details', requireAuth, getCaseDetails);
router.post('/cases/:id/status', requireAuth, updateCaseStatus);
router.get('/cases/:id/available-transitions', requireAuth, getAvailableTransitions);
router.post('/cases/:id/assign', requireAuth, assignCase);

module.exports = router;
