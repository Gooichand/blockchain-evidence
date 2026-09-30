const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authorization');
const { getAuditLogs } = require('../controllers/auditController');

router.get('/audit/logs', requireRole('admin', 'auditor'), getAuditLogs);

module.exports = router;