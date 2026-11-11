const fs = require('fs'),
  vm = require('vm'),
  { webcrypto } = require('crypto');
global.crypto = webcrypto;
const ctx = {
  crypto: webcrypto,
  Event,
  EventTarget,
  CustomEvent,
  TextDecoder,
  TextEncoder,
  AbortController,
  AbortSignal,
  Uint8Array,
  ArrayBuffer,
  ReadableStream,
  Blob,
  queueMicrotask,
  setTimeout,
  clearTimeout,
};
vm.runInNewContext(fs.readFileSync('public/vendor/ipfs-bundle.js', 'utf8'), ctx);
const { inspectCAR } = require('../public/ipfs-evidence');
const manifest = JSON.parse(fs.readFileSync('public/samples/ipfs/example.json'));
const load = (name) => new Uint8Array(fs.readFileSync('public/samples/ipfs/' + name));
test('actual multi-block UnixFS CAR reconstructs exact original bytes after every CID check', async () => {
  const r = await inspectCAR(manifest.cid, load('demo.car'), ctx.LocalIPFS);
  expect(r.cidVerified).toBe(true);
  expect(r.verifiedBlockCount).toBe(manifest.blockCount);
  expect(r.verifiedBlockCount).toBeGreaterThan(1);
  expect(Buffer.from(r.verifiedFileBytes)).toEqual(
    fs.readFileSync('public/samples/ipfs/expected.txt'),
  );
  expect(r.byteLength).toBe(manifest.byteLength);
  expect(r.pinStatus).toBe('NOT CHECKED');
});
test('changed block, missing linked block and unrelated requested CID fail without a trusted preview', async () => {
  await expect(inspectCAR(manifest.cid, load('tampered.car'), ctx.LocalIPFS)).rejects.toThrow(
    'do not match',
  );
  await expect(inspectCAR(manifest.cid, load('missing-block.car'), ctx.LocalIPFS)).rejects.toThrow(
    'missing',
  );
  const dir = JSON.parse(fs.readFileSync('public/samples/ipfs/directory.json'));
  await expect(inspectCAR(dir.cid, load('demo.car'), ctx.LocalIPFS)).rejects.toThrow(
    'Requested CID',
  );
  await expect(
    inspectCAR(manifest.cid, new Uint8Array(10 * 1024 * 1024 + 1), ctx.LocalIPFS),
  ).rejects.toThrow('limit');
});
test('directory entries are linked actual objects, not content opened or executed', async () => {
  const m = JSON.parse(fs.readFileSync('public/samples/ipfs/directory.json'));
  const r = await inspectCAR(m.cid, load('directory.car'), ctx.LocalIPFS);
  expect(r.type).toBe('directory');
  expect(r.entries.map((x) => x.name)).toEqual(['one.txt', 'two.txt']);
  expect(r.contentSafety).toBe('NOT ASSESSED');
  expect(r.verifiedFileBytes).toBeUndefined();
});

test('gateway CAR duplicate blocks and misleading header roots do not override the actual requested CID', async () => {
  const car = load('demo.car'),
    dir = load('directory.car');
  expect(car[0]).toBeLessThan(128);
  expect(dir[0]).toBeLessThan(128);
  const repeated = new Uint8Array(Buffer.concat([car, car.subarray(car[0] + 1)]));
  const result = await inspectCAR(manifest.cid, repeated, ctx.LocalIPFS);
  expect(result.verifiedBlockCount).toBe(manifest.blockCount);
  expect(result.receivedBlockCount).toBe(manifest.blockCount * 2);
  const wrongHint = new Uint8Array(
    Buffer.concat([dir.subarray(0, dir[0] + 1), car.subarray(car[0] + 1)]),
  );
  expect((await inspectCAR(manifest.cid, wrongHint, ctx.LocalIPFS)).cidVerified).toBe(true);
});
