const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authorization');
const { issueCourtOrder } = require('../controllers/courtController');

router.post('/court/order', requireRole('court_official'), issueCourtOrder);

module.exports = router;