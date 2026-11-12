/* Deterministic all-frame visual/GOP measurements, not a forensic edit verdict. */
(function (root) {
  'use strict';
  function median(a) {
    const s = [...a].sort((a, b) => a - b);
    return s.length ? (s[Math.floor((s.length - 1) / 2)] + s[Math.floor(s.length / 2)]) / 2 : null;
  }
  function pixels(rgba) {
    const rgb = new Uint8Array((rgba.length / 4) * 3),
      hist = new Float64Array(48);
    let sum = 0,
      sq = 0,
      black = 0;
    for (let i = 0, j = 0; i < rgba.length; i += 4) {
      const r = rgba[i],
        g = rgba[i + 1],
        b = rgba[i + 2],
        y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      rgb[j++] = r;
      rgb[j++] = g;
      rgb[j++] = b;
      hist[Math.floor(r / 16)]++;
      hist[16 + Math.floor(g / 16)]++;
      hist[32 + Math.floor(b / 16)]++;
      sum += y;
      sq += y * y;
      if (y < 8) black++;
    }
    const n = rgba.length / 4;
    return {
      rgb,
      hist: Array.from(hist, (x) => x / (n * 3)),
      mean: sum / n,
      stddev: Math.sqrt(Math.max(0, sq / n - (sum / n) ** 2)),
      blackFraction: black / n,
    };
  }
  function difference(a, b) {
    let delta = 0,
      hist = 0;
    for (let i = 0; i < a.rgb.length; i++)
      delta += Math.abs(a.rgb[i] - b.rgb[i]) / (255 * a.rgb.length);
    for (let i = 0; i < a.hist.length; i++) hist += Math.abs(a.hist[i] - b.hist[i]) / 2;
    return { meanAbsoluteRGBDifference: delta, histogramDistance: hist };
  }
  function analyze(frames, samples, shift = 0) {
    if (!frames.length || frames.length !== samples.length || frames.length > 2000)
      throw Error('All expected frames must be decoded; limit2000.');
    const ordered = [...frames].sort((a, b) => a.seconds - b.seconds);
    if (
      ordered.some(
        (f, i) =>
          !Number.isFinite(f.seconds) ||
          f.duration <= 0 ||
          (i && f.seconds <= ordered[i - 1].seconds),
      )
    )
      throw Error('Invalid or duplicate frame timestamps.');
    const metrics = ordered.map((f, i) => ({
      presentationIndex: i,
      sampleNumber: f.sampleNumber,
      seconds: f.seconds + shift,
      durationSeconds: f.duration,
      isSync: f.isSync,
      meanLuminance: f.measure.mean,
      luminanceStddev: f.measure.stddev,
      blackFraction: f.measure.blackFraction,
      ...(i
        ? difference(f.measure, ordered[i - 1].measure)
        : { meanAbsoluteRGBDifference: 0, histogramDistance: 0 }),
    }));
    const durations = metrics.map((f) => f.durationSeconds),
      medianDuration = median(durations),
      cuts = [],
      events = [];
    for (let i = 1; i < metrics.length; i++) {
      const f = metrics[i];
      if (f.meanAbsoluteRGBDifference >= 0.22 && f.histogramDistance >= 0.22) {
        cuts.push(i);
        events.push({
          kind: 'ABRUPT_VISUAL_CHANGE_CANDIDATE',
          frameIndex: i,
          seconds: f.seconds,
          meanAbsoluteRGBDifference: f.meanAbsoluteRGBDifference,
          histogramDistance: f.histogramDistance,
        });
      }
      const gap = f.seconds - (metrics[i - 1].seconds + metrics[i - 1].durationSeconds);
      if (Math.abs(gap) > Math.max(0.005, medianDuration * 0.5))
        events.push({
          kind: 'PRESENTATION_GAP_OR_OVERLAP',
          frameIndex: i,
          seconds: f.seconds,
          gapSeconds: gap,
        });
    }
    function intervals(predicate, kind, minDuration) {
      let begin = null;
      for (let i = 0; i <= metrics.length; i++) {
        const yes = i < metrics.length && predicate(metrics[i], i);
        if (yes && begin === null) begin = i;
        if (!yes && begin !== null) {
          const end = i - 1,
            duration = metrics[end].seconds + metrics[end].durationSeconds - metrics[begin].seconds;
          if (duration >= minDuration)
            events.push({
              kind,
              startFrame: begin,
              endFrame: end,
              startSeconds: metrics[begin].seconds,
              endSeconds: metrics[end].seconds + metrics[end].durationSeconds,
              durationSeconds: duration,
            });
          begin = null;
        }
      }
    }
    intervals((f) => f.blackFraction >= 0.98, 'NEAR_BLACK_INTERVAL', 0.5);
    intervals((f, i) => i > 0 && f.meanAbsoluteRGBDifference <= 0.001, 'LOW_CHANGE_INTERVAL', 1);
    const sync = samples.map((s, i) => ({ ...s, sampleNumber: i + 1 })).filter((s) => s.is_sync),
      groups = [];
    for (let i = 0; i < sync.length; i++) {
      const start = sync[i].sampleNumber - 1,
        end = i + 1 < sync.length ? sync[i + 1].sampleNumber - 1 : samples.length,
        rows = metrics.filter((f) => f.sampleNumber > start && f.sampleNumber <= end),
        times = rows.map((f) => f.seconds);
      groups.push({
        groupIndex: i,
        startDecodeSample: start + 1,
        endDecodeSampleInclusive: end,
        sampleCount: end - start,
        startPresentationSeconds: Math.min(...times),
        endPresentationSeconds: Math.max(...rows.map((f) => f.seconds + f.durationSeconds)),
        compressedBytes: samples.slice(start, end).reduce((n, s) => n + s.size, 0),
        syncPresentationSeconds: sync[i].cts / sync[i].timescale + shift,
      });
    }
    const typical = median(groups.map((g) => g.sampleCount));
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      g.flags = [];
      if (
        i < groups.length - 1 &&
        typical &&
        Math.abs(g.sampleCount - typical) > Math.max(2, 0.5 * typical)
      )
        g.flags.push('UNUSUAL_GOP_SAMPLE_COUNT');
      g.visualChangeCandidates = events.filter(
        (e) =>
          e.kind === 'ABRUPT_VISUAL_CHANGE_CANDIDATE' &&
          e.seconds >= g.startPresentationSeconds &&
          e.seconds < g.endPresentationSeconds,
      ).length;
    }
    const boundaries = [0, ...cuts, metrics.length],
      scenes = [];
    for (let i = 0; i < boundaries.length - 1; i++) {
      const a = boundaries[i],
        b = boundaries[i + 1] - 1;
      scenes.push({
        startFrame: a,
        endFrame: b,
        startSeconds: metrics[a].seconds,
        endSeconds: metrics[b].seconds + metrics[b].durationSeconds,
        representativeFrame: a,
      });
    }
    return {
      method: 'all-decoded-frame-32x18-RGB-histogram-and-GOP-v1',
      decodedFrameCount: metrics.length,
      syncSampleCount: sync.length,
      medianFrameDurationSeconds: medianDuration,
      groups,
      scenes,
      events,
      frames: metrics,
      note: 'Every supported video frame measured at32x18 resolution. Deterministic candidates only, not semantic event reconstruction, edit proof or authenticity. Similar-looking changes can be missed; motion/exposure/normal GOP encoding can trigger candidates. No audio interpretation.',
    };
  }
  const api = { pixels, difference, analyze, median };
  root.VideoMeasurements = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
