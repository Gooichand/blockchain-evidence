global.TimelineTools = require('../public/timeline-tools');
const U = require('../public/utility-tools');
test('UTF8 Base64 roundtrip and malformed encoding rejection', () => {
  expect(U.utf8Base64(U.utf8Base64('नमस्ते'), true)).toBe('नमस्ते');
  expect(() => U.utf8Base64('%%%bad', true)).toThrow();
});
test('hex preview preserves offsets and discloses truncation', () => {
  const r = U.hex(new Uint8Array(5000));
  expect(r.displayedBytes).toBe(4096);
  expect(r.truncated).toBe(true);
  expect(r.preview).toContain('00000010');
});
test('time units are explicit and offset is normalized', () => {
  const a = U.convertTime('2026-11-11T18:00:00+05:30', 'iso');
  expect(a.utc).toBe('2026-11-11T12:30:00.000Z');
  expect(U.convertTime(String(a.epochSeconds), 'seconds')).toEqual(a);
  expect(U.convertTime(String(a.epochMilliseconds), 'milliseconds')).toEqual(a);
});
test('URL component encoding keeps plus distinct and malformed escapes fail', async () => {
  expect(await U.analyze('url-encoder', 'a+b /', 'encode')).toEqual({ text: 'a%2Bb%20%2F' });
  expect(await U.analyze('url-encoder', 'a+b', 'decode')).toEqual({ text: 'a+b' });
  await expect(U.analyze('url-encoder', '%ZZ', 'decode')).rejects.toThrow();
});
test('fractional epoch seconds use exact decimal millisecond arithmetic', () => {
  expect(U.convertTime('0.029', 'seconds').epochMilliseconds).toBe(29);
  expect(U.convertTime('-0.029', 'seconds').epochMilliseconds).toBe(-29);
  expect(() => U.convertTime('0.5', 'milliseconds')).toThrow();
});
