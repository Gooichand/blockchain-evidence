const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const { listCaseNotes, addCaseNote, editNote, deleteNote, noteHistory } = require('../controllers/notesController');

router.get('/cases/:id/notes', requireAuth, listCaseNotes);
router.post('/cases/:id/notes', requireAuth, addCaseNote);
router.put('/notes/group/:groupId', requireAuth, editNote);
router.delete('/notes/group/:groupId', requireAuth, deleteNote);
router.get('/notes/group/:groupId/history', requireAuth, noteHistory);

module.exports = router;
