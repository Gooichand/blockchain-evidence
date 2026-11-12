/* CID-verified CAR/UnixFS inspection. No content execution, pinning or uploads. */
(function (root) {
  'use strict';
  async function inspectCAR(cidText, bytes, lib) {
    if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes);
    if (bytes.length > 10 * 1024 * 1024) throw Error('CAR input limit: 10 MiB.');
    const cid = lib.CID.parse(cidText.trim());
    if (![0x55, 0x70].includes(cid.code) || cid.multihash.code !== 0x12)
      throw Error('Only raw/DAG-PB SHA-256 CIDs are supported.');
    const reader = await lib.CarReader.fromBytes(bytes),
      roots = await reader.getRoots();
    const canonical = (x) => x.toV1().toString();
    // CAR roots are unspecified on HTTP gateways; validate the requested CID from actual blocks instead.
    if (roots.length > 100) throw Error('Excessive CAR header roots.');
    const store = new Map();
    let blockCount = 0;
    for await (const block of reader.blocks()) {
      if (block.bytes.length > 2 * 1024 * 1024) throw Error('Individual CAR block limit: 2 MiB.');
      if (++blockCount > 1000) throw Error('CAR block limit: 1000.');
      if (
        ![0x55, 0x70].includes(block.cid.code) ||
        block.cid.multihash.code !== 0x12 ||
        block.cid.multihash.size !== 32
      )
        throw Error('Unsupported block codec/hash.');
      const digest = await lib.sha256.digest(block.bytes);
      if (!digest.digest.every((b, i) => b === block.cid.multihash.digest[i]))
        throw Error('CAR block bytes do not match their CID; nothing verified.');
      const name = canonical(block.cid);
      if (!store.has(name)) store.set(name, block.bytes);
    }
    if (!store.has(canonical(cid))) throw Error('Requested CID block is missing from CAR.');
    let reads = 0;
    const blockstore = {
      get: async (c) => {
        if (++reads > 4000) throw Error('UnixFS traversal limit: 4000 reads.');
        const value = store.get(canonical(c));
        if (!value) throw Error('Required UnixFS block missing from CAR.');
        return value;
      },
    };
    const entry = await lib.exporter(cid, blockstore, { blockReadConcurrency: 2 });
    const report = {
      cid: cid.toString(),
      canonicalCID: canonical(cid),
      cidVerified: true,
      carBytes: bytes.length,
      verifiedBlockCount: store.size,
      receivedBlockCount: blockCount,
      declaredCARRoots: roots.map((x) => x.toString()),
      type: entry.type,
      pinStatus: 'NOT CHECKED',
      authorship: 'NOT VERIFIED',
      contentSafety: 'NOT ASSESSED',
    };
    if (entry.type === 'directory') {
      const entries = [];
      for await (const child of entry.content()) {
        if (entries.length >= 200) throw Error('Directory listing limit: 200 entries.');
        entries.push({
          name: child.name,
          cid: child.cid.toString(),
          type: child.type,
          size: child.size.toString(),
        });
      }
      return {
        ...report,
        entries,
        limit:
          'Verified linked directory listing only; no automatic opening, extraction or execution. Names may be hostile. CAR limits apply. No pin, availability, authorship or safety guarantee.',
      };
    }
    if (
      !['file', 'raw'].includes(entry.type) ||
      ['symlink', 'metadata'].includes(entry.unixfs?.type)
    )
      throw Error('Only regular UnixFS files, raw blocks and directories are supported.');
    if (entry.size > 5n * 1024n * 1024n) throw Error('Reconstructed file limit: 5 MiB.');
    const chunks = [];
    let size = 0;
    for await (const chunk of entry.content()) {
      size += chunk.length;
      if (size > 5 * 1024 * 1024) throw Error('Reconstructed file limit: 5 MiB.');
      chunks.push(chunk);
    }
    if (BigInt(size) !== entry.size) throw Error('UnixFS output size differs from declared size.');
    const fileBytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      fileBytes.set(chunk, offset);
      offset += chunk.length;
    }
    let text = null;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(fileBytes.slice(0, 4096));
    } catch (_) {}
    return {
      ...report,
      byteLength: size,
      previewBytes: Math.min(4096, size),
      previewTruncated: size > 4096,
      untrustedUtf8Preview: text,
      hexPrefix: Array.from(fileBytes.slice(0, 128), (b) => b.toString(16).padStart(2, '0')).join(
        ' ',
      ),
      reconstructedSHA256: Array.from((await lib.sha256.digest(fileBytes)).digest, (b) =>
        b.toString(16).padStart(2, '0'),
      ).join(''),
      verifiedFileBytes: fileBytes,
      limit:
        'Every supplied block hash checked and the requested linked UnixFS object reconstructed locally. A UnixFS file CID hashes its DAG, not the reconstructed file bytes directly. Preview is untrusted, never executed. Maximum 10 MiB CAR/1000 blocks/5 MiB output. No pinning, authorship, malware safety or continuous-availability claim.',
    };
  }
  root.IPFSEvidence = { inspectCAR };
  if (typeof module === 'object') module.exports = root.IPFSEvidence;
})(typeof self !== 'undefined' ? self : globalThis);
