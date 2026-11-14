const P = require('../public/noise-prnu');
const W = P.CROP + 12;
/* Synthetic sensor simulation: smooth scene multiplied by a fixed weak
   pattern, matching the multiplicative nature of PRNU. */
function rgbaFrame(seed, pattern, strength = 0.08) {
  const data = new Uint8ClampedArray(W * W * 4);
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  /* Scene geometry varies per frame as real scenes do; only the
     multiplicative sensor pattern is frame-invariant. Periodic structure is
     avoided: it leaks into residuals of any frame, as real periodic scenes
     would - a documented limit of residual correlation. */
  const p1 = rnd() * 6.28,
    p2 = rnd() * 6.28;
  const base = new Float64Array(W * W);
  for (let y = 0; y < W; y++)
    for (let x = 0; x < W; x++)
      base[y * W + x] =
        120 +
        60 * Math.sin(x / (30 + 20 * rnd()) + p1) * Math.cos(y / (40 + 20 * rnd()) + p2) +
        8 * rnd();
  for (let i = 0; i < W * W; i++) {
    const v = Math.max(0, Math.min(255, base[i] * (1 + strength * pattern[i % pattern.length])));
    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  return data;
}
function pattern(seed) {
  const p = new Float64Array(W * W);
  let s = seed;
  for (let i = 0; i < p.length; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    p[i] = s / 0x7fffffff - 0.5;
  }
  return p;
}
const patA = pattern(7),
  patB = pattern(99);
const fpA = P.fingerprint([11, 12, 13, 14, 15].map((seed) => P.residual(rgbaFrame(seed, patA), W, W)));
const fpB = P.fingerprint([21, 22, 23].map((seed) => P.residual(rgbaFrame(seed, patB), W, W)));
test('same synthetic sensor separates from a different sensor by PCE and correlation', () => {
  const q = P.residual(rgbaFrame(31, patA), W, W),
    same = P.pce(q, fpA),
    other = P.pce(q, fpB);
  expect(same.peakCorrelation).toBeGreaterThan(0.02);
  expect(same.peakCorrelation).toBeGreaterThan(other.peakCorrelation * 1.8);
  expect(same.pce).toBeGreaterThan(other.pce * 3);
  expect(same.peakShift).toEqual([0, 0]);
});
test('a scene without the reference pattern stays low', () => {
  const q = P.residual(rgbaFrame(41, pattern(77)), W, W),
    m = P.pce(q, fpA);
  expect(m.peakCorrelation).toBeLessThan(0.02);
});
test('small frames fail closed', () => {
  expect(() => P.residual(new Uint8ClampedArray(100 * 100 * 4), 100, 100)).toThrow(/524/);
});
test('fingerprint rejects empty and mismatched references', () => {
  expect(() => P.fingerprint([])).toThrow();
  expect(() => P.fingerprint([new Float64Array(4), new Float64Array(5)])).toThrow(/mismatch/);
});
