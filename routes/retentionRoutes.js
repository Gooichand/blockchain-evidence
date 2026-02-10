const express = require('express');
const router = express.Router();
const { getRetentionPolicies, createRetentionPolicy, exportTimelinePdf } = require('../controllers/retentionController');

router.get('/retention-policies', getRetentionPolicies);
router.post('/retention-policies', createRetentionPolicy);
router.post('/timeline/export-pdf', exportTimelinePdf);

module.exports = router;
