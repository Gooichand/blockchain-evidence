/* V3 snapshot PDF downloads — local fixture UI test. Not an authenticated production/live test. */
const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer-core');
const root = path.resolve(__dirname, '../public');
const screenshotDir = path.resolve(process.env.SCREENSHOT_DIR || 'test-results/test-analyst-report-download');
fs.mkdirSync(screenshotDir, { recursive: true });
const csp = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'";
const mime = { '.js': 'application/javascript', '.mjs': 'application/javascript', '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon' };

// ---- labelled fixture data (never production records) ----
function makeTask(i, over) {
  return Object.assign({
    id: 100 + i, evidence_id: 200 + i, case_id: 300 + (i % 4), status: 'pending',
    priority: ['critical', 'high', 'medium', 'low'][i % 4], progress: (i * 7) % 100,
    assigned_at: new Date(2026, 10, 1, 9, i).toISOString(), started_at: null, completed_at: null,
    requested_by: 'fixture-manager', notes: '', estimated_time_minutes: 60,
    created_at: new Date(2026, 10, 1, 9, i).toISOString(),
    evidence: { id: 200 + i, name: 'fixture-evidence-' + i + '.bin', file_type: 'bin', hash: 'fixturehash' + String(i).padStart(4, '0'), ipfs_cid: null, blockchain_tx_hash: null, blockchain_block_number: null, blockchain_verified: i % 2 === 0, blockchain_timestamp: null, timestamp: new Date(2026, 9, 20, 8, i).toISOString(), redaction_status: 'Sealed', file_size: 1024 * i, description: 'Fixture evidence ' + i },
    case_number: 'C' + (300 + (i % 4)),
  }, over || {});
}
function makeReport(i, over) {
  return Object.assign({
    id: 500 + i, task_id: 100 + i, evidence_id: 200 + i, case_id: 300 + (i % 4),
    status: ['draft', 'submitted', 'approved', 'rejected'][i % 4],
    report_hash: 'fixturereporthash' + String(i).padStart(4, '0'), report_hash_version: 'canonical-json-v2',
    result_summary: 'Fixture summary ' + i, findings: 'Fixture findings ' + i,
    blockchain_verified: i % 2 === 0,
    created_at: new Date(2026, 10, 2, 10, i).toISOString(), updated_at: new Date(2026, 10, 3, 11, i).toISOString(),
    submitted_at: null, revision: 1,
    evidence: { id: 200 + i, name: 'fixture-evidence-' + i + '.bin', file_type: 'bin', hash: 'fixturehash' + String(i).padStart(4, '0') },
    case_number: 'C' + (300 + (i % 4)),
  }, over || {});
}
function makeStats(over) {
  return Object.assign({
    assigned_evidence: 12, assigned_cases: 4, pending: 5, in_progress: 3, completed: 8,
    evidence_verified: 7, critical_priority: 2, average_processing_minutes: 42, integrity_score: 87,
    blockchain: { state: 'synced', network: 'fixture-net', block: 12345 },
    lab_equipment: [{ name: 'Fixture Imager', status: 'online', category: 'digital', detail: 'bench 1', version: 'v2.1' }],
    recent_activity: [{ action: 'analysis_started', timestamp: new Date(2026, 10, 11, 9, 0).toISOString() }],
    generated_at: new Date(2026, 10, 12, 9, 0).toISOString(),
  }, over || {});
}
function pageParams(url) {
  const page = Math.max(parseInt(url.searchParams.get('page'), 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit'), 10) || 20, 1), 100);
  return { page, limit };
}
function paged(rows, url) {
  const { page, limit } = pageParams(url);
  const total = rows.length;
  const pages = Math.ceil(total / limit);
  const data = rows.slice((page - 1) * limit, page * limit);
  return { success: true, data, pagination: { page, limit, total, pages } };
}

// Fixture API table: labelled local data, never production records.
const apiRoutes = [];
function api(method, match, handler) { apiRoutes.push({ method, match, handler }); }
function respond(res, status, obj, headers) {
  res.writeHead(status, Object.assign({ 'Content-Type': 'application/json' }, headers || {}));
  res.end(JSON.stringify(obj));
}
function respondPdf(res, name) {
  res.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="' + name + '"',
  });
  res.end(Buffer.from('%PDF-1.4\n% fixture snapshot pdf, not a real export\n%%EOF'));
}

const reports = [makeReport(1, { id: 501, task_id: 101, evidence_id: 201, case_id: 301, case_number: 'C301' })];
api('GET', '/analyst/stats', (req, res) => respond(res, 200, { success: true, data: makeStats() }));
api('GET', '/analyst/evidence', (req, res) => respond(res, 200, { success: true, data: [] }));
api('GET', '/analyst/cases', (req, res) => respond(res, 200, { success: true, data: [] }));
api('GET', '/analyst/reports', (req, res, url) => respond(res, 200, paged(reports, url)));
api('GET', '/evidence/201/report.pdf', (req, res) => respondPdf(res, 'evidence-201-snapshot.pdf'));
api('GET', '/cases/301/report.pdf', (req, res) => respond(res, 403, { success: false, error: 'Forbidden by fixture policy' }));

const server = http.createServer((req, res) => {
  res.setHeader('Content-Security-Policy', csp);
  if (req.url.startsWith('/api/')) {
    const url = new URL(req.url, 'http://127.0.0.1');
    const apiPath = url.pathname.replace(/^\/api/, '');
    for (const r of apiRoutes) {
      const ok = r.match instanceof RegExp ? r.match.test(apiPath) : r.match === apiPath;
      if (ok && req.method === r.method) return r.handler(req, res, url);
    }
    res.writeHead(503, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, error: 'Local fixture: endpoint not stubbed.' }));
  }
  const filename = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/dashboard-analyst.html' : req.url.split('?')[0]));
  if (!filename.startsWith(root + path.sep) || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
    res.statusCode = 404;
    return res.end('Not found');
  }
  res.setHeader('Content-Type', mime[path.extname(filename)] || 'application/octet-stream');
  res.end(fs.readFileSync(filename));
});

async function launch(width, height) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: width || 1440, height: height || 1100 });
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // Test identity is local fixture data, never an actual account or token.
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('currentUser', 'analyst-fixture');
    localStorage.setItem('authToken', 'local-fixture-not-a-real-token');
    localStorage.setItem('evidUser_analyst-fixture', JSON.stringify({ role: 'forensic_analyst', full_name: 'Analyst UI Fixture' }));
  });
  const base = 'http://127.0.0.1:' + server.address().port;
  return { browser, page, errors, base };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { browser, page, errors, base } = await launch();
  try {
    // Capture blob downloads without writing files.
    await page.evaluateOnNewDocument(() => {
      window.__downloads = [];
      const origCreate = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (blob) => { const u = origCreate(blob); window.__lastBlobUrl = u; return u; };
      const origClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        window.__downloads.push({ href: this.getAttribute('href'), download: this.getAttribute('download') });
      };
    });
    await page.goto(base + '/dashboard-analyst.html#reports', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('#reportsRoot tbody tr').length === 1);
    const evidenceBtn = '#reportsRoot button[aria-label^="Evidence snapshot PDF"]';
    await page.click(evidenceBtn);
    await page.waitForFunction(() => window.__downloads && window.__downloads.length === 1);
    const dl = await page.evaluate(() => window.__downloads[0]);
    assert.equal(dl.download, 'evidence-201-snapshot.pdf');
    assert.match(dl.href, /^blob:/);
    assert.ok(!dl.href.includes('local-fixture'), 'no token in download URL');
    const label = await page.$eval(evidenceBtn, (n) => n.textContent);
    assert.ok(/Downloaded|Evidence snapshot PDF/.test(label));
    // 403 surfaces visibly, button restored.
    const caseBtn = '#reportsRoot button[aria-label^="Case snapshot PDF"]';
    await page.click(caseBtn);
    await page.waitForFunction(() => {
      const s = [...document.querySelectorAll('.snapshot-action .analyst-search-error')].find((n) => n.textContent.includes('permission'));
      return !!s;
    });
    assert.equal(await page.$eval(caseBtn, (n) => n.textContent), 'Case snapshot PDF');
    // Honest snapshot note rendered.
    const note = await page.$eval('#reportsRoot .section-sub', (n) => n.textContent);
    assert.match(note, /unsigned/i);
    await page.screenshot({ path: screenshotDir + '/v3-report-download.png' });
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    server.close();
  }
}
main().then(() => { console.log('PASS: test-analyst-report-download'); process.exit(0); })
  .catch((e) => { console.error('FAIL: test-analyst-report-download'); console.error(e && e.message); process.exit(1); });
