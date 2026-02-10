const express = require('express');
const router = express.Router();
const { adminLimiter } = require('../middleware/rateLimiters');
const { verifyAdmin } = require('../middleware/verifyAdmin');
const {
    createUser, createAdmin, deleteUser, getAllUsers,
    roleChangeRequest, getRoleChangeRequests,
    approveRoleChange, rejectRoleChange, blockUnauthorizedAdmin
} = require('../controllers/adminController');

router.post('/admin/create-user', adminLimiter, verifyAdmin, createUser);
router.post('/admin/create-admin', adminLimiter, verifyAdmin, createAdmin);
router.post('/admin/delete-user', adminLimiter, verifyAdmin, deleteUser);
router.get('/admin/users', adminLimiter, getAllUsers);
router.post('/admin/role-change-request', adminLimiter, verifyAdmin, roleChangeRequest);
router.get('/admin/role-change-requests', adminLimiter, getRoleChangeRequests);
router.post('/admin/role-change-approve', adminLimiter, verifyAdmin, approveRoleChange);
router.post('/admin/role-change-reject', adminLimiter, verifyAdmin, rejectRoleChange);

// Catch-all for unauthorized admin operations — MUST be last
router.post('/admin/*', blockUnauthorizedAdmin);

module.exports = router;
