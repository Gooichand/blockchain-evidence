/* Bounded document inspection. Never infer signature trust or legal validity. */
(function (root) {
  'use strict';
  const guides = {
    'pdf-inspector': [
      'PDF Inspector',
      'Reads PDF page count, metadata and text with PDF.js, then inventories parsed indirect objects/dictionaries/references and encoded stream sizes with local pdf-lib in a worker. Shows structural markers such as actions/embedded files without executing them. Object limit: 10,000, output: 2,000 objects, 25-second inventory timeout. Not full conformance, revision history, signature verification or proof of safety/authenticity. Encrypted files are unsupported.',
    ],
    'doc-metadata': [
      'Document Metadata Viewer',
      'Reads PDF metadata or DOCX/XLSX/PPTX core, application and custom properties, plus embedded DOCX tracked changes/comments. Values and revision author/date claims are editable, not verified authorship or complete history. Legacy DOC/XLS/PPT and ODT are not supported.',
    ],
    ocr: [
      'English OCR',
      'Recognizes English printed text from PNG, JPEG or scanned PDF using a locally bundled Tesseract model. Select a file and run or try the synthetic scan. PDFs are rendered at 2x scale, up to 10 pages / 40 million total pixels. Recognition can be wrong: check the source image. Handwriting and non-English text are not supported.',
    ],
    'hidden-text': [
      'PDF Concealed-Text Signals',
      'Inspects PDF text operators for invisible rendering mode or white fill color. Select a PDF and inspect the candidate text. White text may be visible on dark backgrounds, other concealment methods can be missed, and findings are not proof of deception.',
    ],
    signature: [
      'PDF Signature Structure Inspector',
      'Inspects PDF bytes for signature fields, ByteRange and Contents entries. Select a PDF and inspect the structure report. This does not cryptographically validate CMS signatures, certificate trust, revocation or signed revisions; a real verification verdict is unavailable.',
    ],
    'doc-compare': [
      'Document Text and Visual Comparison',
      'Compares extracted text from two TXT or PDF files. Two PDFs additionally render and compare each page visually (up to 10 pages, 1 MP/page), reporting changed pixels, bounding boxes and previews of the first 3 changed pages. Select the first file in the Evidence Vault and choose the second file. Visual differences may reflect fonts/antialiasing, not editing intent; text equality is not file/format equality. No Office-format comparison.',
    ],
  };
  function n(tag, text, attrs = {}) {
    const x = document.createElement(tag);
    if (text !== undefined) x.textContent = text;
    for (const [k, v] of Object.entries(attrs)) x.setAttribute(k, v);
    return x;
  }
  function lineDiff(left, right) {
    const a = left.split(/\r?\n/),
      b = right.split(/\r?\n/),
      changes = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++)
      if (a[i] !== b[i]) changes.push({ line: i + 1, first: a[i] ?? null, second: b[i] ?? null });
    return { equal: left === right, changes };
  }
  function pixelDifference(a, b, width, height, tolerance = 8) {
    if (a.length !== width * height * 4 || b.length !== a.length)
      throw Error('Mismatched comparison pixel buffers.');
    const pixels = new Uint8ClampedArray(a.length);
    let changed = 0,
      minX = width,
      minY = height,
      maxX = -1,
      maxY = -1;
    for (let p = 0; p < width * height; p++) {
      const j = p * 4,
        delta = Math.max(...[0, 1, 2].map((c) => Math.abs(a[j + c] - b[j + c])));
      if (delta > tolerance) {
        changed++;
        const x = p % width,
          y = Math.floor(p / width);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        pixels[j] = 220;
        pixels[j + 1] = 20;
        pixels[j + 2] = 20;
      } else pixels[j] = pixels[j + 1] = pixels[j + 2] = 255;
      pixels[j + 3] = 255;
    }
    return {
      changedPixels: changed,
      totalPixels: width * height,
      changedFraction: changed / (width * height),
      bounds: changed
        ? { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
        : null,
      pixels,
    };
  }
  async function comparePDFs(first, second) {
    let left, right;
    const pages = [];
    try {
      left = await pdf(first);
      right = await pdf(second);
      if (Math.max(left.numPages, right.numPages) > 10)
        throw Error('Visual PDF comparison limit:10pages per file.');
      for (let n = 1; n <= Math.max(left.numPages, right.numPages); n++) {
        if (n > left.numPages || n > right.numPages) {
          pages.push({ page: n, status: n > left.numPages ? 'added page' : 'removed page' });
          continue;
        }
        const a = await left.getPage(n),
          b = await right.getPage(n);
        try {
          const va = a.getViewport({ scale: 1 }),
            vb = b.getViewport({ scale: 1 });
          const scale = Math.min(
            1.5,
            Math.sqrt(1000000 / (Math.max(va.width, vb.width) * Math.max(va.height, vb.height))),
          );
          const width = Math.ceil(Math.max(va.width, vb.width) * scale),
            height = Math.ceil(Math.max(va.height, vb.height) * scale);
          const render = async (page) => {
            const c = document.createElement('canvas');
            c.width = width;
            c.height = height;
            const ctx = c.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);
            await page.render({
              canvasContext: ctx,
              viewport: page.getViewport({ scale }),
              background: 'white',
            }).promise;
            return c;
          };
          const ca = await render(a),
            cb = await render(b);
          const diff = pixelDifference(
            ca.getContext('2d').getImageData(0, 0, width, height).data,
            cb.getContext('2d').getImageData(0, 0, width, height).data,
            width,
            height,
          );
          const row = {
            page: n,
            firstPagePoints: [va.width, va.height],
            secondPagePoints: [vb.width, vb.height],
            renderSize: [width, height],
            toleranceRGB: 8,
            changedPixels: diff.changedPixels,
            totalPixels: diff.totalPixels,
            changedFraction: diff.changedFraction,
            bounds: diff.bounds,
          };
          if (diff.changedPixels && pages.filter((p) => p.preview).length < 3) {
            const cc = document.createElement('canvas');
            cc.width = width;
            cc.height = height;
            cc.getContext('2d').putImageData(new ImageData(diff.pixels, width, height), 0, 0);
            row.preview = {
              first: ca.toDataURL('image/png'),
              second: cb.toDataURL('image/png'),
              difference: cc.toDataURL('image/png'),
            };
            cc.width = cc.height = 0;
          }
          ca.width = ca.height = cb.width = cb.height = 0;
          pages.push(row);
        } finally {
          a.cleanup();
          b.cleanup();
        }
      }
      return {
        firstPageCount: left.numPages,
        secondPageCount: right.numPages,
        pages,
        limit:
          'Rendered-page pixel differences with RGB tolerance8, not semantic or authenticity proof. Fonts, antialiasing and renderer behavior affect results. No Office formatting comparison. First3changed pages previewed;10page limit.',
      };
    } finally {
      if (left) await left.destroy();
      if (right) await right.destroy();
    }
  }
  function signatureStructure(bytes) {
    const text = new TextDecoder('latin1').decode(bytes);
    const ranges = [...text.matchAll(/\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/g)]
      .slice(0, 30)
      .map((m) => m.slice(1).map(Number));
    return {
      signatureFieldMarkers: (text.match(/\/FT\s*\/Sig\b/g) || []).length,
      byteRanges: ranges,
      contentsMarkers: (text.match(/\/Contents\b/g) || []).length,
      cryptographicVerification: 'NOT PERFORMED',
      limit:
        'Byte scanning can miss compressed objects or find unrelated markers. Presence is not validity; absence is not a conclusive unsigned verdict.',
    };
  }
  async function pdf(file) {
    if (!root.pdfjsLib) throw new Error('PDF parser unavailable.');
    root.pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdf.worker-4.10.38.min.mjs';
    return root.pdfjsLib.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      isEvalSupported: false,
      disableFontFace: true,
      standardFontDataUrl: '/vendor/pdfjs-standard_fonts/',
      cMapUrl: '/vendor/pdfjs-cmaps/',
      cMapPacked: true,
      maxImageSize: 12000000,
    }).promise;
  }
  async function pdfInfo(file, hidden = false) {
    const doc = await pdf(file);
    try {
      if (doc.numPages > 100) throw new Error('PDF limit: 100 pages.');
      const metadata = await doc.getMetadata();
      const pages = [];
      for (let number = 1; number <= doc.numPages; number++) {
        const page = await doc.getPage(number);
        if (hidden) {
          const ops = await page.getOperatorList(),
            found = [];
          if (ops.fnArray.length > 200000) throw new Error('PDF page operator limit exceeded.');
          let mode = 0,
            white = false,
            stack = [];
          const O = root.pdfjsLib.OPS;
          for (let i = 0; i < ops.fnArray.length; i++) {
            const op = ops.fnArray[i],
              arg = ops.argsArray[i];
            if (op === O.save) stack.push([mode, white]);
            else if (op === O.restore) {
              [mode, white] = stack.pop() || [0, false];
            } else if (op === O.setTextRenderingMode) mode = arg[0];
            else if (op === O.setFillRGBColor) white = arg.every((v) => v >= 250);
            else if (op === O.setFillGray) white = arg[0] >= 0.99;
            else if (
              [O.showText, O.showSpacedText].includes(op) &&
              (mode === 3 || mode === 7 || white)
            ) {
              const text = (arg[0] || []).map((g) => g.unicode || '').join('');
              if (text)
                found.push({
                  text,
                  signal:
                    mode === 3 || mode === 7
                      ? 'invisible rendering mode'
                      : 'white fill (background not evaluated)',
                });
            }
          }
          pages.push({ page: number, candidates: found });
        } else {
          const content = await page.getTextContent();
          pages.push({ page: number, text: content.items.map((t) => t.str).join(' ') });
        }
        page.cleanup();
      }
      return { pageCount: doc.numPages, metadata: metadata.info, pages };
    } finally {
      await doc.destroy();
    }
  }
  async function text(file) {
    if (/\.txt$/i.test(file.name)) return file.text();
    if (/\.pdf$/i.test(file.name)) return (await pdfInfo(file)).pages.map((p) => p.text).join('\n');
    throw new Error('Text comparison supports TXT or PDF only.');
  }
  function pdfObjects(file) {
    return new Promise((resolve, reject) => {
      const worker = new Worker('/pdf-object-worker.js');
      let settled = false;
      const finish = (error, result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        worker.terminate();
        error ? reject(new Error(error)) : resolve(result);
      };
      const timer = setTimeout(() => finish('PDF object parser exceeded25seconds.'), 25000);
      worker.onmessage = (e) =>
        e.data.ok ? finish(null, e.data.result) : finish(e.data.error || 'PDF inventory failed.');
      worker.onerror = () => finish('PDF object worker failed.');
      try {
        worker.postMessage(file);
      } catch (e) {
        finish(e.message);
      }
    });
  }
  async function analyze(id, file, second) {
    if (!file) throw new Error('Select a document or use Try example.');
    if (file.size > 15 * 1024 * 1024) throw new Error('Document limit: 15 MiB.');
    if (id === 'doc-compare') {
      if (!second || second.size > 15 * 1024 * 1024)
        throw new Error('Choose a second TXT or PDF file, up to 15 MiB.');
      const result = lineDiff(await text(file), await text(second));
      if (/\.pdf$/i.test(file.name) && /\.pdf$/i.test(second.name)) {
        result.visual = await comparePDFs(file, second);
        result.equalityMeaning =
          'The equal field compares extracted text only; consult visual page differences for layout/format changes.';
      }
      return result;
    }
    if (id === 'ocr') {
      if (!root.Tesseract) throw new Error('OCR engine unavailable.');
      const isPDF = /\.pdf$/i.test(file.name);
      if (!isPDF && !/\.(png|jpe?g)$/i.test(file.name))
        throw new Error('OCR supports PNG, JPEG or PDF.');
      let worker,
        sourcePDF,
        timer,
        cancelled = false;
      const deadline = new Promise((_, reject) => {
        timer = setTimeout(() => {
          cancelled = true;
          reject(new Error('OCR exceeded 90 second processing limit.'));
        }, 90000);
      });
      const processing = async () => {
        if (isPDF) {
          sourcePDF = await pdf(file);
          if (cancelled) {
            await sourcePDF.destroy();
            throw new Error('OCR cancelled.');
          }
          if (sourcePDF.numPages > 10) throw new Error('OCR PDF limit: 10 pages.');
        } else {
          const bitmap = await createImageBitmap(file);
          const pixels = bitmap.width * bitmap.height;
          bitmap.close();
          if (pixels > 12000000) throw new Error('OCR limit: 12 megapixels per image.');
        }
        worker = await root.Tesseract.createWorker('eng', 1, {
          workerPath: '/vendor/ocr/worker.min.js',
          corePath: '/vendor/ocr',
          langPath: '/vendor/ocr',
          workerBlobURL: false,
          gzip: false,
        });
        if (cancelled) {
          await worker.terminate();
          throw new Error('OCR cancelled.');
        }
        const pages = [];
        let totalPixels = 0;
        for (let number = 1; number <= (sourcePDF ? sourcePDF.numPages : 1); number++) {
          if (cancelled) throw new Error('OCR cancelled.');
          let image = file,
            page,
            canvas;
          try {
            if (sourcePDF) {
              page = await sourcePDF.getPage(number);
              const viewport = page.getViewport({ scale: 2 });
              const pixels = Math.ceil(viewport.width) * Math.ceil(viewport.height);
              totalPixels += pixels;
              if (pixels > 12000000 || totalPixels > 40000000)
                throw new Error('OCR PDF pixel limit exceeded (12 MP/page, 40 MP total).');
              canvas = document.createElement('canvas');
              canvas.width = Math.ceil(viewport.width);
              canvas.height = Math.ceil(viewport.height);
              await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
              image = canvas;
            }
            if (cancelled) throw new Error('OCR cancelled.');
            const result = await worker.recognize(image);
            pages.push({
              page: number,
              text: result.data.text,
              confidence: result.data.confidence,
            });
          } finally {
            if (canvas) {
              canvas.width = 0;
              canvas.height = 0;
            }
            if (page) page.cleanup();
          }
        }
        return {
          text: pages.map((p) => p.text).join('\n'),
          pages,
          limit:
            'English printed-text OCR, not handwriting. Recognition is fallible and is not authenticity proof. Check each source page.',
        };
      };
      try {
        return await Promise.race([processing(), deadline]);
      } finally {
        clearTimeout(timer);
        if (worker) await worker.terminate();
        if (sourcePDF) await sourcePDF.destroy();
      }
    }
    if (id === 'doc-metadata' && /\.(docx|xlsx|pptx)$/i.test(file.name)) {
      if (!root.JSZip) throw new Error('Office ZIP parser unavailable.');
      const zip = await root.JSZip.loadAsync(await file.arrayBuffer());
      const extension = file.name.split('.').pop().toLowerCase();
      const main = {
        docx: 'word/document.xml',
        xlsx: 'xl/workbook.xml',
        pptx: 'ppt/presentation.xml',
      }[extension];
      if (!zip.file(main)) throw new Error('Office package does not match its file extension.');
      const out = {
        format: extension.toUpperCase(),
        embeddedRevisionEvents: [],
        properties: {},
        limit:
          'Embedded editable claims only. Tracked DOCX insertions/deletions/moves and comments are not a complete saved-version history. XLSX/PPTX historical revisions are not reconstructed. Legacy DOC/XLS/PPT unsupported.',
      };
      const parse = async (name) => {
        const entry = zip.file(name);
        if (!entry) return null;
        if (entry._data?.uncompressedSize > 2000000)
          throw new Error('Office XML exceeds 2 MiB limit.');
        const xml = await entry.async('string');
        if (xml.length > 2000000) throw new Error('Office XML exceeds 2 MiB limit.');
        if (/<!DOCTYPE|<!ENTITY/i.test(xml))
          throw new Error('XML entity declarations are not accepted.');
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        if (doc.getElementsByTagName('parsererror').length)
          throw new Error('Malformed Office XML.');
        return doc;
      };
      for (const name of ['docProps/core.xml', 'docProps/app.xml', 'docProps/custom.xml']) {
        const doc = await parse(name);
        if (!doc) continue;
        out.properties[name] = Array.from(doc.documentElement.children).map((x) => ({
          field: x.getAttribute('name') || x.localName,
          type: x.firstElementChild?.localName || null,
          value: x.textContent,
        }));
      }
      if (extension === 'docx') {
        for (const name of ['word/document.xml', 'word/comments.xml']) {
          const doc = await parse(name);
          if (!doc) continue;
          const ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
          for (const kind of ['ins', 'del', 'moveFrom', 'moveTo', 'comment']) {
            for (const item of doc.getElementsByTagNameNS(ns, kind)) {
              if (out.embeddedRevisionEvents.length >= 2000)
                throw new Error('Office revision event limit: 2000.');
              out.embeddedRevisionEvents.push({
                kind,
                id: item.getAttributeNS(ns, 'id'),
                author: item.getAttributeNS(ns, 'author'),
                date: item.getAttributeNS(ns, 'date'),
                text: item.textContent,
              });
            }
          }
        }
        out.embeddedRevisionEvents.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      }
      return out;
    }
    if (!/\.pdf$/i.test(file.name))
      throw new Error('This tool requires a PDF (metadata also accepts DOCX/XLSX/PPTX).');
    if (id === 'signature') return signatureStructure(await file.arrayBuffer());
    const result = await pdfInfo(file, id === 'hidden-text');
    if (id === 'pdf-inspector')
      return {
        pageCount: result.pageCount,
        objectInventory: await pdfObjects(file),
        metadata: result.metadata,
        pages: result.pages,
      };
    return id === 'doc-metadata'
      ? { metadata: result.metadata, pageCount: result.pageCount }
      : result;
  }
  function ready(id) {
    if (id === 'ocr') return false;
    if (id === 'signature') return false;
    return !!root.pdfjsLib;
  }
  function mount(ws, tool, getFile) {
    const [title, guide] = guides[tool.id],
      dot = document.querySelector('[data-tool="' + tool.id + '"] .fl-dot');
    if (dot) {
      dot.className = 'fl-dot ' + (ready(tool.id) ? 'available' : 'beta');
      dot.title =
        tool.id === 'signature'
          ? 'Structure inspection only; cryptographic verifier unavailable'
          : 'Local parser dependency ' + (ready(tool.id) ? 'loaded' : 'unavailable');
    }
    ws.appendChild(n('h2', title));
    ws.appendChild(
      n('p', guide, {
        class: 'fl-tool-guide',
        style:
          'padding:16px;line-height:1.6;border:1px solid #ddd;border-radius:10px;background:#f8fafc;',
      }),
    );
    ws.appendChild(
      n(
        'p',
        tool.id === 'ocr'
          ? 'Local processing; no document upload. Maximum 15 MiB / 10 PDF pages, 90 seconds. OCR text must be checked against the source.'
          : tool.id === 'doc-compare'
            ? 'Local processing; no document upload. Maximum 15 MiB per file; visual comparison up to 10 PDF pages. Text equality does not imply visual equality.'
            : 'Local processing; no document upload. Maximum 15 MiB / 100 PDF pages. Embedded text and metadata are untrusted.',
      ),
    );
    let second = null;
    if (tool.id === 'doc-compare') {
      const input = n('input', undefined, {
        type: 'file',
        accept: '.pdf,.txt',
        'aria-label': 'Second comparison file',
      });
      input.addEventListener('change', () => {
        second = input.files[0];
        out.replaceChildren(n('p', 'Second file changed. Run comparison again.'));
      });
      ws.appendChild(input);
    }
    const run = n('button', 'Analyze selected document', {
        type: 'button',
        class: 'fl-btn fl-btn-primary',
      }),
      demo = n('button', '\u25b6 Try example', {
        type: 'button',
        class: 'fl-btn fl-btn-ghost',
        'aria-label': 'Try document example',
      }),
      out = n('section', undefined, { role: 'status', style: 'margin-top:20px;' });
    ws.appendChild(run);
    ws.appendChild(demo);
    ws.appendChild(out);
    const execute = async (example) => {
      run.disabled = demo.disabled = true;
      out.replaceChildren(n('p', 'Processing locally...'));
      try {
        let file = getFile(),
          other = second;
        if (example) {
          const filename =
            tool.id === 'ocr' ? 'ocr.png' : tool.id === 'doc-compare' ? 'original.txt' : 'demo.pdf';
          const load = async (name) => {
            const r = await fetch('/samples/document/' + name);
            if (!r.ok) throw new Error('Example unavailable.');
            return new File([await r.arrayBuffer()], 'Demo - ' + name);
          };
          file = await load(filename);
          if (tool.id === 'doc-compare') other = await load('changed.txt');
        }
        const result = await analyze(tool.id, file, other);
        if (!ws.contains(out)) return;
        if (dot && tool.id === 'ocr') {
          dot.className = 'fl-dot available';
          dot.title =
            'Local OCR worker, model and engine successfully ran; recognition still needs human checking';
        }
        out.replaceChildren();
        if (example)
          out.appendChild(
            n(
              'strong',
              'DEMO SAMPLE - real tool output. Your evidence and second file are unchanged.',
            ),
          );
        if (result.visual) {
          out.appendChild(
            n(
              'p',
              'Extracted text equal: ' +
                (result.equal ? 'yes' : 'no') +
                '. Pages with rendered differences: ' +
                result.visual.pages.filter((p) => p.changedPixels > 0 || p.status).length +
                '. These are not authenticity verdicts.',
            ),
          );
          for (const p of result.visual.pages) {
            if (!p.preview) continue;
            out.appendChild(n('h3', 'Page ' + p.page + ' rendered differences'));
            const row = n('div', undefined, { style: 'display:flex;gap:8px;flex-wrap:wrap;' });
            for (const [label, url] of Object.entries(p.preview)) {
              const figure = n('figure', undefined, {
                style: 'margin:0;flex:1;min-width:160px;max-width:32%;',
              });
              figure.append(
                n('figcaption', label),
                n('img', undefined, {
                  src: url,
                  alt: label + ' PDF page ' + p.page,
                  style: 'width:100%;border:1px solid #ddd;',
                }),
              );
              row.append(figure);
            }
            out.appendChild(row);
            delete p.preview;
          }
        }
        out.appendChild(
          n('pre', JSON.stringify(result, null, 2), {
            style:
              'padding:16px;background:#f8fafc;white-space:pre-wrap;overflow-wrap:anywhere;max-height:700px;overflow:auto;',
          }),
        );
      } catch (e) {
        if (dot && tool.id === 'ocr') {
          dot.className = 'fl-dot beta';
          dot.title = 'OCR operation unavailable or failed';
        }
        if (ws.contains(out))
          out.replaceChildren(
            n('p', e.message || 'Document processing failed.', { role: 'alert' }),
          );
      } finally {
        run.disabled = demo.disabled = false;
      }
    };
    run.addEventListener('click', () => execute(false));
    demo.addEventListener('click', () => execute(true));
  }
  const api = {
    mount,
    analyze,
    ready,
    lineDiff,
    pixelDifference,
    comparePDFs,
    signatureStructure,
    guides,
  };
  root.DocumentForensics = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
