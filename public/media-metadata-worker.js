/* Isolated local MediaInfo parser. Never fetches media or uploads bytes. */
'use strict';
importScripts('/vendor/mediainfo-0.3.8.min.js');
self.onmessage = async (event) => {
  let engine;
  try {
    const file = event.data.file;
    if (!(file instanceof Blob) || file.size === 0 || file.size > 50 * 1024 * 1024)
      throw Error('Media input must be1 byte to50 MiB.');
    engine = await self.MediaInfo.mediaInfoFactory({
      format: 'object',
      full: true,
      coverData: false,
      locateFile: () => '/vendor/MediaInfoModule-0.3.8.wasm',
    });
    const result = await engine.analyzeData(file.size, async (size, offset) => {
      if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(size) || size < 0)
        throw Error('Invalid parser read request.');
      return new Uint8Array(
        await file.slice(offset, Math.min(file.size, offset + size)).arrayBuffer(),
      );
    });
    if (!Array.isArray(result?.media?.track) || result.media.track.length > 1000)
      throw Error('No readable tracks or track limit exceeded.');
    self.postMessage({ ok: true, result });
  } catch (e) {
    self.postMessage({ ok: false, error: e.message || 'Media parser failed.' });
  } finally {
    engine?.close();
  }
};
