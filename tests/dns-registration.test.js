const s = require('../services/dnsRegistrationService');
const fakeResolver = {
  resolve: jest.fn(async (_d, type) =>
    type === 'A' ? ['93.184.215.14'] : Promise.reject(Object.assign(Error(), { code: 'ENODATA' })),
  ),
  reverse: jest.fn(async () => ['dns.google']),
};
const fakeClient = {
  get: jest.fn(async () => ({
    status: 200,
    data: { objectClassName: 'domain', ldhName: 'example.com', status: ['active'] },
  })),
};
afterEach(() => jest.clearAllMocks());
test('normalize IDN and trailing dot; rejects URLs, private/special/mapped queries and injected paths', () => {
  expect(s.normalize('BÜCHER.de.').value).toBe('xn--bcher-kva.de');
  for (const x of [
    'localhost',
    'file:///etc/passwd',
    'http://example.com',
    'example.com/',
    'example.com?x=y',
    'foo..com',
    'test.local',
    'x.invalid',
    '127.0.0.1',
    '127.1',
    '0x7f.1',
    '0177.0.0.1',
    '10.0.0.1',
    '169.254.169.254',
    '192.0.2.1',
    '::1',
    '::ffff:8.8.8.8',
    '2001:db8::1',
    'fe80::1',
    'fc00::1',
    '0.1.2.3',
    '224.1.1.1',
    ' example.com',
  ])
    expect(() => s.normalize(x)).toThrow();
  expect(s.normalize('8.8.8.8').family).toBe(4);
  expect(s.normalize('2001:4860:4860::8888').family).toBe(6);
});
test('RDAP endpoint comes only from bundled IANA bootstrap', () => {
  expect(s.endpoint('example.com')).toBe('https://rdap.verisign.com/com/v1/domain/example.com');
  expect(s.endpoint('example.not-a-tld')).toBeNull();
});
test('public DNS includes individual explicit errors and matching registry record', async () => {
  const r = await s.lookup('example.com', { resolver: fakeResolver, client: fakeClient });
  expect(r.records.A.data).toEqual(['93.184.215.14']);
  expect(r.records.TXT.code).toBe('ENODATA');
  expect(r.registration.state).toBe('FOUND');
  expect(fakeClient.get).toHaveBeenCalledWith(
    'https://rdap.verisign.com/com/v1/domain/example.com',
    expect.objectContaining({ maxRedirects: 0, timeout: 7000, maxContentLength: 1048576 }),
  );
});
test('reverse does not request registry or target host', async () => {
  const r = await s.lookup('8.8.8.8', { resolver: fakeResolver, client: fakeClient });
  expect(r.reverse.names).toEqual(['dns.google']);
  expect(fakeClient.get).not.toHaveBeenCalled();
  expect(fakeResolver.resolve).not.toHaveBeenCalled();
});
test('mismatched RDAP object, redirect/throttle and unknown registry do not become successes', async () => {
  expect(
    (
      await s.rdap('example.com', {
        get: async () => ({
          status: 200,
          data: { objectClassName: 'domain', ldhName: 'evil.com' },
        }),
      })
    ).state,
  ).toBe('UNEXPECTED_REGISTRATION_OBJECT');
  for (const status of [301, 429, 503])
    expect(
      (
        await s.rdap('example.com', {
          get: async () => {
            throw { response: { status } };
          },
        })
      ).state,
    ).toBe('UNAVAILABLE');
  expect((await s.rdap('x.not-a-tld', fakeClient)).state).toBe('NO_HTTPS_BOOTSTRAP_SERVICE');
});
test('client uses same-origin session headers and text errors', async () => {
  const api = require('../public/public-dns');
  global.apiClient = { getAuthHeaders: () => ({ Authorization: 'Bearer local-only-test' }) };
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({ query: { value: 'example.com' } }),
  }));
  try {
    await api.analyze('example.com');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/network/dns?query=example.com',
      expect.objectContaining({
        credentials: 'same-origin',
        headers: { Authorization: 'Bearer local-only-test' },
      }),
    );
  } finally {
    delete global.fetch;
    delete global.apiClient;
  }
});
