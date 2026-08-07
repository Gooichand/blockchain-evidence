const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const { getAuditLogs } = require('../controllers/auditController');

router.get('/audit/logs', requireAuth, getAuditLogs);

module.exports = router;