/* Fixed-port public TLS handshake inspection. No HTTP request, scans or submitted credentials. */
const tls = require('node:tls');
const dns = require('node:dns').promises;
const net = require('node:net');
const { X509Certificate } = require('node:crypto');
const { normalize } = require('./dnsRegistrationService');
function domain(value) {
  const x = normalize(value);
  if (x.kind !== 'domain') throw Error('Enter a public DNS hostname, not an IP or URL.');
  return x.value;
}
async function resolvePublic(host, lookup = dns.lookup) {
  let timer;
  const records = await Promise.race([
    lookup(host, { all: true }),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(Error('DNS timed out.')), 6000);
    }),
  ]).finally(() => clearTimeout(timer));
  if (!records.length || records.length > 100) throw Error('No bounded public address set.');
  for (const row of records) {
    if (!net.isIP(row.address)) throw Error('Invalid resolver address.');
    normalize(row.address);
  }
  return records.find((x) => x.family === 4) || records[0];
}
function certificateChain(cert) {
  const chain = [],
    seen = new Set();
  let current = cert;
  for (let i = 0; current?.raw && i < 12; i++) {
    const x = new X509Certificate(current.raw);
    if (seen.has(x.fingerprint256)) break;
    seen.add(x.fingerprint256);
    const row = {
      subject: x.subject,
      issuer: x.issuer,
      subjectAltName: x.subjectAltName || null,
      validFrom: x.validFrom,
      validTo: x.validTo,
      serialNumber: x.serialNumber,
      fingerprint256: x.fingerprint256,
      publicKeyType: x.publicKey.asymmetricKeyType,
      ca: x.ca,
      validAtCheck: Date.now() >= Date.parse(x.validFrom) && Date.now() <= Date.parse(x.validTo),
      pem: x.toString(),
    };
    const next = current.issuerCertificate;
    if (next?.raw) {
      try {
        row.signatureMatchesSuppliedIssuer = x.verify(new X509Certificate(next.raw).publicKey);
      } catch {
        row.signatureMatchesSuppliedIssuer = false;
      }
    }
    chain.push(row);
    current = next;
  }
  return chain;
}
function handshake(host, address, options = {}, connect = tls.connect) {
  return new Promise((resolve) => {
    let socket,
      done = false;
    const finish = (result) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      socket?.destroy();
      resolve(result);
    };
    const timer = setTimeout(() => finish({ state: 'UNAVAILABLE', code: 'TLS_TIMEOUT' }), 6000);
    try {
      socket = connect({
        host: address.address,
        family: address.family,
        port: 443,
        servername: host,
        rejectUnauthorized: false,
        minVersion: options.version || 'TLSv1.2',
        maxVersion: options.version || 'TLSv1.3',
        ALPNProtocols: ['h2', 'http/1.1'],
      });
      socket.once('secureConnect', () => {
        try {
          const cert = socket.getPeerCertificate(true),
            chain = certificateChain(cert);
          if (!chain.length) throw Error('No peer certificate.');
          const hostnameError = tls.checkServerIdentity(host, cert);
          finish({
            state: 'CONNECTED',
            protocol: socket.getProtocol(),
            cipher: socket.getCipher(),
            alpn: socket.alpnProtocol || null,
            ephemeralKey: socket.getEphemeralKeyInfo(),
            sessionReused: socket.isSessionReused(),
            nodeDefaultTrustAuthorized: socket.authorized,
            authorizationError: socket.authorizationError || null,
            hostnameMatches: !hostnameError,
            hostnameError: hostnameError?.code || null,
            certificateChain: chain,
            chainSource:
              'Peer-reported chain, may include a root from the local trust store; not evidence the server sent a root.',
          });
        } catch {
          finish({ state: 'UNAVAILABLE', code: 'CERTIFICATE_READ_FAILED' });
        }
      });
      socket.once('error', (e) =>
        finish({ state: 'UNAVAILABLE', code: String(e.code || 'TLS_FAILED') }),
      );
    } catch {
      finish({ state: 'UNAVAILABLE', code: 'TLS_SETUP_FAILED' });
    }
  });
}
async function inspect(value, options = {}) {
  const host = domain(value),
    address = await resolvePublic(host, options.lookup),
    checkedAt = new Date().toISOString();
  // Pin the same validated public IP for all three fixed-port handshakes, avoiding DNS rebinding.
  const negotiated = await handshake(host, address, {}, options.connect);
  const versions = {};
  if (negotiated.state === 'CONNECTED')
    for (const version of ['TLSv1.2', 'TLSv1.3']) {
      const r = await handshake(host, address, { version }, options.connect);
      versions[version] = { state: r.state, protocol: r.protocol || null, code: r.code || null };
    }
  return {
    host,
    port: 443,
    checkedAt,
    connectedAddress: address.address,
    addressFamily: address.family,
    negotiated,
    versionProbes: versions,
    trustStore:
      'Node.js runtime default CA roots at time of check, not the browser/user trust store.',
    note: 'Up to3 explicit TLS handshakes on public port443 only. No HTTP request, credentials, redirect, port scan or private-address connection. Per-connection observations, not a complete cipher-suite/vulnerability scan. Version probe failure is not proof that a version is disabled. No revocation/OCSP/CT or long-term trust guarantee.',
  };
}
module.exports = { domain, resolvePublic, certificateChain, handshake, inspect };
