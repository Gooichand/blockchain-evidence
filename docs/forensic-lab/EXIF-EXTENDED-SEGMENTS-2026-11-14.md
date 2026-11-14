# EXIF Viewer extended-segment validation, November 14 2026

## Scope decision

The original gap was "supported embedded tags only, not universal full-format
extraction". Full universal extraction of every vendor maker-note dialect is
not decidable in a browser without shipping per-vendor dictionaries, so the
bounded product scope is: parse every embedded segment family the vendored
exifr engine supports, and report segment presence honestly. Maker notes are
reported present with byte size but are never decoded or guessed. This keeps
the no-fake-results rule: nothing is invented when bytes are missing,
truncated or vendor-private.

## What the tool now reads (JPEG and PNG)

- TIFF/EXIF IFD0, EXIF detail, GPS, Interoperability, Thumbnail IFD (exifr TIFF parser)
- XMP, including extended XMP split across multiple APP1 segments (`tiff.multiSegment`)
- IPTC IIM (APP13 Photoshop resource blocks)
- ICC profiles, including multi-chunk APP2 assembly
- JFIF (JPEG) and IHDR (PNG) headers
- MakerNote and UserComment payloads (UserComment decoded with its charset
  prefix; MakerNote reported present-but-undecoded with byte length)

## Honest segment reporting

A second, independent container scan walks JPEG APP markers / PNG chunks and
counts ICC chunk indices against the declared chunk count and looks for the
extended-XMP extension APP1. The report therefore states:

- `found` / `absent` per segment family;
- `found (base + extended APP1 segments merged)` or `found (extended XMP
  declared but extension segment is missing; base packet only)` for XMP;
- `found (N of M chunks)` or `found (INCOMPLETE: ...)` for ICC.

A truncated ICC that exifr happens to half-decode is still reported
INCOMPLETE, because the byte scan - not the parser - decides completeness.

## Fixtures (all synthetic, generated locally)

`scripts/generate-metadata-samples.py` deterministically builds:

- `public/samples/metadata/extended-segments.jpg`: EXIF (Make/Model/GPS,
  UserComment with ASCII charset prefix, synthetic MakerNote bytes), base XMP
  with `xmpNote:HasExtendedXMP`, extended XMP in a second APP1, sRGB ICC in
  APP2, IPTC IIM (ObjectName + Caption) in APP13.
- `public/samples/metadata/extended-segments.png`: eXIf chunk, iCCP sRGB
  profile, iTXt XMP.
- `public/samples/metadata/truncated-icc.jpg`: negative; APP2 declares chunk
  1 of 2 and the second chunk never arrives. The tool must report the
  profile INCOMPLETE.

Fixture inventory lives in `public/samples/metadata/manifest.json`.

## Verification

- Unit: `tests/metadata-tools.test.js` gains three real-parser fixture tests
  (full JPEG segment map, PNG segment map, truncated-ICC honesty);
  `tests/metadata-negative-fixtures.test.js` keeps the rejection paths.
- Desktop: `scripts/test-nonnetwork-desktop.cjs` asserts the exif demo's
  segment map (XMP merged, ICC 1/1, IPTC found, GPS found, makerNote present
  but undecoded) and analyzes the truncated-ICC fixture in-browser.

## Honest limits that remain

- Embedded values are editable claims, not verified capture history.
- Maker notes are never decoded; a camera's private fields stay private bytes.
- Formats beyond JPEG/PNG (TIFF, HEIC, WebP) remain unsupported inputs.
