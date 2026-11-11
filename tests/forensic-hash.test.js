const fs = require('fs');
const vm = require('vm');
const { webcrypto, createHash } = require('crypto');
const { Blob } = require('buffer');

const window = {};
vm.runInNewContext(fs.readFileSync(require('path').join(__dirname, '../public/vendor/spark-md5-3.0.2.min.js'), 'utf8'), { window });
vm.runInNewContext(fs.readFileSync(require('path').join(__dirname, '../public/forensic-lab.js'), 'utf8'), {
  window, crypto: webcrypto,
});
const run = (id, file, options) => window.ForensicLab.services.HashToolService.run({ id, name: id }, file, options);
const file = (bytes, name = 'sample.txt') => Object.assign(new Blob([bytes]), { name });
const hash = (bytes, algorithm = 'sha256') => createHash(algorithm).update(bytes).digest('hex');

describe('Hash & Integrity local services', () => {
  test.each(['', 'abc', 'hello\n', '你好', '\0\xff'])('SHA-256 matches independent digest for %p', async text => {
    expect((await run('sha256', file(text))).digests['SHA-256']).toBe(hash(text));
  });
  test('binary and multi-block input', async () => {
    const bytes = Buffer.from(Array.from({ length: 100001 }, (_, i) => i % 256));
    expect((await run('sha256', file(bytes))).digests['SHA-256']).toBe(hash(bytes));
  });
  test('multi hash returns all four SHA digests plus MD5', async () => {
    const result = await run('multi-hash', file('abc'));
    for (const algorithm of ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']) {
      expect(result.digests[algorithm]).toBe(hash('abc', algorithm.toLowerCase().replace('-', '')));
    }
    expect(result.digests.MD5).toBe(hash('abc', 'md5'));
    expect(result.note).toContain('forensic compatibility');
  });
  test.each(['', 'a', 'abc', 'message digest', 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', '1234567890'.repeat(8)])('MD5 known-vector input %p matches Node crypto', async text => {
    expect((await run('multi-hash', file(text))).digests.MD5).toBe(hash(text, 'md5'));
  });
  test('MD5 binary and multi-block data match Node crypto', async () => {
    const bytes = Buffer.from(Array.from({ length: 100001 }, (_, i) => i % 256));
    expect((await run('multi-hash', file(bytes))).digests.MD5).toBe(hash(bytes, 'md5'));
  });
  test('missing MD5 library fails explicitly, never gives a partial success', async () => {
    const library = window.SparkMD5;
    window.SparkMD5 = null;
    try { await expect(run('multi-hash', file('abc'))).rejects.toThrow('MD5 engine unavailable'); }
    finally { window.SparkMD5 = library; }
  });
  test('comparison normalizes case and outer whitespace', async () => {
    expect((await run('hash-compare', null, { left: ' ' + hash('abc').toUpperCase(), right: hash('abc') + '\n' })).match).toBe(true);
  });
  test('comparison reports mismatch', async () => {
    expect((await run('hash-compare', null, { left: hash('abc'), right: hash('abcd') })).match).toBe(false);
  });
  test.each([['', ''], ['not a hash', hash('abc')], ['g'.repeat(64), '0'.repeat(64)], ['a'.repeat(63), 'a'.repeat(63)], ['<script>', '<script>']])('rejects invalid comparison %p', async (left, right) => {
    await expect(run('hash-compare', null, { left, right })).rejects.toThrow();
  });
  test('rejects hashes of different algorithms', async () => {
    await expect(run('hash-compare', null, { left: hash('abc'), right: hash('abc', 'sha1') })).rejects.toThrow('same algorithm');
  });
  test('integrity match is against a supplied baseline', async () => {
    const result = await run('integrity-check', file('abc'), { expected: hash('abc') });
    expect(result.match).toBe(true);
    expect(result.expected).toBe(hash('abc'));
  });
  test('changed bytes fail integrity comparison', async () => {
    expect((await run('integrity-check', file('abcd'), { expected: hash('abc') })).match).toBe(false);
  });
  test('invalid baseline rejected before file read', async () => {
    const unreadable = { size: 1, arrayBuffer: () => { throw new Error('should not read'); } };
    await expect(run('integrity-check', unreadable, { expected: 'x' })).rejects.toThrow('64-character');
  });
  test('missing evidence and oversized files are rejected', async () => {
    await expect(run('sha256')).rejects.toThrow('Select');
    await expect(run('sha256', { size: 50 * 1024 * 1024 + 1 })).rejects.toThrow('50 MiB');
  });
  test('file-read errors propagate, never converted into success', async () => {
    await expect(run('sha256', { size: 1, arrayBuffer: async () => { throw new Error('Read failed'); } })).rejects.toThrow('Read failed');
  });
  test('blockchain verification requires evidence', async () => {
    await expect(run('blockchain-verify')).rejects.toThrow('Select');
  });
});
