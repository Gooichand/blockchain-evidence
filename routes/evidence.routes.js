const express = require('express');
const evidenceController = require('../controllers/evidence.controller');
const { checkCasePermission } = require('../middlewares/auth.middleware');
const { evidenceAuditMiddleware } = require('../middlewares/auditLogger.middleware');

const router = express.Router({ mergeParams: true });

// Apply audit middleware to all evidence endpoints
router.use(evidenceAuditMiddleware);

// Get evidence for a case
router.get('/', checkCasePermission, evidenceController.getEvidenceByCase);

// Upload evidence to a case
router.post('/', checkCasePermission, evidenceController.uploadEvidence);

module.exports = router;
