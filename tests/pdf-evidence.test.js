const { webcrypto } = require('crypto');
global.crypto = webcrypto;
const fs = require('fs'),
  vm = require('vm'),
  P = require('pdf-lib'),
  E = require('../public/pdf-evidence');
const ctx = { crypto: webcrypto, TextEncoder, TextDecoder, ArrayBuffer, Uint8Array, atob, btoa };
vm.runInNewContext(fs.readFileSync('public/vendor/cms-bundle.js', 'utf8'), ctx);
const fixture = (n) =>
  new Uint8Array(fs.readFileSync('public/samples/document/signatures/' + n + '.pdf'));
const check = (b) => E.signatures(b, P, ctx.LocalCMS);
test('three actual linked preserved revisions produce before/after metadata snapshots', async () => {
  const r = await E.history(fixture('two-updates'), P);
  expect(r.preservedRevisionCount).toBe(3);
  expect(r.revisions.map((x) => x.properties['/Title'])).toEqual([
    'Initial signed revision',
    'Later appended unsigned revision',
    'Third preserved revision',
  ]);
  expect(r.revisions[1].changedProperties.find((x) => x.name === '/Title')).toEqual({
    name: '/Title',
    before: 'Initial signed revision',
    after: 'Later appended unsigned revision',
  });
  expect(r.revisions.every((x) => /^[a-f0-9]{64}$/.test(x.sha256))).toBe(true);
  expect(r.limit).toContain('editable');
});
test('xref-stream PDF is parsed as real stream, not fake regex markers', async () => {
  const r = await E.history(
    new Uint8Array(fs.readFileSync('public/samples/document/objects.pdf')),
    P,
  );
  expect(r.preservedRevisionCount).toBe(1);
  expect(r.revisions[0].crossReferenceKind).toBe('stream');
});
test('real detached CMS signature verifies bytes but never claims certificate trust', async () => {
  const r = await check(fixture('valid'));
  expect(r.signatures[0]).toMatchObject({
    cryptographicSignature: 'VALID FOR SIGNED BYTE RANGES',
    coversCurrentFile: true,
    certificateTrust: 'NOT CHECKED',
    revocation: 'NOT CHECKED',
    trustedTimestamp: 'NOT CHECKED',
  });
});
test('changed signed bytes fail the actual CMS digest check', async () => {
  const r = await check(fixture('tampered'));
  expect(r.signatures[0].cryptographicSignature).toBe('INVALID');
});
test('old signature remains valid only for its revision after unsigned append', async () => {
  const r = await check(fixture('later-update'));
  expect(r.signatures[0]).toMatchObject({
    cryptographicSignature: 'VALID FOR SIGNED BYTE RANGES',
    coversCurrentFile: false,
    signedRevision: 1,
  });
  expect(r.signatures[0].bytesAppendedAfterSigning).toBeGreaterThan(0);
});
test('malformed byte ranges, arbitrary exclusions and unsupported subfilters never pass', async () => {
  for (const [from, to] of [
    ['/adbe.pkcs7.detached', '/adbe.pkcs7.sha1    '],
    ['[0 1387', '[1 1387'],
  ]) {
    const input = Buffer.from(fixture('valid')),
      where = input.indexOf(from);
    expect(where).toBeGreaterThan(0);
    input.write(to, where, 'ascii');
    expect((await check(new Uint8Array(input))).signatures[0].cryptographicSignature).toBe(
      'UNVERIFIED',
    );
  }
  const input = Buffer.from(fixture('valid'));
  input[1387] = 40; // Replace excluded hex delimiter with literal string delimiter.
  await expect(check(new Uint8Array(input))).rejects.toThrow();
});
test('bad Prev offsets, broken xref and trailing nonwhitespace are rejected, not fake history', () => {
  const original = Buffer.from(fixture('later-update'));
  const body = original.toString('latin1');
  const prev = body.lastIndexOf('/Prev ');
  const bad = Buffer.from(original);
  bad.write('999999', prev + 6, 'ascii');
  expect(() => E.revisionChain(new Uint8Array(bad), P)).toThrow();
  expect(() =>
    E.revisionChain(new Uint8Array(Buffer.concat([original, Buffer.from('garbage')])), P),
  ).toThrow('trailing');
  const broken = Buffer.from(fixture('valid'));
  const xref = E.revisionChain(new Uint8Array(broken), P)[0].offset;
  broken[xref] = 88;
  expect(() => E.revisionChain(new Uint8Array(broken), P)).toThrow();
});
test('unsigned PDF is reported as no signature dictionaries, never a verified unsigned verdict', async () => {
  const r = await check(new Uint8Array(fs.readFileSync('public/samples/document/demo.pdf')));
  expect(r.signatureCount).toBe(0);
  expect(r.cryptographicVerification).toBe('NO SIGNATURE DICTIONARIES FOUND');
});
