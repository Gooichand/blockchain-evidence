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
  'single-50.jpg',
  'single-65.jpg',
  'single-75.jpg',
  'single-85.jpg',
  'single-95.jpg',
  'single-progressive95.jpg',
  'flat95.jpg',
])('single compression negative %s', (name) => {
  expect(inspect(name).state).toBe('NO_SUPPORTED_LATTICE_CANDIDATE');
});
test.each([
  'double-50-95.jpg',
  'double-65-95.jpg',
  'double-95-50.jpg',
  'double-75-75.jpg',
  'shifted-double85-95.jpg',
])('documented genuine-double miss stays inconclusive %s', (name) => {
  const r = inspect(name);
  expect(r.state).toBe('NO_SUPPORTED_LATTICE_CANDIDATE');
  expect(r.doubleCompressionProven).toBe(false);
  expect(r.limits).toMatch(/does not mean single compression/);
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
