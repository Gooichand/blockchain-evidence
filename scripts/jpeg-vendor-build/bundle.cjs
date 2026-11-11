/* Pinned decoder patch exposes original quantized coefficients before inverse DCT. */
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const root = path.resolve(__dirname, '../..'),
  vendor = path.join(__dirname, 'node_modules/jpeg-js');
let s = fs.readFileSync(path.join(vendor, 'lib/decoder.js'), 'utf8');
if (
  crypto.createHash('sha256').update(s).digest('hex') !==
  'a3f175fd6f62d142aad94d3bd90f3a30be4e076baf9b6a6fa31c8e84d9d4aa9f'
)
  throw Error('Pinned jpeg-js decoder source hash mismatch.');
const start = s.indexOf('      this.width = frame.samplesPerLine;'),
  end = s.indexOf('\n    },\n    getData:', start);
if (start < 0 || end < 0) throw Error('Decoder boundary changed.');
s =
  s.slice(0, start) +
  `      this.width=frame.samplesPerLine;this.height=frame.scanLines;this.progressive=frame.progressive;this.componentData=frame.componentsOrder.map(function(id){var c=frame.components[id];return {id:id,blocksPerLine:c.blocksPerLine,blocksPerColumn:c.blocksPerColumn,quantizationTable:Array.from(c.quantizationTable),blocks:c.blocks};});` +
  s.slice(end);
s =
  s.slice(0, s.indexOf("if (typeof module !== 'undefined')")) +
  `\nmodule.exports=function coefficients(bytes){if(!(bytes instanceof Uint8Array)||bytes.length>20*1024*1024)throw Error('JPEG input20MiB limit.');const decoder=new JpegImage();decoder.opts={tolerantDecoding:false,maxResolutionInMP:4,maxMemoryUsageInMB:192};JpegImage.resetMaxMemoryUsage(192*1024*1024);decoder.parse(bytes);return {width:decoder.width,height:decoder.height,progressive:decoder.progressive,components:decoder.componentData};};\n`;
fs.writeFileSync(path.join(__dirname, 'coefficient-decoder.cjs'), s);
require('esbuild').buildSync({
  entryPoints: [path.join(__dirname, 'coefficient-decoder.cjs')],
  outfile: path.join(root, 'public/vendor/jpeg-coefficients.js'),
  bundle: true,
  minify: true,
  platform: 'browser',
  format: 'iife',
  globalName: 'JPEGCoefficients',
  banner: {
    js: '/* MODIFIED jpeg-js0.4.4: exposes quantized coefficient blocks without inverse DCT/RGB conversion. See jpeg-THIRD-PARTY-NOTICES.txt. */',
  },
});
fs.writeFileSync(
  path.join(root, 'public/vendor/jpeg-THIRD-PARTY-NOTICES.txt'),
  'jpeg-js0.4.4, https://github.com/jpeg-js/jpeg-js . Modified: coefficient-only return before inverseDCT, strict20MiB/4MP/192MiB limits; no pixel conversion.\n\n' +
    fs.readFileSync(path.join(vendor, 'LICENSE'), 'utf8') +
    '\n\n' +
    s.slice(0, s.indexOf('var JpegImage')) +
    '\n\n' +
    fs.readFileSync(path.join(root, 'LICENSE'), 'utf8'),
);
console.log(
  'Coefficient bundleSHA256',
  crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(root, 'public/vendor/jpeg-coefficients.js')))
    .digest('hex'),
);
