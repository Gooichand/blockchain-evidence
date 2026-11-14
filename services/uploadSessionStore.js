const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// S10: chunked, resumable upload sessions, filesystem-backed.
//
// Crime-scene video and disk images are large, and a single multipart POST
// of hundreds of MB dies with the first network drop (audit S10). This store
// keeps each upload as a session directory on disk:
//
//   <root>/<uploadId>/meta.json        session metadata + received chunk map
//   <root>/<uploadId>/chunks/<index>   one file per uploaded chunk
//   <root>/<uploadId>/assembled        full file after /complete
//
// Chunks can arrive in any order and be re-sent (idempotent per index), so a
// client that loses its connection re-queries the session and sends only the
// missing chunks. The SHA-256 is computed as a stream during assembly - the
// whole file is never held in memory on the server.
//
// Size limits (free tier, surfaced in the UI and enforced again at evidence
// attach time by EvidenceUploadController): 8 MB chunks, 500 MB per file,
// sessions expire after 6 hours (1 hour once assembled).

const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB
const MAX_FILE_SIZE = 500 * 1024 * 1024; // matches the hard upload ceiling
const SESSION_TTL_MS = 6 * 60 * 60 * 1000;
const ASSEMBLED_TTL_MS = 60 * 60 * 1000;
const ROOT = process.env.UPLOAD_TMP_DIR || path.join(os.tmpdir(), 'evid-dgc-uploads');

// Upload ids are server-generated hex; the guard keeps caller input from
// ever becoming a path traversal.
const ID_RE = /^upl_[a-f0-9]{24}$/;

// Serialize mutations for one upload within this Node process. This is not a
// distributed lock: multi-process/shared-volume deployments need coordination.
const mutations = new Map();
async function mutate(id, operation) {
  assertId(id);
  const previous = mutations.get(id) || Promise.resolve();
  const current = previous.catch(() => {}).then(operation);
  mutations.set(id, current);
  try {
    return await current;
  } finally {
    if (mutations.get(id) === current) mutations.delete(id);
  }
}
async function currentMeta(id) {
  const meta = await readMeta(id);
  if (!meta || isExpired(meta)) {
    const error = new Error('Upload session not found or expired');
    error.status = 404;
    throw error;
  }
  return meta;
}

function assertId(id) {
  if (!ID_RE.test(String(id || ''))) {
    const e = new Error('Invalid upload id');
    e.status = 400;
    throw e;
  }
}

const sessionDir = (id) => path.join(ROOT, id);
const metaPath = (id) => path.join(sessionDir(id), 'meta.json');
const chunkPath = (id, index) => path.join(sessionDir(id), 'chunks', String(index));
const assembledPath = (id) => path.join(sessionDir(id), 'assembled');

function isExpired(meta) {
  return !meta || Date.now() > meta.expiresAt;
}

async function readMeta(id) {
  assertId(id);
  try {
    return JSON.parse(await fs.promises.readFile(metaPath(id), 'utf8'));
  } catch {
    return null;
  }
}

async function writeMeta(meta) {
  const tmp = metaPath(meta.id) + '.' + crypto.randomBytes(8).toString('hex') + '.tmp';
  await fs.promises.writeFile(tmp, JSON.stringify(meta));
  await fs.promises.rename(tmp, metaPath(meta.id));
}

async function deleteSession(id) {
  assertId(id);
  await fs.promises.rm(sessionDir(id), { recursive: true, force: true });
}

async function createSession({ filename, size, mimeType, createdBy }) {
  const id = 'upl_' + crypto.randomBytes(12).toString('hex');
  const now = Date.now();
  const meta = {
    id,
    filename,
    size,
    mimeType: mimeType || 'application/octet-stream',
    chunkSize: CHUNK_SIZE,
    totalChunks: Math.ceil(size / CHUNK_SIZE),
    createdBy,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    received: {}, // "<index>": byteLength
    assembled: false,
    sha256: null,
  };
  await fs.promises.mkdir(path.join(sessionDir(id), 'chunks'), { recursive: true });
  await writeMeta(meta);
  return meta;
}

// Returns the live meta, or null when the session does not exist or expired
// (expired sessions are swept on the way out).
async function getSession(id) {
  const meta = await readMeta(id);
  if (!meta) return null;
  if (isExpired(meta)) {
    await deleteSession(id).catch(() => {});
    return null;
  }
  return meta;
}

function expectedChunkSize(meta, index) {
  if (index < 0 || index >= meta.totalChunks) return -1;
  if (index < meta.totalChunks - 1) return meta.chunkSize;
  return meta.size - meta.chunkSize * (meta.totalChunks - 1);
}

async function saveChunkUnlocked(meta, index, buf) {
  const expected = expectedChunkSize(meta, index);
  if (expected < 0) {
    const e = new Error(`Chunk index ${index} is out of range (0-${meta.totalChunks - 1})`);
    e.status = 400;
    throw e;
  }
  if (!Buffer.isBuffer(buf) || buf.length !== expected) {
    const e = new Error(
      `Chunk ${index} must be exactly ${expected} bytes (got ${buf ? buf.length : 0})`,
    );
    e.status = 400;
    throw e;
  }
  const finalPath = chunkPath(meta.id, index);
  const tmpPath = finalPath + '.' + crypto.randomBytes(8).toString('hex') + '.tmp';
  await fs.promises.writeFile(tmpPath, buf);
  await fs.promises.rename(tmpPath, finalPath); // atomic; a re-sent chunk just replaces
  meta.received[String(index)] = buf.length;
  await writeMeta(meta);
  return meta;
}

// Concatenate the chunks in order and hash in one pass, 8 MB at a time.
async function assembleUnlocked(meta) {
  if (meta.assembled && meta.sha256) return meta;
  for (let i = 0; i < meta.totalChunks; i++) {
    if (meta.received[String(i)] == null) {
      const e = new Error(`Chunk ${i} of ${meta.totalChunks} is still missing`);
      e.status = 409;
      e.missingChunk = i;
      throw e;
    }
  }
  const hash = crypto.createHash('sha256');
  const out = await fs.promises.open(assembledPath(meta.id), 'w');
  try {
    for (let i = 0; i < meta.totalChunks; i++) {
      const data = await fs.promises.readFile(chunkPath(meta.id, i));
      hash.update(data);
      await out.write(data);
    }
  } finally {
    await out.close();
  }
  const stat = await fs.promises.stat(assembledPath(meta.id));
  if (stat.size !== meta.size) {
    await deleteSession(meta.id).catch(() => {});
    const e = new Error(
      `Assembled file is ${stat.size} bytes but ${meta.size} were declared - upload aborted`,
    );
    e.status = 400;
    throw e;
  }
  meta.assembled = true;
  meta.sha256 = hash.digest('hex');
  meta.expiresAt = Date.now() + ASSEMBLED_TTL_MS; // shorter window once on disk whole
  await writeMeta(meta);
  return meta;
}

async function saveChunk(meta, index, buf) {
  return mutate(meta.id, async () => {
    const latest = await currentMeta(meta.id);
    if (latest.assembled) {
      const error = new Error('This upload is already completed');
      error.status = 409;
      throw error;
    }
    const saved = await saveChunkUnlocked(latest, index, buf);
    Object.assign(meta, saved);
    return saved;
  });
}
async function assemble(meta) {
  return mutate(meta.id, async () => {
    const latest = await currentMeta(meta.id);
    const assembled = await assembleUnlocked(latest);
    Object.assign(meta, assembled);
    return assembled;
  });
}

// Read the assembled file for the evidence pipeline. This re-introduces a
// memory peak of one file size (same as the previous multer memoryStorage
// behaviour); the resumability win is in the transfer, which no longer needs
// one uninterrupted multi-hundred-MB request.
async function readAssembled(id) {
  assertId(id);
  try {
    return await fs.promises.readFile(assembledPath(id));
  } catch {
    return null;
  }
}

async function sweepExpired() {
  let entries;
  try {
    entries = await fs.promises.readdir(ROOT);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!ID_RE.test(entry)) continue;
    const meta = await readMeta(entry);
    if (!meta || isExpired(meta)) {
      await deleteSession(entry).catch(() => {});
    }
  }
}

// Lazy sweep on session creation plus a slow interval; unref'd so it never
// keeps the process alive in tests.
const sweeper = setInterval(() => sweepExpired().catch(() => {}), 60 * 60 * 1000);
if (sweeper.unref) sweeper.unref();

module.exports = {
  CHUNK_SIZE,
  MAX_FILE_SIZE,
  createSession,
  getSession,
  saveChunk,
  assemble,
  readAssembled,
  deleteSession,
  sweepExpired,
};
