#!/usr/bin/env node
/* Regenerate docs/forensic-lab/vendor-checksums.json over public/vendor. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.resolve(__dirname, '..');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const name = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(name) : [name];
  });
}
const files = walk(path.join(root, 'public/vendor'))
  .map((file) => {
    const bytes = fs.readFileSync(file);
    return {
      path: path.relative(root, file).split(path.sep).join('/'),
      bytes: bytes.length,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    };
  })
  .sort((a, b) => a.path.localeCompare(b.path));
const manifest = {
  description:
    'Integrity manifest of vendored assets, not an authenticity or vulnerability guarantee.',
  files,
};
fs.writeFileSync(
  path.join(root, 'docs/forensic-lab/vendor-checksums.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(files.length + ' vendored assets hashed');
