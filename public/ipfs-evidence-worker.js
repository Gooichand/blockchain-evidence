'use strict';
importScripts('/vendor/ipfs-bundle.js', '/ipfs-evidence.js');
self.onmessage = async (e) => {
  try {
    const result = await IPFSEvidence.inspectCAR(
      e.data.cid,
      new Uint8Array(e.data.bytes),
      LocalIPFS,
    );
    self.postMessage({ ok: true, result });
  } catch (error) {
    self.postMessage({ ok: false, error: error.message || 'CAR verification failed.' });
  }
};
