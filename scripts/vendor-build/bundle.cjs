const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const root = path.resolve(__dirname, '../..');
const entries = {
  'x509-bundle.js': {
    name: 'LocalX509',
    source: 'import "reflect-metadata"; export { X509Certificate } from "@peculiar/x509";',
  },
  'qr-bundle.js': {
    name: 'LocalQR',
    source: 'import QRCode from "qrcode"; import jsQR from "jsqr"; export { QRCode, jsQR };',
  },
  'cfb-bundle.js': {
    name: 'LocalCFB',
    source: 'import * as CFB from "cfb"; export { CFB };',
  },
  'cid-bundle.js': {
    name: 'LocalCID',
    source:
      'export { CID } from "multiformats/cid"; export { sha256 } from "multiformats/hashes/sha2";',
  },
};
(async () => {
  for (const folder of ['standard_fonts', 'cmaps'])
    fs.cpSync(
      path.join(__dirname, 'node_modules/pdfjs-dist', folder),
      path.join(root, 'public/vendor/pdfjs-' + folder),
      { recursive: true },
    );
  const pdf = path.join(__dirname, 'node_modules/pdf-lib');
  fs.copyFileSync(
    path.join(pdf, 'dist/pdf-lib.min.js'),
    path.join(root, 'public/vendor/pdf-lib-1.17.1.min.js'),
  );
  fs.copyFileSync(
    path.join(pdf, 'LICENSE.md'),
    path.join(root, 'public/vendor/pdf-lib-LICENSE.md'),
  );
  const cfb = path.join(__dirname, 'node_modules/cfb');
  fs.copyFileSync(path.join(cfb, 'LICENSE'), path.join(root, 'public/vendor/cfb-LICENSE.md'));
  const media = path.join(__dirname, 'node_modules/mediainfo.js');
  fs.copyFileSync(
    path.join(media, 'dist/umd/index.min.js'),
    path.join(root, 'public/vendor/mediainfo-0.3.8.min.js'),
  );
  fs.copyFileSync(
    path.join(media, 'dist/MediaInfoModule.wasm'),
    path.join(root, 'public/vendor/MediaInfoModule-0.3.8.wasm'),
  );
  fs.copyFileSync(
    path.join(media, 'LICENSE.txt'),
    path.join(root, 'public/vendor/mediainfo-LICENSE.txt'),
  );

  for (const [file, entry] of Object.entries(entries))
    await esbuild.build({
      stdin: { contents: entry.source, resolveDir: __dirname, loader: 'js' },
      bundle: true,
      format: 'iife',
      globalName: entry.name,
      outfile: path.join(root, 'public/vendor', file),
    });
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
