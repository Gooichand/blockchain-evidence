const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const {
  getAllTags,
  createTag,
  addTagsToEvidence,
  removeTagFromEvidence,
  batchTag,
  filterByTags,
  suggestTags,
} = require('../controllers/tagController');

router.get('/tags', requireAuth, getAllTags);
router.post('/tags', requireAuth, createTag);
router.post('/evidence/:id/tags', requireAuth, addTagsToEvidence);
router.delete('/evidence/:id/tags/:tagId', requireAuth, removeTagFromEvidence);
router.post('/evidence/batch-tag', requireAuth, batchTag);
router.get('/evidence/filter-by-tags', requireAuth, filterByTags);
// Frontend alias — evidence-tagging page calls /evidence/by-tags
router.get('/evidence/by-tags', requireAuth, filterByTags);
router.get('/tags/suggest', requireAuth, suggestTags);

module.exports = router;
