/* Local helpers. Encodings and QR content confer no trust. */
(function (root) {
  'use strict';
  const guides = {
    base64: [
      'UTF-8 Base64',
      'Choose Encode or Decode and paste text. Uses standard Base64 and strict UTF-8 decoding. Base64 is an encoding, not encryption; binary payloads that are not UTF-8 need a byte-oriented tool.',
    ],
    'url-encoder': [
      'URL Component Encoder',
      'Choose Encode or Decode and paste a URL component. Uses encodeURIComponent/decodeURIComponent, not whole-URL normalization. Plus signs are literal, not form-encoded spaces; malformed percent sequences fail.',
    ],
    'hex-viewer': [
      'Byte Hex Preview',
      'Select a file in the Evidence Vault and run. Shows offsets, hexadecimal bytes and printable ASCII for the first 4096 bytes. Limit 5 MiB input. The preview is deliberately truncated and is not a file-format or malware verdict.',
    ],
    uuid: [
      'Random UUID v4',
      'Generates one random RFC 4122 version-4 UUID with browser cryptographic randomness. Run to generate a fresh UUID. It is a random identifier, not a secret, identity proof or evidence timestamp.',
    ],
    timestamp: [
      'Explicit Timestamp Converter',
      'Choose ISO, epoch seconds or epoch milliseconds. ISO requires a complete date/time with seconds and explicit Z or offset. Produces UTC ISO and epoch units. No local-time or unit guesses are made; this does not verify when an event actually occurred.',
    ],
    'qr-generator': [
      'QR Code Generator',
      'Enter text and run to create a QR code locally. Up to 2000 UTF-8 bytes, error correction M. Scanning reveals your text; QR codes do not encrypt it or prove a link is safe.',
    ],
    'qr-scanner': [
      'Image QR Decoder',
      'Select a PNG or JPEG and run to decode one QR code through jsQR. Limit 10 MiB / 12 megapixels; images are downscaled to max 1600 pixels. Damaged, tiny or multiple codes may be missed. Content is displayed as text and never opened.',
    ],
  };
  function utf8Base64(value, decode = false) {
    if (decode) {
      if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))
        throw Error('Strict padded Base64 required.');
      return new TextDecoder('utf-8', { fatal: true }).decode(
        Uint8Array.from(atob(value), (c) => c.charCodeAt(0)),
      );
    }
    const bytes = new TextEncoder().encode(value);
    let s = '';
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s);
  }
  function hex(bytes) {
    const shown = bytes.slice(0, 4096),
      lines = [];
    for (let p = 0; p < shown.length; p += 16) {
      const row = shown.slice(p, p + 16);
      lines.push(
        p.toString(16).padStart(8, '0') +
          '  ' +
          Array.from(row, (b) => b.toString(16).padStart(2, '0'))
            .join(' ')
            .padEnd(47) +
          '  ' +
          Array.from(row, (b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join(''),
      );
    }
    return {
      byteLength: bytes.length,
      displayedBytes: shown.length,
      truncated: bytes.length > shown.length,
      preview: lines.join('\n'),
    };
  }
  function convertTime(value, mode) {
    let ms;
    if (mode === 'iso') {
      if (!root.TimelineTools) throw Error('Timestamp validator unavailable.');
      ms = root.TimelineTools.timestamp(value);
    } else {
      if (!['seconds', 'milliseconds'].includes(mode))
        throw Error('Choose explicit ISO, seconds or milliseconds mode.');
      const parts = /^(-?)(\d+)(?:\.(\d{1,3}))?$/.exec(value);
      if (!parts) throw Error('Numeric epoch required.');
      const fraction = parts[3] || '';
      if (mode === 'milliseconds' && /[1-9]/.test(fraction))
        throw Error('Epoch milliseconds must be an integer.');
      const magnitude =
        BigInt(parts[2]) * (mode === 'seconds' ? 1000n : 1n) +
        (mode === 'seconds' ? BigInt(fraction.padEnd(3, '0')) : 0n);
      ms = Number(parts[1] ? -magnitude : magnitude);
      if (!Number.isSafeInteger(ms))
        throw Error('Epoch must resolve to an exact millisecond integer.');
    }
    if (!Number.isFinite(ms) || Math.abs(ms) > 8640000000000000)
      throw Error('Timestamp out of range.');
    return { utc: new Date(ms).toISOString(), epochMilliseconds: ms, epochSeconds: ms / 1000 };
  }
  async function analyze(id, value = '', mode = 'encode', file) {
    if (value.length > 1000000) throw Error('Text limit: 1 million characters.');
    if (id === 'base64') return { text: utf8Base64(value, mode === 'decode') };
    if (id === 'url-encoder')
      return { text: mode === 'decode' ? decodeURIComponent(value) : encodeURIComponent(value) };
    if (id === 'uuid') return { uuid: root.crypto.randomUUID(), version: 4 };
    if (id === 'timestamp') return convertTime(value, mode);
    if (id === 'hex-viewer') {
      if (!file) throw Error('Select a file or try the example.');
      if (file.size > 5 * 1024 * 1024) throw Error('Hex input limit: 5 MiB.');
      return hex(new Uint8Array(await file.arrayBuffer()));
    }
    if (!root.LocalQR) throw Error('QR dependency unavailable.');
    if (id === 'qr-generator') {
      if (!value || new TextEncoder().encode(value).length > 2000)
        throw Error('Enter 1-2000 UTF-8 bytes.');
      return {
        image: await root.LocalQR.QRCode.toDataURL(value, {
          width: 600,
          margin: 4,
          errorCorrectionLevel: 'M',
        }),
        summary: {
          text: value,
          errorCorrection: 'M',
          limit: 'Plain content, not encrypted or authenticated.',
        },
      };
    }
    if (id === 'qr-scanner') {
      if (!file || file.size > 10 * 1024 * 1024) throw Error('Select PNG/JPEG up to 10 MiB.');
      if (!/\.(png|jpe?g)$/i.test(file.name)) throw Error('PNG or JPEG required.');
      const bitmap = await createImageBitmap(file);
      try {
        if (bitmap.width * bitmap.height > 12000000) throw Error('QR image limit: 12 megapixels.');
        const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height)),
          c = document.createElement('canvas');
        c.width = Math.round(bitmap.width * scale);
        c.height = Math.round(bitmap.height * scale);
        const ctx = c.getContext('2d');
        ctx.drawImage(bitmap, 0, 0, c.width, c.height);
        const pixels = ctx.getImageData(0, 0, c.width, c.height),
          qr = root.LocalQR.jsQR(pixels.data, c.width, c.height, {
            inversionAttempts: 'attemptBoth',
          });
        return qr
          ? {
              found: true,
              text: qr.data,
              locationInAnalyzedImage: qr.location,
              analyzedWidth: c.width,
              analyzedHeight: c.height,
              limit: 'Untrusted decoded content. No URL was opened.',
            }
          : { found: false, limit: 'No QR decoded; absence is not conclusive.' };
      } finally {
        bitmap.close();
      }
    }
    throw Error('Unknown utility.');
  }
  function ready(id) {
    if (id.startsWith('qr-')) return !!root.LocalQR;
    if (id === 'uuid') return !!root.crypto?.randomUUID;
    if (id === 'timestamp') return !!root.TimelineTools;
    return true;
  }
  function n(tag, text, attrs = {}) {
    const x = document.createElement(tag);
    if (text !== undefined) x.textContent = text;
    for (const [k, v] of Object.entries(attrs)) x.setAttribute(k, v);
    return x;
  }
  function mount(ws, tool, getFile) {
    const [title, guide] = guides[tool.id];
    ws.appendChild(n('h2', title));
    ws.appendChild(
      n('p', guide, {
        style:
          'padding:16px;background:#f8fafc;line-height:1.6;border:1px solid #ddd;border-radius:10px;',
      }),
    );
    ws.appendChild(n('p', 'Local processing only. No uploads or automatic link navigation.'));
    const input = n('textarea', undefined, {
        'aria-label': 'Utility input',
        rows: '5',
        style: 'width:100%;box-sizing:border-box;',
      }),
      mode = n('select', undefined, { 'aria-label': 'Utility mode' });
    if (['base64', 'url-encoder', 'timestamp'].includes(tool.id)) {
      for (const v of tool.id === 'timestamp'
        ? ['iso', 'seconds', 'milliseconds']
        : ['encode', 'decode'])
        mode.appendChild(n('option', v, { value: v }));
      ws.appendChild(mode);
    }
    if (!['hex-viewer', 'qr-scanner', 'uuid'].includes(tool.id)) ws.appendChild(input);
    const run = n('button', 'Run local utility', {
        type: 'button',
        class: 'fl-btn fl-btn-primary',
      }),
      demo = n('button', '▶ Try example', {
        type: 'button',
        class: 'fl-btn fl-btn-ghost',
        'aria-label': 'Try utility example',
      }),
      out = n('section', undefined, { role: 'status', style: 'margin-top:20px;' });
    ws.append(run, demo, out);
    async function execute(d) {
      run.disabled = demo.disabled = true;
      out.replaceChildren(n('p', 'Processing locally...'));
      try {
        let value = input.value,
          m = mode.value,
          file = getFile();
        if (d) {
          value =
            tool.id === 'timestamp'
              ? '2026-11-11T18:00:00+05:30'
              : tool.id === 'qr-generator'
                ? 'DGC original QR demo'
                : 'DGC demo: नमस्ते + / ?';
          m = tool.id === 'timestamp' ? 'iso' : 'encode';
          if (tool.id === 'hex-viewer')
            file = new File([new TextEncoder().encode('DGC original bytes\n')], 'Demo.txt');
          if (tool.id === 'qr-scanner') {
            const r = await fetch('/samples/utility/demo-qr.png');
            if (!r.ok) throw Error('Example missing.');
            file = new File([await r.arrayBuffer()], 'Demo.png');
          }
        }
        const result = await analyze(tool.id, value, m, file);
        if (!ws.contains(out)) return;
        out.replaceChildren();
        if (d)
          out.appendChild(
            n(
              'strong',
              'DEMO SAMPLE - real local operation on original synthetic data. Your evidence and input are unchanged.',
            ),
          );
        if (result.image) {
          out.appendChild(
            n('img', undefined, {
              src: result.image,
              alt: 'Generated QR code',
              style: 'width:400px;max-width:100%;image-rendering:pixelated;',
            }),
          );
        }
        if (tool.id === 'hex-viewer')
          out.appendChild(
            n('pre', result.preview, {
              style: 'padding:16px;background:#f8fafc;white-space:pre;overflow:auto;',
            }),
          );
        const display =
          tool.id === 'hex-viewer'
            ? {
                byteLength: result.byteLength,
                displayedBytes: result.displayedBytes,
                truncated: result.truncated,
              }
            : result.summary || result;
        out.appendChild(
          n('pre', JSON.stringify(display, null, 2), {
            style:
              'padding:16px;background:#f8fafc;white-space:pre-wrap;overflow-wrap:anywhere;max-height:650px;overflow:auto;',
          }),
        );
      } catch (e) {
        if (ws.contains(out))
          out.replaceChildren(n('p', e.message || 'Utility failed.', { role: 'alert' }));
      } finally {
        run.disabled = demo.disabled = false;
      }
    }
    run.onclick = () => execute(false);
    demo.onclick = () => execute(true);
  }
  const api = { mount, analyze, ready, utf8Base64, hex, convertTime, guides };
  root.UtilityTools = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
