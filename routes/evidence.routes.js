const express = require('express');
const evidenceController = require('../controllers/evidence.controller');
const { checkCasePermission } = require('../middlewares/auth.middleware');
const { evidenceAuditMiddleware } = require('../middlewares/auditLogger.middleware');

const router = express.Router({ mergeParams: true });

// Apply audit middleware to all evidence endpoints
router.use(evidenceAuditMiddleware);

/**
 * @swagger
 * /api/cases/{caseId}/evidence:
 *   get:
 *     summary: Get evidence for a case
 *     tags: [Evidence]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [view, edit, approve]
 *         description: Action to perform (default is view)
 *     security:
 *       - UserWallet: []
 */
router.get('/', checkCasePermission, evidenceController.getEvidenceByCase);

/**
 * @swagger
 * /api/cases/{caseId}/evidence:
 *   post:
 *     summary: Upload evidence to a case
 *     tags: [Evidence]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [view, edit, approve]
 *         description: Action to perform (usually edit)
 *     security:
 *       - UserWallet: []
 */
router.post('/', checkCasePermission, evidenceController.uploadEvidence);

module.exports = router;
