const express = require('express');
const router = express.Router();
const { exportLimiter } = require('../middleware/rateLimiters');
const upload = require('../middleware/upload');
const {
    uploadEvidence, downloadEvidence, bulkExport, getDownloadHistory,
    getAllEvidence, getEvidenceById, verifyEvidenceHash, getBlockchainProof,
    verifyIntegrity, generateVerificationCertificate, publicVerify,
    getVerificationHistory, getEvidenceExpiry, setLegalHold,
    bulkRetentionPolicy, checkExpiry, compareEvidence,
    createComparisonReport, getEvidenceByCase
} = require('../controllers/evidenceController');

// ── Static paths MUST come before /evidence/:id to avoid param conflicts ────

// Evidence list & bulk operations
router.get('/evidence', getAllEvidence);
router.post('/evidence/upload', exportLimiter, upload.single('file'), uploadEvidence);
router.post('/evidence/bulk-export', bulkExport);
router.post('/evidence/bulk-retention', bulkRetentionPolicy);
router.post('/evidence/check-expiry', checkExpiry);

// Evidence verification (static paths)
router.get('/evidence/expiry', getEvidenceExpiry);
router.get('/evidence/compare', compareEvidence);
router.get('/evidence/verification-history', getVerificationHistory);
router.post('/evidence/verify-integrity', verifyIntegrity);
router.post('/evidence/verification-certificate', generateVerificationCertificate);
router.post('/evidence/comparison-report', createComparisonReport);

// Evidence by case (static prefix before :id)
router.get('/evidence/case/:caseId', getEvidenceByCase);

// Public verification route (not under /evidence)
router.get('/verify/:hash', publicVerify);

// Evidence batch tagging is in tagRoutes.js

// ── Parameterized paths (:id) MUST come LAST ────────────────────────────────
router.get('/evidence/:id', getEvidenceById);
router.post('/evidence/:id/download', downloadEvidence);
router.get('/evidence/:id/download-history', getDownloadHistory);
router.get('/evidence/:id/verify', verifyEvidenceHash);
router.get('/evidence/:id/blockchain-proof', getBlockchainProof);
router.put('/evidence/:id/legal-hold', setLegalHold);

module.exports = router;
