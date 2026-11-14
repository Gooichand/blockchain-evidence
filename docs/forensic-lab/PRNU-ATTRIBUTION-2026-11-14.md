# Noise Analysis PRNU attribution, November 14, 2026

## What changed

Noise Analysis previously only visualized a luminance residual. It now performs
PRNU (photo-response non-uniformity) same-device attribution:

1. The user supplies up to 8 reference photos known to come from a claimed
   source device, plus the query image.
2. Each image is decoded at native resolution (up to 42 MP / 20 MiB, bypassing
   the general 12 MP scaled decode only for this path), converted to luminance,
   and center-cropped to 512x512 (minimum frame 524px on the short side).
3. A Gaussian low-pass (sigma 1, separable, radius 4) is subtracted to get the
   high-frequency residual.
4. The device fingerprint is the zero-mean, unit-std mean of the reference
   residuals.
5. The query residual is correlated against the fingerprint over +/-4px
   wrap-around alignment shifts; peak normalized correlation and PCE
   (peak-to-correlation-energy) are reported.

Output is a measurement-only candidate signal: higher peak correlation and PCE
against one reference set than another supports a common sensor. It is never a
match verdict, camera-model identification, or person identification. Scaling,
cropping, rotation and re-encoding can erase the signal; a low value does not
prove a different device.

## Validation on real camera material

Dataset: PrnuModernDevices, CSP Lab, University of Florence, CC BY-SA 4.0.
Method reference: Albisani, Iuliani, Piva, "A video forensics framework for the
authentication of social media videos" / PRNU-based source identification
(ICASSP 2021), doi 10.1109/ICASSP39728.2021.9413611. Bundled fixtures and full
attribution live in public/samples/image/prnu/ (14 files, ~36 MB).

Fingerprints built from 3 flat-field frames per device; query natural images:

| Query | Same-device fingerprint | peak corr / PCE | Cross-device fingerprint | peak corr / PCE | Separates |
| --- | --- | --- | --- | --- | --- |
| C02-nat-1 | C02 | 0.043 / 83.5 | C15 | 0.006 / 3.3 | yes (7.2x corr, 25x PCE) |
| C02-nat-2 | C02 | 0.023 / 55.9 | C15 | 0.004 / 3.2 | yes |
| C15-nat-1 | C15 | 0.033 / 74.9 | C02 | 0.007 / 5.8 | yes |
| C15-nat-2 | C15 | 0.044 / 90.0 | C02 | 0.008 / 9.5 | yes |
| C01-nat-1 | C01 | 0.010 / 5.0 | C02/C15 | 0.011 / 18.6 (cross slightly higher) | no signal, weak device disclosed |

Desktop gate requires same-device peak correlation >1.8x and PCE >3x the
cross-device values for C02 and C15 (all four naturals pass; actual margins
above). C01 is a known weak-PRNU device (the dataset's own paper reports the
same): its correct fingerprint shows no usable signal at all - peak
correlation 0.010 and PCE 5.0 against the correct device versus 0.011 and 18.6
against the wrong one, i.e. neither separates and the cross set scores
marginally higher on this frame. It is recorded as a documented weak case, not
credited as a pass and not manufactured into one.

Exact measured numbers are written to
test-results/desktop-forensics/prnu-validation.json on every desktop run.

## Unit tests (tests/noise-prnu.test.js, 4 tests)

- A synthetic multiplicative sensor pattern mixed into natural-like scenes is
  attributed to the correct fingerprint and separated from an unrelated
  pattern, with no periodic scene structure (stripes) leaking into residuals.
- Small frames below the minimum are rejected with a clear error.
- Fingerprint construction validates its inputs.

## Documented limits

- Requires user-supplied reference photos from the claimed device; without
  them the tool falls back to the residual visualization only.
- Center-crop registration only (+/-4px shift search); scaled, cropped,
  rotated, re-encoded or heavily filtered images can erase the PRNU signal and
  are stated misses.
- Weak-PRNU devices (heavy computational photography pipelines, e.g. C01) may
  not separate; reported as weak, not as a match.
- The residual-only mode (no references) remains and is unchanged.
