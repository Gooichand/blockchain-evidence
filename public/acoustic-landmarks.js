/* Original deterministic spectral-landmark comparison. No trained model or identity database. */
(function (root) {
  'use strict';
  const RATE = 8000,
    N = 1024,
    HOP = 128;
  function resample(input, rate) {
    if (!Number.isFinite(rate) || rate < 8000 || rate > 192000 || input.length > rate * 30 + 1)
      throw Error('Fingerprint supports 8-192kHz and first30 seconds.');
    const out = new Float32Array(Math.floor((input.length * RATE) / rate));
    for (let i = 0; i < out.length; i++) {
      const a = (i * rate) / RATE,
        b = ((i + 1) * rate) / RATE;
      let v = 0;
      for (let j = Math.floor(a); j < Math.ceil(b) && j < input.length; j++)
        v += input[j] * (Math.min(b, j + 1) - Math.max(a, j));
      out[i] = v / (b - a);
    }
    return out;
  }
  function spectrum(input, start) {
    const re = new Float64Array(N),
      im = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      let j = 0,
        k = i;
      for (let bit = 0; bit < 10; bit++) {
        j = (j << 1) | (k & 1);
        k >>= 1;
      }
      re[j] = input[start + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
    }
    for (let size = 2; size <= N; size *= 2)
      for (let base = 0; base < N; base += size)
        for (let k = 0; k < size / 2; k++) {
          const a = (-2 * Math.PI * k) / size,
            c = Math.cos(a),
            s = Math.sin(a),
            j = base + k,
            l = j + size / 2,
            x = re[l] * c - im[l] * s,
            y = re[l] * s + im[l] * c;
          re[l] = re[j] - x;
          im[l] = im[j] - y;
          re[j] += x;
          im[j] += y;
        }
    const out = new Float32Array(400);
    for (let i = 8; i < 400; i++)
      out[i] = 10 * Math.log10((re[i] * re[i] + im[i] * im[i]) / (N * N) + 1e-15);
    return out;
  }
  function fingerprint(input, rate) {
    const samples = resample(input, rate),
      frames = Math.floor((samples.length - N) / HOP) + 1;
    if (frames < 120)
      return {
        state: 'INSUFFICIENT_DURATION',
        landmarks: [],
        peaks: [],
        seconds: samples.length / RATE,
      };
    const spectra = Array.from({ length: frames }, (_, i) => spectrum(samples, i * HOP));
    const peaks = [];
    for (let t = 2; t < frames - 2; t++) {
      let max = -150;
      for (let f = 8; f < 400; f++) max = Math.max(max, spectra[t][f]);
      const candidates = [];
      for (let f = 10; f < 398; f++) {
        const v = spectra[t][f];
        if (v < max - 30 || v < -70) continue;
        let best = true;
        for (let dt = -2; dt <= 2 && best; dt++)
          for (let df = -2; df <= 2; df++) {
            if (dt === 0 && df === 0) continue;
            const z = spectra[t + dt][f + df];
            if (z > v || (z === v && (dt < 0 || (dt === 0 && df < 0)))) {
              best = false;
              break;
            }
          }
        if (best) candidates.push({ t, f, power: v });
      }
      candidates.sort((a, b) => b.power - a.power);
      peaks.push(...candidates.slice(0, 5));
    }
    if (peaks.length > 4000) throw Error('Fingerprint peak limit exceeded.');
    const landmarks = [];
    for (let i = 0; i < peaks.length; i++) {
      let paired = 0;
      for (let j = i + 1; j < peaks.length && paired < 5; j++) {
        const dt = peaks[j].t - peaks[i].t;
        if (dt < 4) continue;
        if (dt > 80) break;
        landmarks.push({
          a: i,
          t: peaks[i].t,
          f1: Math.round(peaks[i].f / 2),
          f2: Math.round(peaks[j].f / 2),
          dt: Math.round(dt / 2),
        });
        paired++;
      }
    }
    const bins = new Set(peaks.map((p) => Math.round(p.f / 2))).size,
      hashes = new Set(landmarks.map(key)).size;
    return {
      state: peaks.length < 30 || bins < 12 || hashes < 100 ? 'LOW_INFORMATION' : 'READY',
      seconds: samples.length / RATE,
      peaks,
      landmarks,
      distinctFrequencyBins: bins,
      distinctHashes: hashes,
    };
  }
  function key(p) {
    return p.f1 + ':' + p.f2 + ':' + p.dt;
  }
  function compare(a, b) {
    const summary = {
      method: 'spectral-landmark-offset-v1',
      sampleRate: RATE,
      fftSamples: N,
      hopSeconds: HOP / RATE,
      first: {
        state: a.state,
        peaks: a.peaks.length,
        hashes: a.landmarks.length,
        distinctHashes: a.distinctHashes || 0,
      },
      second: {
        state: b.state,
        peaks: b.peaks.length,
        hashes: b.landmarks.length,
        distinctHashes: b.distinctHashes || 0,
      },
      limits:
        'First30 seconds only. Pairwise candidate acoustic correspondence, not a unique identity, speaker, database or tamper verdict. Silence/simple tones/short clips are inconclusive. Speed/pitch changes, heavy noise and repeated material can fail or be ambiguous; no accuracy guarantee beyond documented fixtures.',
    };
    if (a.state !== 'READY' || b.state !== 'READY')
      return { ...summary, state: 'INCONCLUSIVE', candidateMatch: false };
    const index = new Map();
    for (const p of b.landmarks) {
      const k = key(p);
      if (!index.has(k)) index.set(k, []);
      if (index.get(k).length < 50) index.get(k).push(p);
    }
    const votes = new Map();
    let comparisons = 0;
    for (const p of a.landmarks)
      for (let f1 = -1; f1 <= 1; f1++)
        for (let f2 = -1; f2 <= 1; f2++)
          for (let dt = -1; dt <= 1; dt++)
            for (const q of index.get(key({ f1: p.f1 + f1, f2: p.f2 + f2, dt: p.dt + dt })) || []) {
              if (++comparisons > 1000000)
                return { ...summary, state: 'AMBIGUOUS_DENSE_COLLISIONS', candidateMatch: false };
              const offset = Math.round((q.t - p.t) / 2);
              let v = votes.get(offset);
              if (!v) {
                v = { a: new Map(), b: new Set() };
                votes.set(offset, v);
              }
              v.a.set(p.a, p.t);
              v.b.add(q.a);
            }
    const score = (v) => Math.min(v.a.size, v.b.size);
    const ranked = [...votes].sort((a, b) => score(b[1]) - score(a[1])),
      best = ranked[0];
    if (!best)
      return {
        ...summary,
        state: 'NO_ALIGNED_LANDMARKS',
        candidateMatch: false,
        alignedAnchorCount: 0,
      };
    const times = [...best[1].a.values()],
      span = ((Math.max(...times) - Math.min(...times)) * HOP) / RATE;
    const denominator = Math.min(
      new Set(a.landmarks.map((p) => p.a)).size,
      new Set(b.landmarks.map((p) => p.a)).size,
    );
    const count = score(best[1]),
      coverage = Math.min(1, count / denominator),
      runnerEntry = ranked.find(([offset]) => Math.abs(offset - best[0]) > 32),
      runner = runnerEntry ? score(runnerEntry[1]) : 0;
    const ambiguous = count >= 20 && coverage >= 0.12 && span >= 2 && runner >= count * 0.65,
      matched = count >= 20 && coverage >= 0.12 && span >= 2 && !ambiguous;
    return {
      ...summary,
      state: ambiguous
        ? 'AMBIGUOUS_REPEATED_ALIGNMENT'
        : matched
          ? 'CANDIDATE_ACOUSTIC_MATCH'
          : 'NO_SUPPORTED_ALIGNMENT',
      candidateMatch: matched,
      secondMinusFirstOffsetSeconds: (best[0] * 2 * HOP) / RATE,
      alignedAnchorCount: count,
      anchorCoverage: coverage,
      alignedTimeSpanSeconds: span,
      runnerUpDistinctOffsetAnchorCount: runner,
      landmarkComparisons: comparisons,
    };
  }
  const api = { fingerprint, compare, resample };
  root.AcousticLandmarks = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
