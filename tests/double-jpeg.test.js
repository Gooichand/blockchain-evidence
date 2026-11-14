const fs = require('fs'),
  path = require('path');
const decode = require('../scripts/jpeg-vendor-build/coefficient-decoder.cjs');
const D = require('../public/double-jpeg');
const dir = path.join(__dirname, '../public/samples/image/double-jpeg');
const inspect = (name) => D.analyze(decode(fs.readFileSync(path.join(dir, name))));
test.each(['double-75-95.jpg', 'double-85-95.jpg'])(
  'original independent Pillow aligned artifact positive %s',
  (name) => {
    const r = inspect(name);
    expect(r.state).toBe('ALIGNED_DOUBLE_QUANTIZATION_CANDIDATE');
    expect(r.doubleCompressionProven).toBe(false);
    expect(r.candidateHypotheses[0].supportingFrequencies).toBeGreaterThanOrEqual(4);
  },
);
test.each([
  ['double-50-95.jpg', 50],
  ['double-65-95.jpg', 65],
])('broad lattice enrichment positive %s', (name, quality) => {
  const r = inspect(name);
  expect(r.state).toBe('ALIGNED_DOUBLE_QUANTIZATION_CANDIDATE');
  expect(r.doubleCompressionProven).toBe(false);
  const top = r.candidateHypotheses[0];
  expect(Math.abs(top.previousStandardLumaQualityHypothesis - quality)).toBeLessThanOrEqual(1);
  expect(top.detectionBasis).toMatch(/broad-lattice-enrichment/);
  expect(top.broadSupportFrequencies).toBeGreaterThanOrEqual(8);
});
test.each(['double-95-50.jpg', 'double-75-75.jpg', 'shifted-double85-95.jpg'])(
  'documented genuine-double miss stays inconclusive %s',
  (name) => {
    const r = inspect(name);
    expect(r.state).toBe('NO_SUPPORTED_LATTICE_CANDIDATE');
    expect(r.doubleCompressionProven).toBe(false);
    expect(r.limits).toMatch(/does not mean single compression/);
  },
);
/* Independent photographic evaluation (ELA demo photo, a different source
   than the seeded synthetic texture): genuine doubles stay undetected because
   only 3 of 12 examined frequencies clear the sample/histogram floors on this
   small smooth image. Recorded as a documented miss, never called single. */
test.each([
  'photo-double-50-95.jpg',
  'photo-double-65-95.jpg',
  'photo-single-50.jpg',
  'photo-single-95.jpg',
])('independent photographic fixture %s yields no lattice candidate', (name) => {
  const r = D.analyze(
    decode(
      fs.readFileSync(
        path.join(__dirname, '../public/samples/image/double-jpeg-independent', name),
      ),
    ),
  );
  expect(r.state).toBe('NO_SUPPORTED_LATTICE_CANDIDATE');
  expect(r.doubleCompressionProven).toBe(false);
});
test('current quantization table and original AC histogram measurements are exposed', () => {
  const r = inspect('double-85-95.jpg');
  expect(r.width).toBe(640);
  expect(r.lumaQuantizationTable.slice(0, 8)).toEqual([2, 1, 1, 2, 2, 4, 5, 6]);
  expect(r.examinedFrequencies).toHaveLength(12);
  expect(r.examinedFrequencies[0].sampleCount).toBeGreaterThan(150);
});
test('invalid, truncated and oversized fail closed', () => {
  expect(() => decode(new Uint8Array([0, 1, 2]))).toThrow();
  const bytes = fs.readFileSync(path.join(dir, 'double-85-95.jpg'));
  expect(() => decode(bytes.subarray(0, Math.floor(bytes.length / 2)))).toThrow();
  expect(() => decode(new Uint8Array(20 * 1024 * 1024 + 1))).toThrow();
});

test('oversized JPEG dimensions fail before coefficient block allocation', () => {
  const bytes = Buffer.from(fs.readFileSync(path.join(dir, 'single-95.jpg')));
  const sof = bytes.indexOf(Buffer.from([255, 192]));
  expect(sof).toBeGreaterThan(0);
  bytes.writeUInt16BE(3000, sof + 5);
  bytes.writeUInt16BE(3000, sof + 7);
  expect(() => decode(bytes)).toThrow(/maxResolutionInMP/);
});
