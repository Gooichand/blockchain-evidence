# Legacy Office (OLE2) metadata validation, November 14 2026

## Scope decision

The gap was "no complete Office history/legacy formats". Complete historical
reconstruction of a legacy file is impossible by definition - deleted and
rewritten content is gone - so the bounded product scope mirrors the PDF
metadata entry that is already strict: parse what the bytes actually carry,
state the boundary. Legacy DOC/XLS/PPT (OLE2 compound files) now read their
SummaryInformation and DocumentSummaryInformation streams; nothing is
invented when a stream or field is absent.

## Implementation

- Vendored `cfb` 1.2.2 (Apache-2.0, pinned in scripts/vendor-build with a
  lockfile, bundled as public/vendor/cfb-bundle.js, license alongside, both
  hashed into docs/forensic-lab/vendor-checksums.json).
- A bounded MS-OLEPS property-set reader in public/document-forensics.js:
  2 MiB stream cap, 512 properties per section, scalar types only
  (integers, booleans, LPSTR/LPWSTR, FILETIME to ISO). Unknown fields are
  reported numerically; user-defined properties resolve their names through
  the section dictionary (writers that pack names without MS-OLEPS padding
  and with padding are both handled).
- Author, last-saved-by, revision number, create/save/print timestamps,
  title/subject/keywords/comments, page/word/character counts, application,
  company and other user-defined fields are reported as embedded editable
  claims.
- Non-OLE2 bytes with a .doc/.xls/.ppt extension are rejected before
  parsing; ODT stays explicitly unsupported.

## Fixtures (all synthetic)

`scripts/generate-legacy-office-samples.py` builds minimal ODT/ODS/ODP with
odfpy (synthetic author/editor/company/dates) and converts with LibreOffice
headless to `public/samples/document/legacy-summary.{doc,xls,ppt}`. Output
embeds conversion timestamps; committed fixtures are the test reference.

## Verification

- Unit: three real-parser fixture tests (DOC/XLS/PPT) assert author, editor,
  company, title and creation date, plus a renamed-text-file negative.
- Desktop: the office-metadata workflow additionally analyzes all three
  legacy fixtures in-browser and asserts author, editor, company and the
  honest history limit.

## Honest limits that remain

- Deleted or rewritten history cannot be reconstructed from absent bytes.
- Author/last-saved-by and dates are editable claims, not verified
  authorship or verified time.
- XLSX/PPTX historical revisions remain unreconstructed.
