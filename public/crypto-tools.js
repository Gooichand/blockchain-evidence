/* Browser-only bounded crypto utilities. No keys or plaintext leave this module. */
(function (root) {
  'use strict';
  const guides = {
    aes: [
      'AES Key Checks and GCM Envelope',
      'Encrypts UTF-8 text with a newly generated AES-256-GCM key and random 96-bit IV, or decrypts an envelope containing its raw key. Paste text and choose Encrypt, or paste the complete envelope and choose Decrypt. The envelope includes the secret key: keep it private and separate the key before sharing ciphertext. Choose Analyze key for a raw hexadecimal AES key: checks 128/192/256-bit length and repeated bytes/patterns, then attempts Web Crypto import. Provider support varies (Chrome does not import AES-192). Pattern checks cannot establish entropy or secure randomness. This is a local utility, not secure key storage or a general forensic decryptor.',
    ],
    rsa: [
      'RSA Key Inspection and Validation',
      'Paste a public or two-prime private RSA JWK, PEM PUBLIC KEY (SPKI), or unencrypted PEM PRIVATE KEY (PKCS8). Public keys receive encoding, modulus/exponent, small-factor and provider-import checks; they cannot prove private-key correctness. Private keys additionally check n=p*q, distinct probable primes (32 randomized Miller-Rabin rounds each), e*d modulo lcm(p-1,q-1), all CRT values and a real OAEP round trip. Private validation is limited to 2048-4096 bits; public keys up to 8192 bits. Private values never appear in results or leave this page. No encrypted PEM, multi-prime RSA, certificate trust, randomness proof or formal primality proof. Use synthetic keys, not production secrets.',
    ],
    jwt: [
      'JWT Payload Decoder',
      'Paste a three-part JWT. Decodes its UTF-8 JSON header and payload without verifying the signature. Decoded claims, roles and expiry are untrusted; never use this output to authenticate anyone.',
    ],
    'cert-viewer': [
      'X.509 Certificate Inspector',
      'Paste 1-10 PEM certificates in leaf-to-root order. Inspects fields and extensions, checks each child signature against the next certificate, and reports current validity and declared CA/key usage. This is chain inspection, not complete trust validation: no trusted root store, full RFC5280 path policies/name constraints, hostname, CRL or OCSP.',
    ],
    digisig: [
      'ECDSA Signing and Signature Check',
      'Choose Sign to sign exact UTF-8 text using a new, non-exportable ephemeral P-256 key; its public JWK and detached SHA-256 signature are returned. The private key is discarded, not saved. Choose Verify and paste the resulting JSON object with text, signature (base64url IEEE P1363) and publicKey. A match proves those bytes match that key, not identity or certificate trust. Only ECDSA P-256/SHA-256 is supported.',
    ],
  };
  function b64(bytes) {
    let s = '';
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }
  function un64(s) {
    if (typeof s !== 'string' || !/^[a-zA-Z0-9_-]*={0,2}$/.test(s) || s.length % 4 === 1)
      throw Error('Invalid base64url encoding.');
    const raw = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
  }
  function rsaInfo(jwk) {
    if (
      jwk.kty !== 'RSA' ||
      typeof jwk.n !== 'string' ||
      typeof jwk.e !== 'string' ||
      ['d', 'p', 'q', 'dp', 'dq', 'qi', 'oth'].some((k) => k in jwk)
    )
      throw Error('RSA public JWK only; private parameters are not accepted.');
    const n = un64(jwk.n),
      e = un64(jwk.e);
    let first = 0;
    while (first < n.length && n[first] === 0) first++;
    if (first === n.length || e.length > 8 || !e.length) throw Error('Invalid RSA public values.');
    const bits = (n.length - first - 1) * 8 + Math.floor(Math.log2(n[first])) + 1;
    let exp = 0n;
    for (const b of e) exp = exp * 256n + BigInt(b);
    return {
      modulusBits: bits,
      exponent: exp.toString(),
      limit: 'Syntax/size inspection only. This is not cryptographic key validation.',
    };
  }
  function rsaInteger(bytes) {
    let n = 0n;
    for (const b of bytes) n = n * 256n + BigInt(b);
    return n;
  }
  function rsaGCD(a, b) {
    while (b) [a, b] = [b, a % b];
    return a;
  }
  function rsaPow(a, e, n) {
    let v = 1n;
    for (a %= n; e; e >>= 1n, a = (a * a) % n) if (e & 1n) v = (v * a) % n;
    return v;
  }
  function rsaProbablePrime(n, rounds = 32) {
    if (n < 2n) return false;
    for (const p of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) {
      if (n === p) return true;
      if (n % p === 0n) return false;
    }
    let d = n - 1n,
      s = 0;
    while (!(d & 1n)) {
      d >>= 1n;
      s++;
    }
    const bits = (n - 3n).toString(2).length,
      bytes = new Uint8Array(Math.ceil(bits / 8));
    for (let r = 0; r < rounds; r++) {
      let x;
      do {
        root.crypto.getRandomValues(bytes);
        bytes[0] &= 255 >>> (bytes.length * 8 - bits);
        x = rsaInteger(bytes);
      } while (x >= n - 3n);
      x = rsaPow(x + 2n, d, n);
      if (x === 1n || x === n - 1n) continue;
      let witness = true;
      for (let j = 1; j < s; j++) {
        x = (x * x) % n;
        if (x === n - 1n) {
          witness = false;
          break;
        }
      }
      if (witness) return false;
    }
    return true;
  }
  async function validateRSA(value) {
    const subtle = root.crypto?.subtle;
    if (!subtle) throw Error('Web Crypto unavailable; use HTTPS or localhost.');
    if (typeof value !== 'string' || value.length > 32768) throw Error('RSA input limit: 32 KiB.');
    let jwk;
    if (value.trim().startsWith('-----BEGIN')) {
      const pem = value
        .trim()
        .match(/^-----BEGIN (PUBLIC KEY|PRIVATE KEY)-----([A-Za-z0-9+/=\s]+)-----END \1-----$/);
      if (!pem)
        throw Error('Only PEM PUBLIC KEY (SPKI) or unencrypted PRIVATE KEY (PKCS8) supported.');
      const der = Uint8Array.from(atob(pem[2].replace(/\s/g, '')), (c) => c.charCodeAt(0));
      const priv = pem[1] === 'PRIVATE KEY';
      const imported = await subtle.importKey(
        priv ? 'pkcs8' : 'spki',
        der,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        [priv ? 'decrypt' : 'encrypt'],
      );
      jwk = await subtle.exportKey('jwk', imported);
    } else jwk = JSON.parse(value);
    if (!jwk || typeof jwk !== 'object' || jwk.kty !== 'RSA') throw Error('RSA JWK required.');
    if ('oth' in jwk) throw Error('Multi-prime RSA is unsupported.');
    const fields = ['d', 'p', 'q', 'dp', 'dq', 'qi'];
    const privateKey = fields.some((k) => k in jwk);
    if (privateKey && fields.some((k) => typeof jwk[k] !== 'string'))
      throw Error('Complete two-prime private JWK required: d, p, q, dp, dq and qi.');
    const info = rsaInfo({ kty: 'RSA', n: jwk.n, e: jwk.e });
    const read = (k, max) => {
      const b = un64(jwk[k]);
      if (!b.length || b[0] === 0 || b.length > max)
        throw Error('Noncanonical leading zero, empty or oversized RSA integer: ' + k);
      return rsaInteger(b);
    };
    const N = read('n', 1024),
      E = read('e', 8),
      issues = [];
    if (privateKey && (info.modulusBits < 2048 || info.modulusBits > 4096))
      throw Error('Private RSA validation supports 2048-4096-bit keys only.');
    if (N < 3n || N % 2n === 0n) issues.push('Modulus must be odd and greater than 2.');
    if (E < 3n || E % 2n === 0n || E >= N)
      issues.push('Exponent must be odd, at least 3, and below modulus.');
    if (rsaGCD(N, E) !== 1n) issues.push('Modulus and exponent share a factor.');
    const primes = [
      3n,
      5n,
      7n,
      11n,
      13n,
      17n,
      19n,
      23n,
      29n,
      31n,
      37n,
      41n,
      43n,
      47n,
      53n,
      59n,
      61n,
      67n,
      71n,
      73n,
      79n,
      83n,
      89n,
      97n,
    ];
    const factors = primes.filter((p) => N % p === 0n).map(String);
    if (factors.length) issues.push('Modulus has a tested small prime factor.');
    let privateChecks = null;
    if (privateKey) {
      const D = read('d', 512),
        P = read('p', 512),
        Q = read('q', 512),
        DP = read('dp', 512),
        DQ = read('dq', 512),
        QI = read('qi', 512);
      if (P <= 2n || Q <= 2n) throw Error('Invalid private prime factors.');
      const L = ((P - 1n) / rsaGCD(P - 1n, Q - 1n)) * (Q - 1n);
      privateChecks = {
        modulusProductMatches: P * Q === N,
        distinctFactors: P !== Q,
        pProbablePrime: rsaProbablePrime(P),
        qProbablePrime: rsaProbablePrime(Q),
        privateExponentInRange: D > 0n && D < N,
        exponentInverseMatches: (E * D) % L === 1n,
        dpMatches: DP === D % (P - 1n),
        dqMatches: DQ === D % (Q - 1n),
        qInverseMatches: QI > 0n && QI < P && (QI * Q) % P === 1n,
      };
      for (const [name, pass] of Object.entries(privateChecks))
        if (!pass) issues.push('Private check failed: ' + name);
    }
    let providerImport = false,
      fingerprint = null,
      oaepRoundTrip = null;
    if (!issues.length) {
      try {
        const pub = await subtle.importKey(
          'jwk',
          { kty: 'RSA', n: jwk.n, e: jwk.e },
          { name: 'RSA-OAEP', hash: 'SHA-256' },
          true,
          ['encrypt'],
        );
        const spki = await subtle.exportKey('spki', pub);
        fingerprint = Array.from(new Uint8Array(await subtle.digest('SHA-256', spki)), (b) =>
          b.toString(16).padStart(2, '0'),
        ).join('');
        providerImport = true;
        if (privateKey) {
          const clean = Object.fromEntries(['kty', 'n', 'e', ...fields].map((k) => [k, jwk[k]]));
          const priv = await subtle.importKey(
            'jwk',
            clean,
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            false,
            ['decrypt'],
          );
          const challenge = root.crypto.getRandomValues(new Uint8Array(32));
          const encrypted = await subtle.encrypt({ name: 'RSA-OAEP' }, pub, challenge);
          const plain = new Uint8Array(await subtle.decrypt({ name: 'RSA-OAEP' }, priv, encrypted));
          oaepRoundTrip =
            plain.length === challenge.length && plain.every((b, i) => b === challenge[i]);
          if (!oaepRoundTrip) issues.push('RSA-OAEP pairwise consistency failed.');
        }
      } catch (_) {
        issues.push('Web Crypto import or OAEP pairwise consistency rejected key.');
      }
    }
    return {
      modulusBits: info.modulusBits,
      exponent: info.exponent,
      keyType: privateKey ? 'two-prime private' : 'public',
      syntaxAndArithmeticChecksPass: issues.length === 0,
      providerImport,
      privateChecks,
      probablePrimeRounds: privateKey ? 32 : null,
      oaepRoundTrip,
      validation: issues.length
        ? 'FAILED'
        : privateKey
          ? 'PRIVATE CONSISTENCY CHECKS PASS'
          : 'PUBLIC CHECKS PASS; PRIVATE VALIDATION UNAVAILABLE',
      issues,
      smallPrimeFactors: factors,
      spkiSHA256: fingerprint,
      strengthNote:
        info.modulusBits < 2048
          ? 'Below 2048 bits; unsuitable for modern RSA use.'
          : 'Size alone does not prove security.',
      limit:
        'Probabilistic consistency checks, not complete security certification or formal primality proof. A composite passes 32 independent Miller-Rabin rounds with probability at most 2^-64. Public keys cannot establish private-key correctness. No randomness, certificate trust, side-channel or all-attack assessment. Private values are omitted from results.',
    };
  }
  async function analyzeAESKey(value) {
    const hex = value.trim();
    if (!/^[0-9a-fA-F]+$/.test(hex) || ![32, 48, 64].includes(hex.length))
      throw Error('AES key must be exactly32,48or64 hexadecimal characters (128/192/256bits).');
    const bytes = Uint8Array.from(hex.match(/../g), (h) => parseInt(h, 16));
    let providerImport = false;
    try {
      await root.crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
      providerImport = true;
    } catch {}
    const distinct = new Set(bytes).size;
    const repeatingPeriods = [];
    for (let period = 1; period <= bytes.length / 2; period++)
      if (bytes.length % period === 0 && bytes.every((b, i) => b === bytes[i % period]))
        repeatingPeriods.push(period);
    return {
      keyBits: bytes.length * 8,
      standardAESLength: true,
      providerImport,
      providerNote: providerImport
        ? 'Provider accepted AES-GCM key import.'
        : 'This browser/provider rejected key import (Chrome may not support AES-192). Length/pattern checks still apply.',
      distinctByteValues: distinct,
      repeatingPeriodsBytes: repeatingPeriods,
      warnings: repeatingPeriods.length
        ? ['Repeated byte pattern detected; do not use demonstration/pattern keys to protect data.']
        : [],
      limit:
        'Length/import and simple byte-pattern checks only. Randomness, entropy, origin, reuse and secrecy are NOT established. No key bytes are returned.',
    };
  }
  function jwtDecode(token) {
    const parts = token.trim().split('.');
    if (parts.length !== 3) throw Error('Three JWT segments required.');
    const decode = (p) => JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(un64(p)));
    return {
      header: decode(parts[0]),
      payload: decode(parts[1]),
      signatureBytes: un64(parts[2]).length,
      signatureVerification: 'NOT PERFORMED',
      limit: 'All decoded claims are untrusted.',
    };
  }
  async function inspectChain(value, date = new Date()) {
    if (value.length > 1000000) throw Error('Certificate input limit:1 million characters.');
    const blocks =
      value.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) || [];
    if (
      !blocks.length ||
      blocks.length > 10 ||
      value.replace(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g, '').trim()
    )
      throw Error('Paste 1-10 PEM certificates, leaf first, root last; no other content.');
    const certs = blocks.map((pem) => new root.LocalX509.X509Certificate(pem));
    const certificates = certs.map((c, i) => {
      const bc = c.getExtension('2.5.29.19'),
        ku = c.getExtension('2.5.29.15');
      return {
        index: i,
        subject: c.subject,
        issuer: c.issuer,
        serialNumber: c.serialNumber,
        notBefore: c.notBefore.toISOString(),
        notAfter: c.notAfter.toISOString(),
        validAtCheckedTime: date >= c.notBefore && date <= c.notAfter,
        publicKeyAlgorithm: c.publicKey.algorithm,
        basicConstraints: bc ? { ca: bc.ca, pathLength: bc.pathLength ?? null } : null,
        keyUsageFlags: ku?.usages ?? null,
        extensions: c.extensions.map((e) => ({ oid: e.type, critical: e.critical })),
      };
    });
    const chainSignatureChecks = [];
    for (let i = 0; i < certs.length - 1; i++) {
      const child = certs[i],
        issuer = certs[i + 1];
      let signatureMatches = null,
        error = null;
      try {
        signatureMatches = await child.verify(
          { publicKey: issuer.publicKey, signatureOnly: true },
          root.crypto,
        );
      } catch (e) {
        error = 'Signature algorithm/check unavailable: ' + e.message;
      }
      chainSignatureChecks.push({
        childIndex: i,
        issuerIndex: i + 1,
        issuerNameMatches: child.issuer === issuer.subject,
        signatureMatches,
        issuerDeclaresCA: certificates[i + 1].basicConstraints?.ca === true,
        issuerKeyCertSign:
          certificates[i + 1].keyUsageFlags === null
            ? null
            : !!(certificates[i + 1].keyUsageFlags & 32),
        error,
      });
    }
    const last = certs[certs.length - 1];
    let lastSelfSignature = null;
    try {
      lastSelfSignature =
        last.issuer === last.subject
          ? await last.verify({ publicKey: last.publicKey, signatureOnly: true }, root.crypto)
          : null;
    } catch {}
    return {
      certificateCount: certs.length,
      chainSignatureChecks,
      lastCertificateSelfSignature: lastSelfSignature,
      checkedAt: date.toISOString(),
      trustVerification: 'NOT PERFORMED',
      ...certificates[0],
      certificates,
      limit:
        'Ordered pairwise signatures, names, dates and declared CA/key usage fields only. No trusted root store, full RFC5280 path/policy/name-constraint validation, hostname checks, CRL or OCSP. A matching self-signature does not make a root trusted.',
    };
  }
  async function analyze(id, value, mode = 'encrypt') {
    if (value.length > 1000000) throw Error('Text limit: 1 million characters.');
    const subtle = root.crypto?.subtle;
    if (id === 'jwt') return jwtDecode(value);
    if (id === 'rsa') return validateRSA(value);
    if (id === 'cert-viewer') {
      if (!root.LocalX509) throw Error('Certificate parser unavailable.');
      return inspectChain(value);
    }
    if (!subtle) throw Error('Web Crypto unavailable; use HTTPS or localhost.');
    if (id === 'aes') {
      if (mode === 'analyze-key') return analyzeAESKey(value);
      if (mode === 'decrypt') {
        const x = JSON.parse(value);
        if (x.algorithm !== 'AES-256-GCM' || un64(x.key).length !== 32 || un64(x.iv).length !== 12)
          throw Error('AES-256-GCM envelope with 32-byte key and 12-byte IV required.');
        const key = await subtle.importKey('raw', un64(x.key), 'AES-GCM', false, ['decrypt']);
        try {
          const bytes = await subtle.decrypt(
            { name: 'AES-GCM', iv: un64(x.iv) },
            key,
            un64(x.ciphertext),
          );
          return {
            text: new TextDecoder('utf-8', { fatal: true }).decode(bytes),
            authentication: 'GCM tag accepted; this does not identify the sender.',
          };
        } catch {
          throw Error('Decryption/tag verification failed; no plaintext returned.');
        }
      }
      const key = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
          'encrypt',
          'decrypt',
        ]),
        iv = root.crypto.getRandomValues(new Uint8Array(12)),
        ciphertext = await subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          new TextEncoder().encode(value),
        );
      return {
        algorithm: 'AES-256-GCM',
        key: b64(new Uint8Array(await subtle.exportKey('raw', key))),
        iv: b64(iv),
        ciphertext: b64(new Uint8Array(ciphertext)),
        warning: 'SECRET KEY INCLUDED. Keep this envelope private; it is not protected at rest.',
      };
    }
    if (id === 'digisig') {
      if (mode === 'sign') {
        const pair = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, [
          'sign',
          'verify',
        ]);
        const signature = await subtle.sign(
          { name: 'ECDSA', hash: 'SHA-256' },
          pair.privateKey,
          new TextEncoder().encode(value),
        );
        return {
          text: value,
          signature: b64(new Uint8Array(signature)),
          publicKey: await subtle.exportKey('jwk', pair.publicKey),
          algorithm: 'ECDSA P-256 SHA-256',
          signatureEncoding: 'IEEE P1363 base64url',
          privateKey:
            'Ephemeral, non-exportable and not stored. No persistent signing identity is created.',
          identityAndTrust: 'NOT VERIFIED',
        };
      }
      const x = JSON.parse(value);
      if (
        typeof x.text !== 'string' ||
        x.publicKey?.kty !== 'EC' ||
        x.publicKey.crv !== 'P-256' ||
        'd' in x.publicKey
      )
        throw Error('Text, base64url signature and public-only P-256 JWK required.');
      const key = await subtle.importKey(
          'jwk',
          x.publicKey,
          { name: 'ECDSA', namedCurve: 'P-256' },
          false,
          ['verify'],
        ),
        valid = await subtle.verify(
          { name: 'ECDSA', hash: 'SHA-256' },
          key,
          un64(x.signature),
          new TextEncoder().encode(x.text),
        );
      return {
        signatureMatches: valid,
        algorithm: 'ECDSA P-256 SHA-256',
        identityAndTrust: 'NOT VERIFIED',
      };
    }
    throw Error('Unknown crypto tool.');
  }
  async function example(id) {
    if (id === 'jwt')
      return {
        value:
          b64(new TextEncoder().encode(JSON.stringify({ alg: 'none', typ: 'JWT' }))) +
          '.' +
          b64(
            new TextEncoder().encode(
              JSON.stringify({ sub: 'SYNTHETIC DEMO', role: 'untrusted-claim' }),
            ),
          ) +
          '.',
      };
    if (id === 'aes') return { value: 'Original DGC synthetic text, not evidence.' };
    if (id === 'cert-viewer') {
      const r = await fetch('/samples/crypto/demo-chain.pem');
      if (!r.ok) throw Error('Example unavailable.');
      return { value: await r.text() };
    }
    if (id === 'rsa') {
      const pair = await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt'],
      );
      return { value: JSON.stringify(await crypto.subtle.exportKey('jwk', pair.privateKey)) };
    }
    const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
        'sign',
        'verify',
      ]),
      text = 'Original DGC signed demo',
      signature = await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        pair.privateKey,
        new TextEncoder().encode(text),
      );
    return {
      value: JSON.stringify({
        text,
        signature: b64(new Uint8Array(signature)),
        publicKey: await crypto.subtle.exportKey('jwk', pair.publicKey),
      }),
    };
  }
  function ready(id) {
    return (
      id === 'jwt' ||
      id === 'rsa' ||
      (id === 'cert-viewer' ? !!root.LocalX509 : !!root.crypto?.subtle)
    );
  }
  function n(tag, text, attrs = {}) {
    const x = document.createElement(tag);
    if (text !== undefined) x.textContent = text;
    for (const [k, v] of Object.entries(attrs)) x.setAttribute(k, v);
    return x;
  }
  function mount(ws, tool) {
    const [title, guide] = guides[tool.id];
    ws.appendChild(n('h2', title));
    ws.appendChild(
      n('p', guide, {
        style:
          'padding:16px;background:#f8fafc;line-height:1.6;border:1px solid #ddd;border-radius:10px;',
      }),
    );
    ws.appendChild(
      n(
        'p',
        'Local only. No keys, tokens or plaintext are sent to a server or stored by this tool. Do not use production secrets for experiments.',
      ),
    );
    const input = n('textarea', undefined, {
        'aria-label': 'Cryptography input',
        rows: '6',
        style: 'width:100%;box-sizing:border-box;',
      }),
      mode = n('select', undefined, {
        'aria-label': tool.id === 'digisig' ? 'Signature operation' : 'AES operation',
      });
    for (const v of tool.id === 'digisig'
      ? ['verify', 'sign']
      : ['encrypt', 'decrypt', 'analyze-key'])
      mode.appendChild(n('option', v, { value: v }));
    ws.appendChild(input);
    if (['aes', 'digisig'].includes(tool.id)) ws.appendChild(mode);
    const run = n('button', 'Run local tool', { class: 'fl-btn fl-btn-primary', type: 'button' }),
      demo = n('button', '▶ Try example', {
        class: 'fl-btn fl-btn-ghost',
        type: 'button',
        'aria-label': 'Try crypto example',
      }),
      out = n('section', undefined, { role: 'status', style: 'margin-top:20px;' });
    ws.append(run, demo, out);
    async function execute(d) {
      run.disabled = demo.disabled = true;
      out.replaceChildren(n('p', 'Processing locally...'));
      try {
        const data = d ? await example(tool.id) : { value: input.value },
          result = await analyze(
            tool.id,
            data.value,
            d ? (tool.id === 'digisig' ? 'verify' : 'encrypt') : mode.value,
          );
        if (!ws.contains(out)) return;
        out.replaceChildren();
        if (d)
          out.appendChild(
            n(
              'strong',
              'DEMO SAMPLE - original synthetic data, actual crypto/parser execution. Your input is unchanged.',
            ),
          );
        out.appendChild(
          n('pre', JSON.stringify(result, null, 2), {
            style:
              'padding:16px;background:#f8fafc;white-space:pre-wrap;overflow-wrap:anywhere;max-height:650px;overflow:auto;',
          }),
        );
      } catch (e) {
        if (ws.contains(out))
          out.replaceChildren(
            n('p', e.message || 'Cryptographic operation failed.', { role: 'alert' }),
          );
      } finally {
        run.disabled = demo.disabled = false;
      }
    }
    run.onclick = () => execute(false);
    demo.onclick = () => execute(true);
  }
  const api = {
    mount,
    analyze,
    ready,
    b64,
    un64,
    rsaInfo,
    validateRSA,
    rsaProbablePrime,
    analyzeAESKey,
    jwtDecode,
    inspectChain,
    example,
    guides,
  };
  root.CryptoTools = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
