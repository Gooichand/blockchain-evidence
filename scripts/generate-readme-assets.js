#!/usr/bin/env node
/**
 * generate-readme-assets.js
 * ---------------------------------------------------------------------------
 * Generates the SVG artwork used by README.md.
 *
 * DESIGN CONSTRAINT — "minimalist, not colourful"
 *   Near-black stage, hairline strokes, ONE accent, depth through layering and
 *   perspective rather than saturation. Restraint is the point: the artwork
 *   should frame the content, not compete with it.
 *
 * WHY SVG AND NOT CSS?
 *   GitHub strips <style>, <script> and raw HTML interactivity from Markdown, so
 *   a README cannot host CSS/JS. It CAN render an SVG via <img src="...svg">,
 *   and SMIL/CSS animations *inside* that SVG do play. So the motion lives in
 *   self-hosted SVG instead of a third-party image service that can rot.
 *
 * DETERMINISTIC BY DESIGN
 *   All randomness comes from a seeded LCG, so re-running produces byte-identical
 *   output and CI can regenerate without diff noise.
 *
 * Usage:  npm run assets:readme
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const BADGES = path.join(ASSETS, 'badges');

/* Seeded LCG — stable output across runs. */
let _seed = 0x9e3779b9;
function rnd() {
  _seed = (_seed * 1664525 + 1013904223) >>> 0;
  return _seed / 4294967296;
}
const resetRng = (s) => { _seed = s >>> 0; };
const rF = (a, b) => a + rnd() * (b - a);

/* ------------------------------------------------------------------ *
 * Palette — one accent on near-black. Everything else is a grey.
 * Deliberately NOT the project's crimson everywhere: a single warm red
 * reads as "alert/error" on GitHub, so it is rationed to the accent role.
 * ------------------------------------------------------------------ */
const C = {
  stage: '#08090b',
  stage2: '#0c0d11',
  hair: 'rgba(255,255,255,.10)', // rendered as hex below
  ink: '#f2f3f5',
  muted: '#8b909a',
  dim: '#5b6069',
  accent: '#e5484d', // single accent
  accentSoft: '#f0a04b', // used only for "verified / positive" semantics
};

const FONT_UI =
  "'Segoe UI',system-ui,-apple-system,'Helvetica Neue',Arial,sans-serif";
const FONT_MONO =
  "ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace";

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function defs(extra = '') {
  return `
  <linearGradient id="stage" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%"   stop-color="${C.stage}"/>
    <stop offset="60%"  stop-color="${C.stage2}"/>
    <stop offset="100%" stop-color="${C.stage}"/>
  </linearGradient>
  <linearGradient id="accentFade" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%"   stop-color="${C.accent}" stop-opacity="0"/>
    <stop offset="45%"  stop-color="${C.accent}" stop-opacity=".55"/>
    <stop offset="100%" stop-color="${C.accent}" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%"   stop-color="#ffffff" stop-opacity=".10"/>
    <stop offset="50%"  stop-color="#ffffff" stop-opacity=".02"/>
    <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="halo">
    <stop offset="0%"   stop-color="${C.accent}" stop-opacity=".26"/>
    <stop offset="55%"  stop-color="${C.accent}" stop-opacity=".05"/>
    <stop offset="100%" stop-color="${C.accent}" stop-opacity="0"/>
  </radialGradient>
  <filter id="soft" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="10"/>
  </filter>
  <filter id="softer" x="-90%" y="-90%" width="280%" height="280%">
    <feGaussianBlur stdDeviation="26"/>
  </filter>
  ${extra}`;
}

const wrap = (w, h, label, d, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}">
<title>${esc(label)}</title>
<defs>${d}
</defs>
${body}
</svg>
`;

/* ================================================================== *
 * 1. HERO — isometric evidence blocks receding into depth
 *    Hairline wireframe, one accent, slow drift. Depth, not decoration.
 * ================================================================== */
function hero() {
  const W = 1200;
  const H = 400;

  const CX = 600;
  const TOP = 196;
  const HW = 92; // half width
  const HD = 54; // half depth
  const VE = 88; // vertical edge

  /**
   * One isometric block as pure hairlines. `fillTop` optionally lays a whisper
   * of accent on the top face so the stack reads as a lit surface.
   */
  function block(k, opacity, withFill) {
    const px = (x) => CX + (x - CX) * k;
    const py = (y) => TOP + (y - TOP) * k;

    const t = `${CX},${py(TOP - HD)}`;
    const r = `${px(CX + HW)},${py(TOP)}`;
    const b = `${CX},${py(TOP + HD)}`;
    const l = `${px(CX - HW)},${py(TOP)}`;
    const vb = `${CX},${py(TOP + HD + VE)}`;
    const vl = `${px(CX - HW)},${py(TOP + VE)}`;
    const vr = `${px(CX + HW)},${py(TOP + VE)}`;

    return `
  <g opacity="${opacity}">
    ${withFill ? `<polygon points="${t} ${r} ${b} ${l}" fill="url(#sheen)"/>` : ''}
    <polygon points="${t} ${r} ${b} ${l}" fill="none" stroke="#ffffff" stroke-opacity=".34" stroke-width="1.1"/>
    <polyline points="${l} ${b} ${vb} ${vl}" fill="none" stroke="#ffffff" stroke-opacity=".20" stroke-width="1"/>
    <polyline points="${b} ${r} ${vr} ${vb}" fill="none" stroke="#ffffff" stroke-opacity=".20" stroke-width="1"/>
    <polyline points="${t} ${r} ${vr}" fill="none" stroke="#ffffff" stroke-opacity=".10" stroke-width="1"/>
    <polyline points="${t} ${l} ${vl}" fill="none" stroke="#ffffff" stroke-opacity=".10" stroke-width="1"/>
    <circle cx="${px(CX + HW)}" cy="${py(TOP)}" r="2.4" fill="${C.accent}"/>
    <circle cx="${px(CX - HW)}" cy="${py(TOP)}" r="2.4" fill="${C.accent}" opacity=".7"/>
    <circle cx="${CX}" cy="${py(TOP + HD)}" r="2.4" fill="${C.accent}" opacity=".7"/>
  </g>`;
  }

  /* Fine dot grid — reads as graph paper, not decoration.
     Expressed as a <pattern> + gradient mask rather than ~4,600 <circle>
     elements: same visual, ~40x smaller file, and the fade stays continuous. */
  const gridDefs = `
  <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1" r="1" fill="#ffffff" opacity=".085"/>
  </pattern>
  <linearGradient id="dotFadeGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="#000" stop-opacity="0"/>
    <stop offset="30%"  stop-color="#fff" stop-opacity="1"/>
    <stop offset="78%"  stop-color="#fff" stop-opacity=".45"/>
    <stop offset="100%" stop-color="#000" stop-opacity="0"/>
  </linearGradient>
  <mask id="dotFade">
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#dotFadeGrad)"/>
  </mask>`;

  const dots = `<rect width="${W}" height="${H}" fill="url(#dots)" mask="url(#dotFade)"/>`;

  /* Two hairline rings — the only continuous motion, kept slow. */
  const ring = (rx, ry, dur, op) => `
    <ellipse cx="${CX}" cy="${TOP}" rx="${rx}" ry="${ry}" fill="none"
             stroke="#ffffff" stroke-opacity="${op}" stroke-width="1" stroke-dasharray="3 10">
      <animateTransform attributeName="transform" type="rotate"
        from="0 ${CX} ${TOP}" to="360 ${CX} ${TOP}" dur="${dur}" repeatCount="indefinite"/>
    </ellipse>`;

  /* A single travelling node on the inner ring. */
  const orbitPath = `M ${CX - 210},${TOP} a 210,58 0 1,0 420,0 a 210,58 0 1,0 -420,0`;

  const body = `
  <rect width="${W}" height="${H}" fill="url(#stage)"/>
  <g>${dots}</g>

  <ellipse cx="${CX}" cy="${TOP + 8}" rx="330" ry="210" fill="url(#halo)" filter="url(#softer)"/>

  ${ring(268, 84, '46s', '.13')}
  ${ring(210, 58, '32s', '.18')}
  <path id="orbit" d="${orbitPath}" fill="none"/>
  <circle r="2.6" fill="${C.accent}" opacity=".9">
    <animateMotion dur="32s" repeatCount="indefinite">
      <mpath xlink:href="#orbit"/>
    </animateMotion>
  </circle>

  <!-- stack receding into depth: far → near -->
  <g transform="translate(104,-52)"><g opacity=".26">${block(0.46, 1, false)}</g></g>
  <g transform="translate(56,-28)"><g opacity=".46">${block(0.7, 1, false)}</g></g>
  <g>
    <animateTransform attributeName="transform" type="translate"
      values="0,0;0,-7;0,0" dur="9s" repeatCount="indefinite"/>
    ${block(1, 1, true)}
  </g>

  <!-- single hairline horizon -->
  <line x1="0" y1="330" x2="${W}" y2="330" stroke="${C.accent}" stroke-opacity=".22" stroke-width="1"/>
  <line x1="${CX - 190}" y1="330" x2="${CX + 190}" y2="330" stroke="${C.accent}" stroke-opacity=".5" stroke-width="1">
    <animate attributeName="opacity" values=".25;.7;.25" dur="7s" repeatCount="indefinite"/>
  </line>`;

  return wrap(W, H, 'Isometric evidence blocks receding into depth', defs(gridDefs), body);
}

/* ================================================================== *
 * 2. PIPELINE — restrained custody flow
 * ================================================================== */
function pipeline() {
  const W = 1200;
  const H = 138;
  const stages = [
    ['Capture', 'file + metadata'],
    ['Register', 'evidence id'],
    ['Analyse', 'sha-256 digest'],
    ['Anchor', 'ipfs + chain'],
    ['Verify', 'certificate'],
    ['Admit', 'trial / archive'],
  ];

  const bw = 172;
  const gap = 28;
  const total = stages.length * bw + (stages.length - 1) * gap;
  const x0 = (W - total) / 2;
  const y = 34;
  const bh = 66;

  let s = '';
  stages.forEach((st, i) => {
    const x = x0 + i * (bw + gap);
    const last = i === stages.length - 1;
    s += `
  <g>
    <rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="10"
          fill="#ffffff" fill-opacity="${last ? '.05' : '.02'}"
          stroke="#ffffff" stroke-opacity=".16" stroke-width="1"/>
    <text x="${x + bw / 2}" y="${y + 27}" font-family="${FONT_UI}" font-size="14.5"
          font-weight="700" fill="${last ? C.accent : C.ink}" text-anchor="middle">${esc(st[0])}</text>
    <text x="${x + bw / 2}" y="${y + 47}" font-family="${FONT_MONO}" font-size="10.5"
          fill="${C.dim}" text-anchor="middle">${esc(st[1])}</text>
    <text x="${x + 14}" y="${y + 17}" font-family="${FONT_MONO}" font-size="9.5"
          fill="${C.dim}" opacity=".8">${String(i + 1).padStart(2, '0')}</text>
  </g>`;
    if (!last) {
      const ax = x + bw;
      s += `
  <line x1="${ax + 5}" y1="${y + bh / 2}" x2="${ax + gap - 11}" y2="${y + bh / 2}"
        stroke="#ffffff" stroke-opacity=".26" stroke-width="1" stroke-dasharray="3 4">
    <animate attributeName="stroke-dashoffset" values="14;0" dur="1.6s" repeatCount="indefinite"/>
  </line>
  <circle r="2.2" fill="${C.accent}">
    <animateMotion dur="2.2s" begin="${i * 0.3}s" repeatCount="indefinite"
      path="M${ax + 4} ${y + bh / 2} L${ax + gap - 9} ${y + bh / 2}"/>
  </circle>`;
    }
  });

  return wrap(
    W,
    H,
    'Evidence custody pipeline',
    defs(),
    `<rect width="${W}" height="${H}" fill="${C.stage}"/>
  <text x="${W / 2}" y="20" font-family="${FONT_MONO}" font-size="10" fill="${C.dim}"
        text-anchor="middle" letter-spacing="4">DIGITAL CHAIN OF CUSTODY</text>
  ${s}`
  );
}

/* ================================================================== *
 * 3. STAT STRIP — four numbers, nothing else
 * ================================================================== */
function statStrip() {
  const W = 1200;
  const H = 108;
  const stats = [
    ['128', 'REST endpoints', C.ink],
    ['8', 'access roles', C.ink],
    ['17', 'automated tests', C.ink],
    ['1', 'anchored digest', C.accent],
  ];
  const cw = 282;
  const gap = 24;
  const x0 = (W - (stats.length * cw + (stats.length - 1) * gap)) / 2;

  const body = stats
    .map((st, i) => {
      const x = x0 + i * (cw + gap);
      return `
  <g>
    <line x1="${x}" y1="30" x2="${x + cw}" y2="30" stroke="#ffffff" stroke-opacity=".14" stroke-width="1"/>
    <text x="${x}" y="70" font-family="${FONT_MONO}" font-size="30" font-weight="700"
          fill="${st[2]}" letter-spacing="-1">${esc(st[0])}</text>
    <text x="${x + 2}" y="90" font-family="${FONT_UI}" font-size="12" fill="${C.muted}"
          letter-spacing="1.4">${esc(st[1].toUpperCase())}</text>
    <circle cx="${x + cw - 4}" cy="34" r="2.5" fill="${st[2]}">
      <animate attributeName="opacity" values=".3;1;.3" dur="${3.4 + i * 0.5}s"
               begin="${i * 0.4}s" repeatCount="indefinite"/>
    </circle>
  </g>`;
    })
    .join('');

  return wrap(
    W,
    H,
    'Project metrics',
    defs(),
    `<rect width="${W}" height="${H}" fill="${C.stage}"/>${body}`
  );
}

/* ------------------------------------------------------------------ *
 * Only the three figures the README actually embeds. A section-divider
 * strip was tried and cut: full-bleed dark bands between light markdown
 * sections read as noise, not rhythm.
 * ------------------------------------------------------------------ */
const targets = [
  ['hero.svg', hero],
  ['badges/pipeline.svg', pipeline],
  ['badges/stat-strip.svg', statStrip],
];

fs.mkdirSync(BADGES, { recursive: true });
for (const [rel, fn] of targets) {
  const out = path.join(ASSETS, rel);
  fs.writeFileSync(out, fn(), 'utf8');
  console.log(`  ✅ assets/${rel}  (${(fs.statSync(out).size / 1024).toFixed(1)} KB)`);
}
console.log(`\n🎨 Generated ${targets.length} minimal README assets.`);
