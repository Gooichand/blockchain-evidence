const express = require('express');
const router = express.Router();
const { logActivity } = require('../controllers/activityController');

router.post('/activity-logs', logActivity);

module.exports = router;
