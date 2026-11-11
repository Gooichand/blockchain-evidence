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
        if (id === 'clone-detect') assert(r.exactTilePairs.length > 0);
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
    if (!(await page.$('#flFileInput'))) await page.click('[aria-label="Expand evidence vault"]');
    await page.waitForSelector('#flFileInput');
    await (await page.$('#flFileInput')).uploadFile(path.join(root, 'samples/network/demo.pcap'));
    await page.waitForFunction(() => ForensicLab.getState().file?.name === 'demo.pcap');
    await openTool('network', 'traffic-analysis');
    await page.$eval('[aria-label="Flow fanout threshold"]', (e) => (e.value = '2'));
    await page.$eval('[aria-label="Flow SYN threshold"]', (e) => (e.value = '1'));
    await page.evaluate(() =>
      [...document.querySelectorAll('#flWorkspace button')]
        .find((e) => e.textContent === 'Analyze selected capture')
        .click(),
    );
    await page.waitForFunction(() =>
      document.querySelector('#flWorkspace pre')?.textContent.includes('anomalyCandidates'),
    );
    const flagged = JSON.parse(await page.$eval('#flWorkspace pre', (e) => e.textContent));
    assert.equal(flagged.anomalyCandidates.flags.length, 3);
    await capture('network-flow-rules');
    if (!(await page.$('#flFileInput'))) await page.click('[aria-label="Expand evidence vault"]');
    await page.waitForSelector('#flFileInput');
    await (await page.$('#flFileInput')).uploadFile(retainedFile);
    await page.waitForFunction(
      () => ForensicLab.getState().file?.name === 'dgc-retained-user-input.bin',
    );
    await openTool('network', 'protocol-decode');
    await page.select('[aria-label="Protocol input mode"]', 'custom');
    await page.$eval('[aria-label="Protocol hex bytes"]', (e) => (e.value = '01 0005 48 69'));
    await page.$eval(
      '[aria-label="Custom protocol schema"]',
      (e) =>
        (e.value = JSON.stringify({
          fields: [
            { name: 'version', offset: 0, length: 1, type: 'uint' },
            { name: 'length', offset: 1, length: 2, type: 'uint' },
            { name: 'message', offset: 3, length: 2, type: 'utf8' },
          ],
        })),
    );
    await page.evaluate(() =>
      [...document.querySelectorAll('#flWorkspace button')]
        .find((e) => e.textContent === 'Analyze selected capture')
        .click(),
    );
    await page.waitForFunction(() =>
      document.querySelector('#flWorkspace pre')?.textContent.includes('fields'),
    );
    const custom = JSON.parse(await page.$eval('#flWorkspace pre', (e) => e.textContent));
    assert.deepEqual(
      custom.fields.map((x) => x.value),
      [1, 5, 'Hi'],
    );
    await capture('network-custom-protocol');
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
      ['demo.pcap', 'network', 4],
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
