const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const { getTeam, addMember, removeMember, getComments, addComment } = require('../controllers/teamController');

router.get('/cases/:id/team', requireAuth, getTeam);
router.post('/cases/:id/team', requireAuth, addMember);
router.delete('/cases/:id/team/:userRef', requireAuth, removeMember);
router.get('/cases/:id/comments', requireAuth, getComments);
router.post('/cases/:id/comments', requireAuth, addComment);

module.exports = router;
