const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const { logActivity, getMyActivity } = require('../controllers/activityController');

router.post('/activity-logs', requireAuth, logActivity);
router.get('/my/activity', requireAuth, getMyActivity);

module.exports = router;
