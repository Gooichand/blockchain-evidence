/* Bounded coefficient-only parsing, no image upload or pixel re-encoding. */
importScripts('/vendor/jpeg-coefficients.js', '/double-jpeg.js');
self.onmessage = async ({ data: file }) => {
  try {
    if (!(file instanceof Blob) || file.size > 20 * 1024 * 1024) throw Error('JPEG limit20MiB.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = DoubleJPEG.analyze(JPEGCoefficients(bytes));
    self.postMessage({ ok: true, result });
  } catch (e) {
    self.postMessage({ ok: false, error: e.message || 'JPEG coefficient analysis failed.' });
  }
};
