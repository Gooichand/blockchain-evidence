/* Maintained non-Network desktop fixture integration. No authenticated production, live-chain or external lookup proof. */
const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer-core');
const root = path.resolve(__dirname, '../public');
const screenshotDir = path.resolve(process.env.SCREENSHOT_DIR || 'test-results/desktop-forensics');
fs.mkdirSync(screenshotDir, { recursive: true });
const csp =
  "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; worker-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'";
const mime = {
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.wasm': 'application/wasm',
  '.mp4': 'video/mp4',
  '.wav': 'audio/wav',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
};
const server = http.createServer((req, res) => {
  res.setHeader('Content-Security-Policy', csp);
  if (req.url.startsWith('/api/')) {
    // Never invent a successful live lookup or production record.
    res.writeHead(503, { 'Content-Type': 'application/json' });
    return res.end(
      JSON.stringify({ success: false, error: 'Local fixture: live server/RPC unavailable.' }),
    );
  }
  const filename = path.resolve(
    root,
    '.' +
      decodeURIComponent(
        req.url.split('?')[0] === '/' ? '/dashboard-analyst.html' : req.url.split('?')[0],
      ),
  );
  if (
    !filename.startsWith(root + path.sep) ||
    !fs.existsSync(filename) ||
    !fs.statSync(filename).isFile()
  ) {
    res.statusCode = 404;
    return res.end('Not found');
  }
  res.setHeader('Content-Type', mime[path.extname(filename)] || 'application/octet-stream');
  res.end(fs.readFileSync(filename));
});

async function run() {
  const {
    PDFDocument,
    StandardFonts,
    rgb,
    pushGraphicsState,
    popGraphicsState,
    rectangle,
    clip,
    endPath,
  } = require('pdf-lib');
  const pdf = await PDFDocument.create(),
    font = await pdf.embedFont(StandardFonts.Helvetica);
  const labels = [
    'Visible black text',
    'Visible white on dark',
    'Overpainted black text',
    'Fully clipped black text',
  ];
  for (let i = 0; i < 4; i++) {
    const page = pdf.addPage([320, 180]);
    if (i === 1) page.drawRectangle({ x: 0, y: 0, width: 320, height: 180, color: rgb(0, 0, 0) });
    if (i === 3) page.pushOperators(pushGraphicsState(), rectangle(0, 0, 1, 1), clip(), endPath());
    page.drawText(labels[i], {
      x: 30,
      y: 90,
      size: 15,
      font,
      color: i === 1 ? rgb(1, 1, 1) : rgb(0, 0, 0),
    });
    if (i === 3) page.pushOperators(popGraphicsState());
    if (i === 2) page.drawRectangle({ x: 20, y: 75, width: 280, height: 40, color: rgb(1, 1, 1) });
  }
  const bytes = await pdf.save();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1100 });
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('currentUser', 'negative-fixture');
      localStorage.setItem('authToken', 'synthetic-not-real');
      localStorage.setItem(
        'evidUser_negative-fixture',
        JSON.stringify({ role: 'forensic_analyst', full_name: 'Synthetic Negative Fixtures' }),
      );
    });
    await page.goto('http://127.0.0.1:' + server.address().port + '/dashboard-analyst.html#tools');
    await page.waitForFunction(() => !!window.pdfjsLib && !!window.DocumentForensics);
    const result = await page.evaluate(
      async (bytes) =>
        DocumentForensics.analyze(
          'hidden-text',
          new File([Uint8Array.from(bytes)], 'generated-negative-matrix.pdf'),
        ),
      [...bytes],
    );
    assert.equal(result.pages.length, 4);
    assert.equal(result.pages[0].candidates.length, 0, 'Visible black text false positive');
    assert.equal(result.pages[1].candidates.length, 0, 'Visible white on dark false positive');
    const rows = result.pages.map((p, i) => ({
      page: i + 1,
      groundTruth: labels[i],
      candidateCount: p.candidates.length,
      signals: p.candidates.map((c) => c.signals),
    }));
    console.log(JSON.stringify(rows, null, 2));
    console.log(
      'PASS visible negatives; overpaint/clipping are measured limitations, not claimed detection successes.',
    );
    fs.writeFileSync(
      path.join(screenshotDir, 'negative-pdf-measurements.json'),
      JSON.stringify(rows, null, 2),
    );
    fs.writeFileSync(path.join(screenshotDir, 'generated-negative-matrix.pdf'), bytes);
    // Render actual pixels for visual inspection, not merely text extraction.
    const img = await page.evaluate(
      async (bytes) => {
        const d = await pdfjsLib.getDocument({ data: Uint8Array.from(bytes) }).promise,
          c = document.createElement('canvas');
        c.width = 320;
        c.height = 720;
        const ctx = c.getContext('2d');
        for (let i = 1; i <= 4; i++) {
          const p = await d.getPage(i),
            v = p.getViewport({ scale: 1 }),
            part = document.createElement('canvas');
          part.width = v.width;
          part.height = v.height;
          await p.render({ canvasContext: part.getContext('2d'), viewport: v }).promise;
          ctx.drawImage(part, 0, (i - 1) * 180);
        }
        await d.destroy();
        return c.toDataURL('image/png');
      },
      [...bytes],
    );
    fs.writeFileSync(
      path.join(screenshotDir, 'negative-pdf-render.png'),
      Buffer.from(img.split(',')[1], 'base64'),
    );
    // Actual ZIP/XML negative fixtures with existing browser JSZip/DOMParser.
    const office = await page.evaluate(async () => {
      const out = [];
      for (const [label, content] of [
        ['entity', '<!DOCTYPE x [<!ENTITY a "bad">]><x>&a;</x>'],
        ['malformed', '<broken>'],
        ['oversized', 'x'.repeat(2000001)],
      ]) {
        const zip = new JSZip();
        zip.file('word/document.xml', '<document/>');
        zip.file('docProps/core.xml', content);
        try {
          await DocumentForensics.analyze(
            'doc-metadata',
            new File([await zip.generateAsync({ type: 'uint8array' })], 'synthetic.docx'),
          );
          out.push({ label, rejected: false });
        } catch (e) {
          out.push({ label, rejected: true, error: e.message });
        }
      }
      return out;
    });
    assert(office.every((x) => x.rejected));
    console.log('PASS real generated Office ZIP/XML negative fixtures', JSON.stringify(office));
  } finally {
    await browser.close();
    server.close();
  }
}
run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
