# Concealed-text clip/overpaint correlation, November 14 2026

## Scope decision

The gap was "complex clipping/overpainting/masks/Type3 and omitted/unmapped
text incomplete". Full rendering equivalence is impossible in bounded form, so
the product scope is the same as before: correlate actual operator state with
rendered pixels where the correlation is defensible, disclose what cannot be
evaluated, claim nothing beyond the stated approximations. Basic clipping and
later opaque overpainting are now correlated; masks, image overlays, knockout
groups and the other documented misses remain misses.

## Implementation

- `operators()` now tracks the current transformation matrix (pdf.js
  transform op, correct cm x CTM multiply order) and the graphics-state
  save/restore stack, so clip and paint state is evaluated per text operator,
  not per page.
- Path payloads from constructPath are turned into device rectangles: one
  exact rectangle per PDF `re` element, one bounding box per non-rect path
  segment sequence (approximation, stated in the result `limit` text).
- clip/eoClip applications are recorded on the graphics state and restored
  with Q. A text run whose extracted-text box center falls outside any active
  clip application is reported `CLIPPED_OUTSIDE_CLIP_REGION`.
- fill/eoFill/fillStroke/eoFillStroke paint events are recorded with fill
  color and alpha. A text run whose box is at least 95 percent covered by
  later opaque (alpha >= 0.99) fills is reported
  `OVERPAINTED_BY_LATER_FILL`.
- Show-text runs whose glyphs carry no printable Unicode mapping (empty,
  control-only, private-use-only or replacement-only, for example a Type3
  font without ToUnicode) are moved to `unmappedTextOperators` and disclosed
  as not evaluated, instead of being silently dropped or claimed visible.
- Method string bumped to
  `text-operator-state-clip-overpaint-plus-rendered-white-region-v2`.

## Fixtures and evidence

- scripts/generate-concealed-text-samples.py regenerates signals.pdf with a
  second page: an overpainted run (positive), a white run painted after a
  dark background (negative), a clipped run inside the clip region
  (negative) and one outside it (positive). It also hand-writes
  type3-unmapped.pdf, a Type3 font with no ToUnicode whose only glyph maps
  to a control codepoint (unmapped positive).
- tests/concealed-text.test.js: 10/10, including clip flag, overpaint flag
  with an earlier-paint negative, and unmapped disclosure.
- scripts/test-nonnetwork-desktop.cjs: the document group now analyzes
  signals.pdf page 2 (overpaint positive, clip positive, both layering
  negatives unflagged) and type3-unmapped.pdf (zero candidates, one unmapped
  disclosure) in a real browser render. 44/44 desktop examples pass.

## Remaining limits (stated in the tool result itself)

Clip correlation uses rectangle/bounding-box approximations of paths and the
text box center; overpaint correlation uses later opaque fills covering at
least 95 percent of the text box. Masks, image overlays, knockout groups,
inaccessible text, extraction-omitted text, unmatched runs and nonwhite
low-contrast text may still be missed. Rendered-region whiteness is not proof
of deception. No universal hidden-content or authenticity verdict.
