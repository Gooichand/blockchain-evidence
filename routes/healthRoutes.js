const express = require('express');
const router = express.Router();
const { getHealth, getIpfsHealth } = require('../controllers/healthController');

router.get('/health', getHealth);
router.get('/health/ipfs', getIpfsHealth);

module.exports = router;
