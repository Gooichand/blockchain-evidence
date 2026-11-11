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
  expect(guides['office-metadata'][1]).toContain('legacy DOC/XLS/PPT are unsupported');
});
