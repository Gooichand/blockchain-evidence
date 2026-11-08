const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const { getEvidenceCustody, getCaseCustody, verifyCustodyChain, getRecentCustody } = require('../controllers/custodyController');

router.get('/custody/recent', requireAuth, getRecentCustody);
router.get('/custody/evidence/:id', requireAuth, getEvidenceCustody);
router.get('/custody/evidence/:id/verify-chain', requireAuth, verifyCustodyChain);
router.get('/custody/case/:id', requireAuth, getCaseCustody);

module.exports = router;
