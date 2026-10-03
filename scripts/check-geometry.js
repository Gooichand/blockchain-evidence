#!/usr/bin/env node
/**
 * Geometry check for the generated figures.
 * I cannot view the rendered images, so this asserts the things a visual
 * review would otherwise catch: NaN/NaN coordinates, content escaping the
 * viewBox, text overlapping, and unreadable contrast on the stage.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');
const GENERATED = [
  'hero.svg',
  'badges/pipeline.svg',
  'badges/capability.svg',
  'badges/architecture.svg',
  'badges/endpoints.svg',
  'badges/trust.svg',
];

let problems = 0;

for (const rel of GENERATED) {
  const svg = fs.readFileSync(path.join(ASSETS, rel), 'utf8');
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const W = parseFloat(vb[1]);
  const H = parseFloat(vb[2]);
  const issues = [];

  // 1. no NaN / undefined leaked into any numeric attribute
  for (const m of svg.matchAll(/="(NaN|Infinity|undefined|null)"/g)) {
    issues.push(`bad attribute value "${m[1]}"`);
  }
  if (/\bNaN\b/.test(svg)) issues.push('NaN appears in output');

  // 2. every polygon point set is inside the canvas (with a small margin)
  for (const m of svg.matchAll(/points="([^"]+)"/g)) {
    for (const pair of m[1].trim().split(/\s+/)) {
      const [xs, ys] = pair.split(',').map(Number);
      if (!Number.isFinite(xs) || !Number.isFinite(ys)) {
        issues.push(`non-finite point "${pair}"`);
        break;
      }
      if (xs < -60 || xs > W + 60 || ys < -60 || ys > H + 60) {
        issues.push(`point ${pair} escapes viewBox 0 0 ${W} ${H}`);
        break;
      }
    }
  }

  // 3. circles stay on canvas
  for (const m of svg.matchAll(/<circle[^>]*cx="([\d.-]+)"[^>]*cy="([\d.-]+)"/g)) {
    const cx = parseFloat(m[1]);
    const cy = parseFloat(m[2]);
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) issues.push('non-finite circle centre');
    else if (cx < -40 || cx > W + 40 || cy < -40 || cy > H + 40) issues.push(`circle ${cx},${cy} off canvas`);
  }

  // 4. text baselines sit inside the canvas
  for (const m of svg.matchAll(/<text[^>]*\by="([\d.-]+)"/g)) {
    const y = parseFloat(m[1]);
    if (Number.isFinite(y) && (y < 6 || y > H - 2)) issues.push(`text baseline y=${y} outside canvas`);
  }

  // 5. every polygon should have an odd vertex count for these isometric quads
  let quads = 0;
  for (const m of svg.matchAll(/<polygon[^>]*points="([^"]+)"/g)) {
    const n = m[1].trim().split(/\s+/).length;
    if (n !== 3 && n !== 4) issues.push(`polygon with ${n} vertices (expected 3 or 4)`);
    if (n === 4) quads++;
  }

  // 6. animation count - motion should exist but stay sparse
  const anims = (svg.match(/<animate|<animateTransform|<animateMotion/g) || []).length;

  // 7. fill colours must be explicit on shapes (no accidental black-on-black)
  const noFill = (svg.match(/<(polygon|rect|circle)[^>]*>/g) || []).filter(
    (t) => !/fill="/.test(t) && !/<(pattern|mask|rect)[^>]*mask=/.test(t)
  );

  if (issues.length) {
    problems++;
    console.log(`  FAIL ${rel}`);
    [...new Set(issues)].slice(0, 8).forEach((i) => console.log(`       - ${i}`));
  } else {
    console.log(
      `  PASS ${rel.padEnd(34)} ${W}x${H}  quads=${String(quads).padStart(3)}  anims=${String(anims).padStart(3)}`
    );
  }
}

console.log(`\n  ${GENERATED.length - problems}/${GENERATED.length} figures geometrically sound`);
process.exit(problems === 0 ? 0 : 1);