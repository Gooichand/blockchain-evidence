/* Desktop image measurements. Signals are not authenticity verdicts. */
(function (root) {
  'use strict';
  const guides = {
    ela: [
      'JPEG Error Level Analysis',
      'Recompresses a JPEG at quality 90 and displays amplified absolute RGB differences. Select a JPEG and run, or try the synthetic example. Bright differences can arise from normal encoding or texture and do not prove tampering.',
    ],
    'clone-detect': [
      'Copy-Move Feature Comparison',
      'Finds nonlocal ORB visual-feature correspondences, filters Hamming-distance matches and groups them with homography RANSAC. Select an image and run, then inspect source/target bounds and connecting points. Supports tested translated, rotated, scaled and JPEG-recompressed copied regions with enough texture. These are candidate repeated regions, not proof of an edit or authenticity: natural repeated patterns can match. Small, smooth or heavily altered copies may be missed. Classical features only, no trained model. Up to1200 features, three groups, 30-second local worker. Coordinates are on the scaled analysis image, not original pixels. The example is an original synthetic transformed copy, not a real-image accuracy benchmark.',
    ],
    'noise-analysis': [
      'Luminance Residual Analysis',
      'Computes local luminance residuals against a four-neighbour average. Run on an image to inspect the residual map and standard deviation. Texture, edges and compression affect this signal; it is not sensor fingerprinting or camera attribution.',
    ],
    'img-metadata': [
      'Image Metadata Viewer',
      'Reads embedded EXIF and other supported metadata plus decoded dimensions. Select an image and inspect available fields. Metadata may be absent, edited or stripped and does not prove capture history.',
    ],
    histogram: [
      'RGB Histogram',
      'Counts decoded red, green and blue pixel values in 256 bins. Run on an image and inspect the chart and counts. A histogram describes tone distribution, not whether an image is authentic.',
    ],
    compression: [
      'JPEG Double-Quantization Measurements',
      'Parses original quantized JPEG AC coefficients, shows their histograms/current quantizers, and tests aligned lower-quality-then-higher-quality lattice artifacts against standard-luma-table hypotheses20-95. A candidate needs either at least4 frequencies with>=150 nonzero samples,>=86% lattice fit and>=25% enrichment over allowed-bin density, or at least8 of12 examined frequencies with>=40% enrichment (broad diluted-lattice basis). Genuine double compression can still be missed: equal/higher-first quality, grid shift, resizing, custom matrices, and small or smooth images with too few sampled frequencies. Hypothesized quality is not a recovered encoding history or calibrated probability. No candidate does NOT mean single compression.20MiB,4MP,192MiB parser allocation,25second local worker. Candidate artifacts, not proof of editing/authenticity. No AI or upload.',
    ],
    'color-channels': [
      'RGB Channel Viewer',
      'Separates decoded red, green and blue channels into three grayscale views. Run on an image and compare the channel maps. Differences are normal and are not a tampering verdict.',
    ],
    'edge-detect': [
      'Sobel Edge Map',
      'Computes Sobel gradient magnitude from luminance. Run on an image to inspect high-contrast boundaries. Strong edges do not establish that an object was composited.',
    ],
    'ai-tamper': [
      'AI Tampering Detection - model unavailable',
      'No validated AI detection model is installed in this project. This tool reports its unavailable dependency rather than producing a fabricated score. Use the measured image tools for inspection, but do not treat them as an AI or deepfake verdict.',
    ],
  };
  const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  function histogram(data) {
    const bins = Array.from({ length: 3 }, () => Array(256).fill(0));
    for (let i = 0; i < data.length; i += 4) for (let c = 0; c < 3; c++) bins[c][data[i + c]]++;
    return bins;
  }
  function gray(data) {
    const a = new Float64Array(data.length / 4);
    for (let i = 0; i < a.length; i++)
      a[i] = luminance(data[4 * i], data[4 * i + 1], data[4 * i + 2]);
    return a;
  }
  function spatial(data, w, h, edge) {
    const g = gray(data),
      out = new Uint8ClampedArray(data.length);
    let sum = 0,
      sum2 = 0,
      n = 0;
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const p = y * w + x;
        let v;
        if (edge) {
          const gx =
            -g[p - w - 1] +
            g[p - w + 1] -
            2 * g[p - 1] +
            2 * g[p + 1] -
            g[p + w - 1] +
            g[p + w + 1];
          const gy =
            -g[p - w - 1] -
            2 * g[p - w] -
            g[p - w + 1] +
            g[p + w - 1] +
            2 * g[p + w] +
            g[p + w + 1];
          v = Math.hypot(gx, gy);
        } else {
          v = g[p] - (g[p - 1] + g[p + 1] + g[p - w] + g[p + w]) / 4;
          sum += v;
          sum2 += v * v;
          n++;
        }
        const z = Math.min(255, Math.abs(v) * (edge ? 1 : 8));
        for (let c = 0; c < 3; c++) out[4 * p + c] = z;
        out[4 * p + 3] = 255;
      }
    return { pixels: out, stddev: n ? Math.sqrt(Math.max(0, sum2 / n - (sum / n) ** 2)) : 0 };
  }
  function repeatedBlocks(data, w, h, size = 16) {
    const map = new Map(),
      pairs = [];
    for (let y = 0; y + size <= h; y += size)
      for (let x = 0; x + size <= w; x += size) {
        let signature = '',
          min = 255,
          max = 0;
        for (let dy = 0; dy < size; dy++)
          for (let dx = 0; dx < size; dx++) {
            const p = ((y + dy) * w + x + dx) * 4;
            for (let c = 0; c < 3; c++) {
              const v = data[p + c];
              signature += String.fromCharCode(v);
              min = Math.min(min, v);
              max = Math.max(max, v);
            }
          }
        if (max - min < 16) continue;
        if (map.has(signature)) {
          if (pairs.length < 40) pairs.push([map.get(signature), [x, y]]);
        } else map.set(signature, [x, y]);
      }
    return pairs;
  }
  function jpegTables(bytes) {
    const b = new Uint8Array(bytes);
    if (b[0] !== 255 || b[1] !== 216) throw new Error('Select a JPEG file for this tool.');
    const tables = [];
    let i = 2;
    while (i + 4 <= b.length) {
      if (b[i++] !== 255) throw new Error('Invalid JPEG marker.');
      let marker = b[i++];
      while (marker === 255) marker = b[i++];
      if (marker === 218 || marker === 217) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      const length = (b[i] << 8) | b[i + 1];
      if (length < 2 || i + length > b.length) throw new Error('Truncated JPEG segment.');
      if (marker === 219) {
        let p = i + 2;
        while (p < i + length) {
          const header = b[p++],
            wide = header >> 4;
          if (wide > 1) throw new Error('Invalid JPEG table.');
          const values = [];
          for (let k = 0; k < 64; k++) {
            if (p + wide >= i + length) throw new Error('Truncated quantization table.');
            values.push(wide ? (b[p++] << 8) | b[p++] : b[p++]);
          }
          tables.push({ id: header & 15, precision: wide ? 16 : 8, values });
        }
      }
      i += length;
    }
    return tables;
  }
  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  function pixelCanvas(data, w, h) {
    const c = canvas(w, h);
    c.getContext('2d').putImageData(new ImageData(data, w, h), 0, 0);
    return c;
  }
  async function decode(file) {
    if (!file) throw new Error('Add an image to the Evidence Vault or use Try example.');
    if (file.size > 20 * 1024 * 1024) throw new Error('Image limit: 20 MiB.');
    const image = await createImageBitmap(file);
    if (image.width * image.height > 12000000) {
      image.close();
      throw new Error('Image limit: 12 megapixels.');
    }
    const scale = Math.min(1, 1024 / Math.max(image.width, image.height));
    const c = canvas(
      Math.max(1, Math.round(image.width * scale)),
      Math.max(1, Math.round(image.height * scale)),
    );
    c.getContext('2d').drawImage(image, 0, 0, c.width, c.height);
    const dimensions = [image.width, image.height];
    image.close();
    return { canvas: c, dimensions };
  }
  async function compressionCoefficients(file) {
    if (!file) throw Error('Select a JPEG.');
    if (file.size > 20 * 1024 * 1024) throw Error('JPEG limit20MiB.');
    if (!root.Worker) throw Error('JPEG coefficient worker unavailable.');
    return await new Promise((resolve, reject) => {
      const worker = new root.Worker('/double-jpeg-worker.js'),
        timer = setTimeout(() => {
          worker.terminate();
          reject(Error('JPEG coefficient analysis exceeded25seconds.'));
        }, 25000);
      const finish = () => {
        clearTimeout(timer);
        worker.terminate();
      };
      worker.onmessage = ({ data }) => {
        finish();
        data.ok ? resolve(data.result) : reject(Error(data.error));
      };
      worker.onerror = () => {
        finish();
        reject(Error('JPEG coefficient worker failed.'));
      };
      worker.postMessage(file);
    });
  }
  async function analyze(id, file) {
    if (id === 'ai-tamper')
      throw new Error(
        'Unavailable: no validated AI detection model installed. No score or verdict was generated.',
      );
    // Validate bounded original coefficients before allocating a browser pixel preview.
    const compressionResult = id === 'compression' ? await compressionCoefficients(file) : null;
    const decoded = await decode(file),
      c = decoded.canvas,
      w = c.width,
      h = c.height,
      ctx = c.getContext('2d'),
      data = ctx.getImageData(0, 0, w, h).data;
    const result = {
      summary: {
        file: file.name,
        originalDimensions: decoded.dimensions,
        analysisDimensions: [w, h],
        note: 'Pixel analysis is scaled to at most 1024 px on the longest side. These measurements do not prove authenticity.',
      },
      visuals: [['Decoded image', c]],
    };
    if (id === 'histogram') {
      const bins = histogram(data),
        chart = canvas(768, 220),
        cx = chart.getContext('2d');
      cx.fillStyle = '#fff';
      cx.fillRect(0, 0, 768, 220);
      const max = Math.max(...bins.flat());
      bins.forEach((row, ch) => {
        cx.strokeStyle = ['#dc2626', '#16803c', '#2563eb'][ch];
        cx.beginPath();
        row.forEach((v, i) => {
          const x = i * 3,
            y = 210 - (200 * v) / max;
          if (i) cx.lineTo(x, y);
          else cx.moveTo(x, y);
        });
        cx.stroke();
      });
      result.visuals.push(['RGB histogram (R red, G green, B blue; common linear scale)', chart]);
      result.summary.bins = bins;
    } else if (id === 'color-channels') {
      for (let ch = 0; ch < 3; ch++) {
        const output = new Uint8ClampedArray(data.length);
        for (let i = 0; i < data.length; i += 4) {
          output[i] = output[i + 1] = output[i + 2] = data[i + ch];
          output[i + 3] = 255;
        }
        result.visuals.push([['Red', 'Green', 'Blue'][ch] + ' channel', pixelCanvas(output, w, h)]);
      }
    } else if (id === 'edge-detect' || id === 'noise-analysis') {
      const r = spatial(data, w, h, id === 'edge-detect');
      result.visuals.push([
        id === 'edge-detect' ? 'Sobel magnitude' : 'Absolute luminance residual x8',
        pixelCanvas(r.pixels, w, h),
      ]);
      if (id === 'noise-analysis') result.summary.residualStdDev = r.stddev;
    } else if (id === 'clone-detect') {
      if (!root.Worker) throw Error('Local feature worker unavailable.');
      const matches = await new Promise((resolve, reject) => {
        const worker = new root.Worker('/copy-move-worker.js'),
          copy = new Uint8Array(data);
        const timer = setTimeout(() => {
          worker.terminate();
          reject(Error('Clone comparison exceeded30-second limit.'));
        }, 30000);
        const finish = () => {
          clearTimeout(timer);
          worker.terminate();
        };
        worker.onmessage = ({ data: message }) => {
          finish();
          message.ok ? resolve(message.result) : reject(Error(message.error));
        };
        worker.onerror = () => {
          finish();
          reject(Error('Classical feature engine unavailable.'));
        };
        worker.postMessage({ pixels: copy.buffer, width: w, height: h }, [copy.buffer]);
      });
      const overlay = canvas(w, h),
        o = overlay.getContext('2d');
      o.drawImage(c, 0, 0);
      o.lineWidth = 2;
      for (const model of matches.models) {
        for (const [bounds, color] of [
          [model.sourceBounds, '#ff2020'],
          [model.targetBounds, '#00ddff'],
        ]) {
          o.strokeStyle = color;
          o.strokeRect(
            bounds.left,
            bounds.top,
            bounds.right - bounds.left,
            bounds.bottom - bounds.top,
          );
        }
        o.strokeStyle = 'rgba(255,210,0,.6)';
        for (const pair of model.pairs) {
          o.beginPath();
          o.moveTo(pair.source.x, pair.source.y);
          o.lineTo(pair.target.x, pair.target.y);
          o.stroke();
        }
      }
      result.visuals.push([
        'Candidate corresponding regions: red source, cyan target, yellow feature links. Not an edit verdict.',
        overlay,
      ]);
      result.summary.featureComparison = matches;
    } else if (id === 'compression') {
      result.summary.jpegQuantizationTables = jpegTables(await file.arrayBuffer());
      result.summary.bytes = file.size;
      result.summary.doubleQuantization = compressionResult;
    } else if (id === 'img-metadata') {
      if (!root.exifr) throw new Error('Metadata parser unavailable. Reload the page.');
      result.summary.metadata = (await root.exifr.parse(await file.arrayBuffer(), true)) || {};
      result.summary.limit =
        'No fields means no supported embedded metadata was found. Values are untrusted and editable.';
    } else if (id === 'ela') {
      jpegTables(await file.arrayBuffer());
      const blob = await new Promise((resolve) => c.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('JPEG encoder unavailable.');
      const re = await createImageBitmap(blob),
        r = canvas(w, h);
      r.getContext('2d').drawImage(re, 0, 0);
      re.close();
      const rd = r.getContext('2d').getImageData(0, 0, w, h).data,
        out = new Uint8ClampedArray(data.length);
      for (let i = 0; i < data.length; i += 4) {
        for (let ch = 0; ch < 3; ch++)
          out[i + ch] = Math.min(255, Math.abs(data[i + ch] - rd[i + ch]) * 10);
        out[i + 3] = 255;
      }
      result.visuals.push([
        'JPEG recompression differences x10 (quality 90)',
        pixelCanvas(out, w, h),
      ]);
    } else throw new Error('Unsupported image tool.');
    return result;
  }
  function node(tag, text, attrs = {}) {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    return n;
  }
  function ready(id) {
    if (id === 'ai-tamper') return false;
    if (id === 'clone-detect' && !root.Worker) return false;
    try {
      return !!(
        root.createImageBitmap &&
        document.createElement('canvas').getContext('2d') &&
        (id !== 'img-metadata' || root.exifr) &&
        histogram(new Uint8ClampedArray([1, 2, 3, 255]))[0][1] === 1
      );
    } catch (_) {
      return false;
    }
  }
  function mount(ws, tool, getFile) {
    const [title, guide] = guides[tool.id];
    const known = tool.id !== 'ai-tamper';
    const supported = ready(tool.id);
    const dot = document.querySelector('[data-tool="' + tool.id + '"] .fl-dot');
    if (dot) {
      dot.className = 'fl-dot ' + (known && supported ? 'available' : 'beta');
      dot.title =
        known && supported
          ? 'Local image engine dependencies available; not an authenticity verdict'
          : 'Required model or browser dependency unavailable';
    }
    ws.appendChild(node('h2', title));
    ws.appendChild(
      node('p', guide, {
        class: 'fl-tool-guide',
        style:
          'padding:16px;background:#f8fafc;border:1px solid #ddd;border-radius:10px;line-height:1.6;',
      }),
    );
    ws.appendChild(
      node(
        'p',
        tool.id === 'compression'
          ? 'Local coefficient analysis: JPEG only,20MiB/4MP. Original unscaled coefficient blocks. Preview may scale; no JPEG re-encoding.'
          : 'Local processing only. Supported: browser-decodable JPEG, PNG and WebP; max 20 MiB / 12 MP. Analysis scales to 1024 px.',
      ),
    );
    const run = node('button', 'Analyze selected image', {
        type: 'button',
        class: 'fl-btn fl-btn-primary',
      }),
      demo = node('button', '\u25b6 Try example', {
        type: 'button',
        class: 'fl-btn fl-btn-ghost',
        'aria-label': 'Try image example',
      }),
      out = node('section', undefined, {
        role: 'status',
        style: 'margin-top:20px;overflow-wrap:anywhere;',
      });
    const status = node(
      'p',
      known && supported
        ? 'Local engine ready. Results are measurements, not a tampering verdict.'
        : 'Unavailable: validated AI model or required browser dependency is missing.',
    );
    ws.appendChild(status);
    ws.appendChild(run);
    ws.appendChild(demo);
    ws.appendChild(out);
    let generation = 0;
    const execute = async (example) => {
      const token = ++generation;
      run.disabled = demo.disabled = true;
      out.replaceChildren(node('p', 'Processing...'));
      try {
        let file = getFile();
        if (example) {
          const name =
            tool.id === 'clone-detect'
              ? 'copy-move/rotated-scaled.jpg'
              : tool.id === 'compression'
                ? 'double-jpeg/double-85-95.jpg'
                : tool.id === 'ela'
                  ? 'edited.jpg'
                  : 'original.jpg';
          const r = await fetch(
            (tool.id === 'clone-detect' ? '/samples/images/' : '/samples/image/') + name,
          );
          if (!r.ok) throw new Error('Example unavailable.');
          file = new File([await r.arrayBuffer()], 'Demo - ' + name, {
            type: name.endsWith('png') ? 'image/png' : 'image/jpeg',
          });
        }
        const result = await analyze(tool.id, file);
        if (!ws.contains(out) || token !== generation) return;
        out.replaceChildren();
        if (example)
          out.appendChild(
            node('strong', 'DEMO SAMPLE - real tool output; your evidence is unchanged.'),
          );
        if (tool.id === 'compression') {
          const r = result.summary.doubleQuantization;
          out.appendChild(
            node(
              'h3',
              r.state === 'ALIGNED_DOUBLE_QUANTIZATION_CANDIDATE'
                ? 'Aligned double-quantization candidate'
                : 'No supported aligned lattice candidate',
            ),
          );
          out.appendChild(
            node(
              'p',
              'Candidate artifacts only, not a recovered history or proof of editing. Genuine double compression can return no candidate.',
            ),
          );
          const frequency = r.examinedFrequencies[0],
            canvas = document.createElement('canvas');
          canvas.width = 800;
          canvas.height = 260;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, 800, 260);
          ctx.fillStyle = '#0f172a';
          ctx.font = '16px sans-serif';
          ctx.fillText(
            'Original luma AC coefficient1: absolute values2-60 (zero/one omitted)',
            16,
            24,
          );
          const hist = new Map(frequency.histogram),
            max = Math.max(1, ...hist.values());
          for (let k = 2; k <= 60; k++) {
            const h = ((hist.get(k) || 0) / max) * 170;
            ctx.fillStyle = '#2563eb';
            ctx.fillRect(18 + (k - 2) * 13, 215 - h, 10, h);
          }
          ctx.fillStyle = '#0f172a';
          ctx.fillText('2', 16, 240);
          ctx.fillText('60', 758, 240);
          result.visuals.unshift([
            'Quantized coefficient histogram (counts, not a probability)',
            canvas,
          ]);
        }
        result.visuals.forEach(([label, c]) => {
          out.appendChild(node('h3', label));
          c.style.maxWidth = '100%';
          c.style.height = 'auto';
          c.setAttribute('aria-label', label);
          out.appendChild(c);
        });
        out.appendChild(
          node('pre', JSON.stringify(result.summary, null, 2), {
            style:
              'white-space:pre-wrap;overflow-wrap:anywhere;background:#f8fafc;padding:16px;max-height:420px;overflow:auto;',
          }),
        );
      } catch (e) {
        if (ws.contains(out)) out.replaceChildren(node('p', e.message, { role: 'alert' }));
      } finally {
        run.disabled = demo.disabled = false;
      }
    };
    run.addEventListener('click', () => execute(false));
    demo.addEventListener('click', () => execute(true));
    if (!known) {
      run.disabled = demo.disabled = true;
      out.appendChild(
        node('p', 'No model installed. No synthetic verdict or fake example is shown.'),
      );
    }
  }
  const api = { analyze, mount, ready, histogram, spatial, repeatedBlocks, jpegTables, guides };
  root.ImageForensics = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
