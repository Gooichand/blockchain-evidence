const express = require('express');
const router = express.Router();
const { requireOptionalAuth } = require('../middleware/requireOptionalAuth');
const {
  getRetentionPolicies,
  createRetentionPolicy,
  exportTimelinePdf,
  updateRetentionPolicy,
  deleteRetentionPolicy,
} = require('../controllers/retentionController');

router.get('/retention-policies', requireOptionalAuth, getRetentionPolicies);
router.post('/retention-policies', requireOptionalAuth, createRetentionPolicy);
router.put('/retention-policies/:id', requireOptionalAuth, updateRetentionPolicy);
router.delete('/retention-policies/:id', requireOptionalAuth, deleteRetentionPolicy);
router.post('/timeline/export-pdf', requireOptionalAuth, exportTimelinePdf);

module.exports = router;
