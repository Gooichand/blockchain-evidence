# Double-JPEG broad lattice enrichment, November 14 2026

## Scope decision

The gap was "narrow synthetic-only method misses five genuine-double cases".
Of the five recorded misses, two physical classes cannot carry a coefficient
lattice signal at all and stay documented misses: equal-quality re-encoding
(double-75-75, ratio 1), higher-then-lower quality (double-95-50, the second
coarse pass destroys the fine lattice) and grid shift (shifted-double85-95,
re-blocking destroys the lattice). The remaining two (double-50-95,
double-65-95) do carry the lattice - strongly, across every examined
frequency - but diluted: a strong first quantization spreads genuine image
content between lattice points, so each frequency's observed lattice fraction
(~0.67-0.75) falls below the 0.86 concentrated-support threshold.

## Implementation

- Existing concentrated rule unchanged: at least 4 examined frequencies with
  >=150 nonzero samples, >=86% observed lattice fraction and >=25% enrichment
  over the allowed-bin density baseline.
- New broad rule, additive only: a hypothesis is also a candidate when at
  least 8 of the 12 examined AC frequencies show >=40% baseline-corrected
  enrichment, regardless of any single frequency's observed fraction.
- First/second quantizer ratio ceiling raised 10 -> 15 so strong first
  qualities (q50 tables against q95 tables) stay in scope; floor 1.5
  unchanged (lower-then-higher quality only).
- Every candidate now carries detectionBasis
  (per-frequency-lattice / broad-lattice-enrichment / both),
  broadSupportFrequencies and meanEnrichment; method string bumped to
  quantized-AC-lattice-enrichment-v2.

## Fixtures and evidence

- tests/double-jpeg.test.js 14/14: the two diluted-lattice doubles now flag
  with the broad basis and a quality hypothesis within 1 of truth; the three
  lattice-destroying cases stay inconclusive with the misses named; all
  seven single-compression/flat negatives stay clean.
- Independent photographic evaluation: scripts/generate-double-jpeg-independent.py
  builds double-50->95 and double-65->95 plus single-50/single-95 from the
  ELA demo photo (a different source than the seeded synthetic texture).
  Result on the photo: no candidate - the small smooth image leaves only 3 of
  12 examined frequencies above the sample/histogram floors, below the
  8-frequency breadth requirement. This is recorded in the fixture manifest
  as a documented miss, never called single compression, and confirmed in
  tests and in the real-browser desktop matrix.
- Negative safety was probed at both 12 and 24 examined frequencies: no
  single-compression fixture produces any hypothesis with >=40% enrichment on
  even one frequency.
- scripts/test-nonnetwork-desktop.cjs runs the full matrix through the real
  coefficient worker: 4 positives, 7 negatives, 3 documented misses, 4
  independent smooth-photo cases. 44/44 desktop examples pass.

## Remaining limits (stated in the tool result itself)

Equal/higher-first quality, grid shifts, resizing, custom matrices, small or
smooth/low-texture images (too few sampled frequencies) and rounding can hide
artifacts or create coincidences. A candidate is not a calibrated probability
or proof of re-encoding, editing or authenticity; a hypothesized quality is
not a recovered encoding history. No candidate does not mean single
compression.
