const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authorization');
const { issueLegalOpinion } = require('../controllers/legalController');

router.post('/legal/opinion', requireRole('legal_professional'), issueLegalOpinion);

module.exports = router;