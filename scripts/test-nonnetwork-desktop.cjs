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
const groups = {
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
    // Exact decoder is independently compared with FFmpeg-generated reference pixels.
    const exactChecks = await page.evaluate(async () => {
      const bytes = await (await fetch('/samples/video/exact/b-frames.mp4')).arrayBuffer();
      const file = new File([bytes], 'b-frames.mp4', { type: 'video/mp4' }),
        checks = [];
      for (const [index, expected] of [
        [0, 1],
        [5, 2],
        [23, 3],
      ]) {
        const r = await VideoForensics.analyze('frame-extract', file, 0, index);
        const image = await createImageBitmap(
          await (await fetch('/samples/video/exact/expected-' + expected + '.png')).blob(),
        );
        const c = document.createElement('canvas');
        c.width = image.width;
        c.height = image.height;
        c.getContext('2d').drawImage(image, 0, 0);
        image.close();
        const a = r.frames[0].canvas.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        const b = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let sum = 0,
          max = 0;
        for (let i = 0; i < a.length; i++)
          if (i % 4 !== 3) {
            sum += Math.abs(a[i] - b[i]);
            max = Math.max(max, Math.abs(a[i] - b[i]));
          }
        checks.push({
          index,
          actual: r.summary.presentationFrameIndex,
          mae: sum / (c.width * c.height * 3),
          max,
          timestamp: r.summary.presentationSeconds,
        });
      }
      const vfr = new File(
        [await (await fetch('/samples/video/exact/vfr.mp4')).arrayBuffer()],
        'vfr.mp4',
      );
      const variable = await VideoForensics.analyze('frame-extract', vfr, 0, 18);
      if (
        variable.summary.presentationFrameIndex !== 18 ||
        Math.abs(variable.summary.presentationSeconds - 2) > 0.0001
      )
        throw Error('VFR presentation mapping failed.');
      const vfrByTime = await VideoForensics.analyze('frame-extract', vfr, 2.05);
      if (vfrByTime.summary.presentationFrameIndex !== 18) throw Error('VFR time mapping failed.');
      const byTime = await VideoForensics.analyze('frame-extract', file, 0.46);
      if (byTime.summary.presentationFrameIndex !== 5)
        throw Error('Time did not select covering B-frame.');
      let rejected = false;
      try {
        await VideoForensics.analyze('frame-extract', file, 0, 24);
      } catch (e) {
        rejected = true;
      }
      if (!rejected) throw Error('Out-of-range index accepted.');
      return checks;
    });
    console.log('Exact pixel comparison diagnostics', JSON.stringify(exactChecks));
    for (const c of exactChecks) {
      assert.equal(c.index, c.actual);
      assert(c.mae < 4, 'FFmpeg frame comparison MAE ' + c.mae);
    }
    console.log(
      'PASS exact AVC first/B/last frames vs FFmpeg RGB reference',
      JSON.stringify(exactChecks),
    );
    const privateChecks = await page.evaluate(async () => {
      const { value } = await CryptoTools.example('rsa'),
        j = JSON.parse(value),
        r = await CryptoTools.validateRSA(value);
      if (r.validation !== 'PRIVATE CONSISTENCY CHECKS PASS' || !r.oaepRoundTrip)
        throw Error('Private RSA failed.');
      for (const k of ['d', 'p', 'q', 'dp', 'dq', 'qi'])
        if (JSON.stringify(r).includes(j[k])) throw Error('Private RSA value leaked to results.');
      const b = CryptoTools.un64(j.qi);
      b[b.length - 1] ^= 2;
      j.qi = CryptoTools.b64(b);
      const bad = await CryptoTools.validateRSA(JSON.stringify(j));
      if (bad.validation !== 'FAILED' || bad.privateChecks.qInverseMatches)
        throw Error('Bad CRT accepted.');
      return { valid: r.validation, oaep: r.oaepRoundTrip, changedCRT: bad.validation };
    });
    console.log(
      'PASS real Chrome private RSA pair and negative CRT',
      JSON.stringify(privateChecks),
    );
    let completed = 0;
    for (const [category, ids] of Object.entries(groups)) {
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
        if (id === 'clone-detect') {assert.equal(r.featureComparison.state,'CANDIDATE_REPEATED_REGIONS');assert(r.featureComparison.models[0].inlierCount>=8);}
        if (id === 'pdf-inspector') {
          assert(r.objectInventory.objectCount > 0);
          assert(r.objectInventory.objects.some((o) => o.dictionary));
        }
        if (id === 'ocr') assert(r.text.includes('DGC DEMO'));
        if (id === 'hidden-text')
          assert(r.pages[0].candidates.some((x) => x.text.includes('INVISIBLE')));
        if (id === 'signature') {
          assert.equal(r.signatures[0].cryptographicSignature, 'VALID FOR SIGNED BYTE RANGES');
          assert.equal(r.signatures[0].certificateTrust, 'NOT CHECKED');
        }
        if (id === 'pdf-metadata') assert.equal(r.revisionHistory.preservedRevisionCount, 3);
        if (category === 'video') {
          assert.equal(r.width, 480);
          assert.equal(r.durationSeconds, 3);
        }
        if (id === 'keyframe') {assert.equal(r.syncSampleCount,3);assert.equal(r.decodedFrameCount,30);assert.equal(r.groups.length,3);}
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
        if (id === 'fingerprint') {assert.equal(r.candidateMatch,true);assert(Math.abs(r.secondMinusFirstOffsetSeconds+0.734)<0.04);}
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
          assert.equal(r.cidVerified, true);
          assert.equal(
            r.byteLength,
            JSON.parse(fs.readFileSync(path.join(root, 'samples/ipfs/example.json'), 'utf8'))
              .byteLength,
          );
          assert(r.verifiedBlockCount > 1);
          assert(r.untrustedUtf8Preview.includes('Original DGC'));
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
    if (!(await page.$('#flFileInput'))) await page.click('[aria-label="Expand evidence vault"]');
    await (
      await page.$('#flFileInput')
    ).uploadFile(path.join(root, 'samples/video/exact/b-frames.mp4'));
    await page.waitForFunction(() => ForensicLab.getState().file?.name === 'b-frames.mp4');
    await openTool('video', 'frame-extract');
    await page.$eval('[aria-label="Exact frame index"]', (e) => (e.value = '5'));
    await page.evaluate(() =>
      [...document.querySelectorAll('#flWorkspace button')]
        .find((x) => x.textContent === 'Analyze selected video')
        .click(),
    );
    await page.waitForFunction(
      () =>
        document.querySelector('#flWorkspace pre') ||
        document.querySelector('#flWorkspace [role=alert]'),
    );
    const bFrame = JSON.parse(await page.$eval('#flWorkspace pre', (e) => e.textContent));
    assert.equal(bFrame.presentationFrameIndex, 5);
    assert.equal(bFrame.extraction, 'EXACT DECODED SAMPLE');
    assert(
      (await page.$eval('#flWorkspace', (e) => e.textContent)).includes(
        'Exact presentation frame 5 at 0.416667 s',
      ),
    );
    await capture('video-exact-bframe');
    for (const [name, expected] of [
      ['tampered', 'INVALID'],
      ['later-update', 'VALID FOR SIGNED BYTE RANGES'],
    ]) {
      if (!(await page.$('#flFileInput'))) await page.click('[aria-label="Expand evidence vault"]');
      await (
        await page.$('#flFileInput')
      ).uploadFile(path.join(root, 'samples/document/signatures/' + name + '.pdf'));
      await page.waitForFunction((n) => ForensicLab.getState().file?.name === n, {}, name + '.pdf');
      await openTool('document', 'signature');
      await page.evaluate(() =>
        [...document.querySelectorAll('#flWorkspace button')]
          .find((x) => x.textContent === 'Analyze selected document')
          .click(),
      );
      await page.waitForFunction(
        () =>
          document.querySelector('#flWorkspace pre') ||
          document.querySelector('#flWorkspace [role=alert]'),
      );
      const r = JSON.parse(await page.$eval('#flWorkspace pre', (e) => e.textContent));
      assert.equal(r.signatures[0].cryptographicSignature, expected);
      if (name === 'later-update') assert.equal(r.signatures[0].coversCurrentFile, false);
      await capture('document-signature-' + name);
      console.log('PASS real uploaded PDF signature', name, expected);
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
    for (const [name, location, minEvents] of [
      ['tracked.docx', 'office', 2],
    ]) {
      const derived = await page.evaluate(
        async ({ name, location }) => {
          const r = await fetch('/samples/' + location + '/' + name);
          return TimelineTools.analyze(
            'evidence-timeline',
            new File([await r.arrayBuffer()], name),
          );
        },
        { name, location },
      );
      assert(derived.displayedCount >= minEvents);
      assert.equal(derived.sources[0].sha256.length, 64);
      assert(derived.events.every((e) => e.sourceReference));
      console.log('PASS source-derived evidence chronology', name, derived.displayedCount);
    }
    await openTool('timeline', 'evidence-timeline');
    if (!(await page.$('#flFileInput'))) await page.click('[aria-label="Expand evidence vault"]');
    await (await page.$('#flFileInput')).uploadFile(path.join(root, 'samples/office/tracked.docx'));
    await page.evaluate(() =>
      [...document.querySelectorAll('#flWorkspace button')]
        .find((e) => e.textContent === 'Build imported timeline')
        .click(),
    );
    await page.waitForFunction(
      () =>
        document.querySelector('#flWorkspace pre') ||
        document.querySelector('#flWorkspace [role=alert]'),
    );
    assert(
      (await page.$eval('#flWorkspace pre', (e) => e.textContent)).includes('sourceReference'),
    );
    await capture('timeline-derived-evidence');
    await openTool('timeline', 'invest-timeline');
    if (!(await page.$('#flFileInput'))) await page.click('[aria-label="Expand evidence vault"]');
    await (
      await page.$('#flFileInput')
    ).uploadFile(path.join(root, 'samples/timeline/source-a.json'));
    await (
      await page.$('[aria-label="Additional investigation sources"]')
    ).uploadFile(path.join(root, 'samples/timeline/source-b.json'));
    await page.$eval('[aria-label="Correlation window seconds"]', (e) => (e.value = '30'));
    await page.evaluate(() =>
      [...document.querySelectorAll('#flWorkspace button')]
        .find((e) => e.textContent === 'Build imported timeline')
        .click(),
    );
    await page.waitForFunction(
      () =>
        document.querySelector('#flWorkspace pre') ||
        document.querySelector('#flWorkspace [role=alert]'),
    );
    const correlation = JSON.parse(await page.$eval('#flWorkspace pre', (e) => e.textContent));
    assert.equal(correlation.displayedCount, 3);
    assert.equal(correlation.sources.length, 2);
    assert.equal(correlation.correlationCandidates.length, 1);
    assert.equal(correlation.correlationCandidates[0].secondsApart, 10);
    await capture('timeline-cross-source-correlation');
    if (!(await page.$('#flFileInput'))) await page.click('[aria-label="Expand evidence vault"]');
    await (await page.$('#flFileInput')).uploadFile(retainedFile);
    console.log(
      'PASS multi-file timeline merge and exact-entity/time correlation through real controls',
    );
    await openTool('crypto', 'aes');
    await page.select('[aria-label="AES operation"]', 'analyze-key');
    await page.$eval('[aria-label="Cryptography input"]', (e) => (e.value = '00'.repeat(16)));
    await page.evaluate(() =>
      [...document.querySelectorAll('#flWorkspace button')]
        .find((e) => e.textContent === 'Run local tool')
        .click(),
    );
    await page.waitForFunction(() => document.querySelector('#flWorkspace pre'));
    const aesInfo = JSON.parse(await page.$eval('#flWorkspace pre', (e) => e.textContent));
    assert.equal(aesInfo.keyBits, 128);
    for (const size of [16, 24, 32]) {
      const key = await page.evaluate(
        async (size) => CryptoTools.analyze('aes', '00'.repeat(size), 'analyze-key'),
        size,
      );
      assert.equal(key.keyBits, size * 8);
      assert.equal(key.standardAESLength, true);
      assert.equal(key.providerImport, size !== 24);
    }
    assert(aesInfo.repeatingPeriodsBytes.includes(1));
    await capture('crypto-aes-key-analysis');
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
    await openTool('metadata', 'office-metadata');
    if (!(await page.$('#flFileInput'))) await page.click('[aria-label="Expand evidence vault"]');
    await (await page.$('#flFileInput')).uploadFile(path.join(root, 'samples/office/tracked.docx'));
    await page.evaluate(() =>
      [...document.querySelectorAll('#flWorkspace button')]
        .find((e) => e.textContent === 'Read selected metadata')
        .click(),
    );
    await page.waitForFunction(
      () =>
        document.querySelector('#flWorkspace pre') ||
        document.querySelector('#flWorkspace [role=alert]'),
    );
    assert((await page.$eval('#flWorkspace pre', (e) => e.textContent)).includes('Amount 101'));
    await capture('metadata-office-revisions');
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
    await openTool('crypto', 'digisig');
    await page.$eval(
      '[aria-label="Cryptography input"]',
      (e) => (e.value = 'Original browser signing test'),
    );
    await page.select('[aria-label="Signature operation"]', 'sign');
    await page.evaluate(() =>
      [...document.querySelectorAll('#flWorkspace button')]
        .find((e) => e.textContent === 'Run local tool')
        .click(),
    );
    await page.waitForFunction(() =>
      document.querySelector('#flWorkspace pre')?.textContent.includes('signatureEncoding'),
    );
    const signed = JSON.parse(await page.$eval('#flWorkspace pre', (e) => e.textContent));
    assert.equal(signed.text, 'Original browser signing test');
    assert(!signed.publicKey.d);
    assert.equal(
      await page.evaluate(
        async (r) =>
          (await CryptoTools.analyze('digisig', JSON.stringify(r), 'verify')).signatureMatches,
        signed,
      ),
      true,
    );
    await capture('crypto-signature-generated');
    for (const id of [
      'tx-verify',
      'evidence-verify',
      'block-explorer',
      'chain-custody',
      'provenance',
    ]) {
      await openTool('blockchain', id);
      await page.click('[aria-label="Try blockchain example"]');
      await page.waitForSelector('#flWorkspace [role=alert]');
      assert((await page.$eval('#flWorkspace', (e) => e.textContent)).includes('unavailable'));
      await capture('blockchain-' + id + '-unavailable');
    }
    for (const [category, id] of [
      ['image', 'ai-tamper'],
      ['ai', 'ai-assistant'],
      ['ai', 'ai-summary'],
      ['ai', 'ai-report'],
      ['ai', 'ai-tamper'],
    ]) {
      await openTool(category, id);
      assert(
        (await page.$eval('#flWorkspace', (e) => e.textContent))
          .toLowerCase()
          .includes('unavailable'),
      );
      await capture(category + '-' + id + '-unavailable');
    }
    if (!(await page.$('#flFileInput'))) await page.click('[aria-label="Expand evidence vault"]');
    await page.waitForSelector('#flFileInput');
    await (await page.$('#flFileInput')).uploadFile(path.join(root,'samples/audio/landmarks/original.wav'));
    await page.waitForFunction(()=>ForensicLab.getState().file?.name==='original.wav');
    await openTool('audio','fingerprint');
    await (await page.$('[aria-label="Second audio file"]')).uploadFile(path.join(root,'samples/audio/landmarks/different.wav'));
    await page.evaluate(()=>[...document.querySelectorAll('#flWorkspace button')].find(e=>e.textContent==='Analyze selected audio').click());
    await page.waitForSelector('#flWorkspace pre');
    assert.equal(JSON.parse(await page.$eval('#flWorkspace pre',e=>e.textContent)).candidateMatch,false);
    await capture('audio-fingerprint-selected-negative');
    await page.click('[aria-label="Try audio example"]');await page.waitForSelector('#flWorkspace pre');
    assert.equal(JSON.parse(await page.$eval('#flWorkspace pre',e=>e.textContent)).candidateMatch,true);
    assert.equal(await page.$eval('[aria-label="Second audio file"]',e=>e.files[0].name),'different.wav');
    assert.equal(await page.evaluate(()=>ForensicLab.getState().file.name),'original.wav');
    await capture('audio-fingerprint-landmark-match');
    if (!(await page.$('#flFileInput'))) await page.click('[aria-label="Expand evidence vault"]');
    await page.waitForSelector('#flFileInput');
    await (await page.$('#flFileInput')).uploadFile(retainedFile);
    await page.waitForFunction(()=>ForensicLab.getState().file?.name==='dgc-retained-user-input.bin');
    if (!(await page.$('#flFileInput'))) await page.click('[aria-label="Expand evidence vault"]');
    await page.waitForSelector('#flFileInput');
    await (await page.$('#flFileInput')).uploadFile(path.join(root,'samples/document/concealed/signals.pdf'));
    await page.waitForFunction(()=>ForensicLab.getState().file?.name==='signals.pdf');
    await openTool('document','hidden-text');
    await page.evaluate(()=>[...document.querySelectorAll('#flWorkspace button')].find(e=>e.textContent==='Analyze selected document').click());
    await page.waitForSelector('#flWorkspace pre');
    const concealed=JSON.parse(await page.$eval('#flWorkspace pre',e=>e.textContent));
    const candidates=concealed.pages[0].candidates;
    for(const label of ['WHITE ON WHITE HIDDEN','INVISIBLE RENDER MODE','ZERO OPACITY TEXT'])assert(candidates.some(x=>x.text===label),JSON.stringify(concealed));
    assert(!candidates.some(x=>x.text.includes('VISIBLE WHITE ON DARK')||x.text==='VISIBLE BLACK TEXT'||x.text==='VISIBLE AFTER RESTORE'));
    fs.writeFileSync(path.join(screenshotDir,'concealed-text-validation.json'),JSON.stringify(concealed,null,2));
    await capture('document-concealed-text-measured');console.log('PASS actual PDF rendered white-region/white-on-dark negative, invisible and zero-opacity signals');
    const videoMeasurements=await page.evaluate(async()=>{
      const results=[];
      for(const name of ['measurement/cuts-gops.mp4','exact/b-frames.mp4','exact/vfr.mp4']){
        const response=await fetch('/samples/video/'+name),file=new File([await response.arrayBuffer()],name);
        const result=(await VideoForensics.analyze('keyframe',file)).summary;
        if(name.includes('cuts-gops')){if(result.decodedFrameCount!==40)throw Error('Frame count mismatch.');const cuts=result.events.filter(e=>e.kind==='ABRUPT_VISUAL_CHANGE_CANDIDATE');if(cuts.length!==3)throw Error('Visual change count '+JSON.stringify(cuts));if(!result.events.some(e=>e.kind==='NEAR_BLACK_INTERVAL'))throw Error('Black interval missed.');}
        results.push({file:name,result});
      }
      const response=await fetch('/samples/video/measurement/corrupted-sample.mp4');let rejected=false;try{await VideoForensics.analyze('keyframe',new File([await response.arrayBuffer()],'damaged.mp4'));}catch{rejected=true;}if(!rejected)throw Error('Damaged video falsely passed complete decode.');
      const audio=await (async()=>{
        const load=async(n)=>new File([await (await fetch('/samples/video/measurement/'+n)).arrayBuffer()],n);
        const aac=(await VideoForensics.analyze('keyframe',await load('audio-aac.mp4'))).summary;
        if(aac.audioStreams.length!==1||aac.audioStreams[0].validation!=='DECODED_ALL')throw Error('AAC stream not validated: '+JSON.stringify(aac.audioStreams));
        if(aac.audioStreams[0].sampleCount!==88)throw Error('Audio sample count '+aac.audioStreams[0].sampleCount);
        if(aac.audioStreams[0].sampleRate!==44100||aac.audioStreams[0].channels!==1)throw Error('Audio format mismatch '+JSON.stringify(aac.audioStreams[0]));
        if(aac.audioStreams[0].decodedSampleFrames<=0)throw Error('No decoded audio frames.');
        if(aac.ignoredOtherTrackCount!==0)throw Error('Track accounting wrong.');
        for(const n of ['truncated-audio.mp4','corrupted-audio.mp4']){let r=false;try{await VideoForensics.analyze('keyframe',await load(n));}catch{r=true;}if(!r)throw Error(n+' falsely passed all-stream validation.');}
        const ac3=(await VideoForensics.analyze('keyframe',await load('audio-ac3.mp4'))).summary;
        if(ac3.audioStreams.length!==1||ac3.audioStreams[0].validation!=='NOT VALIDATED')throw Error('AC-3 should be NOT VALIDATED: '+JSON.stringify(ac3.audioStreams));
        if(ac3.decodedFrameCount!==20)throw Error('AC-3 file video should still decode: '+ac3.decodedFrameCount);
        const insp=(await VideoForensics.analyze('video-inspector',await load('audio-aac.mp4'))).summary;
        if(!insp.streamValidation||!insp.streamValidation.audioStreams||insp.streamValidation.audioStreams[0].validation!=='DECODED_ALL')throw Error('video-inspector stream validation missing.');
        return {aac:aac.audioStreams[0],ac3:ac3.audioStreams[0],inspectorStreamValidation:!!insp.streamValidation};
      })();
      results.push({audio});
      return results;
    });
    fs.writeFileSync(path.join(screenshotDir,'video-measurements-validation.json'),JSON.stringify(videoMeasurements,null,2));
    console.log('PASS all-frame H264 measurements: independent frame-count/timestamps, Bframes/VFR, cuts/black/freeze and damaged-sample rejection');
    if (!(await page.$('#flFileInput'))) await page.click('[aria-label="Expand evidence vault"]');
    await page.waitForSelector('#flFileInput');
    await (await page.$('#flFileInput')).uploadFile(path.join(root,'samples/video/measurement/cuts-gops.mp4'));
    await page.waitForFunction(()=>ForensicLab.getState().file?.name==='cuts-gops.mp4');
    for(const id of ['keyframe','vid-timeline']){
      await openTool('video',id);
      await page.evaluate(()=>[...document.querySelectorAll('#flWorkspace button')].find(e=>e.textContent==='Analyze selected video').click());
      await page.waitForSelector('#flWorkspace pre');
      const r=JSON.parse(await page.$eval('#flWorkspace pre',e=>e.textContent));assert.equal(r.decodedFrameCount,40);
      assert.deepEqual(r.events.filter(e=>e.kind==='ABRUPT_VISUAL_CHANGE_CANDIDATE').map(e=>e.seconds),[1,2,3]);
      if(id==='vid-timeline')assert.equal((await page.$$('#flWorkspace canvas')).length,4);
      assert(!(await page.$eval('#flWorkspace',e=>e.textContent)).includes('undefined'));
      await capture('video-'+id+'-all-frames');
    }
    const copyMatrix=await page.evaluate(async()=>{
      const actualWorker=window.Worker;
      window.Worker=class{constructor(){setTimeout(()=>this.onerror({message:'controlled test failure'}),0);}postMessage(){}terminate(){}};
      try{const r=await fetch('/samples/images/copy-move/unique.png');let failed=false;try{await ImageForensics.analyze('clone-detect',new File([await r.arrayBuffer()],'unique.png'));}catch(e){failed=e.message==='Classical feature engine unavailable.';}if(!failed)throw Error('Worker failure not handled.');}finally{window.Worker=actualWorker;}
      const checks=[];
      for(const [name,expected] of [['translated.png',true],['recompressed.jpg',true],['rotated-scaled.jpg',true],['unique.png',false],['flat.png',false]]){
        const response=await fetch('/samples/images/copy-move/'+name);if(!response.ok)throw Error('Copy-move fixture missing.');
        const result=await ImageForensics.analyze('clone-detect',new File([await response.arrayBuffer()],name));
        const r=result.summary.featureComparison;if((r.models.length>0)!==expected)throw Error(name+' unexpected feature result');checks.push({file:name,expected,result:r});
      }return checks;
    });
    fs.writeFileSync(path.join(screenshotDir,'copy-move-validation.json'),JSON.stringify(copyMatrix,null,2));
    console.log('PASS actual CSP-safe ORB worker: off-grid translation, JPEG, rotation/scale; unique/flat negatives');
    const acousticMatrix = await page.evaluate(async()=>{
      async function file(name){const r=await fetch('/samples/audio/landmarks/'+name);if(!r.ok)throw Error('Fixture unavailable.');return new File([await r.arrayBuffer()],name);}
      const first=await file('original.wav'),checks=[];
      for(const [name,expected] of [['original.wav',true],['trimmed.mp3',true],['resampled.m4a',true],['noisy.wav',true],['different.wav',false],['reordered.wav',false]]){
        const r=(await AudioForensics.analyze('fingerprint',first,await file(name))).summary;
        if(r.candidateMatch!==expected)throw Error(name+' unexpected fingerprint '+JSON.stringify(r));
        if(name==='trimmed.mp3'&&Math.abs(r.secondMinusFirstOffsetSeconds+.734)>.04)throw Error('Incorrect acoustic offset.');
        checks.push({file:name,expected,result:r});
      }return checks;
    });
    fs.writeFileSync(path.join(screenshotDir,'acoustic-landmark-validation.json'),JSON.stringify(acousticMatrix,null,2));
    console.log('PASS real worker acoustic landmark matching: WAV, MP3 trim, AAC resample, gain/noise; different/reordered negatives');
    const retainedBeforeJPEG=await page.evaluate(()=>ForensicLab.getState().file.name);
    await openTool('image','compression');
    await page.evaluate(()=>[...document.querySelectorAll('#flWorkspace button')].find(b=>b.textContent.includes('Try example')).click());
    await page.waitForFunction(()=>document.querySelector('#flWorkspace pre')?.textContent.includes('ALIGNED_DOUBLE_QUANTIZATION_CANDIDATE'));
    assert.equal(await page.evaluate(()=>ForensicLab.getState().file.name),retainedBeforeJPEG);
    await capture('image-double-jpeg-candidate');
    const jpegMatrix=await page.evaluate(async()=>{
      const out=[];for(const name of ['double-75-95.jpg','double-85-95.jpg','single-50.jpg','single-95.jpg','single-progressive95.jpg','double-50-95.jpg','double-65-95.jpg','double-95-50.jpg','double-75-75.jpg','shifted-double85-95.jpg','flat95.jpg']){
        const file=await(await fetch('/samples/image/double-jpeg/'+name)).blob();const r=await new Promise((resolve,reject)=>{const w=new Worker('/double-jpeg-worker.js');const timer=setTimeout(()=>{w.terminate();reject(Error('JPEG worker timeout.'));},25000);w.onmessage=({data})=>{clearTimeout(timer);w.terminate();data.ok?resolve(data.result):reject(Error(data.error));};w.postMessage(file);});
        const positive=['double-75-95.jpg','double-85-95.jpg'].includes(name);if((r.state==='ALIGNED_DOUBLE_QUANTIZATION_CANDIDATE')!==positive)throw Error('JPEG case '+name+' unexpected.');out.push({file:name,result:r});
      }return out;
    });
    const jpegPreflight=await page.evaluate(async()=>{
      let previews=0;const original=globalThis.createImageBitmap;globalThis.createImageBitmap=()=>{previews++;throw Error('Unexpected preview before coefficient validation.');};
      try{
        const source=new Uint8Array(await(await fetch('/samples/image/double-jpeg/single-95.jpg')).arrayBuffer());
        let sof=-1;for(let i=0;i<source.length-9;i++)if(source[i]===255&&source[i+1]===192){sof=i;break;}if(sof<0)throw Error('SOF missing.');
        source[sof+5]=0x0b;source[sof+6]=0xb8;source[sof+7]=0x0b;source[sof+8]=0xb8;
        const errors=[];for(const file of [new File([new Uint8Array([0,1,2])],'bad.jpg'),new File([source],'oversized-dimensions.jpg')]){
          try{await ImageForensics.analyze('compression',file);throw Error('Invalid JPEG unexpectedly accepted.');}catch(e){errors.push(e.message);}
        }
        if(previews!==0||!errors[1].includes('maxResolutionInMP'))throw Error('JPEG preflight did not reject before preview: '+JSON.stringify({errors,previews}));
        return {previews,errors};
      }finally{globalThis.createImageBitmap=original;}
    });
    fs.writeFileSync(path.join(screenshotDir,'double-jpeg-preflight.json'),JSON.stringify(jpegPreflight,null,2));
    fs.writeFileSync(path.join(screenshotDir,'double-jpeg-validation.json'),JSON.stringify(jpegMatrix,null,2));
    console.log('PASS actual coefficient worker JPEG positives, single negatives and5 documented genuine-double misses');
    await openTool('network','dns-lookup');
    await page.$eval('[aria-label="Public DNS domain or IP"]',e=>e.value='preserve-my-typed-domain.com');
    await page.click('[aria-label="Try live DNS example"]');
    if(process.env.LIVE_DNS_QA === '1'){
      await page.waitForSelector('#flWorkspace pre');
      const dnsResult=JSON.parse(await page.$eval('#flWorkspace pre',e=>e.textContent));
      assert.equal(dnsResult.records.A.state,'FOUND');assert.equal(dnsResult.registration.state,'FOUND');
      assert.equal(await page.$eval('[aria-label="Public DNS domain or IP"]',e=>e.value),'preserve-my-typed-domain.com');
      assert.equal(await page.evaluate(()=>ForensicLab.getState().file.name),'dgc-retained-user-input.bin');
      fs.writeFileSync(path.join(screenshotDir,'public-dns-domain-result.json'),JSON.stringify(dnsResult,null,2));
      await page.evaluate(()=>{const e=document.createElement('p');e.textContent='LOCAL QA: actual UI + live DNS/RDAP service. Test HTTP adapter, not the deployed authenticated site. Auth checks are tested separately.';e.style='background:#fff0cc;padding:12px;';document.querySelector('#flWorkspace').prepend(e);});
      await capture('network-dns-live-domain');
      await page.$eval('[aria-label="Public DNS domain or IP"]',e=>e.value='8.8.8.8');
      await page.evaluate(()=>[...document.querySelectorAll('#flWorkspace button')].find(e=>e.textContent==='Run public lookup').click());
      await page.waitForFunction(()=>document.querySelector('#flWorkspace pre')?.textContent.includes('dns.google'));
      const reverse=JSON.parse(await page.$eval('#flWorkspace pre',e=>e.textContent));assert.equal(reverse.reverse.state,'FOUND');
      fs.writeFileSync(path.join(screenshotDir,'public-dns-reverse-result.json'),JSON.stringify(reverse,null,2));
      await capture('network-dns-live-reverse');console.log('PASS real public DNS/RDAP domain and PTR UI, typed input and evidence preserved');
    }else{
      await page.waitForSelector('#flWorkspace [role=alert]');
      assert((await page.$eval('#flWorkspace',e=>e.textContent)).includes('unavailable'));
    }
    if(process.env.LIVE_TLS_QA==='1'){
      await openTool('network','ssl-inspect');
      await page.$eval('[aria-label="Public TLS hostname"]',e=>e.value='preserve-typed.example.net');
      await page.click('[aria-label="Try live TLS example"]');
      await page.waitForSelector('#flWorkspace pre');
      const result=JSON.parse(await page.$eval('#flWorkspace pre',e=>e.textContent));
      assert.equal(result.negotiated.state,'CONNECTED');assert.equal(result.negotiated.nodeDefaultTrustAuthorized,true);assert.equal(result.negotiated.hostnameMatches,true);assert(result.negotiated.certificateChain.length>=2);
      assert.equal(await page.$eval('[aria-label="Public TLS hostname"]',e=>e.value),'preserve-typed.example.net');
      fs.writeFileSync(path.join(screenshotDir,'public-tls-validation.json'),JSON.stringify(result,null,2));
      await page.evaluate(()=>{const p=document.createElement('p');p.textContent='LOCAL QA: actual UI and live TLS service through a test HTTP adapter, not the deployed authenticated website. Auth/invalid-certificate handling tested separately.';p.style='padding:12px;background:#fff0cc;';document.querySelector('#flWorkspace').prepend(p);});
      await capture('network-public-tls');console.log('PASS actual public TLS certificate chain/default roots/hostname/cipher/protocol UI');
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
