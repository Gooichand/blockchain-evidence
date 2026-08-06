const express = require('express');
const { requireAuth, requireAnalyst } = require('../middleware/requireAuth');
const { analystLimiter } = require('../middleware/rateLimiters');
const {
  getStats,
  getQueue,
  getTaskDetail,
  startAnalysis,
  updateTaskProgress,
  saveReport,
  getReports,
  getTools,
  searchAll,
  getAnalystEvidence,
  getAnalystCases,
  verifyEvidenceIntegrity,
  getEvidenceBlockchain,
} = require('../controllers/analystController');

const router = express.Router();

const guard = [analystLimiter, requireAuth, requireAnalyst];

router.get('/analyst/stats', guard, getStats);
router.get('/analyst/queue', guard, getQueue);
router.get('/analyst/tasks/:id', guard, getTaskDetail);
router.post('/analyst/evidence/:id/start', guard, startAnalysis);
router.put('/analyst/tasks/:id/progress', guard, updateTaskProgress);
router.put('/analyst/tasks/:id/report', guard, saveReport);
router.get('/analyst/reports', guard, getReports);
router.get('/analyst/tools', guard, getTools);
router.get('/analyst/search', guard, searchAll);
router.get('/analyst/evidence', guard, getAnalystEvidence);
router.get('/analyst/cases', guard, getAnalystCases);
router.get('/analyst/evidence/:id/verify', guard, verifyEvidenceIntegrity);
router.get('/analyst/evidence/:id/blockchain', guard, getEvidenceBlockchain);

module.exports = router;
