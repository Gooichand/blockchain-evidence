const express = require('express');
const userController = require('../controllers/user.controller');
const { verifyAdmin } = require('../middlewares/auth.middleware');
const { adminLimiter } = require('../middlewares/rateLimiter.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/admin/create-user:
 *   post:
 *     summary: Create regular user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - AdminWallet: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             adminWallet: "0xADMIN..."
 *             userData:
 *               walletAddress: "0xUSER..."
 *               fullName: "John Doe"
 *               role: "investigator"
 *     responses:
 *       200:
 *         description: User created successfully
 *       403:
 *         description: Admin privileges required
 */
router.post('/create-user', adminLimiter, verifyAdmin, userController.createUser);

/**
 * @swagger
 * /api/admin/create-admin:
 *   post:
 *     summary: Create admin user
 *     tags: [Admin]
 *     security:
 *       - AdminWallet: []
 *     responses:
 *       200:
 *         description: Admin created
 */
router.post('/create-admin', adminLimiter, verifyAdmin, userController.createAdmin);

/**
 * @swagger
 * /api/admin/delete-user:
 *   post:
 *     summary: Delete user (soft delete)
 *     tags: [Admin]
 *     security:
 *       - AdminWallet: []
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
router.post('/delete-user', adminLimiter, verifyAdmin, userController.deleteUser);

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - AdminWallet: []
 *     responses:
 *       200:
 *         description: Users list returned
 */
router.post('/users', adminLimiter, verifyAdmin, userController.getAllUsers);

// Block unauthorized admin operations
router.post('/*', (req, res) => {
    res.status(403).json({
        error: 'Forbidden: Administrator privileges required'
    });
});

module.exports = router;
