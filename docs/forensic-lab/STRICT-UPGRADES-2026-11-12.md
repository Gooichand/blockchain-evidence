# Local strict upgrades, November 12

Base: PR3 c508f907744c4551385737cf271764e3032e8765. Branch: local/strict-upgrades-20261112. No push, PR edit, merge, AI or spending.

## Batch 1: 38/67 strict, four more than the published stack

- RSA: public SPKI/JWK checks remain. Private two-prime JWK/unencrypted PKCS8 now receives n=p*q, distinct probable-prime factors (32 random Miller-Rabin rounds each), exponent inverse/CRT checks and actual RSA-OAEP roundtrip. Real 2048/4096-bit cases and tampered n/d/p/q/dp/dq/qi negatives pass. Private values never enter output. This does not certify entropy, mathematical primality, implementation side-channel safety or resistance to every attack. No production secrets used.
- Frame extraction: MP4/H.264 samples are demuxed, selected in presentation order and decoded by WebCodecs at an exact track timestamp. Explicit frame index, edit-list mapping and full-resolution PNG. Real first/B/last frames matched independent FFmpeg reference decodes with RGB MAE below 3/255; RGB color conversion is not byte-identical. CFR and VFR time/index mappings pass. Unsupported codecs, multiple video tracks/descriptions, rotation/non-square pixels, unusual edits, encryption and excessive sample windows fail closed.
- PDF metadata/history: preserved actual Prev-linked cross-reference sections are followed, with property snapshots/changes, revision byte boundaries, hashes and page counts. Standard table and stream fixtures pass; three real preserved revisions are displayed. Rewritten/deleted prior history cannot be recovered. Embedded dates and names remain unverified claims.
- PDF signatures: actual detached CMS integrity verification of supported SHA-256/384/512 signatures. A real OpenSSL-signed PDF passes, altered signed bytes fail, and an old valid signature after a later unsigned append is clearly limited to its earlier revision. No certificate trust/revocation, trusted timestamp, legal validity, full PAdES, DocMDP permission-policy or current-display authenticity verdict. Unsupported/malformed signatures are unverified.

## Validation

- Full Jest: 26 suites / 184 tests pass.
- Full real Chrome runner: all 48 original-data tool examples pass, plus new private RSA/negative CRT, exact AVC first/B/last versus independent FFmpeg, VFR mapping, actual uploaded tampered PDF and unsigned-append checks. Existing extended OCR/Office/media/timeline/visual-PDF checks remain passing.
- Screenshots captured and visually inspected: RSA private consistency output, exact B-frame index 5 at 0.416667 seconds, three preserved PDF revisions, invalid tampered CMS signature and valid old signature with coversCurrentFile=false.
- CMS dependencies isolated in scripts/cms-vendor-build to preserve existing certificate/QR/CID vendor bundles unchanged. PKIjs 3.3.3 and ASN1js 3.0.6 pinned, licenses/notices included, recursive vendor checksums refreshed. Isolated production audit: zero reported advisories at this checkpoint. This is not a repository-wide vulnerability clearance.
- Synthetic OpenSSL signing private key exists only in a temporary directory and is deleted after generating fixtures. Committed certificate is public only. Original fixtures and their generators are included.

Public Amoy reads, IPFS retrieval, full custody/provenance, live/native networking and AI scope are not newly credited by this batch. The 53 bounded implementation count is unchanged and is not the strict count.
