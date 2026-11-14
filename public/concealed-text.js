/* Measured concealed-text candidates. No intent or authenticity verdict. */
(function (root) {
  'use strict';
  function color(value, gray = false) {
    const a = Array.from(value || []);
    return gray ? [a[0] * 255, a[0] * 255, a[0] * 255] : a.slice(0, 3);
  }
  function multiply(m1, m2) {
    return [
      m1[0] * m2[0] + m1[2] * m2[1],
      m1[1] * m2[0] + m1[3] * m2[1],
      m1[0] * m2[2] + m1[2] * m2[3],
      m1[1] * m2[2] + m1[3] * m2[3],
      m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
      m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
    ];
  }
  function deviceRect(x, y, w, h, ctm, m) {
    const pts = [
      [x, y],
      [x + w, y],
      [x, y + h],
      [x + w, y + h],
    ].map(([px, py]) => {
      const qx = ctm[0] * px + ctm[2] * py + ctm[4],
        qy = ctm[1] * px + ctm[3] * py + ctm[5];
      return [m[0] * qx + m[2] * qy + m[4], m[1] * qx + m[3] * qy + m[5]];
    });
    return {
      left: Math.min(...pts.map((p) => p[0])),
      right: Math.max(...pts.map((p) => p[0])),
      top: Math.min(...pts.map((p) => p[1])),
      bottom: Math.max(...pts.map((p) => p[1])),
    };
  }
  /* Walk a constructPath payload ([opcodes, flat data]) and return device
     rectangles: one per PDF 're', plus one bounding box per non-rect path
     segment sequence (approximation, documented in the limit text). */
  function pathRects(arg, ctm, m, PATH) {
    const codes = arg?.[0] || [],
      data = arg?.[1] || [];
    const rects = [];
    let p = 0,
      loose = null;
    const extend = (x, y) => {
      const r = deviceRect(x, y, 0, 0, ctm, m);
      loose = loose
        ? {
            left: Math.min(loose.left, r.left),
            right: Math.max(loose.right, r.right),
            top: Math.min(loose.top, r.top),
            bottom: Math.max(loose.bottom, r.bottom),
          }
        : r;
    };
    for (const code of codes) {
      if (code === PATH.rectangle) {
        rects.push(deviceRect(data[p], data[p + 1], data[p + 2], data[p + 3], ctm, m));
        p += 4;
      } else if (code === PATH.moveTo || code === PATH.lineTo) {
        extend(data[p], data[p + 1]);
        p += 2;
      } else if (code === PATH.curveTo) {
        extend(data[p], data[p + 1]);
        extend(data[p + 2], data[p + 3]);
        extend(data[p + 4], data[p + 5]);
        p += 6;
      } else if (code === PATH.curveTo2 || code === PATH.curveTo3) {
        extend(data[p], data[p + 1]);
        extend(data[p + 2], data[p + 3]);
        p += 4;
      }
    }
    if (loose) rects.push(loose);
    return rects;
  }
  function operators(ops, O, viewport) {
    const PATH = {
      moveTo: O.moveTo ?? 13,
      lineTo: O.lineTo ?? 14,
      curveTo: O.curveTo ?? 15,
      curveTo2: O.curveTo2 ?? 16,
      curveTo3: O.curveTo3 ?? 17,
      closePath: O.closePath ?? 18,
      rectangle: O.rectangle ?? 19,
    };
    const vm = viewport?.transform;
    let state = { mode: 0, fill: [0, 0, 0], alpha: 1, ctm: [1, 0, 0, 1, 0, 0], clips: [] },
      stack = [],
      out = [],
      path = [],
      paintEvents = [];
    if (ops.fnArray.length > 200000) throw Error('PDF page operator limit200000.');
    for (let i = 0; i < ops.fnArray.length; i++) {
      const op = ops.fnArray[i],
        arg = ops.argsArray[i];
      if (op === O.save)
        stack.push({
          ...state,
          fill: [...state.fill],
          ctm: [...state.ctm],
          clips: state.clips.map((c) => c.map((r) => ({ ...r }))),
        });
      else if (op === O.restore)
        state = stack.pop() || {
          mode: 0,
          fill: [0, 0, 0],
          alpha: 1,
          ctm: [1, 0, 0, 1, 0, 0],
          clips: [],
        };
      else if (op === O.transform && arg?.length >= 6) state.ctm = multiply(arg, state.ctm);
      else if (op === O.setTextRenderingMode) state.mode = arg[0];
      else if (op === O.setFillRGBColor) state.fill = color(arg);
      else if (op === O.setFillGray) state.fill = color(arg, true);
      else if (op === O.setGState) {
        for (const [key, value] of arg[0] || []) if (key === 'ca') state.alpha = value;
      } else if (op === O.constructPath && vm) path = pathRects(arg, state.ctm, vm, PATH);
      else if ((op === O.clip || op === O.eoClip) && vm) {
        if (path.length) state.clips = [...state.clips, path.map((r) => ({ ...r }))];
        path = [];
      } else if (op === O.endPath && vm) path = [];
      else if (
        [O.fill, O.eoFill, O.fillStroke, O.eoFillStroke].includes(op) &&
        vm &&
        path.length
      ) {
        paintEvents.push({
          operatorIndex: i,
          rects: path.map((r) => ({ ...r })),
          fill: [...state.fill],
          alpha: state.alpha,
        });
        path = [];
      } else if ([O.showText, O.showSpacedText].includes(op)) {
        const glyphs = arg[0] || [];
        const text = glyphs.map((g) => g?.unicode || '').join('');
        /* A run with no printable mapping - empty, control-only,
           private-use-only or replacement-only - cannot be evaluated as
           text (e.g. Type3 without ToUnicode): disclose, never claim. */
        const meaningful = /[^\u0000-\u001f\u007f-\u009f\ue000-\uf8ff\ufffd]/.test(text);
        if (meaningful)
          out.push({
            operatorIndex: i,
            text,
            mode: state.mode,
            alpha: state.alpha,
            fill: [...state.fill],
            clips: state.clips.map((c) => c.map((r) => ({ ...r }))),
          });
        else if (glyphs.length)
          out.push({
            operatorIndex: i,
            text: '',
            unmappedGlyphs: glyphs.length,
            mode: state.mode,
            alpha: state.alpha,
            fill: [...state.fill],
            clips: [],
          });
      }
    }
    out.paintEvents = paintEvents;
    return out;
  }
  function rectangle(item, viewport) {
    const t = item.transform,
      m = viewport.transform;
    // Four corners of extracted-text baseline/height, including rotation/skew.
    const length = Math.hypot(t[0], t[1]),
      height = Math.hypot(t[2], t[3]);
    if (!length || !height) return null;
    const ux = t[0] / length,
      uy = t[1] / length,
      vx = t[2] / height,
      vy = t[3] / height,
      w = item.width,
      h = item.height;
    const points = [
      [0, -0.25],
      [w, -0.25],
      [0, 0.9],
      [w, 0.9],
    ].map(([x, y]) => {
      const px = t[4] + ux * x + vx * h * y,
        py = t[5] + uy * x + vy * h * y;
      return [m[0] * px + m[2] * py + m[4], m[1] * px + m[3] * py + m[5]];
    });
    return {
      left: Math.min(...points.map((p) => p[0])),
      right: Math.max(...points.map((p) => p[0])),
      top: Math.min(...points.map((p) => p[1])),
      bottom: Math.max(...points.map((p) => p[1])),
    };
  }
  function region(image, box) {
    const left = Math.max(0, Math.floor(box.left)),
      top = Math.max(0, Math.floor(box.top)),
      right = Math.min(image.width, Math.ceil(box.right)),
      bottom = Math.min(image.height, Math.ceil(box.bottom));
    if (right <= left || bottom <= top) return null;
    let white = 0,
      min = 255,
      max = 0,
      n = 0;
    for (let y = top; y < bottom; y++)
      for (let x = left; x < right; x++) {
        const p = (y * image.width + x) * 4,
          r = image.data[p],
          g = image.data[p + 1],
          b = image.data[p + 2],
          l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        min = Math.min(min, l);
        max = Math.max(max, l);
        if (r >= 248 && g >= 248 && b >= 248) white++;
        n++;
      }
    return { whitePixelFraction: white / n, luminanceRange: max - min, sampledPixels: n };
  }
  function overlap(a, b) {
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left),
      h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return w > 0 && h > 0 ? w * h : 0;
  }
  function boxArea(b) {
    return Math.max(0, b.right - b.left) * Math.max(0, b.bottom - b.top);
  }
  function insideClip(box, applications) {
    const cx = (box.left + box.right) / 2,
      cy = (box.top + box.bottom) / 2;
    return applications.every((rects) =>
      rects.some((r) => cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom),
    );
  }
  function classify(ops, content, image, viewport) {
    const rows = [],
      unmatched = [],
      unmapped = [];
    const paintEvents = ops.paintEvents || [];
    let cursor = 0;
    for (const op of ops) {
      if (op.unmappedGlyphs) {
        unmapped.push({
          operatorIndex: op.operatorIndex,
          glyphCount: op.unmappedGlyphs,
          reason:
            'Glyphs carry no printable Unicode mapping (for example a Type3 font without ToUnicode, or control/private-use codepoints); contents and visibility not evaluated.',
        });
        continue;
      }
      let index = -1;
      for (let i = cursor; i < Math.min(content.items.length, cursor + 15); i++)
        if (content.items[i].str === op.text) {
          index = i;
          break;
        }
      const item = index >= 0 ? content.items[index] : null;
      if (index >= 0) cursor = index + 1;
      const box = item ? rectangle(item, viewport) : null,
        measurement = box ? region(image, box) : null,
        signals = [];
      if (op.mode === 3 || op.mode === 7) signals.push('INVISIBLE_TEXT_RENDERING_MODE');
      if (box && op.clips?.length && !insideClip(box, op.clips))
        signals.push('CLIPPED_OUTSIDE_CLIP_REGION');
      if (box) {
        const area = boxArea(box);
        let covered = 0;
        for (const ev of paintEvents)
          if (ev.operatorIndex > op.operatorIndex && ev.alpha >= 0.99)
            for (const r of ev.rects) covered += overlap(box, r);
        if (area > 0 && covered / area >= 0.95) signals.push('OVERPAINTED_BY_LATER_FILL');
      }
      if (op.alpha <= 0.01 && [0, 2, 4, 6].includes(op.mode))
        signals.push('NEAR_ZERO_FILL_OPACITY');
      if (
        box &&
        (box.right <= 0 || box.bottom <= 0 || box.left >= image.width || box.top >= image.height)
      )
        signals.push('OUTSIDE_RENDERED_PAGE');
      const white = op.fill.length === 3 && op.fill.every((v) => v >= 248);
      // White fill alone is not hidden: render must show an almost entirely white region.
      if (
        white &&
        [0, 2, 4, 6].includes(op.mode) &&
        measurement &&
        measurement.whitePixelFraction >= 0.995
      )
        signals.push('WHITE_TEXT_ON_RENDERED_WHITE_REGION');
      if (!item && (white || op.alpha <= 0.01))
        unmatched.push({
          operatorIndex: op.operatorIndex,
          text: op.text,
          reason: 'No unambiguous extracted-text box mapping; background/off-page not evaluated.',
        });
      if (signals.length)
        rows.push({
          text: op.text,
          operatorIndex: op.operatorIndex,
          signals,
          signal: signals.join(', '),
          renderingMode: op.mode,
          fillRGB: op.fill,
          fillOpacity: op.alpha,
          renderedBounds: box,
          renderedRegion: measurement,
        });
    }
    return {
      candidates: rows,
      unmatchedPotentialSignals: unmatched,
      examinedTextOperators: ops.length,
      method: 'text-operator-state-clip-overpaint-plus-rendered-white-region-v2',
      unmappedTextOperators: unmapped,
      limit:
        'Candidate signals only. White-on-dark text is not hidden. Clip correlation uses rectangle/bounding-box approximations of paths and the text box center; overpaint correlation uses later opaque fills covering at least 95 percent of the text box. Masks, image overlays, knockout groups, inaccessible text, extraction-omitted text, unmatched runs and nonwhite low-contrast text may still be missed. Rendered-region whiteness is not proof of deception. No universal hidden-content or authenticity verdict.',
    };
  }
  async function inspect(page, lib) {
    const viewport = page.getViewport({
      scale: Math.min(2, 1500 / Math.max(page.view[2] - page.view[0], page.view[3] - page.view[1])),
    });
    if (viewport.width * viewport.height > 4000000)
      throw Error('Concealed-text page render limit4MP.');
    const c = document.createElement('canvas');
    c.width = Math.ceil(viewport.width);
    c.height = Math.ceil(viewport.height);
    const ctx = c.getContext('2d', { willReadFrequently: true }),
      task = page.render({ canvasContext: ctx, viewport, background: 'rgb(255,255,255)' }),
      timer = setTimeout(() => task.cancel(), 15000);
    try {
      await task.promise;
    } finally {
      clearTimeout(timer);
    }
    const list = await page.getOperatorList(),
      content = await page.getTextContent();
    return classify(
      operators(list, lib.OPS, viewport),
      content,
      ctx.getImageData(0, 0, c.width, c.height),
      viewport,
    );
  }
  const api = { operators, rectangle, region, classify, inspect };
  root.ConcealedText = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
