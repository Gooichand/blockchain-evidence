/* Bounded local metadata parsing, not origin or stream-integrity verification. */
(function (root) {
  'use strict';
  function summarize(result, kind) {
    const tracks = result?.media?.track;
    if (!Array.isArray(tracks)) throw Error('Invalid media metadata.');
    const general = tracks.find((t) => t['@type'] === 'General') || {},
      track = tracks.find((t) => t['@type'] === (kind === 'audio' ? 'Audio' : 'Video'));
    if (!track) throw Error('No ' + kind + ' track recognized.');
    const number = (x) => {
      const n = Number(x);
      return Number.isFinite(n) ? n : null;
    };
    return {
      format: general.Format || null,
      durationSeconds: number(general.Duration ?? track.Duration),
      width: kind === 'video' ? number(track.Width) : undefined,
      height: kind === 'video' ? number(track.Height) : undefined,
      originalSampleRate: kind === 'audio' ? number(track.SamplingRate) : undefined,
      channels: kind === 'audio' ? number(track.Channels) : undefined,
      codec: track.Format || null,
      tracks,
      engine: 'MediaInfo.js0.3.8 / local WASM',
      parserVersion: result.creatingLibrary?.version || null,
      limit:
        'Embedded/container claims only. No recording identity, authorship, full history, decryption or all-frame integrity check. Missing fields may be absent or unsupported.',
    };
  }
  function inspect(file, kind) {
    if (!file || file.size === 0 || file.size > 50 * 1024 * 1024)
      return Promise.reject(Error('Media input must be1 byte to50 MiB.'));
    if (!['audio', 'video'].includes(kind))
      return Promise.reject(Error('Choose audio or video metadata.'));
    return new Promise((resolve, reject) => {
      const worker = new Worker('/media-metadata-worker.js');
      let done = false;
      const timer = setTimeout(
        () => finish(Error('Media metadata parser exceeded25 seconds.')),
        25000,
      );
      function finish(error, result) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        worker.terminate();
        if (error) reject(error);
        else resolve(result);
      }
      worker.onmessage = (e) => {
        if (!e.data.ok) return finish(Error(e.data.error || 'Media parser failed.'));
        try {
          finish(null, summarize(e.data.result, kind));
        } catch (error) {
          finish(error);
        }
      };
      worker.onerror = () => finish(Error('Local media worker/engine unavailable.'));
      worker.postMessage({ file });
    });
  }
  const api = { inspect, summarize };
  root.MediaMetadata = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
