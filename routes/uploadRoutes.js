const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const { chunkInitLimiter } = require('../middleware/rateLimiters');
const { CHUNK_SIZE } = require('../services/uploadSessionStore');
const {
  initUpload,
  getUploadStatus,
  putChunk,
  completeUpload,
  cancelUpload,
} = require('../controllers/uploadSessionController');

// S10: chunked/resumable uploads.
// Chunks arrive as raw octet-stream bodies (max one chunk + 1MB slack). The
// global JSON parser skips this content type, so the raw parser sees the
// body untouched.
const rawChunk = express.raw({ type: () => true, limit: CHUNK_SIZE + 1024 * 1024 });

router.post('/uploads', requireAuth, chunkInitLimiter, initUpload);
router.get('/uploads/:id', requireAuth, getUploadStatus);
router.put('/uploads/:id/chunks/:index', requireAuth, rawChunk, putChunk);
router.post('/uploads/:id/complete', requireAuth, completeUpload);
router.delete('/uploads/:id', requireAuth, cancelUpload);

module.exports = router;
