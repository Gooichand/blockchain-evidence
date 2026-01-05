const express = require('express');
const caseController = require('../controllers/case.controller');
const evidenceRoutes = require('./evidence.routes');
const { checkCasePermission } = require('../middlewares/auth.middleware');

const router = express.Router();

// Nested evidence routes
router.use('/:caseId/evidence', evidenceRoutes);

/**
 * @swagger
 * /api/cases:
 *   get:
 *     summary: Get cases visible to current user
 *     tags: [Cases]
 *     security:
 *       - UserWallet: []
 *     responses:
 *       200:
 *         description: List of cases
 */
router.get('/', caseController.getCases);

/**
 * @swagger
 * /api/cases:
 *   post:
 *     summary: Create a new case (Investigator/Admin)
 *     tags: [Cases]
 *     security:
 *       - UserWallet: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             title: "Cyber Fraud Case"
 *             description: "UPI scam investigation"
 *             crimeType: "Financial Fraud"
 *             location: "Mumbai"
 *             suspects: ["Unknown"]
 *     responses:
 *       200:
 *         description: Case created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only investigators can create cases      
 *       500:
 *         description: Internal server error
 */
router.post('/', caseController.createCase);

/**
 * @swagger
 * /api/cases/{caseId}:
 *   get:
 *     summary: Get case details by case ID
 *     tags: [Cases]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - UserWallet: []
 */
router.get('/:caseId', checkCasePermission, caseController.getCaseById);

/**
 * @swagger
 * /api/cases/{caseId}/status:
 *   put:
 *     summary: Update case status
 *     tags: [Cases]
 *     security:
 *       - UserWallet: []
 */
router.put('/:caseId/status', checkCasePermission, caseController.updateCaseStatus);

/**
 * @swagger
 * /api/cases/{caseId}/assign:
 *   post:
 *     summary: Assign case to a role
 *     tags: [Cases]
 *     security:
 *       - UserWallet: []
 */
router.post('/:caseId/assign', checkCasePermission, caseController.assignCase);

module.exports = router;
