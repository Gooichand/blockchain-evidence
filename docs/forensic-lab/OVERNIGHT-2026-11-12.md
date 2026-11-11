# Local desktop upgrades, November 12

No push, PR, deployment, active scan or app connection to a live host was performed in this sprint. Public standards were researched for the TLS parser.

- Added bounded PCAP/PCAPNG offline parsing, configurable fixed-offset protocol fields, bidirectional flows and deterministic destination fanout/SYN rules. No live capture, TCP reassembly, attack classifier or active scans.
- Waveform has actual time-window zoom and window measurements.
- ECDSA P-256 now generates detached signatures using a non-exportable ephemeral private key, with public JWK verification. No persistent signing identity.
- Certificate inspection checks pairwise chain signatures, validity, CA/key usage and extensions. Trust is NOT verified: no root store, full RFC5280 path/policy processing, hostname or revocation checks.
- MediaInfo 0.3.8 runs in a bounded local worker. Audio reads original container/codec, rate, channels, duration and available tags, rather than only browser-decoded properties. Video reads container/codec, tracks, dimensions, duration and tags without requiring browser playback codecs.
- Eight additional real synthetic media formats passed desktop checks: MP3, FLAC, M4A, OGG, AVI, MKV, MOV, WebM. Existing WAV/MP4 examples still pass. Metadata is editable, not identity/history/authenticity proof.

English OCR now renders scanned PDFs locally and recognizes each page, in addition to PNG/JPEG. Bounded to 10 pages, 12 MP/page, 40 MP total and 90 seconds. A real original raster-only two-page PDF passed both page-text assertions; page/pixel rejection and worker cleanup are tested. Handwriting/non-English are unsupported.

Office metadata now reads DOCX/XLSX/PPTX core/app/custom properties. DOCX tracked insertions/deletions/moves/comments return embedded author/date/text claims. Real original Office files and two deliberate tracked changes passed desktop checks. Invalid package types, malformed XML, entity declarations and oversized XML fail safely. XLSX/PPTX revision history and legacy formats remain unsupported, so this is an improvement, not a claim of full history reconstruction.

RSA now checks public JWK/SPKI PEM syntax, bounds, oddness, exponent constraints, GCD and small prime factors, imports with Web Crypto and fingerprints canonical SPKI. Not a complete RSA generation/private-key/security validation. AES raw hex key analysis checks all standard key lengths, import and simple repeated-byte patterns without claiming entropy/randomness. No key bytes returned by analysis. Cross-browser QA caught Chrome rejecting AES-192 import despite Node accepting it: the tool now returns valid-length/pattern measurements with providerImport:false and an explicit provider-support note, not a fabricated successful import.

Investigation Timeline now merges up to10 local JSON sources, hashes exact source bytes, retains source/row references and correlates exact evidence IDs across sources within a configured time window. Candidate relationships are not causality or verified events; clock skew is not corrected. Real two-file UI test recovered one10-second match and excluded a different evidence ID.

Evidence Timeline now derives a chronology directly from actual PCAP/PCAPNG packet timestamps or DOCX embedded revision/core-property dates and retains source references and SHA-256 of source bytes. Missing/invalid/offset-free dates are skipped with reasons, never guessed. It does not verify collection history, capture clocks or embedded authors/dates. Actual PCAP and DOCX derived events pass tests.

PDF Inspector now inventories indirect objects, dictionaries/references and stream lengths through pinned pdf-lib1.17.1 in a25-second worker, with10,000object input/2,000output bounds. Compressed-object-stream fixture and inert action markers pass real worker/Node tests; malformed input fails. No scripts/actions execute. This is not full conformance/security/signature/history validation. MIT license included; isolated vendor audit reports0advisories at this checkpoint.

Document Comparison now adds rendered-page visual differences to extracted-text comparison for PDFs (10pages,1MP/page, first3changed-page previews). Original same-text/different-layout PDFs produce6,351changed pixels while identical PDFs produce0. Shows text equality separately from visual changes. PDF.js standard-font and CMap assets/licenses are bundled locally, avoiding blank missing-font renders found during testing. Pixel differences are not editing intent/authenticity proof; no Office visual comparison.

Offline TLS inspection now reads complete supplied ClientHello/ServerHello records (offered/selected versions, cipher codes/names, SNI, ALPN, extensions) plus separately supplied ordered PEM chain signatures. The original fixture is never sent to a host. No live configuration scan, handshake authentication, cert-to-Hello association, root/hostname/revocation or fragmentation support. Standards: https://www.rfc-editor.org/rfc/inline-errata/rfc8446.html and IANA TLS/extension registries linked in output. Remains partial against live server/configuration expectations.

Strict count is34/67, including the old Hash Blockchain Verification user-confirmed live availability on November11 (not a particular anchored-file verdict). See STRICT-STATUS-2026-11-12.md for all67 entries and the separate52local desktop +1user-confirmed live Hash count. No80% claim.

Checkpoint: 24 suites / 155 tests; 48 real desktop examples plus eight additional media-format checks, signing roundtrip, custom protocol fields, flow rules and waveform-window interactions. Captures inspected at desktop size. These tests do not validate models, live network features, or public Amoy access.

MediaInfo BSD-2-Clause license is shipped alongside the local JS/WASM. Pinned build inputs live in scripts/vendor-build. SHA-256 checksums are in vendor-checksums.json; hashes are integrity records, not a security guarantee.

## Final local checkpoint

- Strict: 34/67 (50.7%), including old user-confirmed live Hash lookup availability. This does not reach 80%.
- 52 bounded desktop implementations plus that old live Hash lookup = 53 bounded implementations (79.1%), not 53 full original promises.
- 24 suites / 155 tests pass. 48 new real desktop examples plus extra media/Office/visual/source-merge/scanned-PDF/control checks pass. All new decisive outputs visually inspected.
- Real in-memory EVM deployment/store/seal/hash/transaction/block/record/event checks pass again. Not public Amoy confirmation for the five new Blockchain tools.
- Pinned vendor rebuild reproduces tracked assets; complete recursive checksum manifest verified. Isolated production vendor audit has zero reported advisories at this dated checkpoint. Targeted changed JS/test lint has no warnings/errors; unrelated older tests still have formatting warnings in the wider check.
- QA fixed actual missing-font blank PDF renders and Chrome AES-192 import rejection. No fake success substituted for either failure.
- All work remains local. No push/PR/deployment/spending/active scanning. Category branches are stacked; final support fixes must be folded into per-section PRs before publication.
