const express = require('express');
const router = express.Router();
const { adminLimiter } = require('../middleware/rateLimiters');
const { verifyAdmin } = require('../middleware/verifyAdmin');
const { requireAuth } = require('../middleware/requireAuth');
const {
  createUser,
  createAdmin,
  deleteUser,
  getAllUsers,
  roleChangeRequest,
  getRoleChangeRequests,
  approveRoleChange,
  rejectRoleChange,
  updateUserStatus,
  updateUserRole,
  blockUnauthorizedAdmin,
  logAdminActionEndpoint,
} = require('../controllers/adminController');
const {
  getAdminActivityLogs,
  exportAdminActivityLogs,
} = require('../controllers/adminActivityController');

router.post('/admin/create-user', adminLimiter, requireAuth, verifyAdmin, createUser);
router.post('/admin/create-admin', adminLimiter, requireAuth, verifyAdmin, createAdmin);
router.post('/admin/delete-user', adminLimiter, requireAuth, verifyAdmin, deleteUser);
// SECURITY FIX: Added verifyAdmin middleware to getAllUsers (was missing)
router.get('/admin/users', adminLimiter, requireAuth, verifyAdmin, getAllUsers);
router.post('/admin/role-change-request', adminLimiter, requireAuth, verifyAdmin, roleChangeRequest);
// SECURITY FIX: Added verifyAdmin middleware to getRoleChangeRequests (was missing)
router.get('/admin/role-change-requests', adminLimiter, requireAuth, verifyAdmin, getRoleChangeRequests);
router.post('/admin/role-change-approve', adminLimiter, requireAuth, verifyAdmin, approveRoleChange);
router.post('/admin/role-change-reject', adminLimiter, requireAuth, verifyAdmin, rejectRoleChange);
router.put('/admin/users/:id/status', adminLimiter, requireAuth, verifyAdmin, updateUserStatus);
router.put('/admin/users/:id/role', adminLimiter, requireAuth, verifyAdmin, updateUserRole);

// Audit activity feed (JWT-friendly; controllers enforce role scoping)
router.get('/admin/activity-logs', adminLimiter, requireAuth, getAdminActivityLogs);
router.get('/admin/activity-logs/export', adminLimiter, requireAuth, exportAdminActivityLogs);

// Admin action logging (fire-and-forget from retention/legal-hold workstations)
router.post('/admin-actions/log', logAdminActionEndpoint);

// Catch-all for unauthorized admin operations - MUST be last
router.post('/admin/*', blockUnauthorizedAdmin);

module.exports = router;
