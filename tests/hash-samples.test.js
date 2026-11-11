const fs = require('fs');
const path = require('path');
const { createHash, webcrypto } = require('crypto');
const vm = require('vm');
const { Blob } = require('buffer');
const root = path.join(__dirname, '..');
const folder = path.join(root, 'samples');
const original = fs.readFileSync(path.join(folder, 'original.txt'));
const changed = fs.readFileSync(path.join(folder, 'changed.txt'));
const readme = fs.readFileSync(path.join(folder, 'README.md'), 'utf8');
const window = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'public/vendor/spark-md5-3.0.2.min.js'), 'utf8'), { window });
vm.runInNewContext(fs.readFileSync(path.join(root, 'public/forensic-lab.js'), 'utf8'), { window, crypto: webcrypto });
const run = (id, bytes, options) => window.ForensicLab.services.HashToolService.run({ id }, Object.assign(new Blob([bytes]), { name: 'demo.txt' }), options);
test('changed sample differs in exactly one byte and preserves size', () => {
  expect(original.length).toBe(97);
  expect(changed.length).toBe(original.length);
  expect([...original].filter((byte, i) => byte !== changed[i])).toHaveLength(1);
});
test.each(['original.txt', 'changed.txt'])('%s has five correct documented digests', name => {
  const bytes = fs.readFileSync(path.join(folder, name));
  const section = readme.split('### ' + name)[1].split('```')[1];
  for (const algorithm of ['md5', 'sha1', 'sha256', 'sha384', 'sha512']) {
    expect(section).toContain(algorithm.toUpperCase() + ': ' + createHash(algorithm).update(bytes).digest('hex'));
  }
});
test('sample workflows match generator and integrity results', async () => {
  const result = await run('multi-hash', original);
  for (const [label, digest] of Object.entries(result.digests)) {
    expect(digest).toBe(createHash(label.toLowerCase().replace('-', '')).update(original).digest('hex'));
  }
  const expected = result.digests['SHA-256'];
  expect((await run('integrity-check', original, { expected })).match).toBe(true);
  expect((await run('integrity-check', changed, { expected })).match).toBe(false);
});
test('sample files opt out of automatic newline conversion', () => {
  expect(fs.readFileSync(path.join(folder, '.gitattributes'), 'utf8')).toBe('original.txt -text\nchanged.txt -text\n');
});
test('demo covers all tools and never promises a fabricated anchor', () => {
  for (const name of ['SHA-256 Generator', 'Hash Comparison', 'Multi Hash Generator', 'File Integrity Checker', 'Blockchain Verification']) expect(readme).toContain(name);
  expect(readme).toContain('There is no guaranteed anchored sample');
  expect(readme).toContain('No sample was anchored');
});
