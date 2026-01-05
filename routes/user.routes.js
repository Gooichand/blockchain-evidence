const express = require('express');
const userController = require('../controllers/user.controller');

const router = express.Router();

/**
 * @swagger
 * /api/user/{wallet}:
 *   get:
 *     summary: Get user by wallet address
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: wallet
 *         required: true
 *         schema:
 *           type: string
 *         example: "0xA1B2C3D4E5F6789012345678901234567890ABCD" 
 *     security:
 *       - UserWallet: []
 *     responses:
 *       200:
 *         description: User data returned
 *       400:
 *         description: Invalid wallet address
 *       404:
 *         description: User not found
 */
router.get('/:wallet', userController.getUserByWallet);

// Prevent user self-deletion
router.post('/delete-self', userController.deleteSelf);

module.exports = router;
