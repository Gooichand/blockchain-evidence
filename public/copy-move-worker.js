/* Lazy local classical-feature worker. No evidence upload or trained model. */
importScripts('vendor/opencv.js', 'copy-move-features.js');
self.onmessage = ({ data }) => {
  const start = Date.now();
  function run() {
    if (!self.cv?.Mat) {
      if (Date.now() - start > 15000) {
        self.postMessage({ ok: false, error: 'Feature engine initialization timed out.' });
        return;
      }
      setTimeout(run, 50);
      return;
    }
    try {
      self.postMessage({
        ok: true,
        result: CopyMoveFeatures.find(cv, new Uint8Array(data.pixels), data.width, data.height),
      });
    } catch {
      self.postMessage({
        ok: false,
        error: 'Feature comparison failed or exceeded supported input.',
      });
    }
  }
  run();
};
