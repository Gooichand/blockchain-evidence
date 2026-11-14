const { cameraFields, guides } = require('../public/metadata-tools');
test('camera projection includes only grounded embedded fields', () => {
  expect(cameraFields({ Make: 'demo', Model: 'camera', Other: 'ignored' })).toEqual({
    Make: 'demo',
    Model: 'camera',
  });
  expect(cameraFields({})).toEqual({});
});
test('metadata guides preserve scope and editable-field caveats', () => {
  expect(Object.keys(guides)).toHaveLength(5);
  expect(guides.gps[1]).toContain('not live location');
  expect(guides['office-metadata'][1]).toContain('legacy DOC/XLS/PPT OLE2 summary streams');
});

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const exifr = require('../public/vendor/exifr-7.1.3.umd.js');
function realEngine() {
  const window = { exifr };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/metadata-tools.js'), 'utf8'), {
    window,
    Uint8Array,
    ArrayBuffer,
    Set,
    console,
  });
  return window.MetadataTools;
}
function realFile(name) {
  const buf = fs.readFileSync(path.join(__dirname, '../public/samples/metadata', name));
  return {
    name,
    size: buf.length,
    arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length),
  };
}
test('full-segment JPEG: every embedded segment family is found and extended XMP merges', async () => {
  const r = await realEngine().analyze('exif', realFile('extended-segments.jpg'));
  expect(r.embeddedTags.Make).toBe('DGC Synthetic');
  expect(r.embeddedTags.Model).toBe('ExtendedSegments Demo');
  expect(r.embeddedTags.description.value).toContain('second APP1 segment');
  expect(r.embeddedTags.ObjectName).toBe('Synthetic IPTC object name');
  expect(r.embeddedTags.ProfileDescription).toBe('sRGB built-in');
  expect(r.segments['TIFF/EXIF IFD0']).toBe('found');
  expect(r.segments['GPS']).toBe('found');
  expect(r.segments['XMP']).toBe('found (base + extended APP1 segments merged)');
  expect(r.segments['IPTC IIM']).toBe('found');
  expect(r.segments['ICC profile']).toBe('found (1 of 1 chunks)');
  expect(r.segments['Interoperability']).toBe('absent');
  expect(r.makerNote).toMatchObject({ present: true, byteLength: 70, decoded: false });
  expect(String(r.embeddedTags.makerNote)).toContain('not rendered');
  expect(r.userComment).toBe('DGC synthetic extended-segment fixture');
  expect(r.limit).toContain('not verified capture history');
});
test('full-segment PNG: eXIf, iCCP and iTXt XMP surface with an honest segment map', async () => {
  const r = await realEngine().analyze('exif', realFile('extended-segments.png'));
  expect(r.embeddedTags.Make).toBe('DGC Synthetic');
  expect(r.segments['PNG IHDR']).toBe('found');
  expect(r.segments['JFIF']).toBe('absent');
  expect(r.segments['XMP']).toBe('found');
  expect(r.segments['ICC profile']).toBe('found (1 of 1 chunks)');
});
test('truncated ICC fixture is reported incomplete, never as a whole profile', async () => {
  const r = await realEngine().analyze('exif', realFile('truncated-icc.jpg'));
  expect(r.segments['ICC profile']).toContain('INCOMPLETE');
  expect(r.segments['ICC profile']).toContain('1 of 2');
});
