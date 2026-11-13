const H = require('../lib/analysisReportPayload');
test('legacy delimiter collision is separated by v2 field boundaries', () => {
  expect(H.digest('a|b', 'c', H.LEGACY)).toBe(H.digest('a', 'b|c', H.LEGACY));
  expect(H.digest('a|b', 'c')).not.toBe(H.digest('a', 'b|c'));
});
test('canonical payload is explicit, stable UTF-8 with fixed field order', () => {
  expect(H.payload('नमस्ते', 'line\n"quoted"')).toBe(
    JSON.stringify({
      schema: 'evid-dgc.analysis-report',
      version: 2,
      result_summary: 'नमस्ते',
      findings: 'line\n"quoted"',
    }),
  );
  expect(H.digest('same', 'text')).toBe(H.digest('same', 'text'));
});
test('changes to either field, whitespace, Unicode form and field order differ', () => {
  const base = H.digest('a', 'b');
  for (const pair of [
    ['a ', 'b'],
    ['a', 'b '],
    ['b', 'a'],
    ['a\n', 'b'],
    ['a', 'B'],
  ])
    expect(H.digest(...pair)).not.toBe(base);
  expect(H.digest('é', '')).not.toBe(H.digest('e\u0301', ''));
});
test('null and missing text have defined empty-string semantics', () => {
  expect(H.digest(null, undefined)).toBe(H.digest('', ''));
  expect(H.payload(null, null, H.LEGACY)).toBe('|');
});
test('historical unversioned hashes verify only as legacy and are never rewritten', () => {
  const row = { result_summary: 'a|b', findings: 'c', report_hash: H.digest('a|b', 'c', H.LEGACY) };
  const snapshot = JSON.stringify(row);
  expect(H.verify(row)).toMatchObject({ version: H.LEGACY, verified: true });
  expect(JSON.stringify(row)).toBe(snapshot);
  expect(H.verify({ ...row, report_hash_version: H.CURRENT }).verified).toBe(false);
});
test('v2 verifies exact content and reports signature/anchor limits', () => {
  const row = {
    result_summary: 'a',
    findings: 'b',
    report_hash: H.digest('a', 'b'),
    report_hash_version: H.CURRENT,
  };
  expect(H.verify(row)).toMatchObject({
    verified: true,
    meaning: expect.stringContaining('not a digital signature'),
  });
  expect(H.verify({ ...row, findings: 'changed' }).verified).toBe(false);
});
test('unknown version fails closed rather than guessing a digest scheme', () => {
  expect(H.verify({ report_hash_version: 'future' })).toMatchObject({ verified: false });
  expect(() => H.digest('a', 'b', 'future')).toThrow();
  expect(() => H.payload(42, 'x')).toThrow(TypeError);
});
