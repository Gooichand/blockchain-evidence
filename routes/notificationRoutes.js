const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createTestNotification,
  bulkCreateNotifications,
} = require('../controllers/notificationController');

router.get('/notifications/:wallet', getNotifications);
router.put('/notifications/:id/read', markAsRead);
router.put('/notifications/read-all', markAllAsRead);
router.post('/notifications/test', createTestNotification);
router.post('/notifications/bulk-create', bulkCreateNotifications);

module.exports = router;
