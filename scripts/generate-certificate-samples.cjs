/* Synthetic public certificates only. Keys exist only in memory and are never exported. */
require('./vendor-build/node_modules/reflect-metadata');
const { webcrypto } = require('crypto');
const fs = require('fs');
const X = require('./vendor-build/node_modules/@peculiar/x509');
X.cryptoProvider.set(webcrypto);
(async () => {
  const algorithm = { name: 'ECDSA', namedCurve: 'P-256' },
    ca = await webcrypto.subtle.generateKey(algorithm, false, ['sign', 'verify']),
    leaf = await webcrypto.subtle.generateKey(algorithm, false, ['sign', 'verify']);
  const dates = {
    notBefore: new Date('2026-11-01T00:00:00Z'),
    notAfter: new Date('2030-11-01T00:00:00Z'),
  };
  const root = await X.X509CertificateGenerator.createSelfSigned({
    name: 'CN=DGC Synthetic Root,O=Public Demo Only',
    keys: ca,
    serialNumber: '01',
    ...dates,
    extensions: [
      new X.BasicConstraintsExtension(true, 1, true),
      new X.KeyUsagesExtension(X.KeyUsageFlags.keyCertSign | X.KeyUsageFlags.cRLSign, true),
    ],
  });
  const cert = await X.X509CertificateGenerator.create({
    subject: 'CN=DGC Synthetic Leaf,O=Public Demo Only',
    issuer: root.subject,
    publicKey: leaf.publicKey,
    signingKey: ca.privateKey,
    serialNumber: '02',
    ...dates,
    extensions: [
      new X.BasicConstraintsExtension(false, undefined, true),
      new X.KeyUsagesExtension(X.KeyUsageFlags.digitalSignature, true),
    ],
  });
  fs.writeFileSync(
    'public/samples/crypto/demo-chain.pem',
    cert.toString('pem') + '\n' + root.toString('pem') + '\n',
  );
  console.log('Wrote original two-certificate public demo chain. No private keys exported.');
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
