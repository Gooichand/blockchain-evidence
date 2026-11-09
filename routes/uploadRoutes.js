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

// A body bigger than one chunk trips the raw parser's limit before the
// controller runs; answer with a clear 413 instead of the generic 500.
router.use('/uploads', (err, req, res, next) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: `Chunk too large. Send exactly one chunk per request (${CHUNK_SIZE / 1024 / 1024}MB, smaller for the final chunk).`,
    });
  }
  next(err);
});

module.exports = router;
