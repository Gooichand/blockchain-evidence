/* Original deterministic UnixFS CAR examples, never uploaded or pinned. */
import { importer } from 'ipfs-unixfs-importer';
import { fixedSize } from 'ipfs-unixfs-importer/chunker';
import { MemoryBlockstore } from 'blockstore-core/memory';
import { CarWriter } from '@ipld/car/writer';
import { CID } from 'multiformats/cid';
import { sha256 } from 'multiformats/hashes/sha2';
import fs from 'node:fs';
import path from 'node:path';
const out = path.resolve(import.meta.dirname, '../../public/samples/ipfs');
fs.mkdirSync(out, { recursive: true });
const text =
  'Original DGC synthetic UnixFS content. No personal evidence, no upload, no pin.\n'.repeat(120);
function trackedStore() {
  const store = new MemoryBlockstore(),
    put = store.put.bind(store);
  store.known = new Map();
  store.put = (cid, bytes, options) => {
    store.known.set(cid.toString(), { cid, block: bytes });
    return put(cid, bytes, options);
  };
  return store;
}
const store = trackedStore();
let root;
for await (const entry of importer(
  [{ path: 'demo.txt', content: new TextEncoder().encode(text) }],
  store,
  { cidVersion: 1, rawLeaves: true, chunker: fixedSize({ chunkSize: 1024 }) },
))
  root = entry.cid;
async function saveCAR(name, cid, storage, omitLast = false, alter = false) {
  const { writer, out: stream } = CarWriter.create([cid]);
  const collect = (async () => {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
  })();
  const blocks = [...storage.known.values()];
  for (let i = 0; i < blocks.length; i++) {
    if (omitLast && i === 0) continue; // omit a linked leaf, not the requested root
    const block = blocks[i];
    let bytes = block.block;
    if (alter && i === 0) {
      bytes = new Uint8Array(bytes);
      bytes[bytes.length - 1] ^= 1;
    }
    await writer.put({ cid: block.cid, bytes });
  }
  await writer.close();
  fs.writeFileSync(path.join(out, name), await collect);
  return blocks.length;
}
const count = await saveCAR('demo.car', root, store);
await saveCAR('tampered.car', root, store, false, true);
await saveCAR('missing-block.car', root, store, true, false);
fs.writeFileSync(path.join(out, 'expected.txt'), text);
fs.writeFileSync(
  path.join(out, 'example.json'),
  JSON.stringify(
    { cid: root.toString(), byteLength: new TextEncoder().encode(text).length, blockCount: count },
    null,
    2,
  ) + '\n',
);
const dirs = trackedStore();
let directory;
for await (const entry of importer(
  [
    { path: 'one.txt', content: new TextEncoder().encode('Original one') },
    { path: 'two.txt', content: new TextEncoder().encode('Original two') },
  ],
  dirs,
  { cidVersion: 1, wrapWithDirectory: true },
))
  directory = entry.cid;
await saveCAR('directory.car', directory, dirs);
fs.writeFileSync(
  path.join(out, 'directory.json'),
  JSON.stringify({ cid: directory.toString() }, null, 2) + '\n',
);
fs.writeFileSync(
  path.join(out, 'README.md'),
  '# Original UnixFS CAR fixtures\n\nGenerated locally with scripts/ipfs-vendor-build/generate-samples.mjs. demo.car contains an original multi-block UnixFS file, expected.txt its reconstructed bytes; tampered.car changes a block without changing its CID; missing-block.car omits a linked block; directory.car contains two original files. No files were uploaded or pinned. CAR bytes are inert test input, not a live IPFS availability claim.\n',
);
console.log({ cid: root.toString(), blocks: count, directory: directory.toString() });
