const { webcrypto } = require('crypto');
global.crypto = webcrypto;
const C = require('../public/crypto-tools');
test('JWT utf8 decoding never claims signature validation', () => {
  const b = (x) => C.b64(new TextEncoder().encode(JSON.stringify(x)));
  const r = C.jwtDecode(b({ alg: 'none' }) + '.' + b({ sub: 'डेमो' }) + '.');
  expect(r.payload.sub).toBe('डेमो');
  expect(r.signatureVerification).toBe('NOT PERFORMED');
  expect(() => C.jwtDecode('x')).toThrow();
});
test('RSA inspection rejects private JWKs and reports modulus bits', () => {
  expect(C.rsaInfo({ kty: 'RSA', n: C.b64(new Uint8Array([128, 0])), e: 'AQAB' })).toEqual(
    expect.objectContaining({ modulusBits: 16, exponent: '65537' }),
  );
  expect(() => C.rsaInfo({ kty: 'RSA', n: 'gA', e: 'AQAB', d: 'private' })).toThrow('private');
});
test('AES round trip checks GCM tag and rejects changed bytes', async () => {
  const envelope = await C.analyze('aes', 'Original डेमो');
  expect((await C.analyze('aes', JSON.stringify(envelope), 'decrypt')).text).toBe('Original डेमो');
  envelope.ciphertext = C.b64(new Uint8Array(32));
  await expect(C.analyze('aes', JSON.stringify(envelope), 'decrypt')).rejects.toThrow('failed');
});
test('real ECDSA signature verifies and changed message fails', async () => {
  const { value } = await C.example('digisig');
  expect((await C.analyze('digisig', value)).signatureMatches).toBe(true);
  const x = JSON.parse(value);
  x.text += ' changed';
  expect((await C.analyze('digisig', JSON.stringify(x))).signatureMatches).toBe(false);
});

test('user text can be signed with a nonpersistent key and verified; tampering fails', async () => {
  const r = await C.analyze('digisig', 'Exact नमस्ते\nwith whitespace ', 'sign');
  expect(r.text).toBe('Exact नमस्ते\nwith whitespace ');
  expect(r.publicKey.d).toBeUndefined();
  expect(r.privateKey).toContain('non-exportable');
  expect((await C.analyze('digisig', JSON.stringify(r), 'verify')).signatureMatches).toBe(true);
  r.text += 'x';
  expect((await C.analyze('digisig', JSON.stringify(r), 'verify')).signatureMatches).toBe(false);
});
test('real certificate chain signatures are checked without asserting trusted identity', async () => {
  const context = {
    crypto: webcrypto,
    Reflect,
    TextEncoder,
    TextDecoder,
    Uint8Array,
    ArrayBuffer,
    atob,
    btoa,
  };
  require('vm').runInNewContext(
    require('fs').readFileSync('public/vendor/x509-bundle.js', 'utf8'),
    context,
  );
  global.LocalX509 = context.LocalX509;
  const pem = require('fs').readFileSync('public/samples/crypto/demo-chain.pem', 'utf8');
  const r = await C.inspectChain(pem, new Date('2027-01-01T00:00:00Z'));
  expect(r.certificateCount).toBe(2);
  expect(r.chainSignatureChecks[0]).toMatchObject({
    signatureMatches: true,
    issuerNameMatches: true,
    issuerDeclaresCA: true,
    issuerKeyCertSign: true,
  });
  expect(r.lastCertificateSelfSignature).toBe(true);
  expect(r.trustVerification).toBe('NOT PERFORMED');
  expect((await C.inspectChain(pem, new Date('2031-01-01T00:00:00Z'))).validAtCheckedTime).toBe(
    false,
  );
  const blocks = pem.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g),
    raw = Buffer.from(blocks[0].replace(/-----[^-]+-----|\s/g, ''), 'base64');
  raw[raw.length - 1] ^= 1;
  const changed =
    '-----BEGIN CERTIFICATE-----\n' +
    raw.toString('base64') +
    '\n-----END CERTIFICATE-----\n' +
    blocks[1];
  expect((await C.inspectChain(changed)).chainSignatureChecks[0].signatureMatches).toBe(false);
  await expect(C.inspectChain('not a certificate')).rejects.toThrow('PEM');
});
test('RSA public validation imports a real key, fingerprints SPKI and supports PEM', async () => {
  const pair = await webcrypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt'],
  );
  const jwk = await webcrypto.subtle.exportKey('jwk', pair.publicKey);
  const r = await C.validateRSA(JSON.stringify(jwk));
  expect(r.syntaxAndArithmeticChecksPass).toBe(true);
  expect(r.providerImport).toBe(true);
  expect(r.spkiSHA256).toMatch(/^[0-9a-f]{64}$/);
  const spki = await webcrypto.subtle.exportKey('spki', pair.publicKey);
  const pem =
    '-----BEGIN PUBLIC KEY-----\n' +
    Buffer.from(spki).toString('base64') +
    '\n-----END PUBLIC KEY-----';
  expect((await C.validateRSA(pem)).spkiSHA256).toBe(r.spkiSHA256);
  expect(r.limit).toContain('not complete');
});
test('RSA public checks catch even modulus, small factors and invalid exponents', async () => {
  const key = (n, e) =>
    JSON.stringify({ kty: 'RSA', n: C.b64(Uint8Array.from(n)), e: C.b64(Uint8Array.from(e)) });
  expect((await C.validateRSA(key([128, 0], [3]))).issues.join(' ')).toContain('odd');
  expect((await C.validateRSA(key([15], [3]))).smallPrimeFactors).toEqual(['3', '5']);
  expect((await C.validateRSA(key([101], [2]))).syntaxAndArithmeticChecksPass).toBe(false);
  await expect(
    C.validateRSA('-----BEGIN PRIVATE KEY-----\nx\n-----END PRIVATE KEY-----'),
  ).rejects.toThrow();
  await expect(C.validateRSA(key([0, 101], [3]))).rejects.toThrow('leading zero');
});
test('AES raw key analysis checks all AES sizes, flags repetitions without claiming entropy', async () => {
  for (const bytes of [16, 24, 32]) {
    const r = await C.analyze('aes', '00'.repeat(bytes), 'analyze-key');
    expect(r.keyBits).toBe(bytes * 8);
    expect(r.providerImport).toBe(true);
    expect(r.repeatingPeriodsBytes).toContain(1);
    expect(r.limit).toContain('entropy');
    expect(r.key).toBeUndefined();
  }
  await expect(C.analyzeAESKey('xyz')).rejects.toThrow('hexadecimal');
  await expect(C.analyzeAESKey('00'.repeat(17))).rejects.toThrow('exactly');
});

test('AES key analysis reports provider rejection without hiding valid length and pattern measurements', async () => {
  const old = global.crypto;
  global.crypto = {
    subtle: {
      importKey: async () => {
        throw new Error('unsupported');
      },
    },
  };
  try {
    const r = await C.analyzeAESKey('00'.repeat(24));
    expect(r.standardAESLength).toBe(true);
    expect(r.keyBits).toBe(192);
    expect(r.providerImport).toBe(false);
    expect(r.providerNote).toContain('rejected');
    expect(r.repeatingPeriodsBytes).toContain(1);
  } finally {
    global.crypto = old;
  }
});

describe('RSA private two-prime consistency validation', () => {
  let privateJWK, pair;
  beforeAll(async () => {
    pair = await webcrypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt'],
    );
    privateJWK = await webcrypto.subtle.exportKey('jwk', pair.privateKey);
  });
  const changed = (value) => {
    const b = C.un64(value);
    b[b.length - 1] ^= 2;
    return C.b64(b);
  };
  test('full JWK validates arithmetic, probable primes, CRT and actual OAEP roundtrip without disclosing secrets', async () => {
    const r = await C.validateRSA(JSON.stringify(privateJWK));
    expect(r.validation).toBe('PRIVATE CONSISTENCY CHECKS PASS');
    expect(Object.values(r.privateChecks).every(Boolean)).toBe(true);
    expect(r.oaepRoundTrip).toBe(true);
    expect(r.probablePrimeRounds).toBe(32);
    for (const k of ['n', 'd', 'p', 'q', 'dp', 'dq', 'qi'])
      expect(JSON.stringify(r)).not.toContain(privateJWK[k]);
  });
  test('PKCS8 private PEM also validates and has same public fingerprint', async () => {
    const der = await webcrypto.subtle.exportKey('pkcs8', pair.privateKey);
    const pem =
      '-----BEGIN PRIVATE KEY-----\n' +
      Buffer.from(der).toString('base64') +
      '\n-----END PRIVATE KEY-----';
    const r = await C.validateRSA(pem);
    expect(r.oaepRoundTrip).toBe(true);
    expect(r.spkiSHA256).toBe((await C.validateRSA(JSON.stringify(privateJWK))).spkiSHA256);
  });
  test.each(['n', 'd', 'p', 'q', 'dp', 'dq', 'qi'])(
    'tampered %s fails rather than provider normalization hiding it',
    async (k) => {
      const r = await C.validateRSA(JSON.stringify({ ...privateJWK, [k]: changed(privateJWK[k]) }));
      expect(r.validation).toBe('FAILED');
      expect(r.oaepRoundTrip).toBeNull();
    },
  );
  test('partial or multi-prime private keys rejected', async () => {
    const x = { ...privateJWK };
    delete x.qi;
    await expect(C.validateRSA(JSON.stringify(x))).rejects.toThrow('Complete');
    await expect(C.validateRSA(JSON.stringify({ ...privateJWK, oth: [] }))).rejects.toThrow(
      'Multi-prime',
    );
  });
  test('Miller-Rabin detects prime and composite/Carmichael inputs', () => {
    for (const p of [2n, 3n, 101n, 65537n, 2147483647n]) expect(C.rsaProbablePrime(p)).toBe(true);
    for (const n of [0n, 1n, 4n, 341n, 561n, 1105n, 1729n, 3215031751n])
      expect(C.rsaProbablePrime(n)).toBe(false);
  });
});

test('invalid CRT inside PKCS8 is not silently repaired into a passing key', async () => {
  const pair = await webcrypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt'],
  );
  const der = Buffer.from(await webcrypto.subtle.exportKey('pkcs8', pair.privateKey));
  der[der.length - 1] ^= 2;
  const pem =
    '-----BEGIN PRIVATE KEY-----\n' + der.toString('base64') + '\n-----END PRIVATE KEY-----';
  let r;
  try {
    r = await C.validateRSA(pem);
  } catch (e) {
    expect(e).toBeInstanceOf(Error);
    return;
  }
  expect(r.validation).toBe('FAILED');
  expect(r.privateChecks.qInverseMatches).toBe(false);
});

test('4096-bit private key validates within the supported size bound', async () => {
  const pair = await webcrypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt'],
  );
  const r = await C.validateRSA(
    JSON.stringify(await webcrypto.subtle.exportKey('jwk', pair.privateKey)),
  );
  expect(r.modulusBits).toBe(4096);
  expect(r.oaepRoundTrip).toBe(true);
  expect(r.validation).toBe('PRIVATE CONSISTENCY CHECKS PASS');
}, 20000);
