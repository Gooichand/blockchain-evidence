const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const { globalSearch } = require('../controllers/searchController');

router.get('/search', requireAuth, globalSearch);

module.exports = router;
