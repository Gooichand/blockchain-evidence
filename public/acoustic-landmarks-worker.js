/* Dedicated bounded landmark worker. No network or uploaded evidence. */
importScripts('acoustic-landmarks.js');
self.onmessage = ({ data }) => {
  try {
    const first = AcousticLandmarks.fingerprint(new Float32Array(data.first), data.firstRate);
    const second = AcousticLandmarks.fingerprint(new Float32Array(data.second), data.secondRate);
    self.postMessage({ ok: true, result: AcousticLandmarks.compare(first, second) });
  } catch (e) {
    self.postMessage({ ok: false, error: e.message || 'Fingerprint calculation failed.' });
  }
};
