const store = require('../services/uploadSessionStore');
const { getAuthUser, getStableWallet } = require('../middleware/identity');

// S10: chunked/resumable upload sessions.
// Flow: POST /api/uploads (init) -> PUT /api/uploads/:id/chunks/:index (any
// order, retryable) -> POST /api/uploads/:id/complete (assemble + SHA-256) ->
// POST /api/evidence/upload with the returned uploadId instead of a file.

const UPLOAD_ROLES = ['admin', 'investigator', 'evidence_manager', 'legal_professional', 'court_official', 'forensic_analyst'];

function statusOf(meta) {
  return {
    uploadId: meta.id,
    filename: meta.filename,
    size: meta.size,
    mimeType: meta.mimeType,
    chunkSize: meta.chunkSize,
    totalChunks: meta.totalChunks,
    received: Object.keys(meta.received).map(Number).sort((a, b) => a - b),
    assembled: meta.assembled,
    expiresAt: new Date(meta.expiresAt).toISOString(),
  };
}

async function loadOwnedSession(req, res) {
  const meta = await store.getSession(String(req.params.id || ''));
  if (!meta) {
    res.status(404).json({ success: false, error: 'Upload session not found or expired' });
    return null;
  }
  if (meta.createdBy !== getStableWallet(req)) {
    res.status(403).json({ success: false, error: 'This upload session belongs to another user' });
    return null;
  }
  return meta;
}

const initUpload = async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    const createdBy = getStableWallet(req);
    if (!authUser || !createdBy) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!UPLOAD_ROLES.includes(authUser.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions to upload evidence' });
    }

    const { size, mimeType } = req.body || {};
    let { filename } = req.body || {};
    filename = String(filename || '').trim().slice(0, 255);
    if (!filename) {
      return res.status(400).json({ success: false, error: 'filename is required' });
    }
    // Never let a client-supplied name carry path segments onto disk later
    filename = filename.split(/[\\/]/).pop();
    const declaredSize = Number(size);
    if (!Number.isInteger(declaredSize) || declaredSize <= 0) {
      return res.status(400).json({ success: false, error: 'size must be a positive integer (bytes)' });
    }
    if (declaredSize > store.MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        error: `File too large. The free tier allows up to ${store.MAX_FILE_SIZE / 1024 / 1024}MB per file.`,
        maxFileSize: store.MAX_FILE_SIZE,
      });
    }

    await store.sweepExpired().catch(() => {}); // lazy cleanup piggybacked on init
    const meta = await store.createSession({
      filename,
      size: declaredSize,
      mimeType: String(mimeType || '').slice(0, 100) || undefined,
      createdBy,
    });
    res.status(201).json({ success: true, ...statusOf(meta) });
  } catch (error) {
    console.error('Upload init failed:', error);
    res.status(error.status || 500).json({ success: false, error: error.status ? error.message : 'Could not start the upload session' });
  }
};

const getUploadStatus = async (req, res) => {
  try {
    const meta = await loadOwnedSession(req, res);
    if (!meta) return;
    res.json({ success: true, ...statusOf(meta), sha256: meta.assembled ? meta.sha256 : undefined });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: error.status ? error.message : 'Could not read the upload session' });
  }
};

const putChunk = async (req, res) => {
  try {
    const meta = await loadOwnedSession(req, res);
    if (!meta) return;
    if (meta.assembled) {
      return res.status(409).json({ success: false, error: 'This upload is already completed' });
    }
    const index = parseInt(req.params.index, 10);
    if (!Number.isInteger(index) || String(index) !== String(req.params.index)) {
      return res.status(400).json({ success: false, error: 'Chunk index must be a non-negative integer' });
    }
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ success: false, error: 'Send the raw chunk bytes as the request body' });
    }
    await store.saveChunk(meta, index, req.body);
    res.json({ success: true, received: Object.keys(meta.received).length, totalChunks: meta.totalChunks });
  } catch (error) {
    console.error('Chunk upload failed:', error);
    res.status(error.status || 500).json({ success: false, error: error.status ? error.message : 'Could not store the chunk' });
  }
};

const completeUpload = async (req, res) => {
  try {
    let meta = await loadOwnedSession(req, res);
    if (!meta) return;
    if (!meta.assembled) {
      meta = await store.assemble(meta);
    }
    res.json({
      success: true,
      uploadId: meta.id,
      filename: meta.filename,
      size: meta.size,
      sha256: meta.sha256,
      expiresAt: new Date(meta.expiresAt).toISOString(),
      message: 'Upload complete. Attach it to a case with POST /api/evidence/upload and this uploadId.',
    });
  } catch (error) {
    console.error('Upload complete failed:', error);
    res.status(error.status || 500).json({ success: false, error: error.status ? error.message : 'Could not finalize the upload', missingChunk: error.missingChunk });
  }
};

const cancelUpload = async (req, res) => {
  try {
    const meta = await loadOwnedSession(req, res);
    if (!meta) return;
    await store.deleteSession(meta.id);
    res.json({ success: true, message: 'Upload session cancelled and deleted' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: error.status ? error.message : 'Could not cancel the upload session' });
  }
};

module.exports = { initUpload, getUploadStatus, putChunk, completeUpload, cancelUpload };
