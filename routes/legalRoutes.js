const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const { issueLegalOpinion } = require('../controllers/legalController');

router.post('/legal/opinion', requireAuth, issueLegalOpinion);

module.exports = router;