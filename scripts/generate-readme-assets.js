#!/usr/bin/env node
/**
 * generate-readme-assets.js
 * ---------------------------------------------------------------------------
 * Generates every SVG figure embedded in README.md.
 *
 * DESIGN CONSTRAINT — "colourful but minimal, with depth"
 *   A restrained multi-hue palette on a deep stage. Colour is used for
 *   *meaning* (each pipeline stage owns a hue) rather than decoration, so the
 *   artwork stays calm while still reading as "top class". Depth comes from
 *   real isometric projection — three visible faces per solid, parallel edges,
 *   consistent vanishing — not from drop shadows alone.
 *
 * WHY SVG AND NOT CSS?
 *   GitHub strips <style>, <script> and inline interactivity from Markdown, so
 *   a README cannot host CSS/JS. It CAN render an SVG via <img src="...svg">,
 *   and SMIL animation *inside* that SVG does play. So the motion lives in
 *   self-hosted SVG rather than a third-party image service that can rot.
 *
 * FIGURES ARE THE CONTENT
 *   The README leans on these to carry data that would otherwise be a wall of
 *   prose: the capability matrix, the architecture map, the endpoint breakdown
 *   and the trust chain are all drawn. Every number baked into a figure is
 *   asserted against the source by scripts/verify-readme-facts.js.
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

/* Seeded LCG — stable output across runs. */
let _seed = 0x9e3779b9;
function rnd() {
  _seed = (_seed * 1664525 + 1013904223) >>> 0;
  return _seed / 4294967296;
}
const rF = (a, b) => a + rnd() * (b - a);

/* ------------------------------------------------------------------ *
 * Palette. Deep neutral stage; hues carry meaning.
 *   ok    = verified / working      amber = partial
 *   rose  = absent / blocked        blue  = infrastructure
 *   violet= cryptographic core      mint  = storage
 * Saturation stays moderate so nothing glows or fights the text.
 * ------------------------------------------------------------------ */
const C = {
  stage: '#070910',
  stage2: '#0d1220',
  stage3: '#111827',
  ink: '#f4f6fb',
  muted: '#98a2b8',
  dim: '#5f6b85',
  line: '#ffffff',

  ok: '#34d399',
  amber: '#fbbf24',
  rose: '#fb7185',
  blue: '#60a5fa',
  violet: '#a78bfa',
  mint: '#2dd4bf',
  gold: '#f0a04b',
};

const FONT_UI =
  "'Segoe UI',system-ui,-apple-system,'Helvetica Neue',Arial,sans-serif";
const FONT_MONO =
  "ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace";

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Standard gradient/filter defs. `extra` is appended for figure-specific ids. */
function defs(extra = '') {
  return `
  <linearGradient id="stage" x1="0" y1="0" x2="0.35" y2="1">
    <stop offset="0%"   stop-color="${C.stage}"/>
    <stop offset="55%"  stop-color="${C.stage2}"/>
    <stop offset="100%" stop-color="${C.stage}"/>
  </linearGradient>
  <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%"   stop-color="#ffffff" stop-opacity=".14"/>
    <stop offset="45%"  stop-color="#ffffff" stop-opacity=".03"/>
    <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="vignette" cx="50%" cy="42%" r="72%">
    <stop offset="0%"   stop-color="#ffffff" stop-opacity=".055"/>
    <stop offset="60%"  stop-color="#ffffff" stop-opacity=".012"/>
    <stop offset="100%" stop-color="#000000" stop-opacity=".38"/>
  </radialGradient>
  <filter id="soft" x="-70%" y="-70%" width="240%" height="240%">
    <feGaussianBlur stdDeviation="14"/>
  </filter>
  <filter id="glow" x="-90%" y="-90%" width="280%" height="280%">
    <feGaussianBlur stdDeviation="5" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  ${extra}`;
}

/** Standard <svg> shell. Always sets explicit width/height so GitHub reserves
 *  the right space and the page does not reflow as images decode. */
const wrap = (w, h, label, d, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}">
<title>${esc(label)}</title>
<defs>${d}
</defs>
${body}
</svg>
`;

/** Dot-grid expressed as a pattern + gradient mask, so a 1200px-wide field
 *  costs one <rect> instead of thousands of <circle>s. */
function dotField(w, h, id, step = 28, op = 0.075) {
  return {
    defs: `
  <pattern id="${id}" width="${step}" height="${step}" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1" r="1" fill="#ffffff" opacity="${op}"/>
  </pattern>
  <linearGradient id="${id}fade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="#000" stop-opacity="0"/>
    <stop offset="26%"  stop-color="#fff" stop-opacity="1"/>
    <stop offset="74%"  stop-color="#fff" stop-opacity=".5"/>
    <stop offset="100%" stop-color="#000" stop-opacity="0"/>
  </linearGradient>
  <mask id="${id}mask">
    <rect x="0" y="0" width="${w}" height="${h}" fill="url(#${id}fade)"/>
  </mask>`,
    body: `<rect width="${w}" height="${h}" fill="url(#${id})" mask="url(#${id}mask)"/>`,
  };
}

/* ================================================================== *
 * Isometric primitives — one projection used by every 3D figure so the
 * whole set reads as one system.
 *   Iso uses a 2:1 face ratio, which is the classic pixel-art isometric
 *   convention and keeps the maths exact at these sizes.
 * ================================================================== */
const ISO_X = 0.866; // cos(30deg)
const ISO_Y = 0.5; // sin(30deg)

/**
 * Draw an isometric cuboid.
 * @param {number} cx  centre x on the baseline
 * @param {number} cy  centre y of the TOP face
 * @param {number} w   full width  (along the x axis)
 * @param {number} d   full depth  (along the y axis)
 * @param {number} h   full height (vertical)
 * @param {object} o   { top, left, right, stroke, sw, opacity, rx }
 */
function isoBox(cx, cy, w, d, h, o = {}) {
  const hw = w / 2;
  const hd = d / 2;
  const dx = hw * ISO_X;
  const dy = hd * ISO_Y;
  const vx = hw * ISO_X * 0.0; // vertical edge has no x offset in true iso

  const top = `${cx},${cy} ${cx + dx},${cy + dy} ${cx},${cy + dy * 2} ${cx - dx},${cy + dy}`;
  const left = `${cx - dx},${cy + dy} ${cx},${cy + dy * 2} ${cx},${cy + dy * 2 + h} ${cx - dx},${cy + dy + h}`;
  const right = `${cx},${cy + dy * 2} ${cx + dx},${cy + dy} ${cx + dx},${cy + dy + h} ${cx},${cy + dy * 2 + h}`;

  const st = o.stroke === null ? 'none' : o.stroke || C.line;
  const sw = o.sw == null ? 1 : o.sw;
  const op = o.opacity == null ? 1 : o.opacity;

  return `<g opacity="${op}">
    <polygon points="${left}"  fill="${o.left}"  stroke="${st}" stroke-opacity="${o.so == null ? '.22' : o.so}" stroke-width="${sw}" stroke-linejoin="round"/>
    <polygon points="${right}" fill="${o.right}" stroke="${st}" stroke-opacity="${o.so == null ? '.22' : o.so}" stroke-width="${sw}" stroke-linejoin="round"/>
    <polygon points="${top}"    fill="${o.top}"    stroke="${st}" stroke-opacity="${o.so == null ? '.34' : o.so}" stroke-width="${sw}" stroke-linejoin="round"/>
  </g>`;
}

/** Hex -> rgba() string, for building face tints from one base hue. */
function tint(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** An isometric cuboid whose three faces are shaded from one hue, so a solid
 *  reads as lit from the upper left. */
function solidBox(cx, cy, w, d, h, hue, o = {}) {
  return isoBox(cx, cy, w, d, h, {
    top: tint(hue, o.topA == null ? 0.3 : o.topA),
    left: tint(hue, o.leftA == null ? 0.14 : o.leftA),
    right: tint(hue, o.rightA == null ? 0.07 : o.rightA),
    stroke: hue,
    so: o.so == null ? 0.5 : o.so,
    sw: o.sw == null ? 1.1 : o.sw,
    opacity: o.opacity,
  });
}

/* ================================================================== *
 * 1. HERO — isometric evidence stack, one hue per integrity layer
 *    Colour now carries meaning: green = verified, blue = stored, violet =
 *    cryptographically bound.
 * ================================================================== */
function hero() {
  const W = 1200;
  const H = 460;
  const CX = 600;
  const BASE = 250;

  const grid = dotField(W, H, 'hd', 30, 0.07);

  // Four slabs stacked with air between them; lower = more foundational.
  const layers = [
    { w: 300, d: 150, h: 34, hue: C.violet, dy: -8 },
    { w: 268, d: 134, h: 30, hue: C.blue, dy: -96 },
    { w: 236, d: 118, h: 28, hue: C.mint, dy: -178 },
    { w: 150, d: 76, h: 34, hue: C.ok, dy: -262 },
  ];

  // Draw far-to-near so nearer solids overlap correctly. Bottom slab first.
  let solids = '';
  layers.forEach((L, i) => {
    const cy = BASE + L.dy;
    const dur = 7 + i * 1.4;
    solids += `<g>
      <animateTransform attributeName="transform" type="translate"
        values="0,0;0,-8;0,0" dur="${dur}s" repeatCount="indefinite"/>
      ${solidBox(CX, cy, L.w, L.d, L.h, L.hue, { topA: 0.26, leftA: 0.12, rightA: 0.06 })}
    </g>`;
  });

  // Wireframe echo behind the stack, for depth.
  const echo = isoBox(CX + 176, BASE - 40, 210, 105, 210, {
    top: 'none', left: 'none', right: 'none', stroke: C.blue, so: 0.16, sw: 1, opacity: 0.75,
  });

  // Data motes drifting upward through the stack: hash -> pin -> anchor.
  let motes = '';
  for (let i = 0; i < 22; i++) {
    const x = CX + rF(-215, 215);
    const y = BASE + 70 + rF(-40, 40);
    const dur = rF(9, 17);
    const hue = [C.ok, C.mint, C.blue, C.violet][i % 4];
    motes += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rF(1.1, 2.4).toFixed(2)}" fill="${hue}" opacity="0">
      <animate attributeName="opacity" values="0;.75;0" dur="${dur.toFixed(1)}s" begin="${rF(0, 6).toFixed(1)}s" repeatCount="indefinite"/>
      <animateTransform attributeName="transform" type="translate" values="0,0;0,-190" dur="${dur.toFixed(1)}s" begin="${rF(0, 6).toFixed(1)}s" repeatCount="indefinite"/>
    </circle>`;
  }

  // Slow orbit rings around the stack.
  const ring = (rx, ry, dur, op, hue) => `
    <ellipse cx="${CX}" cy="${BASE - 130}" rx="${rx}" ry="${ry}" fill="none"
             stroke="${hue}" stroke-opacity="${op}" stroke-width="1" stroke-dasharray="2 12">
      <animateTransform attributeName="transform" type="rotate"
        from="0 ${CX} ${BASE - 130}" to="360 ${CX} ${BASE - 130}" dur="${dur}" repeatCount="indefinite"/>
    </ellipse>`;

  const body = `
  <rect width="${W}" height="${H}" fill="url(#stage)"/>
  ${grid.body}
  <ellipse cx="${CX}" cy="${BASE + 40}" rx="330" ry="70" fill="${tint(C.violet, 0.16)}" filter="url(#soft)"/>
  ${echo}
  ${ring(320, 96, '54s', '.16', C.violet)}
  ${ring(255, 74, '38s', '.2', C.blue)}
  ${solids}
  ${motes}
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>

  <!-- baseline: a lit edge that grounds the stack -->
  <line x1="${CX - 250}" y1="${BASE + 106}" x2="${CX + 250}" y2="${BASE + 106}"
        stroke="${C.ok}" stroke-opacity=".34" stroke-width="1">
    <animate attributeName="opacity" values=".18;.5;.18" dur="8s" repeatCount="indefinite"/>
  </line>

  <!-- corner ticks: precision framing, kept faint -->
  <g stroke="${C.line}" stroke-opacity=".13" stroke-width="1">
    <path d="M40 ${H - 40} L40 ${H - 62} L62 ${H - 62}" fill="none"/>
    <path d="M${W - 40} ${H - 40} L${W - 40} ${H - 62} L${W - 62} ${H - 62}" fill="none"/>
  </g>

  <text x="${CX}" y="${H - 22}" font-family="${FONT_MONO}" font-size="10.5"
        fill="${C.dim}" text-anchor="middle" letter-spacing="5.5">HASH · PIN · ANCHOR · PROVE</text>`;

  return wrap(W, H, 'Isometric stack of the four evidence integrity layers', defs(grid.defs), body);
}

/* ================================================================== *
 * 2. PIPELINE — 3D stages on an isometric rail
 *    Replaces a numbered list; each stage is a solid with its own hue.
 * ================================================================== */
function pipeline() {
  const W = 1200;
  const H = 210;
  const stages = [
    ['Capture', 'bytes in', C.blue],
    ['Hash', 'sha-256', C.violet],
    ['Pin', 'ipfs cid', C.mint],
    ['Anchor', 'amoy', C.gold],
    ['Verify', 're-hash', C.ok],
  ];

  const bw = 176;
  const gap = 40;
  const total = stages.length * bw + (stages.length - 1) * gap;
  const x0 = (W - total) / 2;
  const railY = 118;

  let s = '';
  stages.forEach((st, i) => {
    const x = x0 + i * (bw + gap);
    const cx = x + bw / 2;
    const last = i === stages.length - 1;

    s += `<g>
      ${solidBox(cx, railY - 30, bw - 16, 62, 40, st[2], { topA: 0.22, leftA: 0.1, rightA: 0.05 })}
      <text x="${cx}" y="${railY + 2}" font-family="${FONT_UI}" font-size="15" font-weight="700"
            fill="${C.ink}" text-anchor="middle">${esc(st[0])}</text>
      <text x="${cx}" y="${railY + 26}" font-family="${FONT_MONO}" font-size="10.5"
            fill="${tint(st[2], 0.95)}" text-anchor="middle" letter-spacing="1.2">${esc(st[1])}</text>
      <text x="${x + 4}" y="${railY - 44}" font-family="${FONT_MONO}" font-size="9.5"
            fill="${C.dim}" opacity=".85">${String(i + 1).padStart(2, '0')}</text>
    </g>`;

    if (!last) {
      const ax = x + bw - 8;
      s += `<line x1="${ax + 4}" y1="${railY - 8}" x2="${ax + gap - 12}" y2="${railY - 8}"
              stroke="${C.line}" stroke-opacity=".3" stroke-width="1.2" stroke-dasharray="3 5"/>
      <circle r="2.6" fill="${stages[i + 1][2]}" filter="url(#glow)">
        <animateMotion dur="1.9s" begin="${(i * 0.25).toFixed(2)}s" repeatCount="indefinite"
          path="M${ax + 3} ${railY - 8} L${ax + gap - 10} ${railY - 8}"/>
      </circle>`;
    }
  });

  // Isometric rail the stages sit on.
  const rail = isoBox(W / 2, railY + 54, total + 90, 40, 12, {
    top: '#ffffff', left: 'none', right: 'none', so: 0.1, sw: 1, topA: 0.028,
  });

  return wrap(W, H, 'Evidence custody pipeline', defs(), `
  <rect width="${W}" height="${H}" fill="${C.stage}"/>
  <text x="${W / 2}" y="34" font-family="${FONT_MONO}" font-size="10.5" fill="${C.dim}"
        text-anchor="middle" letter-spacing="5">DIGITAL CHAIN OF CUSTODY</text>
  ${rail}
  ${s}
  <text x="${W / 2}" y="${H - 14}" font-family="${FONT_UI}" font-size="11.5" fill="${C.muted}"
        text-anchor="middle">An IPFS or chain failure is recorded as a warning — the record still saves.</text>`);
}

/* ================================================================== *
 * 3. CAPABILITY MATRIX — the honest status table, as a 3D bar chart
 *    This is the figure that replaces the longest table in the README.
 * ================================================================== */
function capability() {
  const W = 1200;
  const H = 330;

  // Counts must match the "What actually works" claims.
  const groups = [
    { label: 'Shipped', n: 8, hue: C.ok, note: 'working as described' },
    { label: 'Partial', n: 3, hue: C.amber, note: 'real path, incomplete' },
    { label: 'Absent', n: 2, hue: C.rose, note: 'never implemented' },
    { label: 'Planned', n: 1, hue: C.blue, note: 'testnet only' },
  ];

  const x0 = 96;
  const baseY = 236;
  const maxH = 132;
  const maxN = 9;
  const bw = 128;
  const gap = 74;

  let bars = '';
  groups.forEach((g, i) => {
    const x = x0 + i * (bw + gap);
    const h = (g.n / maxN) * maxH;
    const cx = x + bw / 2;

    bars += `<g>
      ${solidBox(cx, baseY - h - 8, bw, 56, h, g.hue, { topA: 0.3, leftA: 0.15, rightA: 0.08 })}
      <text x="${cx}" y="${baseY - h - 22}" font-family="${FONT_MONO}" font-size="27" font-weight="700"
            fill="${g.hue}" text-anchor="middle" letter-spacing="-1">${g.n}</text>
      <text x="${cx}" y="${baseY + 26}" font-family="${FONT_UI}" font-size="13.5" font-weight="700"
            fill="${C.ink}" text-anchor="middle">${esc(g.label)}</text>
      <text x="${cx}" y="${baseY + 44}" font-family="${FONT_UI}" font-size="10.5"
            fill="${C.dim}" text-anchor="middle">${esc(g.note)}</text>
    </g>`;
  });

  // Baseline slab.
  const base = isoBox(W / 2, baseY + 8, 760, 34, 10, {
    top: '#ffffff', left: 'none', right: 'none', so: 0.12, sw: 1, topA: 0.035,
  });

  return wrap(W, H, 'Capability status: 8 shipped, 3 partial, 2 absent, 1 planned', defs(), `
  <rect width="${W}" height="${H}" fill="${C.stage}"/>
  <text x="${W / 2}" y="34" font-family="${FONT_MONO}" font-size="10.5" fill="${C.dim}"
        text-anchor="middle" letter-spacing="5">14 CAPABILITIES, GRADED AGAINST THE SOURCE</text>
  ${base}
  ${bars}
  <text x="${W - 40}" y="34" font-family="${FONT_UI}" font-size="11" fill="${C.muted}"
        text-anchor="end">A forensic tool that overstates itself is worse than none.</text>`);
}

/* ================================================================== *
 * 4. ARCHITECTURE MAP — layered isometric slabs
 *    Replaces the indented code tree: each tier is a slab, the slabs are
 *    stacked with visible offset so the layering reads spatially.
 * ================================================================== */
function architecture() {
  const W = 1200;
  const H = 420;

  const tiers = [
    { name: 'Client', hue: C.blue, items: ['45 static pages', '8 role dashboards'] },
    { name: 'Express 5', hue: C.violet, items: ['19 routers', 'helmet · cors', 'page guards'] },
    { name: 'Services', hue: C.mint, items: ['integrated evidence', 'blockchain · ipfs', 'watermark · notify'] },
    { name: 'Contracts & store', hue: C.gold, items: ['EvidenceStorage.sol', 'IPFS via Pinata', 'Supabase · 16 tables'] },
  ];

  const cx = W / 2;
  const topY = 92;
  const tierH = 62;
  const gapY = 30;

  let rows = '';
  tiers.forEach((t, i) => {
    const y = topY + i * (tierH + gapY);
    const w = 720 - i * 34;
    const left = cx - w / 2;

    // Tier name occupies a fixed-width gutter; items are laid out to its right
    // with even spacing, so nothing can drift back over the label.
    const GUTTER = 168;
    const itemX0 = left + GUTTER;
    const itemSpan = w - GUTTER - 26;
    const step = itemSpan / t.items.length;
    const items = t.items
      .map(
        (it, j) =>
          `<text x="${(itemX0 + step * (j + 0.5)).toFixed(1)}" y="${y + 45}"
             font-family="${FONT_UI}" font-size="11.5" fill="${C.muted}" text-anchor="middle">${esc(it)}</text>`
      )
      .join('');

    rows += `<g>
      ${solidBox(cx, y, w, 74, tierH, t.hue, { topA: 0.2, leftA: 0.09, rightA: 0.045 })}
      <text x="${left + 28}" y="${y + 45}" font-family="${FONT_UI}" font-size="14.5"
            font-weight="700" fill="${C.ink}">${esc(t.name)}</text>
      <line x1="${left + 24}" y1="${y + 53}" x2="${left + GUTTER - 34}" y2="${y + 53}"
            stroke="${t.hue}" stroke-opacity=".65" stroke-width="1.4"/>
      <line x1="${itemX0 - 18}" y1="${y + 26}" x2="${itemX0 - 18}" y2="${y + 56}"
            stroke="${C.line}" stroke-opacity=".1" stroke-width="1"/>
      ${items}
    </g>`;

    // Connector to the tier below.
    if (i < tiers.length - 1) {
      const y1 = y + tierH + 6;
      const y2 = y + tierH + gapY - 12;
      rows += `<line x1="${cx}" y1="${y1}" x2="${cx}" y2="${y2}"
        stroke="${t.hue}" stroke-opacity=".4" stroke-width="1.2" stroke-dasharray="3 4">
        <animate attributeName="stroke-dashoffset" values="14;0" dur="1.5s" repeatCount="indefinite"/>
      </line>
      <circle cx="${cx}" r="2.4" fill="${t.hue}" filter="url(#glow)">
        <animateMotion dur="1.5s" repeatCount="indefinite" path="M${cx} ${y1} L${cx} ${y2}"/>
      </circle>`;
    }
  });

  return wrap(W, H, 'Four-tier architecture: client, Express, services, contracts and storage', defs(), `
  <rect width="${W}" height="${H}" fill="url(#stage)"/>
  <text x="${W / 2}" y="34" font-family="${FONT_MONO}" font-size="10.5" fill="${C.dim}"
        text-anchor="middle" letter-spacing="5">REQUEST PATH, TOP TO BOTTOM</text>
  ${rows}`);
}

/* ================================================================== *
 * 5. ENDPOINT MAP — where the 128 routes actually live
 *    A labelled treemap-ish column set. Bars are proportional to the real
 *    counts taken from the Express router stack.
 * ================================================================== */
function endpoints() {
  const W = 1200;
  const H = 300;

  // Verified against the live router stack: 128 total.
  const groups = [
    ['evidence', 27, C.ok],
    ['admin', 20, C.violet],
    ['auth', 13, C.blue],
    ['analyst', 13, C.mint],
    ['cases', 9, C.gold],
    ['public', 6, C.ok],
    ['notifications', 5, C.blue],
    ['legal-holds', 5, C.violet],
    ['retention', 4, C.mint],
    ['tags', 3, C.blue],
    ['other 21', 23, C.dim],
  ];

  const x0 = 70;
  const baseY = 208;
  const maxH = 118;
  const maxN = 27;
  const bw = 74;
  const gap = 30;

  let bars = '';
  groups.forEach((g, i) => {
    const [name, n, hue] = g;
    const x = x0 + i * (bw + gap);
    const h = (n / maxN) * maxH;
    const cx = x + bw / 2;
    const shown = name.length > 9 ? name.slice(0, 8) + '…' : name;

    bars += `<g>
      ${solidBox(cx, baseY - h - 6, bw, 40, h, hue, { topA: 0.26, leftA: 0.12, rightA: 0.06 })}
      <text x="${cx}" y="${baseY - h - 18}" font-family="${FONT_MONO}" font-size="15" font-weight="700"
            fill="${C.ink}" text-anchor="middle">${n}</text>
      <text x="${cx}" y="${baseY + 24}" font-family="${FONT_MONO}" font-size="9.5"
            fill="${C.muted}" text-anchor="middle">${esc(shown)}</text>
    </g>`;
  });

  const base = isoBox(W / 2, baseY + 6, 1080, 26, 8, {
    top: '#ffffff', left: 'none', right: 'none', so: 0.1, sw: 1, topA: 0.03,
  });

  return wrap(W, H, 'Endpoint distribution across the API surface: 128 routes', defs(), `
  <rect width="${W}" height="${H}" fill="${C.stage}"/>
  <text x="${W / 2}" y="32" font-family="${FONT_MONO}" font-size="10.5" fill="${C.dim}"
        text-anchor="middle" letter-spacing="5">128 ROUTES · 65 GET · 51 POST · 10 PUT · 2 DELETE</text>
  ${base}
  ${bars}
  <text x="${W / 2}" y="${H - 14}" font-family="${FONT_UI}" font-size="11.5" fill="${C.muted}"
        text-anchor="middle">Counted from the mounted Express router stack, not from the source by hand.</text>`);
}

/* ================================================================== *
 * 6. TRUST CHAIN — what is actually enforced, in layers
 *    A concentric "onion": each ring is a control. Outer rings are perimeter,
 *    inner rings are the guarantee.
 * ================================================================== */
function trust() {
  const W = 1200;
  const H = 396;
  const CX = 236;
  const CY = 208;

  const rings = [
    { r: 150, hue: C.blue, label: 'Transport', items: 'helmet · cors allowlist' },
    { r: 116, hue: C.violet, label: 'Identity', items: 'eip-191 · nonce · ±5min' },
    { r: 82, hue: C.mint, label: 'Authorisation', items: '8 roles · re-read per request' },
    { r: 48, hue: C.ok, label: 'Integrity', items: 'sha-256 · ipfs · chain' },
  ];

  let s = '';
  // The rings are concentric, so labels anchored to each radius would land on
  // top of one another. Instead each label is parked in its own evenly spaced
  // band and tied back to its ring with a leader line.
  const LABEL_X = 452;
  const bandH = 64;
  const bandTop = 96;

  rings.forEach((ring, i) => {
    const isLast = i === rings.length - 1;
    const ly = bandTop + i * bandH + 18;

    s += `<g opacity="${isLast ? 1 : 0.94}">
      <circle cx="${CX}" cy="${CY}" r="${ring.r}" fill="${tint(ring.hue, isLast ? 0.16 : 0.05)}"
              stroke="${ring.hue}" stroke-opacity="${isLast ? 0.85 : 0.42}" stroke-width="${isLast ? 1.6 : 1.1}"
              stroke-dasharray="${isLast ? 'none' : '5 7'}">
        ${isLast ? `<animate attributeName="stroke-opacity" values=".6;1;.6" dur="4s" repeatCount="indefinite"/>` : ''}
      </circle>
      <circle cx="${CX + ring.r}" cy="${CY}" r="2.6" fill="${ring.hue}"/>
      <polyline points="${CX + ring.r},${CY} ${LABEL_X - 16},${ly - 5} ${LABEL_X - 6},${ly - 5}"
                fill="none" stroke="${ring.hue}" stroke-opacity=".3" stroke-width="1"/>
      <rect x="${LABEL_X - 6}" y="${ly - 16}" width="4" height="32" rx="2" fill="${ring.hue}"/>
      <text x="${LABEL_X + 12}" y="${ly - 1}" font-family="${FONT_UI}" font-size="13"
            font-weight="700" fill="${ring.hue}">${esc(ring.label)}</text>
      <text x="${LABEL_X + 12}" y="${ly + 14}" font-family="${FONT_MONO}" font-size="10"
            fill="${C.muted}">${esc(ring.items)}</text>
    </g>`;
  });

  s += `<circle cx="${CX}" cy="${CY}" r="15" fill="${C.ok}" opacity=".9" filter="url(#glow)">
    <animate attributeName="r" values="14;17;14" dur="3.4s" repeatCount="indefinite"/>
  </circle>
  <text x="${CX}" y="${CY - 168}" font-family="${FONT_MONO}" font-size="9.5" fill="${C.dim}"
        text-anchor="middle" letter-spacing="2">PROOF AT THE CORE</text>`;

  // Right column: the limits, stated as plainly as the controls.
  const limits = [
    ['Base RLS is permissive', 'run security-hardening.sql', C.rose],
    ['CSP allows unsafe-inline', 'scripts and attributes', C.amber],
    ['Failed logins skip the quota', 'skipFailedRequests: true', C.amber],
    ['Private key in-process', 'no KMS, no rotation', C.rose],
    ['Replay cache is in memory', 'lost on restart', C.amber],
  ];

  let lim = `<text x="796" y="60" font-family="${FONT_MONO}" font-size="10" fill="${C.dim}"
        letter-spacing="3.5">AND WHAT IS NOT ENFORCED</text>`;
  limits.forEach((l, i) => {
    const y = 80 + i * 52;
    lim += `<g>
      <rect x="796" y="${y}" width="368" height="42" rx="8" fill="${tint(l[2], 0.07)}"
            stroke="${l[2]}" stroke-opacity=".26" stroke-width="1"/>
      <rect x="796" y="${y}" width="3.5" height="42" rx="1.75" fill="${l[2]}"/>
      <text x="812" y="${y + 18}" font-family="${FONT_UI}" font-size="11.5" fill="${C.ink}">${esc(l[0])}</text>
      <text x="812" y="${y + 32}" font-family="${FONT_MONO}" font-size="9.5" fill="${C.dim}">${esc(l[1])}</text>
    </g>`;
  });

  const rule = `<line x1="768" y1="54" x2="768" y2="${H - 36}"
    stroke="${C.line}" stroke-opacity=".08" stroke-width="1"/>`;

  return wrap(W, H, 'Trust layers from transport to integrity, alongside known security limits', defs(), `
  <rect width="${W}" height="${H}" fill="url(#stage)"/>
  <text x="${CX}" y="44" font-family="${FONT_MONO}" font-size="10" fill="${C.dim}"
        text-anchor="middle" letter-spacing="3.5">DEFENCE IN DEPTH</text>
  ${rule}
  ${s}
  ${lim}`);
}

/* ------------------------------------------------------------------ *
 * Targets. Only figures the README actually embeds.
 * ------------------------------------------------------------------ */
const targets = [
  ['hero.svg', hero],
  ['badges/pipeline.svg', pipeline],
  ['badges/capability.svg', capability],
  ['badges/architecture.svg', architecture],
  ['badges/endpoints.svg', endpoints],
  ['badges/trust.svg', trust],
];

fs.mkdirSync(ASSETS, { recursive: true });
let total = 0;
for (const [rel, fn] of targets) {
  const out = path.join(ASSETS, rel);
  const svg = fn();
  fs.writeFileSync(out, svg, 'utf8');
  const kb = fs.statSync(out).size / 1024;
  total += kb;
  console.log(`  ✅ assets/${rel}  (${kb.toFixed(1)} KB)`);
}
console.log(`\n🎨 Generated ${targets.length} README figures, ${total.toFixed(1)} KB total.`);