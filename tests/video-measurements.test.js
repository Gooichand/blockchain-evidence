const { pixels, difference, analyze } = require('../public/video-measurements');
function color(r, g, b) {
  return pixels(
    Uint8ClampedArray.from({ length: 32 * 18 * 4 }, (_, i) =>
      i % 4 === 3 ? 255 : [r, g, b][i % 4],
    ),
  );
}
function fixture() {
  const samples = Array.from({ length: 100 }, (_, i) => ({
    cts: i * 100,
    dts: i * 100,
    duration: 100,
    timescale: 1000,
    size: 100 + i,
    is_sync: [0, 10, 20, 70, 80, 90].includes(i),
  }));
  const frames = samples.map((s, i) => ({
    seconds: s.cts / 1000,
    duration: 0.1,
    sampleNumber: i + 1,
    isSync: s.is_sync,
    measure: i < 30 ? color(255, 0, 0) : i < 60 ? color(0, 0, 0) : color(0, 0, 255),
  }));
  return { samples, frames };
}
test('pixel and histogram differences reflect actual measured colors', () => {
  expect(difference(color(255, 0, 0), color(255, 0, 0)).meanAbsoluteRGBDifference).toBe(0);
  expect(difference(color(255, 0, 0), color(0, 0, 255)).meanAbsoluteRGBDifference).toBeCloseTo(
    2 / 3,
  );
  expect(color(0, 0, 0).blackFraction).toBe(1);
});
test('all-frame GOP groups and deterministic timing/visual/black/low-change candidates', () => {
  const { samples, frames } = fixture(),
    r = analyze(frames, samples);
  expect(r.decodedFrameCount).toBe(100);
  expect(r.groups).toHaveLength(6);
  expect(r.groups[2].flags).toContain('UNUSUAL_GOP_SAMPLE_COUNT');
  expect(
    r.events.filter((e) => e.kind === 'ABRUPT_VISUAL_CHANGE_CANDIDATE').map((e) => e.frameIndex),
  ).toEqual([30, 60]);
  expect(r.events.find((e) => e.kind === 'NEAR_BLACK_INTERVAL').durationSeconds).toBeCloseTo(3);
  expect(r.events.some((e) => e.kind === 'LOW_CHANGE_INTERVAL')).toBe(true);
  expect(r.scenes).toHaveLength(3);
});
test('B-frame output order is sorted by presentation and missing/duplicate outputs fail', () => {
  const { samples, frames } = fixture();
  expect(analyze([...frames].reverse(), samples).frames[0].sampleNumber).toBe(1);
  expect(() => analyze(frames.slice(1), samples)).toThrow('All expected');
  expect(() => analyze([frames[0], frames[0]], samples.slice(0, 2))).toThrow('duplicate');
  const r = analyze(frames, samples, 1);
  expect(r.frames[0].seconds).toBe(1);
});
