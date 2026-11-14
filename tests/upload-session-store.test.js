const fs = require('fs'),
  os = require('os'),
  path = require('path'),
  crypto = require('crypto');
let store, root;
beforeEach(() => {
  jest.resetModules();
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'be-upload-fixture-'));
  process.env.UPLOAD_TMP_DIR = root;
  store = require('../services/uploadSessionStore');
});
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
  delete process.env.UPLOAD_TMP_DIR;
});
const make = (size) =>
  store.createSession({
    filename: 'synthetic.bin',
    size,
    mimeType: 'application/octet-stream',
    createdBy: 'synthetic-owner',
  });
test('out-of-order chunks assemble exact original bytes and digest, retries preserve content', async () => {
  const bytes = Buffer.alloc(store.CHUNK_SIZE + 17, 0xa7),
    meta = await make(bytes.length);
  await store.saveChunk(meta, 1, bytes.subarray(store.CHUNK_SIZE));
  await store.saveChunk(meta, 0, bytes.subarray(0, store.CHUNK_SIZE));
  await store.saveChunk(meta, 0, bytes.subarray(0, store.CHUNK_SIZE));
  const result = await store.assemble(meta);
  expect(result.sha256).toBe(crypto.createHash('sha256').update(bytes).digest('hex'));
  expect((await store.readAssembled(meta.id)).equals(bytes)).toBe(true);
  expect((await store.assemble(await store.getSession(meta.id))).sha256).toBe(result.sha256);
});
test('missing/wrong-sized/out-of-range chunks fail explicitly', async () => {
  const meta = await make(3);
  await expect(store.assemble(meta)).rejects.toMatchObject({ status: 409, missingChunk: 0 });
  await expect(store.saveChunk(meta, 0, Buffer.alloc(2))).rejects.toMatchObject({ status: 400 });
  await expect(store.saveChunk(meta, -1, Buffer.alloc(3))).rejects.toMatchObject({ status: 400 });
  await expect(store.saveChunk(meta, 1, Buffer.alloc(3))).rejects.toMatchObject({ status: 400 });
});
test.each(['../escape', 'upl_../../x', 'UPL_123', ''])(
  'path traversal or malformed ID rejected: %s',
  async (id) => {
    await expect(store.getSession(id)).rejects.toMatchObject({ status: 400 });
    await expect(store.readAssembled(id)).rejects.toMatchObject({ status: 400 });
  },
);
test('expired session is deleted, not returned', async () => {
  const meta = await make(3);
  meta.expiresAt = Date.now() - 1;
  fs.writeFileSync(path.join(root, meta.id, 'meta.json'), JSON.stringify(meta));
  expect(await store.getSession(meta.id)).toBeNull();
  expect(fs.existsSync(path.join(root, meta.id))).toBe(false);
});
test('deleted assembled chunk cannot become successful completion', async () => {
  const meta = await make(3);
  await store.saveChunk(meta, 0, Buffer.from('abc'));
  fs.unlinkSync(path.join(root, meta.id, 'chunks', '0'));
  await expect(store.assemble(meta)).rejects.toThrow();
  expect((await store.getSession(meta.id)).assembled).toBe(false);
});
test('parallel distinct chunks preserve both receipts and assemble', async () => {
  const original = await make(store.CHUNK_SIZE + 3);
  const a = await store.getSession(original.id),
    b = await store.getSession(original.id);
  await Promise.all([
    store.saveChunk(a, 0, Buffer.alloc(store.CHUNK_SIZE, 1)),
    store.saveChunk(b, 1, Buffer.from('end')),
  ]);
  const latest = await store.getSession(original.id);
  expect(Object.keys(latest.received).sort()).toEqual(['0', '1']);
  await expect(store.assemble(latest)).resolves.toMatchObject({ assembled: true });
});
test('parallel retries of the same chunk do not produce a filesystem failure', async () => {
  const original = await make(3),
    a = await store.getSession(original.id),
    b = await store.getSession(original.id);
  const settled = await Promise.allSettled([
    store.saveChunk(a, 0, Buffer.from('abc')),
    store.saveChunk(b, 0, Buffer.from('abc')),
  ]);
  expect(settled.map((x) => x.status)).toEqual(['fulfilled', 'fulfilled']);
});
test('parallel completions return identical exact-byte digest', async () => {
  const meta = await make(3);
  await store.saveChunk(meta, 0, Buffer.from('abc'));
  const [a, b] = await Promise.all([
    store.assemble(await store.getSession(meta.id)),
    store.assemble(await store.getSession(meta.id)),
  ]);
  expect(a.sha256).toBe(b.sha256);
  expect((await store.readAssembled(meta.id)).toString()).toBe('abc');
});
test('stale chunk writer cannot replace completed bytes', async () => {
  const meta = await make(3),
    stale = await store.getSession(meta.id);
  await store.saveChunk(meta, 0, Buffer.from('abc'));
  await store.assemble(meta);
  await expect(store.saveChunk(stale, 0, Buffer.from('bad'))).rejects.toMatchObject({
    status: 409,
  });
  expect((await store.readAssembled(meta.id)).toString()).toBe('abc');
});
test('failed chunk operation releases queue for a valid retry', async () => {
  const meta = await make(3);
  await expect(store.saveChunk(meta, 0, Buffer.from('xx'))).rejects.toMatchObject({ status: 400 });
  await store.saveChunk(meta, 0, Buffer.from('abc'));
  expect((await store.assemble(meta)).assembled).toBe(true);
});
