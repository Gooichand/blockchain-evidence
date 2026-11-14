// Live public IPFS gateway check, 2026-11-14. Read-only: retrieves CARs for two
// long-standing public CIDs through the actual readCAR service (no mocks), then
// verifies every block and link with the actual inspectCAR verifier. No upload,
// pinning, wallet, credentials or writes. Results go to stdout as JSON.
const fs = require('fs');
const vm = require('vm');
const { webcrypto } = require('crypto');
const service = require('../services/ipfsReadOnlyService');
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
const TARGETS = [
  {
    note: 'Empty UnixFS directory, deterministic public CIDv1 of QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn',
    cid: 'bafybeiczsscdsbs7ffqz55asqdf3smv6klcw3gofszvwlyarci47bgf354',
  },
  {
    note: 'Public directory (docs example QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG as CIDv1)',
    cid: 'bafybeie5nqv6kd3qnfjupgvz34woh3oksc3iau6abmyajn7qvtf6d2ho34',
  },
];
(async () => {
  const out = { checkedAt: new Date().toISOString(), gateway: 'everland', results: [] };
  for (const t of TARGETS) {
    try {
      const bytes = await service.readCAR('everland', t.cid);
      const r = await inspectCAR(t.cid, new Uint8Array(bytes), ctx.LocalIPFS);
      out.results.push({
        cid: t.cid,
        note: t.note,
        retrievedBytes: bytes.length,
        cidVerified: r.cidVerified,
        verifiedBlockCount: r.verifiedBlockCount,
        status: 'RETRIEVED_AND_VERIFIED',
      });
    } catch (e) {
      out.results.push({ cid: t.cid, note: t.note, status: 'FAILED', error: String(e.message || e) });
    }
  }
  console.log(JSON.stringify(out, null, 2));
})();
