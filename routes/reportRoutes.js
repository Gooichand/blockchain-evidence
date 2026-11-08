const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const { getCaseReportPdf, getEvidenceReportPdf } = require('../controllers/reportController');

// M17: one-click signed PDF reports (evidence hashes, custody timeline,
// notes, signature block, verifiable report hash).
router.get('/cases/:id/report.pdf', requireAuth, getCaseReportPdf);
router.get('/evidence/:id/report.pdf', requireAuth, getEvidenceReportPdf);

module.exports = router;
