/* Local desktop fixture integration. Not an authenticated production/live-chain test. */
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
const groups = {
  network: ['packet-capture', 'protocol-decode', 'traffic-analysis', 'ssl-inspect'],
  blockchain: ['ipfs-viewer'],
  image: [
    'ela',
    'clone-detect',
    'noise-analysis',
    'img-metadata',
    'histogram',
    'compression',
    'color-channels',
    'edge-detect',
  ],
  document: ['pdf-inspector', 'doc-metadata', 'ocr', 'hidden-text', 'signature', 'doc-compare'],
  video: ['vid-metadata', 'frame-extract', 'vid-timeline', 'keyframe', 'video-inspector'],
  audio: ['waveform', 'spectrogram', 'aud-metadata', 'fingerprint'],
  crypto: ['aes', 'rsa', 'jwt', 'cert-viewer', 'digisig'],
  metadata: ['exif', 'gps', 'camera-info', 'office-metadata', 'pdf-metadata'],
  timeline: ['evidence-timeline', 'invest-timeline', 'custody-timeline'],
  utility: [
    'base64',
    'url-encoder',
    'hex-viewer',
    'uuid',
    'timestamp',
    'qr-generator',
    'qr-scanner',
  ],
};
async function run() {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1100 });
    page.setDefaultTimeout(60000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));

    // Test identity is local fixture data, never an actual account or token.
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('currentUser', 'desktop-fixture');
      localStorage.setItem('authToken', 'local-fixture-not-a-real-token');
      localStorage.setItem(
        'evidUser_desktop-fixture',
        JSON.stringify({ role: 'forensic_analyst', full_name: 'Desktop Test Fixture' }),
      );
    });
    // The application has optional external CDNs. No external traffic is needed
    // for these tools; CSP blocks those CDNs in this isolated fixture.
    await page.goto('http://127.0.0.1:' + server.address().port + '/dashboard-analyst.html#tools');
    await page.waitForSelector('#flWorkspace');
    await page.waitForFunction(() => !!window.pdfjsLib);
    const retainedFile = path.join(require('os').tmpdir(), 'dgc-retained-user-input.bin');
    fs.writeFileSync(retainedFile, 'USER FILE UNCHANGED');
    if (!(await page.$('#flFileInput'))) await page.click('[aria-label="Expand evidence vault"]');
    await page.waitForSelector('#flFileInput');
    await (await page.$('#flFileInput')).uploadFile(retainedFile);
    await page.waitForFunction(
      () => ForensicLab.getState().file?.name === 'dgc-retained-user-input.bin',
    );
    async function openTool(category, id) {
      await page.evaluate(
        ({ category, id }) => {
          document
            .querySelectorAll('.fl-category.open')
            .forEach((e) => e.querySelector('.fl-cat-head').click());
          const candidates = [...document.querySelectorAll('[data-tool="' + id + '"]')];
          const item = category === 'ai' ? candidates[candidates.length - 1] : candidates[0];
          item.closest('.fl-category').querySelector('.fl-cat-head').click();
          item.click();
        },
        { category, id },
      );
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
    async function capture(name) {
      await page.evaluate(() => window.scrollTo(0, 0));
      const rect = await page.$eval('#flLab', (e) => {
        const r = e.getBoundingClientRect();
        return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height };
      });
      await page.screenshot({
        path: path.join(screenshotDir, name + '.png'),
        clip: rect,
        captureBeyondViewport: true,
      });
    }
    let completed = 0;
    for (const [category, ids] of Object.entries(groups).filter(([category]) =>
      ['image', 'document', 'video'].includes(category),
    )) {
      for (const id of ids) {
        await openTool(category, id);
        await page.evaluate(() => {
          // Preserve an actual File object and typed inputs across the demo.
          for (const e of document.querySelectorAll('#flWorkspace textarea'))
            e.value = 'RETAIN TYPED INPUT';
        });
        await page.click('[aria-label="Try ' + category + ' example"]');
        await page.waitForFunction(
          () =>
            document.querySelector('#flWorkspace pre') ||
            document.querySelector('#flWorkspace [role=alert]'),
        );
        const err = await page.$eval(
          '#flWorkspace',
          (e) => e.querySelector('[role=alert]')?.textContent,
        );
        assert(!err, category + '/' + id + ': ' + err);
        const r = JSON.parse(
          await page.$$eval('#flWorkspace pre', (es) => es[es.length - 1].textContent),
        );
        if (id === 'histogram')
          assert.equal(
            r.bins[0].reduce((a, b) => a + b),
            512 * 384,
          );
        if (id === 'img-metadata') assert.equal(r.metadata.Make, 'DGC Demo');
        if (id === 'clone-detect') assert(r.exactTilePairs.length > 0);
        if (id === 'pdf-inspector') {
          assert(r.objectInventory.objectCount > 0);
          assert(r.objectInventory.objects.some((o) => o.dictionary));
        }
        if (id === 'ocr') assert(r.text.includes('DGC DEMO'));
        if (id === 'hidden-text')
          assert(r.pages[0].candidates.some((x) => x.text.includes('INVISIBLE')));
        if (id === 'signature') assert.equal(r.cryptographicVerification, 'NOT PERFORMED');
        if (category === 'video') {
          assert.equal(r.width, 480);
          assert.equal(r.durationSeconds, 3);
        }
        if (id === 'keyframe') assert.equal(r.syncSampleCount, 3);
        if (category === 'audio' && id !== 'fingerprint') {
          assert.equal(r.durationSeconds, 2);
          assert.equal(r.wav.sampleRate, 16000);
        }
        if (id === 'waveform') {
          await page.$eval('[aria-label="Waveform start seconds"]', (e) => (e.value = '0.25'));
          await page.$eval('[aria-label="Waveform end seconds"]', (e) => (e.value = '0.30'));
          await page.evaluate(() =>
            [...document.querySelectorAll('#flWorkspace button')]
              .find((e) => e.textContent === 'Apply zoom')
              .click(),
          );
          assert(
            (await page.$eval('#flWorkspace', (e) => e.textContent)).includes(
              'Window 0.250000 to 0.300000',
            ),
          );
        }
        if (id === 'fingerprint') assert(Math.abs(r.cosineSimilarity - 1) < 1e-8);
        if (id === 'rsa') {
          assert.equal(r.modulusBits, 2048);
          assert.equal(r.providerImport, true);
          assert.equal(r.syntaxAndArithmeticChecksPass, true);
          assert(r.spkiSHA256);
        }
        if (id === 'digisig') assert.equal(r.signatureMatches, true);
        if (id === 'cert-viewer') {
          assert(r.subject.includes('DGC Synthetic'));
          assert.equal(r.certificateCount, 2);
          assert.equal(r.chainSignatureChecks[0].signatureMatches, true);
          assert.equal(r.trustVerification, 'NOT PERFORMED');
        }
        if (id === 'jwt') assert.equal(r.signatureVerification, 'NOT PERFORMED');
        if (id === 'aes')
          assert(
            (
              await page.evaluate(
                (r) => CryptoTools.analyze('aes', JSON.stringify(r), 'decrypt'),
                r,
              )
            ).text.includes('DGC synthetic'),
          );
        if (id === 'gps') assert.deepEqual(r.embeddedCoordinates, { latitude: 19, longitude: 73 });
        if (id === 'camera-info') assert.equal(r.camera.Make, 'DGC Synthetic');
        if (id === 'office-metadata')
          assert.equal(r.properties['docProps/core.xml'][0].value, 'DGC Synthetic');
        if (category === 'timeline') assert.equal(r.displayedCount, 1);
        if (id === 'qr-scanner') assert.equal(r.text, 'DGC original QR demo');
        if (id === 'ipfs-viewer') {
          assert.equal(r.matchesBlockBytes, true);
          assert(r.untrustedUtf8Preview.includes('Original DGC'));
        }
        if (id === 'ssl-inspect') {
          assert.equal(r.records[0].message, 'ClientHello');
          assert.deepEqual(r.records[0].serverNames, ['demo.example']);
          assert.deepEqual(r.records[0].supportedVersions, ['TLS1.3', 'TLS1.2']);
          assert.equal(r.records[1].selectedVersion, 'TLS1.3');
          assert.equal(r.certificateChain.chainSignatureChecks[0].signatureMatches, true);
        }
        if (category === 'network' && id !== 'ssl-inspect') {
          assert.equal(r.packetCount, 4);
          if (id === 'traffic-analysis') assert.equal(r.flowCount, 2);
          else assert.equal(r.packets[0].dns.questions[0].name, 'demo.example');
        }
        if (id === 'timestamp') assert.equal(r.utc, '2026-11-11T12:30:00.000Z');
        assert.equal(
          await page.evaluate(() => ForensicLab.getState().file.name),
          'dgc-retained-user-input.bin',
        );
        assert(
          await page.$$eval('#flWorkspace textarea', (es) =>
            es.every((e) => e.value === 'RETAIN TYPED INPUT'),
          ),
        );
        await new Promise((resolve) => setTimeout(resolve, 350));
        await page.evaluate(() => window.scrollTo(0, 0));
        const rect = await page.$eval('#flLab', (e) => {
          const r = e.getBoundingClientRect();
          return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height };
        });
        await page.screenshot({
          path: path.join(screenshotDir, category + '-' + id + '.png'),
          clip: rect,
          captureBeyondViewport: true,
        });
        completed++;
        console.log('PASS', category, id);
      }
    }
    await openTool('document', 'doc-compare');
    if (!(await page.$('#flFileInput'))) await page.click('[aria-label="Expand evidence vault"]');
    await (
      await page.$('#flFileInput')
    ).uploadFile(path.join(root, 'samples/document/visual-first.pdf'));
    await (
      await page.$('[aria-label="Second comparison file"]')
    ).uploadFile(path.join(root, 'samples/document/visual-second.pdf'));
    await page.evaluate(() =>
      [...document.querySelectorAll('#flWorkspace button')]
        .find((e) => e.textContent === 'Analyze selected document')
        .click(),
    );
    await page.waitForFunction(
      () =>
        document.querySelector('#flWorkspace pre') ||
        document.querySelector('#flWorkspace [role=alert]'),
    );
    const visualComparison = JSON.parse(await page.$eval('#flWorkspace pre', (e) => e.textContent));
    await capture('document-visual-pdf-comparison');

    assert.equal(visualComparison.equal, true);
    assert(visualComparison.visual.pages[0].changedPixels > 100);
    assert.equal(await page.$$eval('#flWorkspace figure img', (es) => es.length), 3);
    await capture('document-visual-pdf-comparison');
    console.log(
      'PASS identical extracted text with visibly changed PDF layout through real comparison UI',
    );
    const samePDF = await page.evaluate(async () => {
      const bytes = await (await fetch('/samples/document/visual-first.pdf')).arrayBuffer();
      return DocumentForensics.comparePDFs(new File([bytes], 'a.pdf'), new File([bytes], 'b.pdf'));
    });
    assert.equal(samePDF.pages[0].changedPixels, 0);
    const objectFixture = await page.evaluate(async () => {
      const r = await fetch('/samples/document/objects.pdf');
      return DocumentForensics.analyze(
        'pdf-inspector',
        new File([await r.arrayBuffer()], 'objects.pdf'),
      );
    });
    assert(
      objectFixture.objectInventory.structuralMarkers.some((x) => x.path.includes('/OpenAction')),
    );
    assert(objectFixture.objectInventory.objectCount > 0);
    console.log(
      'PASS real worker inventory of compressed PDF object stream and inert action marker',
    );
    await openTool('document', 'ocr');
    if (!(await page.$('#flFileInput'))) await page.click('[aria-label="Expand evidence vault"]');
    await (
      await page.$('#flFileInput')
    ).uploadFile(path.join(root, 'samples/document/scanned.pdf'));
    await page.evaluate(() =>
      [...document.querySelectorAll('#flWorkspace button')]
        .find((e) => e.textContent === 'Analyze selected document')
        .click(),
    );
    await page.waitForFunction(
      () =>
        document.querySelector('#flWorkspace pre') ||
        document.querySelector('#flWorkspace [role=alert]'),
    );
    const scannedOCR = JSON.parse(await page.$eval('#flWorkspace pre', (e) => e.textContent));
    assert.equal(scannedOCR.pages.length, 2);
    for (const p of scannedOCR.pages) assert(p.text.includes('DGC DEMO'));
    await capture('document-scanned-pdf-ocr');
    if (!(await page.$('#flFileInput'))) await page.click('[aria-label="Expand evidence vault"]');
    await page.waitForSelector('#flFileInput');
    await (await page.$('#flFileInput')).uploadFile(retainedFile);
    console.log('PASS real two-page scanned PDF OCR through actual upload/run UI');
    for (const name of ['tracked.docx', 'workbook.xlsx', 'presentation.pptx']) {
      const info = await page.evaluate(async (name) => {
        const r = await fetch('/samples/office/' + name);
        return DocumentForensics.analyze('doc-metadata', new File([await r.arrayBuffer()], name));
      }, name);
      assert(
        info.properties['docProps/core.xml'].some(
          (x) => x.field === 'creator' && x.value === 'DGC Synthetic',
        ),
      );
      if (name === 'tracked.docx') {
        assert.equal(info.embeddedRevisionEvents.length, 2);
        assert.equal(info.embeddedRevisionEvents[0].kind, 'del');
        assert.equal(info.embeddedRevisionEvents[1].text, 'Amount 101');
      }
      console.log('PASS original Office properties', name);
    }
    const officeSafety = await page.evaluate(async () => {
      const checks = [];
      for (const [label, entries] of [
        ['extension mismatch', { 'xl/workbook.xml': '<workbook/>' }],
        ['malformed XML', { 'word/document.xml': '<document/>', 'docProps/core.xml': '<broken>' }],
        [
          'entity declaration',
          {
            'word/document.xml': '<document/>',
            'docProps/core.xml': '<!DOCTYPE x [<!ENTITY e "data">]><x>&e;</x>',
          },
        ],
        [
          'large XML',
          { 'word/document.xml': '<document/>', 'docProps/core.xml': 'x'.repeat(2000001) },
        ],
      ]) {
        const zip = new JSZip();
        for (const [name, text] of Object.entries(entries)) zip.file(name, text);
        try {
          await DocumentForensics.analyze(
            'doc-metadata',
            new File([await zip.generateAsync({ type: 'uint8array' })], 'bad.docx'),
          );
          checks.push({ label, rejected: false });
        } catch (e) {
          checks.push({ label, rejected: true, error: e.message });
        }
      }
      const zip = new JSZip();
      zip.file('word/document.xml', '<document/>');
      zip.file(
        'docProps/custom.xml',
        '<Properties><property name="Case ID"><lpwstr>SYNTHETIC-01</lpwstr></property></Properties>',
      );
      const custom = await DocumentForensics.analyze(
        'doc-metadata',
        new File([await zip.generateAsync({ type: 'uint8array' })], 'custom.docx'),
      );
      return { checks, custom };
    });
    assert(officeSafety.checks.every((x) => x.rejected));
    assert.equal(officeSafety.custom.properties['docProps/custom.xml'][0].field, 'Case ID');
    assert.equal(officeSafety.custom.properties['docProps/custom.xml'][0].value, 'SYNTHETIC-01');
    console.log('PASS Office XML bounds, malformed/entity rejection, custom properties');
    for (const [kind, names] of [
      ['audio', ['tones.mp3', 'tones.flac', 'tones.m4a', 'tones.ogg']],
      ['video', ['clip.avi', 'clip.mkv', 'clip.mov', 'clip.webm']],
    ]) {
      for (const name of names) {
        const metadata = await page.evaluate(
          async ({ kind, name }) => {
            const r = await fetch('/samples/media/' + name);
            return MediaMetadata.inspect(new File([await r.arrayBuffer()], name), kind);
          },
          { kind, name },
        );
        assert(metadata.codec, kind + '/' + name + ' codec');
        assert(
          JSON.stringify(metadata.tracks).includes('Original DGC synthetic'),
          name + ' embedded title',
        );
        assert(
          metadata.durationSeconds > 1 && metadata.durationSeconds < 4,
          kind + '/' + name + ' duration',
        );
        if (kind === 'video') {
          assert.equal(metadata.width, 480);
          assert.equal(metadata.height, 270);
        } else assert.equal(metadata.originalSampleRate, 16000);
        console.log('PASS format metadata', name, metadata.format, metadata.codec);
      }
    }
    assert.deepEqual(errors, [], 'Unexpected JavaScript exception(s)');
    console.log(
      completed +
        ' real desktop tool examples passed. Live-chain and model dependencies stayed explicitly unavailable.',
    );
  } finally {
    await browser.close();
  }
}
run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => server.close());
