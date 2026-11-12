const express = require('express');
const router = express.Router();
const blockchainController = require('../controllers/blockchainController');
const { requireAuth } = require('../middleware/requireAuth');

// H6 fix: network config, server wallet and IPFS file names were public.
// Everything under /api/blockchain now requires an authenticated session.
router.get('/inspect/:kind/:value', requireAuth, require('../controllers/blockchainInspectionController').inspect);
router.get('/verification-health', requireAuth, require('../controllers/hashVerificationController').verificationHealth);
router.get('/verify-hash/:hash', requireAuth, require('../controllers/hashVerificationController').verifyFileHash);
router.get('/status', requireAuth, blockchainController.getSystemStatus);
router.get('/config', requireAuth, blockchainController.getBlockchainConfig);
router.get('/stats', requireAuth, blockchainController.getBlockchainStats);
router.get('/ipfs/stats', requireAuth, blockchainController.getIPFSStats);
router.get('/transaction/:txHash', requireAuth, blockchainController.verifyTransaction);
router.post('/estimate-gas', requireAuth, blockchainController.estimateGas);
router.get('/health', requireAuth, blockchainController.healthCheck);

module.exports = router;
