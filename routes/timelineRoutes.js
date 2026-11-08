const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const { getCaseTimeline } = require('../controllers/timelineController');

router.get('/cases/:id/timeline', requireAuth, getCaseTimeline);

module.exports = router;
