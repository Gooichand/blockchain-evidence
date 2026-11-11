const fs = require('fs');
const { fingerprint, compare, resample } = require('../public/acoustic-landmarks');
function wav(name) {
  const b = fs.readFileSync('public/samples/audio/landmarks/' + name);
  return Float32Array.from(
    { length: (b.length - 44) / 2 },
    (_, i) => b.readInt16LE(44 + 2 * i) / 32768,
  );
}
const samples = wav('original.wav');
let original;
beforeAll(() => {
  original = fingerprint(samples, 16000);
});
test('actual landmark hashes preserve time ordering and match identical/gain/noisy/cropped signals', () => {
  expect(original.state).toBe('READY');
  expect(original.distinctHashes).toBeGreaterThan(100);
  const cut = samples.subarray(Math.round(0.734 * 16000));
  for (const s of [
    samples,
    Float32Array.from(samples, (x) => x * 0.2),
    Float32Array.from(cut, (x, i) => x * 0.3 + 0.004 * Math.sin(i * 31.71)),
  ]) {
    const r = compare(original, fingerprint(s, 16000));
    expect(r.candidateMatch).toBe(true);
    expect(r.alignedAnchorCount).toBeGreaterThanOrEqual(20);
    expect(r.anchorCoverage).toBeLessThanOrEqual(1);
  }
  const r = compare(original, fingerprint(cut, 16000));
  expect(Math.abs(r.secondMinusFirstOffsetSeconds + 0.734)).toBeLessThan(0.04);
});
test('same spectra in reordered short segments and different source do not establish alignment', () => {
  for (const name of ['different.wav', 'reordered.wav']) {
    const r = compare(original, fingerprint(wav(name), 16000));
    expect(r.candidateMatch).toBe(false);
  }
});
test('silence, stationary tones and clips too short are inconclusive rather than identity matches', () => {
  for (const x of [
    new Float32Array(8000 * 5),
    Float32Array.from({ length: 8000 * 5 }, (_, i) => Math.sin((2 * Math.PI * 440 * i) / 8000)),
    new Float32Array(8000),
  ]) {
    const f = fingerprint(x, 8000),
      r = compare(f, f);
    expect(r.state).toBe('INCONCLUSIVE');
    expect(r.candidateMatch).toBe(false);
  }
});
test('repeated passages are ambiguous, not unique identity; sample and duration limits enforced', () => {
  const repeat = new Float32Array(16000 * 12),
    part = samples.subarray(0, 16000 * 3);
  for (let i = 0; i < 4; i++) repeat.set(part, i * part.length);
  const f = fingerprint(repeat, 16000),
    r = compare(f, f);
  expect(r.candidateMatch).toBe(false);
  expect(r.state).toMatch(/AMBIGUOUS/);
  expect(() => resample(samples, 7999)).toThrow();
  expect(() => resample(new Float32Array(8000 * 31), 8000)).toThrow();
});
