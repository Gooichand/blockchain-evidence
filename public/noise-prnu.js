/* Bounded PRNU same-device candidate measurements: Gaussian residual, flat-field
   fingerprint averaging, normalized-correlation peak and PCE over a small shift
   search. Measurements only - never a match verdict or person identification. */
(function (root) {
  'use strict';
  const SIGMA = 1,
    RADIUS = 4,
    MARGIN = RADIUS + 2,
    CROP = 512,
    SEARCH = 4;
  function kernel() {
    const k = [];
    let s = 0;
    for (let i = -RADIUS; i <= RADIUS; i++) {
      const v = Math.exp(-(i * i) / (2 * SIGMA * SIGMA));
      k.push(v);
      s += v;
    }
    return k.map((v) => v / s);
  }
  const K = kernel();
  function blur(lum, w, h) {
    const tmp = new Float64Array(w * h),
      out = new Float64Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let a = 0;
        for (let i = -RADIUS; i <= RADIUS; i++) {
          const xx = Math.min(w - 1, Math.max(0, x + i));
          a += lum[y * w + xx] * K[i + RADIUS];
        }
        tmp[y * w + x] = a;
      }
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let a = 0;
        for (let i = -RADIUS; i <= RADIUS; i++) {
          const yy = Math.min(h - 1, Math.max(0, y + i));
          a += tmp[yy * w + x] * K[i + RADIUS];
        }
        out[y * w + x] = a;
      }
    return out;
  }
  /* Residual of the center CROPxCROP region from a full RGBA frame whose width
     and height are the frame's. Only the center window is blurred; the margin
     keeps the interior identical to a whole-frame blur. */
  function residual(data, w, h) {
    if (w < CROP + 2 * MARGIN || h < CROP + 2 * MARGIN)
      throw Error('Image below the 524x524 PRNU window.');
    const win = CROP + 2 * MARGIN,
      x0 = (w - win) >> 1,
      y0 = (h - win) >> 1,
      lum = new Float64Array(win * win);
    for (let y = 0; y < win; y++)
      for (let x = 0; x < win; x++) {
        const p = ((y0 + y) * w + x0 + x) * 4;
        lum[y * win + x] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
      }
    const b = blur(lum, win, win),
      res = new Float64Array(CROP * CROP);
    for (let y = 0; y < CROP; y++)
      for (let x = 0; x < CROP; x++)
        res[y * CROP + x] = lum[(y + MARGIN) * win + x + MARGIN] - b[(y + MARGIN) * win + x + MARGIN];
    return res;
  }
  function stats(a) {
    let m = 0;
    for (const v of a) m += v;
    m /= a.length;
    let s = 0;
    for (const v of a) s += (v - m) * (v - m);
    return { mean: m, std: Math.sqrt(s / a.length) };
  }
  function fingerprint(residuals) {
    if (!residuals?.length) throw Error('No reference residuals.');
    const f = new Float64Array(residuals[0].length);
    for (const r of residuals) {
      if (r.length !== f.length) throw Error('Reference residual size mismatch.');
      for (let i = 0; i < f.length; i++) f[i] += r[i] / residuals.length;
    }
    const s = stats(f),
      out = new Float64Array(f.length);
    for (let i = 0; i < f.length; i++) out[i] = (f[i] - s.mean) / (s.std || 1);
    return out;
  }
  /* Normalized-correlation surface over +/-SEARCH wrap shifts; PCE is the
     squared peak over the mean of the squared off-peak surface. */
  function pce(res, ref) {
    const rs = stats(res),
      fs = stats(ref),
      n = res.length;
    let peak = -Infinity,
      px = 0,
      py = 0;
    const surface = new Float64Array((2 * SEARCH + 1) * (2 * SEARCH + 1));
    let si = 0;
    for (let dy = -SEARCH; dy <= SEARCH; dy++)
      for (let dx = -SEARCH; dx <= SEARCH; dx++) {
        let acc = 0;
        for (let y = 0; y < CROP; y++) {
          const ry = (y + dy + CROP) % CROP,
            base = y * CROP,
            fbase = ry * CROP;
          for (let x = 0; x < CROP; x++)
            acc += res[base + x] * ref[fbase + ((x + dx + CROP) % CROP)];
        }
        const c = acc / n / ((rs.std || 1) * (fs.std || 1));
        surface[si++] = c;
        if (c > peak) {
          peak = c;
          px = dx;
          py = dy;
        }
      }
    let energy = 0,
      count = 0;
    for (const c of surface)
      if (c < peak) {
        energy += c * c;
        count++;
      }
    return {
      peakCorrelation: peak,
      pce: count ? (peak * peak) / (energy / count) : null,
      peakShift: [px, py],
    };
  }
  const api = { residual, fingerprint, pce, stats, CROP, SEARCH, SIGMA };
  root.NoisePRNU = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
