const fs = require('fs');
const path = require('path');
const { boxList, guides, framePlan } = require('../public/video-forensics');
const fixture = fs.readFileSync(path.join(__dirname, '../public/samples/video/demo.mp4'));
const buffer = fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.byteLength);
test('MP4 fixture boundaries cover exact bytes with ftyp moov mdat boxes', () => {
  const boxes = boxList(buffer);
  expect(boxes.map((b) => b.type)).toEqual(expect.arrayContaining(['ftyp', 'moov', 'mdat']));
  expect(boxes.reduce((n, b) => n + b.size, 0)).toBe(fixture.length);
});
test('truncated and oversized box lengths fail closed', () => {
  expect(() => boxList(new Uint8Array([0, 0, 0]).buffer)).toThrow('Truncated');
  expect(() => boxList(new Uint8Array([0, 0, 1, 0, 102, 116, 121, 112]).buffer)).toThrow('Invalid');
});
test('all five tools state limits instead of authenticity verdicts', () => {
  expect(Object.keys(guides)).toHaveLength(5);
  expect(guides.keyframe[1]).toContain('not scene changes');
  expect(guides['frame-extract'][1]).toContain('exact decoded MP4/H.264');
  expect(guides['video-inspector'][1]).toContain('does not prove the file is complete, safe or authentic');
  expect(guides['video-inspector'][1]).toContain('NOT VALIDATED');
});

describe('exact MP4 presentation planning', () => {
  const info = { timescale: 1000, duration: 3000, videoTracks: [{ id: 1 }] };
  const track = { codec: 'avc1.640015', timescale: 1000 };
  // Decode order differs from presentation order, as with B-frames.
  const samples = [0, 2000, 1000].map((cts, i) => ({
    cts,
    dts: i * 1000,
    timescale: 1000,
    duration: 1000,
    is_sync: i === 0,
  }));
  test('frame index uses presentation order, not decode/sample order', () => {
    const p = framePlan(info, track, samples, 0, 1);
    expect(p.target.decodeIndex).toBe(2);
    expect(p.target.seconds).toBe(1);
    expect(p.start).toBe(0);
    expect(p.totalFrames).toBe(3);
  });
  test('time chooses covering sample exactly; rejects out-of-range index/time', () => {
    expect(framePlan(info, track, samples, 1.5, null).target.decodeIndex).toBe(2);
    expect(() => framePlan(info, track, samples, 3, null)).toThrow('within');
    expect(() => framePlan(info, track, samples, 0, 3)).toThrow('index');
    expect(() => framePlan(info, track, samples, 0, 0.2)).toThrow('index');
  });
  test('rate-1 media edit removes pre-roll and leading empty time is not fabricated', () => {
    const edited = {
      ...track,
      edits: [
        { media_time: -1, segment_duration: 1000, media_rate_integer: 1, media_rate_fraction: 0 },
        { media_time: 1000, segment_duration: 1000, media_rate_integer: 1, media_rate_fraction: 0 },
      ],
    };
    const p = framePlan(info, edited, samples, 1.5, null);
    expect(p.target.seconds).toBe(1);
    expect(p.totalFrames).toBe(1);
    expect(() => framePlan(info, edited, samples, 0.5, null)).toThrow('no displayed');
  });
  test('ambiguous timestamps, codecs, multiple tracks and unusual edits fail closed', () => {
    expect(() => framePlan(info, track, [samples[0], samples[0]], 0, 0)).toThrow('ambiguous');
    expect(() => framePlan(info, { ...track, codec: 'hev1' }, samples, 0, 0)).toThrow('H.264');
    expect(() => framePlan({ ...info, videoTracks: [{}, {}] }, track, samples, 0, 0)).toThrow(
      'one',
    );
    expect(() =>
      framePlan(
        info,
        { ...track, edits: [{ media_time: 0, media_rate_integer: 2 }] },
        samples,
        0,
        0,
      ),
    ).toThrow('edit');
  });
});
