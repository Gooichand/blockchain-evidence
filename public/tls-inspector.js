/* Offline complete TLS Hello-record inspection. Never connects to any host. */
(function (root) {
  'use strict';
  const cipherNames = {
    4865: 'TLS_AES_128_GCM_SHA256',
    4866: 'TLS_AES_256_GCM_SHA384',
    4867: 'TLS_CHACHA20_POLY1305_SHA256',
    4868: 'TLS_AES_128_CCM_SHA256',
    4869: 'TLS_AES_128_CCM_8_SHA256',
  };
  const version = (n) =>
    ({ 768: 'SSL3.0', 769: 'TLS1.0', 770: 'TLS1.1', 771: 'TLS1.2', 772: 'TLS1.3' })[n] ||
    '0x' + n.toString(16).padStart(4, '0');
  function helloRecord(bytes) {
    let p = 0;
    const take = (n) => {
      if (!Number.isSafeInteger(n) || n < 0 || p + n > bytes.length)
        throw Error('Truncated TLS record/Hello.');
      const out = bytes.slice(p, p + n);
      p += n;
      return out;
    };
    const u8 = () => take(1)[0],
      u16 = () => {
        const b = take(2);
        return b[0] * 256 + b[1];
      };
    if (u8() !== 22) throw Error('Expected TLS handshake record (content type22).');
    const recordVersion = u16(),
      len = u16();
    if (len !== bytes.length - 5 || len > 18432)
      throw Error('One complete TLS record required, maximum18432payload bytes.');
    const kind = u8(),
      lengthBytes = take(3),
      length = lengthBytes[0] * 65536 + lengthBytes[1] * 256 + lengthBytes[2];
    if (![1, 2].includes(kind) || length !== bytes.length - 9)
      throw Error('One complete ClientHello or ServerHello required; no fragmentation/reassembly.');
    const client = kind === 1,
      legacy = u16();
    take(32);
    const session = u8();
    if (session > 32) throw Error('Invalid TLS session ID length.');
    take(session);
    const out = {
      message: client ? 'ClientHello' : 'ServerHello',
      legacyRecordVersion: version(recordVersion),
      legacyHelloVersion: version(legacy),
      cipherSuites: [],
      extensions: [],
    };
    if (client) {
      const n = u16();
      if (n < 2 || n % 2 || n > 1024) throw Error('Invalid cipher-suite vector.');
      for (let i = 0; i < n; i += 2) {
        const code = u16();
        out.cipherSuites.push({
          code: '0x' + code.toString(16).padStart(4, '0'),
          name: cipherNames[code] || 'Unmapped registry code',
        });
      }
      const ncomp = u8();
      if (!ncomp) throw Error('Empty compression-method vector.');
      out.compressionMethods = Array.from(take(ncomp));
    } else {
      const code = u16();
      out.cipherSuites = [
        {
          code: '0x' + code.toString(16).padStart(4, '0'),
          name: cipherNames[code] || 'Unmapped registry code',
        },
      ];
      out.compressionMethods = [u8()];
    }
    if (p < bytes.length) {
      const n = u16(),
        end = p + n;
      if (end !== bytes.length) throw Error('TLS extension vector length mismatch.');
      const seen = new Set();
      while (p < end) {
        const type = u16(),
          n = u16();
        if (seen.has(type)) throw Error('Duplicate TLS extension.');
        seen.add(type);
        const b = take(n);
        out.extensions.push({ type, bytes: n });
        if (type === 43) {
          if (client) {
            if (!b.length || b[0] < 2 || b[0] !== b.length - 1 || b[0] % 2)
              throw Error('Invalid supported_versions extension.');
            out.supportedVersions = [];
            for (let i = 1; i < b.length; i += 2)
              out.supportedVersions.push(version(b[i] * 256 + b[i + 1]));
          } else {
            if (b.length !== 2) throw Error('Invalid selected version.');
            out.selectedVersion = version(b[0] * 256 + b[1]);
          }
        }
        if (type === 0 && client) {
          if (b.length < 2 || b[0] * 256 + b[1] !== b.length - 2) throw Error('Invalid SNI list.');
          let i = 2;
          const names = [];
          while (i < b.length) {
            if (i + 3 > b.length) throw Error('Invalid SNI entry.');
            const t = b[i++],
              n = b[i++] * 256 + b[i++];
            if (!n || i + n > b.length) throw Error('Invalid SNI name length.');
            if (t === 0)
              names.push(new TextDecoder('utf-8', { fatal: true }).decode(b.slice(i, i + n)));
            i += n;
          }
          out.serverNames = names;
        }
        if (type === 16) {
          if (b.length < 2 || b[0] * 256 + b[1] !== b.length - 2) throw Error('Invalid ALPN list.');
          let i = 2;
          out.alpn = [];
          while (i < b.length) {
            const n = b[i++];
            if (!n || i + n > b.length) throw Error('Invalid ALPN protocol.');
            out.alpn.push(new TextDecoder('utf-8', { fatal: true }).decode(b.slice(i, i + n)));
            i += n;
          }
        }
      }
    }
    out.effectiveVersions = out.supportedVersions || [
      out.selectedVersion || out.legacyHelloVersion,
    ];
    out.limit =
      'Recorded Hello fields only, not a live server scan or completed authenticated negotiation. Offered client versions are not selected server versions. No TLS1.3 encrypted certificates, resumption, renegotiation or stream reassembly.';
    return out;
  }
  async function inspect(value) {
    if (value.length > 1000000) throw Error('TLS JSON input limit:1million characters.');
    const x = JSON.parse(value);
    if (!Array.isArray(x.recordsHex) || x.recordsHex.length < 1 || x.recordsHex.length > 8)
      throw Error('Provide1-8complete Hello TLS records in recordsHex.');
    const records = x.recordsHex.map((hex) => {
      if (typeof hex !== 'string') throw Error('TLS record must be hexadecimal text.');
      const s = hex.replace(/\s/g, '');
      if (!s || s.length % 2 || !/^[a-f\d]+$/i.test(s) || s.length > 36874)
        throw Error('Invalid or oversized TLS hexadecimal record.');
      return helloRecord(Uint8Array.from(s.match(/../g), (h) => parseInt(h, 16)));
    });
    const result = {
      records,
      certificateChain: null,
      association:
        'Supplied certificate chain is separate; its association with these Hello records and host identity is NOT verified.',
      liveConnections: 'NONE',
      sources: [
        'https://www.rfc-editor.org/rfc/inline-errata/rfc8446.html',
        'https://www.iana.org/assignments/tls-parameters/tls-parameters.txt',
        'https://www.iana.org/assignments/tls-extensiontype-values/tls-extensiontype-values.txt',
      ],
    };
    if (x.certificatesPEM) {
      if (typeof x.certificatesPEM !== 'string' || !root.CryptoTools)
        throw Error('Certificate chain parser unavailable/invalid input.');
      result.certificateChain = await root.CryptoTools.inspectChain(x.certificatesPEM);
    }
    return result;
  }
  function mount(ws) {
    if (root.PublicTLS) root.PublicTLS.mount(ws);
    const n = (tag, text, attrs = {}) => {
      const e = document.createElement(tag);
      if (text !== undefined) e.textContent = text;
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
      return e;
    };
    ws.append(
      n('h2', 'Offline TLS Hello and Certificate Inspection'),
      n(
        'p',
        'Paste JSON with recordsHex (1-8 complete ClientHello/ServerHello TLS records) and optional certificatesPEM (ordered leaf-to-root). Reads offered/selected versions, cipher codes, SNI, ALPN and extensions, plus actual pairwise certificate signatures. No live connection, server scan, trust-root/revocation/hostname verification or proof that a supplied certificate belongs to a Hello. No fragmented handshake reassembly.',
        {
          style:
            'padding:16px;line-height:1.6;background:#f8fafc;border:1px solid #ddd;border-radius:10px;',
        },
      ),
    );
    const input = n('textarea', undefined, {
        'aria-label': 'TLS inspection JSON',
        rows: '8',
        style: 'width:100%;box-sizing:border-box;',
      }),
      run = n('button', 'Inspect supplied TLS data', {
        class: 'fl-btn fl-btn-primary',
        type: 'button',
      }),
      demo = n('button', '▶ Try example', {
        'aria-label': 'Try network example',
        class: 'fl-btn fl-btn-ghost',
        type: 'button',
      }),
      out = n('section', undefined, { role: 'status', style: 'margin-top:20px;' });
    ws.append(input, run, demo, out);
    const execute = async (isDemo) => {
      run.disabled = demo.disabled = true;
      out.replaceChildren(n('p', 'Inspecting locally...'));
      try {
        let value = input.value;
        if (isDemo) {
          const r = await fetch('/samples/network/tls-hello.json');
          if (!r.ok) throw Error('Original TLS example missing.');
          value = await r.text();
        }
        const r = await inspect(value);
        if (!ws.contains(out)) return;
        out.replaceChildren();
        if (isDemo)
          out.append(
            n(
              'strong',
              'DEMO SAMPLE - original synthetic records, no connection made. Your input is unchanged.',
            ),
          );
        out.append(
          n('pre', JSON.stringify(r, null, 2), {
            style:
              'padding:16px;background:#f8fafc;white-space:pre-wrap;overflow-wrap:anywhere;max-height:700px;overflow:auto;',
          }),
        );
      } catch (e) {
        out.replaceChildren(n('p', e.message, { role: 'alert' }));
      } finally {
        run.disabled = demo.disabled = false;
      }
    };
    run.onclick = () => execute(false);
    demo.onclick = () => execute(true);
  }
  const api = { helloRecord, inspect, mount };
  root.LocalTLS = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
