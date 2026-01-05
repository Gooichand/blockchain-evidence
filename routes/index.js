const express = require('express');
const userRoutes = require('./user.routes');
const adminRoutes = require('./admin.routes');
const caseRoutes = require('./case.routes');
const dashboardRoutes = require('./dashboard.routes');
const authRoutes = require('./auth.routes');
const auditLogsRoutes = require('./auditLogs.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/audit-logs', auditLogsRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);
router.use('/cases', caseRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;

module.exports = router;
