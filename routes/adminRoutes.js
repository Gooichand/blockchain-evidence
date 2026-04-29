const express = require('express');
const router = express.Router();
const { adminLimiter } = require('../middleware/rateLimiters');
const { verifyAdmin } = require('../middleware/verifyAdmin');
const {
  createUser,
  createAdmin,
  deleteUser,
  getAllUsers,
  roleChangeRequest,
  getRoleChangeRequests,
  approveRoleChange,
  rejectRoleChange,
  blockUnauthorizedAdmin,
} = require('../controllers/adminController');

router.post('/admin/create-user', adminLimiter, verifyAdmin, createUser);
router.post('/admin/create-admin', adminLimiter, verifyAdmin, createAdmin);
router.post('/admin/delete-user', adminLimiter, verifyAdmin, deleteUser);
// SECURITY FIX: Added verifyAdmin middleware to getAllUsers (was missing)
router.get('/admin/users', adminLimiter, verifyAdmin, getAllUsers);
router.post('/admin/role-change-request', adminLimiter, verifyAdmin, roleChangeRequest);
// SECURITY FIX: Added verifyAdmin middleware to getRoleChangeRequests (was missing)
router.get('/admin/role-change-requests', adminLimiter, verifyAdmin, getRoleChangeRequests);
router.post('/admin/role-change-approve', adminLimiter, verifyAdmin, approveRoleChange);
router.post('/admin/role-change-reject', adminLimiter, verifyAdmin, rejectRoleChange);

// Catch-all for unauthorized admin operations - MUST be last
router.post('/admin/*', blockUnauthorizedAdmin);

module.exports = router;
