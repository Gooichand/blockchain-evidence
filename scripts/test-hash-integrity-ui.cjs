/* Isolated localhost browser regression, synthetic identity/files only.
 * Hash calculations use actual browser engines. The OS clipboard boundary and
 * deferred-error case are controlled fixtures, not live clipboard/RPC proof. */
const fs = require('fs'),
  http = require('http'),
  path = require('path'),
  assert = require('assert/strict'),
  puppeteer = require('puppeteer-core');
const root = path.resolve(__dirname, '../public');
const server = http.createServer((req, res) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; worker-src 'self'",
  );
  if (req.url.startsWith('/api/')) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    return res.end('{"success":false,"error":"Local fixture: no live lookup"}');
  }
  const f = path.join(root, req.url.split('?')[0]);
  if (!f.startsWith(root) || !fs.existsSync(f)) {
    res.writeHead(404);
    return res.end();
  }
  res.setHeader(
    'Content-Type',
    req.url.endsWith('.js')
      ? 'application/javascript'
      : req.url.endsWith('.css')
        ? 'text/css'
        : req.url.endsWith('.html')
          ? 'text/html'
          : 'text/plain',
  );
  res.end(fs.readFileSync(f));
});
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const b = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox'],
  });
  try {
    const p = await b.newPage();
    await p.setViewport({ width: 1440, height: 1100 });
    await p.evaluateOnNewDocument(() => {
      localStorage.setItem('currentUser', 'local-hash-fixture');
      localStorage.setItem('authToken', 'synthetic-not-real');
      localStorage.setItem(
        'evidUser_local-hash-fixture',
        JSON.stringify({ role: 'forensic_analyst', full_name: 'Local Hash Fixture' }),
      );
    });
    await p.goto('http://127.0.0.1:' + server.address().port + '/dashboard-analyst.html#tools');
    await p.waitForSelector('#flWorkspace');
    fs.writeFileSync('/tmp/hash-user-fixture.bin', 'abc');
    await (await p.$('#flFileInput')).uploadFile('/tmp/hash-user-fixture.bin');
    await p.evaluate(() => ForensicLab.openTool('hash', 'sha256'));

    await p.$eval('#flAnalyzeBtn', (n) => n.form.requestSubmit());
    console.log(await p.$eval('#flHashResults', (n) => n.textContent));
    await p.waitForFunction(() =>
      document.querySelector('#flHashResults').textContent.includes('Hash computation complete'),
    );
    assert(
      (await p.$eval('#flHashResults', (n) => n.textContent)).includes(
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      ),
    );
    assert(!(await p.$eval('#flWorkspace', (n) => n.textContent)).includes('Under Development'));
    await p.evaluate(() => {
      window.originalRun = ForensicLab.services.HashToolService.run;
      ForensicLab.services.HashToolService.run = () =>
        new Promise((yes, no) => {
          window.deferredReject = no;
        });
    });
    await p.$eval('#flAnalyzeBtn', (n) => n.form.requestSubmit());
    await p.waitForFunction(() => !!window.deferredReject);
    await p.evaluate(() =>
      [...document.querySelectorAll('button')]
        .find((n) => n.textContent === 'Return to my inputs')
        .click(),
    );
    await p.evaluate(() => window.deferredReject(new Error('OBSOLETE ERROR')));
    await p.waitForFunction(() => !document.querySelector('#flAnalyzeBtn').disabled);
    const result = await p.$eval('#flHashResults', (n) => n.textContent);
    console.log('stale rejection output:', result);
    assert(!result.includes('OBSOLETE ERROR'), 'Old rejected run overwrote restored inputs');
    console.log(
      'PASS SHA-256 browser real-byte digest, development notice absence, stale error invalidation',
    );
    await p.evaluate(() => {
      ForensicLab.services.HashToolService.run = window.originalRun;
    });
    await p.$eval('#flAnalyzeBtn', (n) => n.form.requestSubmit());
    await p.waitForFunction(() =>
      document.querySelector('#flHashResults').textContent.includes('Hash computation complete'),
    );
    await p.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (text) => {
            window.copiedDigest = text;
          },
        },
      });
    });
    await p.$eval('[aria-label="Copy SHA-256"]', (n) => n.click());
    await p.waitForFunction(
      () => document.querySelector('[aria-label="Copy SHA-256"]').textContent === 'Copied',
    );
    assert.equal(
      await p.evaluate(() => window.copiedDigest),
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    await p.$eval('[aria-label="Try example"]', (n) => n.click());
    await p.waitForFunction(() =>
      document.querySelector('#flHashResults').textContent.includes('DEMO SAMPLE'),
    );
    assert.equal(await p.evaluate(() => ForensicLab.getState().file.name), 'hash-user-fixture.bin');
    await p.evaluate(() =>
      [...document.querySelectorAll('button')]
        .find((n) => n.textContent === 'Return to my inputs')
        .click(),
    );
    assert.equal(await p.evaluate(() => ForensicLab.getState().lastRun), null);
    await p.$eval('#flAnalyzeBtn', (n) => n.form.requestSubmit());
    await p.waitForFunction(() =>
      document.querySelector('#flHashResults').textContent.includes('ba7816bf'),
    );
    console.log(
      'PASS clipboard handler digest (stubbed OS boundary), real bundled demo and retained Evidence Vault input',
    );
    // The OS clipboard boundary is stubbed above; digest calculations are real.
    async function open(id) {
      await p.evaluate((id) => ForensicLab.openTool('hash', id), id);
    }
    async function fill(id, value) {
      await p.$eval(
        '#flHash-' + id,
        (n, v) => {
          n.value = v;
          n.dispatchEvent(new Event('input', { bubbles: true }));
        },
        value,
      );
    }
    async function submit() {
      await p.$eval('#flAnalyzeBtn', (n) => n.form.requestSubmit());
      await p.waitForFunction(() => !document.querySelector('#flAnalyzeBtn').disabled);
    }
    const abc = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
    await open('hash-compare');
    await fill('left', abc.toUpperCase());
    await fill('right', abc);
    await submit();
    assert((await p.$eval('#flHashResults', (n) => n.textContent)).includes('MATCH'));
    await fill('right', '0'.repeat(64));
    assert((await p.$eval('#flHashResults', (n) => n.textContent)).includes('Inputs changed'));
    assert.equal(await p.evaluate(() => ForensicLab.getState().lastRun), null);
    await submit();
    assert((await p.$eval('#flHashResults', (n) => n.textContent)).includes('MISMATCH'));
    await fill('right', 'not-hex');
    await submit();
    assert(await p.$('#flHashResults [role=alert]'));
    assert.equal(await p.evaluate(() => ForensicLab.getState().lastRun), null);
    await fill('right', abc);
    await p.$eval('[aria-label="Try changed example"]', (n) => n.click());
    await p.waitForFunction(() =>
      document.querySelector('#flHashResults').textContent.includes('MISMATCH'),
    );
    assert.equal(await p.$eval('#flHash-right', (n) => n.value), abc);
    assert.equal(await p.evaluate(() => ForensicLab.getState().file.name), 'hash-user-fixture.bin');
    console.log(
      'PASS comparison match/mismatch/invalid input, stale-result clearing and unchanged demo inputs',
    );
    await open('integrity-check');
    await fill('expected', abc.toUpperCase());
    await submit();
    assert((await p.$eval('#flHashResults', (n) => n.textContent)).includes('MATCH'));
    await p.$eval('[aria-label="Try changed example"]', (n) => n.click());
    await p.waitForFunction(() =>
      document.querySelector('#flHashResults').textContent.includes('MISMATCH'),
    );
    assert.equal(await p.$eval('#flHash-expected', (n) => n.value), abc.toUpperCase());
    await fill('expected', 'invalid');
    await submit();
    assert(await p.$('#flHashResults [role=alert]'));
    console.log(
      'PASS integrity match, changed-demo mismatch, input preservation and baseline error',
    );
    await open('multi-hash');
    await submit();
    const values = await p.$$eval('#flHashResults code', (nodes) =>
      nodes.map((n) => n.textContent),
    );
    assert.equal(values.length, 5);
    const expected = ['sha1', 'sha256', 'sha384', 'sha512', 'md5'].map((a) =>
      require('crypto').createHash(a).update('abc').digest('hex'),
    );
    assert.deepEqual(values, expected);
    assert((await p.$eval('#flHashResults', (n) => n.textContent)).includes('legacy'));
    console.log('PASS multi-hash real five independent digests and legacy warning');
    await p.evaluate(() => ForensicLab.openTool('hash', 'sha256'));
    await submit();
    await p.evaluate(() => document.querySelector('#flWorkspace').scrollIntoView());
    await p.screenshot({
      path: process.env.HASH_UI_SCREENSHOT || '/tmp/be-sha256-local-check.png',
      fullPage: true,
    });
  } finally {
    await b.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
