/* Measured concealed-text candidates. No intent or authenticity verdict. */
(function (root) {
  'use strict';
  function color(value, gray = false) {
    const a = Array.from(value || []);
    return gray ? [a[0] * 255, a[0] * 255, a[0] * 255] : a.slice(0, 3);
  }
  function operators(ops, O) {
    let state = { mode: 0, fill: [0, 0, 0], alpha: 1 },
      stack = [],
      out = [];
    if (ops.fnArray.length > 200000) throw Error('PDF page operator limit200000.');
    for (let i = 0; i < ops.fnArray.length; i++) {
      const op = ops.fnArray[i],
        arg = ops.argsArray[i];
      if (op === O.save) stack.push({ ...state, fill: [...state.fill] });
      else if (op === O.restore) state = stack.pop() || { mode: 0, fill: [0, 0, 0], alpha: 1 };
      else if (op === O.setTextRenderingMode) state.mode = arg[0];
      else if (op === O.setFillRGBColor) state.fill = color(arg);
      else if (op === O.setFillGray) state.fill = color(arg, true);
      else if (op === O.setGState) {
        for (const [key, value] of arg[0] || []) if (key === 'ca') state.alpha = value;
      } else if ([O.showText, O.showSpacedText].includes(op)) {
        const text = (arg[0] || []).map((g) => g?.unicode || '').join('');
        if (text) out.push({ operatorIndex: i, text, ...state, fill: [...state.fill] });
      }
    }
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
  function classify(ops, content, image, viewport) {
    const rows = [],
      unmatched = [];
    let cursor = 0;
    for (const op of ops) {
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
      method: 'text-operator-state-plus-rendered-white-region-v1',
      limit:
        'Candidate signals only. White-on-dark text is not hidden. Complex clipping, overpainting, masks, Type3 glyphs, inaccessible text, unmatched runs and nonwhite low-contrast text may be missed. Rendered-region whiteness is not proof of deception. No universal hidden-content or authenticity verdict.',
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
      operators(list, lib.OPS),
      content,
      ctx.getImageData(0, 0, c.width, c.height),
      viewport,
    );
  }
  const api = { operators, rectangle, region, classify, inspect };
  root.ConcealedText = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
