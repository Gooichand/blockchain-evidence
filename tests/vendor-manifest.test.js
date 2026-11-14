const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const name = path.join(dir, entry.name);
    return entry.isDirectory() ? files(name) : [name.split(path.sep).join('/')];
  });
}
test('vendor integrity manifest covers every recursive asset and exact bytes', () => {
  const manifest = JSON.parse(fs.readFileSync('docs/forensic-lab/vendor-checksums.json'));
  const actual = files('public/vendor').sort();
  expect(manifest.files.map((entry) => entry.path).sort()).toEqual(actual);
  expect(new Set(manifest.files.map((entry) => entry.path)).size).toBe(actual.length);
  for (const entry of manifest.files) {
    const bytes = fs.readFileSync(entry.path);
    expect(bytes.length).toBe(entry.bytes);
    expect(crypto.createHash('sha256').update(bytes).digest('hex')).toBe(entry.sha256);
  }
});
