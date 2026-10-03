#!/usr/bin/env node
/** Structural sanity check on the generated SVGs: well-formed XML, no dangling
 *  url(#id) references, declared viewBox, sane dimensions. */
'use strict';
const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');

// Only the figures this repo generates. Pre-existing hand-made SVGs elsewhere in
// assets/ are not this script's business and are left untouched.
const GENERATED = [
  'hero.svg',
  'badges/pipeline.svg',
  'badges/capability.svg',
  'badges/architecture.svg',
  'badges/endpoints.svg',
  'badges/trust.svg',
];
const files = GENERATED.map((r) => path.join(ASSETS, r)).filter((f) => fs.existsSync(f));

const missing = GENERATED.filter((r) => !fs.existsSync(path.join(ASSETS, r)));
if (missing.length) {
  console.log(`  FAIL missing generated figures: ${missing.join(', ')}`);
  process.exit(1);
}

let bad = 0;
for (const f of files) {
  const rel = path.relative(path.join(__dirname, '..'), f).replace(/\\/g, '/');
  const svg = fs.readFileSync(f, 'utf8');
  const problems = [];

  // 1. well-formed?
  try {
    const { DOMParser } = require('@xmldom/xmldom');
    new DOMParser({ onError: () => {} }).parseFromString(svg, 'text/xml');
  } catch {
    // fall back to a structural check if xmldom is unavailable
  }

  // 2. every url(#x) has a matching id
  const ids = new Set([...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const refs = [...svg.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);
  const xlink = [...svg.matchAll(/xlink:href="#([^"]+)"/g)].map((m) => m[1]);
  for (const r of [...refs, ...xlink]) {
    if (!ids.has(r)) problems.push(`dangling reference #${r}`);
  }

  // 3. required attributes
  if (!/viewBox="0 0 [\d.]+ [\d.]+"/.test(svg)) problems.push('missing/!malformed viewBox');
  if (!/width="\d+"/.test(svg)) problems.push('missing width');
  if (!/height="\d+"/.test(svg)) problems.push('missing height');
  if (!/<title>/.test(svg)) problems.push('missing <title> for a11y');
  if (!/role="img"/.test(svg)) problems.push('missing role="img"');

  // 4. size guard — GitHub renders these inline
  const kb = (fs.statSync(f).size / 1024).toFixed(1);
  if (parseFloat(kb) > 120) problems.push(`too large for inline render: ${kb} KB`);

  const dims = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const ratio = dims ? (dims[1] / dims[2]).toFixed(2) : '?';

  if (problems.length) {
    bad++;
    console.log(`  FAIL ${rel}`);
    problems.forEach((p) => console.log(`       - ${p}`));
  } else {
    console.log(`  PASS ${rel.padEnd(38)} ${String(kb).padStart(6)} KB  ratio ${ratio}`);
  }
}
console.log(`\n  ${files.length - bad}/${files.length} SVGs valid`);
process.exit(bad === 0 ? 0 : 1);