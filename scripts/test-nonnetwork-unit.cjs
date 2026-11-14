/* Explicit local scope. Never imports excluded Network or mixed-route suites. */
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const excluded = new Set([
  'dns-registration.test.js',
  'network-forensics.test.js',
  'public-tls.test.js',
  'tls-inspector.test.js',
  'hash-verification-route.test.js',
  'timeline-tools.test.js',
]);
const files = fs
  .readdirSync(path.resolve(__dirname, '../tests'))
  .filter((name) => name.endsWith('.test.js') && !excluded.has(name))
  .sort()
  .map((name) => 'tests/' + name);
for (const file of files) {
  if (
    /networkReadRoutes|NetworkForensics|dnsRegistrationService|publicTLSService|samples\/network/.test(
      fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'),
    )
  ) {
    throw Error('New mixed Network suite requires an explicit scope review: ' + file);
  }
}
console.log(
  'Non-Network unit scope:',
  files.length,
  'suites. Mixed route/timeline suites deliberately excluded.',
);
const result = spawnSync(
  process.execPath,
  [require.resolve('jest/bin/jest'), '--runInBand', ...files],
  {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
  },
);
process.exitCode = result.status === null ? 1 : result.status;
