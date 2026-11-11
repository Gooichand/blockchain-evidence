const fs = require('fs');
const path = require('path');
const { boxList, guides } = require('../public/video-forensics');
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
  expect(guides['frame-extract'][1]).toContain('not a frame-exact');
  expect(guides['video-inspector'][1]).toContain('does not validate every frame');
});
