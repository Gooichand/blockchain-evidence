const express = require('express');
const router = express.Router();
const {
    getCases, getCaseStatuses, getEnhancedCases, createCase,
    getCaseDetails, updateCaseStatus, getAvailableTransitions,
    assignCase, getCaseStatistics, exportCases
} = require('../controllers/caseController');

// Note: /statistics and /export must be before /:id routes to avoid param conflicts
router.get('/cases/statistics', getCaseStatistics);
router.get('/cases/export', exportCases);
router.get('/cases/enhanced', getEnhancedCases);
router.get('/cases', getCases);
router.post('/cases', createCase);
router.get('/case-statuses', getCaseStatuses);
router.get('/cases/:id/details', getCaseDetails);
router.post('/cases/:id/status', updateCaseStatus);
router.get('/cases/:id/available-transitions', getAvailableTransitions);
router.post('/cases/:id/assign', assignCase);

module.exports = router;
