/* V2 report draft protection — local fixture UI test. Not an authenticated production/live test. */
const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer-core');
const root = path.resolve(__dirname, '../public');
const screenshotDir = path.resolve(process.env.SCREENSHOT_DIR || 'test-results/test-analyst-report-editor');
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

let saveCalls = 0;
let revision = 3;
let conflictMode = false;
const task = makeTask(1, { id: 101, status: 'in_progress', progress: 60, notes: 'fixture notes' });
function reportRow() {
  return { id: 501, task_id: 101, status: 'draft', result_summary: 'Draft summary text', findings: 'Draft findings text', report_hash: 'abc123', report_hash_version: 'canonical-json-v2', revision };
}
api('GET', '/analyst/stats', (req, res) => respond(res, 200, { success: true, data: makeStats() }));
api('GET', '/analyst/evidence', (req, res) => respond(res, 200, { success: true, data: [] }));
api('GET', '/analyst/cases', (req, res) => respond(res, 200, { success: true, data: [] }));
api('GET', /^\/analyst\/queue/, (req, res) => respond(res, 200, paged([task], url(req))));
function url(req) { return new URL(req.url, 'http://127.0.0.1'); }
api('GET', /^\/analyst\/tasks\/101$/, (req, res) => respond(res, 200, { success: true, data: { task, case: { title: 'Fixture case' }, report: reportRow(), custody_timeline: [] } }));
api('GET', '/__setconflict', (req, res) => { conflictMode = true; respond(res, 200, { success: true }); });
api('GET', /^\/analyst\/evidence\/\d+\/blockchain$/, (req, res) => respond(res, 200, { success: true, data: { immutable: false } }));
api('PUT', /^\/analyst\/tasks\/101\/report$/, (req, res) => {
  saveCalls += 1;
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    if (conflictMode) return respond(res, 409, { success: false, error: 'Revision conflict', code: 'STALE_REVISION' });
    revision += 1;
    respond(res, 200, { success: true, data: { report_id: 501, task_id: 101, report_hash: 'def456', report_hash_version: 'canonical-json-v2', status: 'draft', revision } });
  });
});

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
    await page.goto(base + '/dashboard-analyst.html#queue', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.analystDashboard);
    await page.evaluate(() => window.analystDashboard.openWorkspace(101));
    await page.waitForSelector('#reportSummary');
    await page.evaluate(() => [...document.querySelectorAll('.ws-tab')].find((b) => b.textContent === 'Report').click());
    assert.equal(await page.$eval('#reportSummary', (n) => n.value), 'Draft summary text');
    // Dirty tracking badge appears on edit.
    await page.click('#reportSummary', { clickCount: 3 });
    await page.type('#reportSummary', ' edited');
    await page.waitForFunction(() => {
      const b = [...document.querySelectorAll('.evid-badge')].find((n) => n.textContent === 'Unsaved changes');
      return b && !b.hidden;
    });
    // Double click = one request (button disabled while saving).
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.textContent === 'Save Draft');
      btn.click(); btn.click();
    });
    await sleep(400);
    assert.equal(saveCalls, 1);
    await page.waitForFunction(() => {
      const line = [...document.querySelectorAll('.section-sub')].find((n) => n.textContent.includes('revision 4'));
      return !!line;
    });
    await page.screenshot({ path: screenshotDir + '/v2-editor-saved.png' });
    // Conflict: text preserved, reload offered.
    await page.evaluate(() => fetch('/api/__setconflict'));
    await sleep(50);
    await page.click('#reportSummary', { clickCount: 3 });
    await page.type('#reportSummary', ' conflicting edit');
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent === 'Save Draft').click());
    await page.waitForFunction(() => {
      const m = [...document.querySelectorAll('.section-sub')].find((n) => n.textContent.includes('changed elsewhere'));
      return !!m;
    });
    assert.match(await page.$eval('#reportSummary', (n) => n.value), /conflicting edit/);
    await page.screenshot({ path: screenshotDir + '/v2-editor-conflict.png' });
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    server.close();
  }
}
main().then(() => { console.log('PASS: test-analyst-report-editor'); process.exit(0); })
  .catch((e) => { console.error('FAIL: test-analyst-report-editor'); console.error(e && e.message); process.exit(1); });
