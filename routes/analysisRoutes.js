const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const { createRequest, listMine, getRequest } = require('../controllers/analysisRequestController');

router.post('/analysis/requests', requireAuth, createRequest);
router.get('/analysis/requests/mine', requireAuth, listMine);
router.get('/analysis/requests/:id', requireAuth, getRequest);

module.exports = router;
