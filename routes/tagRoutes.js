const express = require('express');
const router = express.Router();
const { getAllTags, createTag, addTagsToEvidence, removeTagFromEvidence, batchTag, filterByTags, suggestTags } = require('../controllers/tagController');

router.get('/tags', getAllTags);
router.post('/tags', createTag);
router.post('/evidence/:id/tags', addTagsToEvidence);
router.delete('/evidence/:id/tags/:tagId', removeTagFromEvidence);
router.post('/evidence/batch-tag', batchTag);
router.get('/evidence/filter-by-tags', filterByTags);
router.get('/tags/suggest', suggestTags);

module.exports = router;
