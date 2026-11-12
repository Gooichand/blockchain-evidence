const fs = require('fs');
const { find } = require('../public/copy-move-features');
let cv;
beforeAll((done) => {
  cv = require('../public/vendor/opencv');
  if (cv.Mat) done();
  else cv.onRuntimeInitialized = () => done();
}, 20000);
function picture(copy) {
  const width = 400,
    height = 300,
    pixels = new Uint8Array(width * height * 4);
  let seed = 1;
  for (let i = 0; i < pixels.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = seed >>> 24;
    pixels[i + 3] = 255;
  }
  if (copy)
    for (let y = 0; y < 110; y++)
      for (let x = 0; x < 110; x++)
        for (let c = 0; c < 4; c++)
          pixels[((y + 155) * width + x + 250) * 4 + c] =
            pixels[((y + 40) * width + x + 40) * 4 + c];
  return { pixels, width, height };
}
test('actual OpenCV ORB and geometric RANSAC find an off-grid copied region', () => {
  const p = picture(true),
    r = find(cv, p.pixels, p.width, p.height);
  expect(r.state).toBe('CANDIDATE_REPEATED_REGIONS');
  expect(r.models[0].inlierCount).toBeGreaterThanOrEqual(8);
  expect(r.models[0].homography).toHaveLength(9);
}, 20000);
test('unique source and blank image do not become clone verdicts', () => {
  const p = picture(false);
  expect(find(cv, p.pixels, p.width, p.height).models).toHaveLength(0);
  expect(find(cv, new Uint8Array(128 * 128 * 4), 128, 128).state).toBe('INSUFFICIENT_FEATURES');
}, 20000);
test('unsupported dimensions fail and bundled bindings do not execute generated strings', () => {
  expect(() => find(cv, new Uint8Array(4), 1, 1)).toThrow();
  const source = fs.readFileSync('public/vendor/opencv.js', 'utf8');
  expect(source).not.toMatch(/new Function\(|new_\(Function,|\beval\(/);
});
