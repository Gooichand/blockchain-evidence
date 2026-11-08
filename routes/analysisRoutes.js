const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const { validate, schemas } = require('../middleware/validate');
const { createRequest, listMine, getRequest } = require('../controllers/analysisRequestController');

router.post('/analysis/requests', requireAuth, validate(schemas.createAnalysisRequest), createRequest);
router.get('/analysis/requests/mine', requireAuth, listMine);
router.get('/analysis/requests/:id', requireAuth, getRequest);

module.exports = router;
