const express = require('express');
const router = express.Router();
const { updateProfile, getUserByWallet, preventSelfDeletion } = require('../controllers/userController');

router.put('/users/:id/profile', updateProfile);
router.get('/users/wallet/:wallet', getUserByWallet);
router.post('/user/delete-self', preventSelfDeletion);

module.exports = router;
