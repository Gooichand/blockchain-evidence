/* Live public-gateway UI check, synthetic identity only.
 * The read-car API route is handled by the ACTUAL controller/service against the
 * real public 4everland gateway; everything is verified again in the browser by
 * the actual inspectCAR verifier. No upload, pinning, wallet or credentials.
 * Auth on this fixture server is not exercised (covered by route/middleware tests
 * elsewhere); the point here is live retrieval plus UI verification. */
const fs = require('fs'),
  http = require('http'),
  path = require('path'),
  assert = require('assert/strict'),
  puppeteer = require('puppeteer-core');
const controller = require('../controllers/ipfsReadOnlyController');
const root = path.resolve(__dirname, '../public');
const CID = 'bafybeiczsscdsbs7ffqz55asqdf3smv6klcw3gofszvwlyarci47bgf354';
const server = http.createServer(async (req, res) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; worker-src 'self'",
  );
  const m = req.url.match(/^\/api\/blockchain\/ipfs\/read-car\/([a-z]+)\/(b[a-z2-7]+)$/);
  if (m) {
    const shim = {
      headers: {},
      code: 200,
      set(k, v) {
        this.headers[k] = v;
      },
      status(c) {
        this.code = c;
        return this;
      },
      json(o) {
        res.writeHead(this.code, { ...this.headers, 'Content-Type': 'application/json' });
        res.end(JSON.stringify(o));
      },
      send(b) {
        res.writeHead(this.code, this.headers);
        res.end(b);
      },
    };
    return controller.readCAR({ params: { gateway: m[1], cid: m[2] } }, shim);
  }
  if (req.url.startsWith('/api/')) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    return res.end('{"success":false,"error":"Local fixture: no live lookup"}');
  }
  const f = path.join(root, req.url.split('?')[0]);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
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
          : req.url.endsWith('.car')
            ? 'application/vnd.ipld.car'
            : req.url.endsWith('.json')
              ? 'application/json'
              : 'text/plain',
  );
  res.end(fs.readFileSync(f));
});
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const b = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    args: ['--no-sandbox'],
  });
  try {
    const p = await b.newPage();
    await p.setViewport({ width: 1440, height: 1100 });
    await p.evaluateOnNewDocument(() => {
      localStorage.setItem('currentUser', 'local-ipfs-fixture');
      localStorage.setItem('authToken', 'local-fixture-not-a-real-token');
      localStorage.setItem(
        'evidUser_local-ipfs-fixture',
        JSON.stringify({ role: 'forensic_analyst', full_name: 'Local IPFS Fixture' }),
      );
    });
    await p.goto('http://127.0.0.1:' + server.address().port + '/dashboard-analyst.html#tools');
    await p.waitForSelector('#flWorkspace');
    await p.evaluate(() => ForensicLab.openTool('blockchain', 'ipfs-viewer'));
    await p.waitForSelector('[aria-label="IPFS source mode"]');
    await p.select('[aria-label="IPFS source mode"]', 'gateway');
    await p.select('[aria-label="Public IPFS gateway"]', 'everland');
    await p.type('#flWorkspace input', CID);
    await p.evaluate(() =>
      [...document.querySelectorAll('#flWorkspace button')]
        .find((x) => x.textContent === 'Inspect IPFS object')
        .click(),
    );
    await p.waitForFunction(
      () =>
        document.querySelector('#flWorkspace pre') ||
        document.querySelector('#flWorkspace [role=alert]'),
      { timeout: 45000 },
    );
    const alert = await p.$('#flWorkspace [role=alert]');
    assert.equal(alert, null, alert && (await alert.evaluate((e) => e.textContent)));
    const report = JSON.parse(await p.$eval('#flWorkspace pre', (e) => e.textContent));
    assert.equal(report.cidVerified, true);
    assert.equal(report.verifiedBlockCount, 1);
    console.log(
      'PASS live public gateway UI: retrieved through real controller/service and verified in browser',
      JSON.stringify({ cidVerified: report.cidVerified, verifiedBlockCount: report.verifiedBlockCount }),
    );
    await p.evaluate(() => {
      const el = document.querySelector('#flWorkspace pre');
      el.scrollIntoView({ block: 'center' });
      el.style.maxHeight = 'none';
    });
    await new Promise((r) => setTimeout(r, 300));
    await p.screenshot({ path: '/tmp/be-ipfs-public-ui.png', fullPage: false });
  } finally {
    await b.close();
    server.close();
  }
})().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
