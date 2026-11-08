const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const { listFilters, createFilter, deleteFilter } = require('../controllers/savedFiltersController');

router.get('/saved-filters', requireAuth, listFilters);
router.post('/saved-filters', requireAuth, createFilter);
router.delete('/saved-filters/:id', requireAuth, deleteFilter);

module.exports = router;
