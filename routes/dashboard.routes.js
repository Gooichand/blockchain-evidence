const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');

const router = express.Router();

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - UserWallet: []
 */
router.get('/stats', dashboardController.getStats);

module.exports = router;
