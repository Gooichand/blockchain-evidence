const express = require('express');
const userController = require('../controllers/user.controller');
const { verifyAdmin } = require('../middlewares/auth.middleware');
const { adminLimiter } = require('../middlewares/rateLimiter.middleware');

const router = express.Router();

// Admin only routes
router.post('/create-user', adminLimiter, verifyAdmin, userController.createUser);
router.post('/create-admin', adminLimiter, verifyAdmin, userController.createAdmin);
router.post('/delete-user', adminLimiter, verifyAdmin, userController.deleteUser);
router.post('/users', adminLimiter, verifyAdmin, userController.getAllUsers);

// Block unauthorized admin operations
router.post('/*', (req, res) => {
    res.status(403).json({
        error: 'Forbidden: Administrator privileges required'
    });
});

module.exports = router;
