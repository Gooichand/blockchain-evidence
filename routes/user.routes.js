const express = require('express');
const userController = require('../controllers/user.controller');

const router = express.Router();

// Get user by wallet address
router.get('/:wallet', userController.getUserByWallet);

// Prevent user self-deletion
router.post('/delete-self', userController.deleteSelf);

module.exports = router;
