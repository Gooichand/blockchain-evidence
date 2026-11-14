const fs = require('fs'),
  vm = require('vm'),
  path = require('path');
function engine(tags) {
  const window = { exifr: { parse: async () => tags } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/metadata-tools.js'), 'utf8'), {
    window,
  });
  return window.MetadataTools;
}
const file = (name = 'synthetic.jpg') => ({
  name,
  size: 3,
  arrayBuffer: async () => new ArrayBuffer(3),
});
test.each([
  { latitude: 91, longitude: 1 },
  { latitude: 0, longitude: 181 },
  { latitude: NaN, longitude: 0 },
  { latitude: '19', longitude: '73' },
  {},
  null,
])('invalid/missing GPS remains unknown, never guessed: %j', async (tags) => {
  expect((await engine(tags).analyze('gps', file())).embeddedCoordinates).toBeNull();
});
test('valid zero coordinates are not mistaken for missing, exact boundary coordinates remain claims', async () => {
  const a = await engine({ latitude: 0, longitude: 0 }).analyze('gps', file());
  expect(JSON.stringify(a.embeddedCoordinates)).toBe('{"latitude":0,"longitude":0}');
  expect(a.limit).toContain('not live GPS');
  const b = await engine({ latitude: -90, longitude: 180 }).analyze('gps', file());
  expect(JSON.stringify(b.embeddedCoordinates)).toBe('{"latitude":-90,"longitude":180}');
});
test('unrelated embedded strings are not invented physical-camera identity', async () => {
  const r = await engine({
    Make: 'Synthetic claim',
    Model: 'Model',
    Untrusted: '<script>alert(1)</script>',
  }).analyze('camera-info', file());
  expect(JSON.stringify(r.camera)).toBe('{"Make":"Synthetic claim","Model":"Model"}');
  expect(r.limit).toContain('No physical camera identity');
});
test.each(['synthetic.exe', 'synthetic.doc', 'synthetic.tiff'])(
  'unsupported image input rejected: %s',
  async (name) => {
    await expect(engine({}).analyze('exif', file(name))).rejects.toThrow('JPEG/PNG');
  },
);
test('metadata size bound rejects before parser and no fallback data is invented', async () => {
  await expect(
    engine({}).analyze('exif', { ...file(), size: 15 * 1024 * 1024 + 1 }),
  ).rejects.toThrow('15 MiB');
});
