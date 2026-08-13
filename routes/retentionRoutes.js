const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authorization');
const {
  getRetentionPolicies,
  createRetentionPolicy,
  exportTimelinePdf,
  updateRetentionPolicy,
  deleteRetentionPolicy,
} = require('../controllers/retentionController');

const retentionGuard = requireRole('evidence_manager', 'admin');
router.get('/retention-policies', retentionGuard, getRetentionPolicies);
router.post('/retention-policies', retentionGuard, createRetentionPolicy);
router.put('/retention-policies/:id', retentionGuard, updateRetentionPolicy);
router.delete('/retention-policies/:id', retentionGuard, deleteRetentionPolicy);
router.post('/timeline/export-pdf', retentionGuard, exportTimelinePdf);

module.exports = router;
