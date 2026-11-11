/* Keep CMS dependencies isolated from the existing certificate-inspection bundle. */
const esbuild = require('esbuild'),
  fs = require('fs'),
  path = require('path');
(async () => {
  await esbuild
    .build({
      absWorkingDir: __dirname,
      stdin: {
        contents:
          'import * as asn1js from "asn1js"; export { asn1js }; export { ContentInfo, SignedData, setEngine, CryptoEngine } from "pkijs";',
        resolveDir: __dirname,
        loader: 'js',
      },
      bundle: true,
      format: 'iife',
      globalName: 'LocalCMS',
      outfile: path.resolve(__dirname, '../../public/vendor/cms-bundle.js'),
      metafile: true,
    })
    .then((result) => {
      const folders = new Set();
      for (const input of Object.keys(result.metafile.inputs)) {
        const match = input.match(/^(node_modules\/(?:@[^/]+\/)?[^/]+)\//);
        if (match) folders.add(match[1]);
      }
      const notices = [];
      for (const folder of [...folders].sort()) {
        const base = path.join(__dirname, folder),
          pkg = JSON.parse(fs.readFileSync(path.join(base, 'package.json'), 'utf8'));
        const files = fs.readdirSync(base).filter((f) => /^licen[sc]e(?:\.|$)/i.test(f));
        if (!files.length) throw Error('License missing for ' + folder);
        for (const file of files)
          notices.push(
            pkg.name +
              ' ' +
              pkg.version +
              ' ' +
              file +
              '\n' +
              fs.readFileSync(path.join(base, file), 'utf8'),
          );
      }
      fs.writeFileSync(
        path.resolve(__dirname, '../../public/vendor/cms-THIRD-PARTY-NOTICES.txt'),
        notices.join('\n\n'),
      );
    });
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
