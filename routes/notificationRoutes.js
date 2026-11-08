const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createTestNotification,
  bulkCreateNotifications,
} = require('../controllers/notificationController');
const { requireAuth, requireRole } = require('../middleware/requireAuth');

// H6 fix: notification routes were callable with any wallet address and no
// session. All routes now require authentication and enforce ownership.
router.get('/notifications/:wallet', requireAuth, getNotifications);
router.put('/notifications/:id/read', requireAuth, markAsRead);
router.put('/notifications/read-all', requireAuth, markAllAsRead);
router.post('/notifications/test', requireAuth, requireRole('admin'), createTestNotification);
router.post('/notifications/bulk-create', requireAuth, requireRole('admin'), bulkCreateNotifications);

module.exports = router;
