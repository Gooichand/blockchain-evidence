/* Aligned double-quantization candidate measurements, no learned classifier. */
(function (root) {
  'use strict';
  const BASE = [
    16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56,
    14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113,
    92, 49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99,
  ];
  const AC = [1, 8, 2, 9, 16, 3, 10, 17, 24, 4, 11, 18];
  function quant(q, base) {
    const scale = q < 50 ? 5000 / q : 200 - 2 * q;
    return Math.max(1, Math.min(255, Math.floor((base * scale + 50) / 100)));
  }
  function analyze(decoded) {
    if (decoded.width * decoded.height > 4000000 || !decoded.components?.length)
      throw Error('JPEG coefficient limit4MP.');
    const c = decoded.components[0],
      data = AC.map((index) => {
        const histogram = new Map();
        for (let y = 0; y < c.blocksPerColumn; y++)
          for (let x = 0; x < c.blocksPerLine; x++) {
            const value = Math.abs(c.blocks[y][x][index]);
            if (value >= 2 && value <= 60) histogram.set(value, (histogram.get(value) || 0) + 1);
          }
        return {
          index,
          currentQuantizer: c.quantizationTable[index],
          histogram: [...histogram].sort((a, b) => a[0] - b[0]),
          sampleCount: [...histogram.values()].reduce((a, b) => a + b, 0),
        };
      });
    const candidates = [];
    for (let quality = 20; quality <= 95; quality++) {
      const bins = [];
      for (const frequency of data) {
        const first = quant(quality, BASE[frequency.index]),
          second = frequency.currentQuantizer,
          ratio = first / second;
        if (
          ratio < 1.5 ||
          ratio > 10 ||
          frequency.sampleCount < 150 ||
          frequency.histogram.length < 10
        )
          continue;
        let eligible = 0,
          matches = 0;
        for (const [value, count] of frequency.histogram) {
          eligible += count;
          let residual = Infinity;
          const target = (value * second) / first;
          for (let n = Math.max(0, Math.floor(target) - 1); n <= Math.ceil(target) + 1; n++)
            residual = Math.min(residual, Math.abs(value - Math.floor((n * first) / second + 0.5)));
          if (residual === 0) matches += count;
        }
        const allowed = new Set();
        for (let n = 0; n < 700; n++) {
          const k = Math.floor((n * first) / second + 0.5);
          if (k >= 2 && k <= 60) allowed.add(k);
        }
        const baseline = allowed.size / 59,
          observed = matches / eligible,
          enrichment = observed - baseline;
        bins.push({
          coefficientIndex: frequency.index,
          previousQuantizerHypothesis: first,
          currentQuantizer: second,
          nonzeroSampleCount: eligible,
          allowedLatticeFraction: baseline,
          observedLatticeFraction: observed,
          enrichment,
          support: observed >= 0.86 && enrichment >= 0.25,
        });
      }
      const supported = bins.filter((b) => b.support);
      if (bins.length >= 4 && supported.length >= 4)
        candidates.push({
          previousStandardLumaQualityHypothesis: quality,
          supportingFrequencies: supported.length,
          examinedFrequencies: bins.length,
          meanSupportedEnrichment:
            supported.reduce((n, b) => n + b.enrichment, 0) / supported.length,
          frequencies: bins,
        });
    }
    candidates.sort(
      (a, b) =>
        b.supportingFrequencies - a.supportingFrequencies ||
        b.meanSupportedEnrichment - a.meanSupportedEnrichment,
    );
    return {
      method: 'quantized-AC-lattice-enrichment-v1',
      width: decoded.width,
      height: decoded.height,
      progressive: decoded.progressive,
      componentCount: decoded.components.length,
      lumaQuantizationTable: c.quantizationTable,
      examinedFrequencies: data,
      candidateHypotheses: candidates.slice(0, 5),
      state: candidates.length
        ? 'ALIGNED_DOUBLE_QUANTIZATION_CANDIDATE'
        : 'NO_SUPPORTED_LATTICE_CANDIDATE',
      doubleCompressionProven: false,
      limits:
        'Supports only strong aligned lower-quality-then-higher-quality JPEG lattice artifacts with standard-luma-table hypotheses20-95. Not a calibrated probability or proof of re-encoding, editing or authenticity. Equal/higher-first quality, grid shifts, resizing, custom matrices, smooth/low-texture images and rounding can hide artifacts or create coincidences. No candidate does not mean single compression. First/luma component only,4MP/20MiB.',
    };
  }
  const api = { analyze, quant };
  root.DoubleJPEG = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
