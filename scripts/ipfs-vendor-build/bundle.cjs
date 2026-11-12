/* Keep IPFS dependencies isolated from other forensic parsers. */
const esbuild = require('esbuild'),
  fs = require('fs'),
  path = require('path');
(async () => {
  await esbuild
    .build({
      absWorkingDir: __dirname,
      stdin: {
        contents:
          'export { CarReader } from "@ipld/car"; export { exporter } from "ipfs-unixfs-exporter"; export { CID } from "multiformats/cid"; export { sha256 } from "multiformats/hashes/sha2";',
        resolveDir: __dirname,
        loader: 'js',
      },
      bundle: true,
      format: 'iife',
      globalName: 'LocalIPFS',
      outfile: path.resolve(__dirname, '../../public/vendor/ipfs-bundle.js'),
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
        const files = fs.readdirSync(base).filter((f) => /^licen[sc]e(?:[.\-]|$)/i.test(f));
        if (!files.length) {
          const index = require('./licenses/index.json');
          const notice = index[pkg.name];
          if (!notice) throw Error('License missing for ' + folder);
          notices.push(
            pkg.name +
              ' ' +
              pkg.version +
              '\n' +
              fs.readFileSync(path.join(__dirname, 'licenses', notice), 'utf8'),
          );
          continue;
        }
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
        path.resolve(__dirname, '../../public/vendor/ipfs-THIRD-PARTY-NOTICES.txt'),
        notices.join('\n\n'),
      );
    });
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
