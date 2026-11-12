const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const { getCaseReportPdf, getEvidenceReportPdf } = require('../controllers/reportController');

// Unsigned case/evidence snapshot PDFs with an attached canonical JSON payload.
router.get('/cases/:id/report.pdf', requireAuth, getCaseReportPdf);
router.get('/evidence/:id/report.pdf', requireAuth, getEvidenceReportPdf);

module.exports = router;
