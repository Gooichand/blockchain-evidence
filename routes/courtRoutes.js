const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const { issueCourtOrder } = require('../controllers/courtController');

router.post('/court/order', requireAuth, issueCourtOrder);

module.exports = router;