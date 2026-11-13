/* PR #387 review regressions — local fixture UI test. Not an authenticated production/live test.
   Covers the merge-blocking report-editor findings:
   1. Edits typed while a Save Draft / Submit request is in flight must stay dirty
      (only the sent snapshot is marked saved).
   2. A 409 FINALIZED response must preserve local text read-only with an explicit
      reload choice — never auto-replace the editor.
   Plus smaller review points:
   3. The "Unsaved changes" badge must actually be hidden while clean (CSS [hidden]).
   4. A later-page list failure must render an error, not an "Empty page" state. */
const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer-core');
const root = path.resolve(__dirname, '../public');
const screenshotDir = path.resolve(process.env.SCREENSHOT_DIR || 'test-results/test-analyst-report-safety');
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
function url(req) { return new URL(req.url, 'http://127.0.0.1'); }

const task = makeTask(1, { id: 101, status: 'in_progress', progress: 60, notes: 'fixture notes' });
const evidenceRows = Array.from({ length: 25 }, (_, i) => ({
  id: 200 + i, name: 'fixture-evidence-' + i + '.bin', file_type: 'bin',
  hash: 'fixturehash' + String(i).padStart(4, '0'), case_number: 'C300',
  timestamp: new Date(2026, 9, 20, 8, i).toISOString(),
  file_size: 2048, description: 'Fixture', task_status: 'pending', task_id: 100 + i,
}));
const caseRows = Array.from({ length: 25 }, (_, i) => ({
  id: 300 + i, case_number: 'C' + (300 + i), title: 'Fixture case ' + i, status: 'active',
  created_date: new Date(2026, 8, 1, 8, i).toISOString(), priority_level: 'medium', jurisdiction: 'IN',
}));

let revision = 3;
let finalMode = false;
let submittedOnce = false;
let evidencePageFail = false;
let casesPageFail = false;
let lastReceived = null;
function reportRow() {
  return {
    id: 501, task_id: 101,
    status: (finalMode || submittedOnce) ? 'submitted' : 'draft',
    result_summary: lastReceived ? lastReceived.result_summary : 'Draft summary text',
    findings: lastReceived ? lastReceived.findings : 'Draft findings text',
    report_hash: 'abc123', report_hash_version: 'canonical-json-v2', revision,
  };
}
api('GET', '/analyst/stats', (req, res) => respond(res, 200, { success: true, data: makeStats() }));
api('GET', '/analyst/evidence', (req, res, u) => {
  const { page } = pageParams(u);
  if (evidencePageFail && page > 1) return respond(res, 500, { success: false, error: 'fixture later-page failure' });
  respond(res, 200, paged(evidenceRows, u));
});
api('GET', '/analyst/cases', (req, res, u) => {
  const { page } = pageParams(u);
  if (casesPageFail && page > 1) return respond(res, 500, { success: false, error: 'fixture later-page failure' });
  respond(res, 200, paged(caseRows, u));
});
api('GET', /^\/analyst\/queue/, (req, res, u) => respond(res, 200, paged([task], u)));
api('GET', /^\/analyst\/tasks\/101$/, (req, res) => respond(res, 200, { success: true, data: { task, case: { title: 'Fixture case' }, report: reportRow(), custody_timeline: [] } }));
api('GET', '/__setfinal', (req, res) => { finalMode = true; respond(res, 200, { success: true }); });
api('GET', '/__failpages', (req, res) => { evidencePageFail = true; casesPageFail = true; respond(res, 200, { success: true }); });
api('GET', /^\/analyst\/evidence\/\d+\/blockchain$/, (req, res) => respond(res, 200, { success: true, data: { immutable: false } }));
api('PUT', /^\/analyst\/tasks\/101\/report$/, (req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const parsed = JSON.parse(body);
    if (finalMode) return respond(res, 409, { success: false, error: 'Finalized elsewhere', code: 'FINALIZED' });
    revision += 1;
    // Delayed response: leaves a window where the analyst can keep typing.
    setTimeout(() => {
      lastReceived = parsed;
      if (parsed.submit) submittedOnce = true;
      respond(res, 200, { success: true, data: { report_id: 501, task_id: 101, report_hash: 'def456', report_hash_version: 'canonical-json-v2', status: parsed.submit ? 'submitted' : 'draft', revision } });
    }, 600);
  });
});

const server = http.createServer((req, res) => {
  res.setHeader('Content-Security-Policy', csp);
  if (req.url.startsWith('/api/')) {
    const u = new URL(req.url, 'http://127.0.0.1');
    const apiPath = u.pathname.replace(/^\/api/, '');
    for (const r of apiRoutes) {
      const ok = r.match instanceof RegExp ? r.match.test(apiPath) : r.match === apiPath;
      if (ok && req.method === r.method) return r.handler(req, res, u);
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
  page.on('dialog', (d) => d.accept());
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

function setField(page, selector, value) {
  return page.$eval(selector, (n, v) => { n.value = v; n.dispatchEvent(new Event('input')); }, value);
}
function clickButton(page, label) {
  return page.evaluate((t) => [...document.querySelectorAll('button')].find((b) => b.textContent === t).click(), label);
}
function badgeState(page) {
  return page.evaluate(() => {
    const b = [...document.querySelectorAll('.evid-badge')].find((n) => n.textContent === 'Unsaved changes');
    if (!b) return { found: false };
    return { found: true, hidden: b.hidden, display: getComputedStyle(b).display };
  });
}
async function openEditor(page, base) {
  await page.goto(base + '/dashboard-analyst.html#queue', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.analystDashboard);
  await page.evaluate(() => window.analystDashboard.openWorkspace(101));
  await page.waitForSelector('#reportSummary');
  await page.evaluate(() => [...document.querySelectorAll('.ws-tab')].find((b) => b.textContent === 'Report').click());
}

async function main() {
  const { browser, page, errors, base } = await launch();
  try {
    // ---- 3. Badge is truly hidden while clean (CSS must not override [hidden]).
    await openEditor(page, base);
    let badge = await badgeState(page);
    assert.equal(badge.found, true);
    assert.equal(badge.hidden, true);
    assert.equal(badge.display, 'none', 'hidden badge must compute to display:none');

    // ---- 1a. Save race: later edit stays dirty, only the sent snapshot is saved.
    await setField(page, '#reportSummary', 'Sent draft');
    await clickButton(page, 'Save Draft');
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => b.textContent === 'Save Draft' && b.disabled));
    await setField(page, '#reportSummary', 'UNSENT later edit');
    await page.waitForFunction(() => [...document.querySelectorAll('p')].some((n) => n.textContent.includes('Draft saved.')));
    assert.equal(lastReceived.result_summary, 'Sent draft');
    assert.equal(await page.$eval('#reportSummary', (n) => n.value), 'UNSENT later edit');
    badge = await badgeState(page);
    assert.equal(badge.hidden, false, 'later edit must keep the dirty badge visible');
    assert.notEqual(badge.display, 'none');
    const savedMsg = await page.evaluate(() => [...document.querySelectorAll('p')].map((n) => n.textContent).find((t) => t.includes('Draft saved.')));
    assert.match(savedMsg, /not saved yet/);
    await page.screenshot({ path: screenshotDir + '/save-race-later-edit-dirty.png' });
    // Second save sends the later edit and clears the badge.
    await clickButton(page, 'Save Draft');
    await page.waitForFunction(() => [...document.querySelectorAll('p')].some((n) => n.textContent === 'Draft saved.'));
    assert.equal(lastReceived.result_summary, 'UNSENT later edit');
    badge = await badgeState(page);
    assert.equal(badge.hidden, true);
    assert.equal(badge.display, 'none');

    // ---- 2. FINALIZED conflict: text preserved read-only, explicit reload choice.
    lastReceived = null;
    await openEditor(page, base);
    await page.evaluate(() => fetch('/api/__setfinal'));
    await setField(page, '#reportSummary', 'UNSAVED conflict text');
    await clickButton(page, 'Save Draft');
    await page.waitForFunction(() => [...document.querySelectorAll('p')].some((n) => n.textContent.includes('finalized elsewhere')));
    await sleep(700); // an auto-reload would have replaced the text by now
    assert.equal(await page.$eval('#reportSummary', (n) => n.value), 'UNSAVED conflict text', 'unsaved text must survive the 409');
    assert.equal(await page.$eval('#reportSummary', (n) => n.disabled), true, 'editor locks read-only');
    assert.equal(await page.$eval('#reportFindings', (n) => n.disabled), true);
    const loadBtn = await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent === 'Load finalized report'));
    assert.equal(loadBtn, true, 'explicit reload choice is offered');
    await page.screenshot({ path: screenshotDir + '/finalized-preserve-choice.png' });
    await clickButton(page, 'Load finalized report');
    await page.waitForFunction(() => document.querySelector('#reportSummary') && document.querySelector('#reportSummary').value === 'Draft summary text');
    assert.equal(await page.$eval('#reportSummary', (n) => n.disabled), true);
    await page.screenshot({ path: screenshotDir + '/finalized-after-explicit-reload.png' });

    // ---- 1b. Submit race: unsent edit preserved read-only, no silent discard.
    finalMode = false; submittedOnce = false; lastReceived = null; revision = 3;
    await openEditor(page, base);
    await setField(page, '#reportSummary', 'Submit sent text');
    await clickButton(page, 'Submit Report');
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => b.textContent === 'Submit Report' && b.disabled));
    await setField(page, '#reportSummary', 'UNSENT submit edit');
    await page.waitForFunction(() => [...document.querySelectorAll('p')].some((n) => n.textContent.includes('were not submitted')));
    assert.equal(lastReceived.result_summary, 'Submit sent text');
    assert.equal(await page.$eval('#reportSummary', (n) => n.value), 'UNSENT submit edit', 'unsent submit edit preserved');
    assert.equal(await page.$eval('#reportSummary', (n) => n.disabled), true);
    await page.screenshot({ path: screenshotDir + '/submit-race-preserved.png' });
    await clickButton(page, 'View submitted report');
    await page.waitForFunction(() => document.querySelector('#reportSummary') && document.querySelector('#reportSummary').value === 'Submit sent text');
    assert.equal(await page.$eval('#reportSummary', (n) => n.disabled), true);

    // ---- 4. Later-page 500 renders a visible error, not "Empty page".
    // Select the Dashboard tab explicitly and require visible rows/errors, so
    // assertions cannot pass against hidden DOM.
    await page.goto(base + '/dashboard-analyst.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => fetch('/api/__failpages'));
    await page.evaluate(() => [...document.querySelectorAll('a, button')].find((b) => b.textContent.trim() === 'Dashboard').click());
    await page.waitForFunction(() => [...document.querySelectorAll('#analystEvidenceList tbody tr')].filter((r) => r.offsetParent !== null).length === 10);
    await page.evaluate(() => [...document.querySelectorAll('.inventory-toolbar .pager button[aria-label="Next page"]')][0].click());
    await page.waitForFunction(() => {
      const c = document.getElementById('analystEvidenceList');
      if (!c || !c.textContent.includes('Could not load evidence inventory')) return false;
      const err = [...c.querySelectorAll('*')].find((n) => n.textContent.includes('Could not load evidence inventory') && n.children.length === 0);
      const retry = [...c.querySelectorAll('button')].find((b) => b.textContent === 'Retry');
      return err && err.offsetParent !== null && retry && retry.offsetParent !== null;
    });
    let containerText = await page.$eval('#analystEvidenceList', (n) => n.textContent);
    assert.ok(!containerText.includes('Empty page'), 'failed later page must not render Empty page');
    await page.waitForFunction(() => [...document.querySelectorAll('#analystCaseList tbody tr')].filter((r) => r.offsetParent !== null).length === 10);
    await page.evaluate(() => [...document.querySelectorAll('.inventory-toolbar .pager button[aria-label="Next page"]')][1].click());
    await page.waitForFunction(() => {
      const c = document.getElementById('analystCaseList');
      if (!c || !c.textContent.includes('Could not load cases')) return false;
      const err = [...c.querySelectorAll('*')].find((n) => n.textContent.includes('Could not load cases') && n.children.length === 0);
      const retry = [...c.querySelectorAll('button')].find((b) => b.textContent === 'Retry');
      return err && err.offsetParent !== null && retry && retry.offsetParent !== null;
    });
    containerText = await page.$eval('#analystCaseList', (n) => n.textContent);
    assert.ok(!containerText.includes('Empty page'), 'failed later page must not render Empty page');
    await page.screenshot({ path: screenshotDir + '/later-page-error-state.png' });

    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    server.close();
  }
}
main().then(() => { console.log('PASS: test-analyst-report-safety'); process.exit(0); })
  .catch((e) => { console.error('FAIL: test-analyst-report-safety'); console.error(e && e.message); process.exit(1); });
