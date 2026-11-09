const express = require('express');
const router = express.Router();
const { exportLimiter, uploadLimiter, verificationLimiter } = require('../middleware/rateLimiters');
const upload = require('../middleware/upload');
const { uploadEvidence } = require('../controllers/EvidenceUploadController');
const {
  downloadEvidence,
  previewEvidence,
  bulkExport,
  courtExport,
  getDownloadHistory,
  getAllEvidence,
  getEvidenceById,
  getEvidenceByCase,
} = require('../controllers/EvidenceDownloadController');
const {
  verifyEvidenceHash,
  getBlockchainProof,
  verifyIntegrity,
  generateVerificationCertificate,
  publicVerify,
  getVerificationHistory,
  compareEvidence,
  createComparisonReport,
  getIntegrityAlerts,
  acknowledgeIntegrityAlert,
  triggerIntegrityScan,
  getIntegrityScanStatus,
} = require('../controllers/EvidenceVerificationController');
const {
  getEvidenceExpiry,
  setLegalHold,
  updateAdmissionStatus,
  bulkRetentionPolicy,
  checkExpiry,
  getEvidenceExpiring,
  archiveEvidence,
} = require('../controllers/retentionController');
const { getManagerStats } = require('../controllers/evidenceStatsController');
const { requireAuth } = require('../middleware/requireAuth');
const { requireOptionalAuth } = require('../middleware/requireOptionalAuth');

// ── Static paths MUST come before /evidence/:id to avoid param conflicts ────

// Evidence list & bulk operations
router.get('/evidence', requireAuth, getAllEvidence);
router.post('/evidence/upload', requireAuth, uploadLimiter, upload.single('file'), uploadEvidence);
router.post('/evidence/bulk-export', requireAuth, bulkExport);
router.post('/evidence/court-export', requireAuth, courtExport);
router.post('/evidence/bulk-retention', requireAuth, bulkRetentionPolicy);
router.post('/evidence/check-expiry', requireAuth, checkExpiry);

// Manager dashboard statistics
router.get('/evidence/manager-stats', requireAuth, getManagerStats);

// Evidence verification (static paths)
router.get('/evidence/expiry', requireAuth, getEvidenceExpiry);
router.get('/evidence/expiring', requireOptionalAuth, getEvidenceExpiring);
router.post('/evidence/archive', requireOptionalAuth, archiveEvidence);
router.get('/evidence/compare', requireAuth, compareEvidence);
router.get('/evidence/verification-history', getVerificationHistory);
router.post('/evidence/verify-integrity', verificationLimiter, verifyIntegrity);
router.post('/evidence/verification-certificate', requireAuth, generateVerificationCertificate);
router.post('/evidence/comparison-report', createComparisonReport);
// M5: integrity alerts from the scheduled/on-demand scans (static paths)
router.get('/evidence/integrity-alerts', requireAuth, getIntegrityAlerts);
router.post('/evidence/integrity-alerts/:id/acknowledge', requireAuth, acknowledgeIntegrityAlert);
router.post('/evidence/integrity-scan', requireAuth, triggerIntegrityScan);
router.get('/evidence/integrity-scan-status', requireAuth, getIntegrityScanStatus);

// Evidence by case (static prefix before :id)
router.get('/evidence/case/:caseId', requireAuth, getEvidenceByCase);

// Public verification route (not under /evidence)
router.get('/verify/:hash', publicVerify);

// Evidence batch tagging is in tagRoutes.js

// ── Parameterized paths (:id) MUST come LAST ────────────────────────────────
router.get('/evidence/:id', requireAuth, getEvidenceById);
router.post('/evidence/:id/download', requireAuth, downloadEvidence);
// M8: in-browser preview (inline, authed, integrity-checked, custody-logged)
router.get('/evidence/:id/preview', requireAuth, previewEvidence);
router.get('/evidence/:id/download-history', requireAuth, getDownloadHistory);
router.get('/evidence/:id/verify', requireAuth, verificationLimiter, verifyEvidenceHash);
router.get('/evidence/:id/blockchain-proof', getBlockchainProof);
router.put('/evidence/:id/legal-hold', requireAuth, setLegalHold);
router.post('/evidence/:id/admission', requireAuth, updateAdmissionStatus);

module.exports = router;
