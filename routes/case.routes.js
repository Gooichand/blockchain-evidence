const express = require('express');
const caseController = require('../controllers/case.controller');
const evidenceRoutes = require('./evidence.routes');
const { checkCasePermission } = require('../middlewares/auth.middleware');

const router = express.Router();

// Nested evidence routes
router.use('/:caseId/evidence', evidenceRoutes);

// Get cases visible to current user
router.get('/', caseController.getCases);

// Create new case (Investigators only)
router.post('/', caseController.createCase);

// Get specific case details
router.get('/:caseId', checkCasePermission, caseController.getCaseById);

// Update case status
router.put('/:caseId/status', checkCasePermission, caseController.updateCaseStatus);

// Assign case to role
router.post('/:caseId/assign', checkCasePermission, caseController.assignCase);

module.exports = router;
