const crypto = require('crypto');

const LEGACY = 'legacy-delimited-v1';
const CURRENT = 'canonical-json-v2';
function fields(summary, findings) {
  if (summary !== null && summary !== undefined && typeof summary !== 'string')
    throw new TypeError('Summary must be text or null');
  if (findings !== null && findings !== undefined && typeof findings !== 'string')
    throw new TypeError('Findings must be text or null');
  return { result_summary: summary ?? '', findings: findings ?? '' };
}
// Fixed field order, UTF-8 JSON with JSON escaping. No trimming or Unicode
// normalization: the digest represents the exact saved text. Absent text is ''.
function payload(summary, findings, version = CURRENT) {
  const f = fields(summary, findings);
  if (version === LEGACY) return `${f.result_summary}|${f.findings}`;
  if (version !== CURRENT) throw new Error('Unsupported report hash version');
  return JSON.stringify({ schema: 'evid-dgc.analysis-report', version: 2, ...f });
}
function digest(summary, findings, version = CURRENT) {
  return crypto
    .createHash('sha256')
    .update(payload(summary, findings, version), 'utf8')
    .digest('hex');
}
function verify(row) {
  const version = row.report_hash_version ?? LEGACY;
  if (![LEGACY, CURRENT].includes(version))
    return { version, verified: false, reason: 'Unsupported report hash version' };
  const expected = digest(row.result_summary, row.findings, version);
  return {
    version,
    verified:
      typeof row.report_hash === 'string' &&
      /^[0-9a-f]{64}$/.test(row.report_hash) &&
      row.report_hash === expected,
    meaning:
      version === LEGACY
        ? 'Legacy delimiter digest; field-boundary ambiguity remains'
        : 'Content digest only, not a digital signature or blockchain anchor',
  };
}
module.exports = { LEGACY, CURRENT, payload, digest, verify };
