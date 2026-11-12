const fs = require('fs');
const { X509Certificate } = require('node:crypto');
const { EventEmitter } = require('node:events');
const s = require('../services/publicTLSService');
test('hostnames only, all DNS addresses public and same validated IP pinned', async () => {
  for (const host of [
    '127.0.0.1',
    '8.8.8.8',
    'https://example.com',
    'example.com:443',
    'example.com/',
    'local.invalid',
  ])
    expect(() => s.domain(host)).toThrow();
  expect(s.domain('EXAMPLE.COM.')).toBe('example.com');
  for (const address of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '::1', '::ffff:8.8.8.8'])
    await expect(
      s.resolvePublic('example.com', async () => [
        { address: '8.8.8.8', family: 4 },
        { address, family: 4 },
      ]),
    ).rejects.toThrow();
  expect(
    (await s.resolvePublic('example.com', async () => [{ address: '8.8.8.8', family: 4 }])).address,
  ).toBe('8.8.8.8');
});
function fakeConnection(options) {
  const socket = new EventEmitter();
  socket.destroy = jest.fn();
  socket.getProtocol = () => options.maxVersion;
  socket.getCipher = () => ({ name: 'TEST_CIPHER' });
  socket.alpnProtocol = 'h2';
  socket.getEphemeralKeyInfo = () => ({});
  socket.isSessionReused = () => false;
  socket.authorized = false;
  socket.authorizationError = 'DEPTH_ZERO_SELF_SIGNED_CERT';
  const x = new X509Certificate(fs.readFileSync('public/samples/crypto/demo-cert.pem'));
  const cert = { ...x.toLegacyObject(), raw: x.raw };
  cert.issuerCertificate = cert;
  socket.getPeerCertificate = () => cert;
  process.nextTick(() => socket.emit('secureConnect'));
  return socket;
}
test('invalid chain and hostname are reported as invalid, never upgraded to trusted', async () => {
  const connect = jest.fn(fakeConnection);
  const r = await s.inspect('example.com', {
    lookup: async () => [{ address: '8.8.8.8', family: 4 }],
    connect,
  });
  expect(connect).toHaveBeenCalledTimes(3);
  for (const [options] of connect.mock.calls) {
    expect(options.host).toBe('8.8.8.8');
    expect(options.port).toBe(443);
    expect(options.servername).toBe('example.com');
  }
  expect(r.negotiated.nodeDefaultTrustAuthorized).toBe(false);
  expect(r.negotiated.hostnameMatches).toBe(false);
  expect(r.negotiated.authorizationError).toBe('DEPTH_ZERO_SELF_SIGNED_CERT');
  expect(r.negotiated.certificateChain[0].fingerprint256).toBeTruthy();
});
test('network errors are explicit, not proof that protocol is disabled', async () => {
  const r = await s.handshake('example.com', { address: '8.8.8.8', family: 4 }, {}, () => {
    const socket = new EventEmitter();
    socket.destroy = () => {};
    process.nextTick(() => socket.emit('error', { code: 'ECONNRESET' }));
    return socket;
  });
  expect(r).toEqual({ state: 'UNAVAILABLE', code: 'ECONNRESET' });
});
test('public TLS client sends same-origin request only', async () => {
  const original = global.fetch;
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ host: 'example.com' }) }));
  try {
    await require('../public/public-tls').inspect('example.com');
    expect(global.fetch.mock.calls[0][0]).toBe('/api/network/tls?host=example.com');
  } finally {
    global.fetch = original;
  }
});
