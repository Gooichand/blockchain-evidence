const express = require('express');
const router = express.Router();
const { getChecklist, updateChecklistItem } = require('../controllers/checklistController');
const { requireAuth } = require('../middleware/requireAuth');

// S9: guided collection checklist (ISO 27037 phases), one per case.
router.get('/cases/:id/checklist', requireAuth, getChecklist);
router.put('/cases/:id/checklist/items/:key', requireAuth, updateChecklistItem);

module.exports = router;
