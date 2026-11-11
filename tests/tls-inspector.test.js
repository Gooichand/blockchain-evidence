const T = require('../public/tls-inspector');
const fixture = require('../public/samples/network/tls-hello.json');
const bytes = (hex) => Uint8Array.from(Buffer.from(hex, 'hex'));
test('original Hello records decode offered versus selected versions, cipher names, SNI and ALPN', () => {
  const c = T.helloRecord(bytes(fixture.recordsHex[0])),
    s = T.helloRecord(bytes(fixture.recordsHex[1]));
  expect(c.supportedVersions).toEqual(['TLS1.3', 'TLS1.2']);
  expect(c.serverNames).toEqual(['demo.example']);
  expect(c.alpn).toEqual(['h2']);
  expect(c.cipherSuites[0].name).toBe('TLS_AES_128_GCM_SHA256');
  expect(s.selectedVersion).toBe('TLS1.3');
  expect(s.supportedVersions).toBeUndefined();
  expect(c.limit).toContain('not a live');
});
test('TLS truncation, record boundaries and handshake fragmentation reject rather than fabricate', () => {
  const b = bytes(fixture.recordsHex[0]);
  for (const n of [0, 4, 10, b.length - 1]) expect(() => T.helloRecord(b.slice(0, n))).toThrow();
  const changed = b.slice();
  changed[0] = 23;
  expect(() => T.helloRecord(changed)).toThrow('handshake');
  const bad = b.slice();
  bad[6] = 255;
  expect(() => T.helloRecord(bad)).toThrow('complete ClientHello');
});
test('TLS JSON rejects excessive record counts, malformed hex and invalid SNI lengths', async () => {
  await expect(T.inspect(JSON.stringify({ recordsHex: [] }))).rejects.toThrow('1-8');
  await expect(T.inspect(JSON.stringify({ recordsHex: ['no'] }))).rejects.toThrow('hexadecimal');
  const b = bytes(fixture.recordsHex[0]);
  b[61] = 255;
  expect(() => T.helloRecord(b)).toThrow();
});
