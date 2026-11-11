const fs = require('fs');
const path = require('path');
const { histogram, spatial, repeatedBlocks, jpegTables } = require('../public/image-forensics');
test('RGB histogram counts each pixel exactly', () => {
  const result = histogram(new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 1, 255]));
  expect(result[0][255]).toBe(1);
  expect(result[1][255]).toBe(1);
  expect(result[2][1]).toBe(1);
  for (const bins of result) expect(bins.reduce((a, b) => a + b, 0)).toBe(2);
});
test('uniform image has zero interior residual and edges', () => {
  const data = new Uint8ClampedArray(10 * 10 * 4).fill(128);
  expect(spatial(data, 10, 10, false).stddev).toBe(0);
  expect(spatial(data, 10, 10, true).pixels.every((x, i) => i % 4 === 3 || x === 0)).toBe(true);
});
test('nonuniform identical tiles are detected; flat tiles ignored', () => {
  const data = new Uint8ClampedArray(32 * 16 * 4);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 32; x++)
      for (let c = 0; c < 3; c++) data[(y * 32 + x) * 4 + c] = (x % 16) * 16;
  expect(repeatedBlocks(data, 32, 16)).toEqual([
    [
      [0, 0],
      [16, 0],
    ],
  ]);
  expect(repeatedBlocks(new Uint8ClampedArray(32 * 16 * 4), 32, 16)).toHaveLength(0);
});
test('JPEG tables parse real fixture and reject malformed input', () => {
  const file = fs.readFileSync(path.join(__dirname, '../public/samples/image/original.jpg'));
  const tables = jpegTables(file);
  expect(tables.length).toBeGreaterThan(0);
  expect(tables[0].values).toHaveLength(64);
  expect(() => jpegTables(Buffer.from('not jpeg'))).toThrow();
  expect(() => jpegTables(Buffer.from([255, 216, 255, 219, 0, 100]))).toThrow('Truncated');
});
