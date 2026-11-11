# Local upgrade checkpoint, November 12 02:47 IST

Current local branch local/strict-upgrades-20261112 adds eight validated tools to the published stack: 42/67 strict, not 80%. See STRICT-UPGRADES-2026-11-12.md and strict-status.json. Published PR381-383 retain their original 34-tool checkpoint until separately approved publication.

RSA now checks supported private-key arithmetic/CRT/probable primes and an OAEP roundtrip. Frame extraction is exact for supported MP4/H.264 samples using WebCodecs. PDF metadata includes preserved incremental revisions. PDF signature verification now checks supported detached CMS signatures against signed bytes, NOT certificate trust/revocation/legal validity or later unsigned content.

Public DNS/reverse-DNS and registry RDAP (the current WHOIS successor) now work through an explicit authenticated read route. No scanning, raw-port WHOIS, DNSSEC or ownership verdict. Public Amoy tx/block/hash controller reads and multi-block local CAR/UnixFS verification also work; live IPFS gateway retrieval remains unconfirmed.

The following is the earlier overnight scope record, not current capability truth. Statements about approximate-only extraction, marker-only PDF signatures, property-only PDF metadata, local-only blockchain, raw-only IPFS and unavailable DNS/registration are superseded by the upgrade checkpoints above and STRICT-UPGRADES-2026-11-12.md; other limits remain.

# Desktop forensic lab: local implementation status

No result is a general authenticity or legal-admissibility verdict. All new examples use original synthetic material and call the actual tools. Processing is local except explicitly labeled read-only Amoy lookups. No mobile tests, paid services or uploads to external AI. The November 12 extension adds offline Networking only; no live capture, scans or sockets. See OVERNIGHT-2026-11-12.md for the latest validation checkpoint.

## Implemented, bounded and locally tested

- Image: eight measured tools (JPEG ELA, exact fixed-grid repeats, local residuals, metadata, RGB histogram, JPEG tables, RGB channels, Sobel edges). No general clone search, camera attribution or double-compression verdict.
- Document: PDF object/reference/stream inventory and text/properties, PDF and DOCX/XLSX/PPTX properties/embedded DOCX revisions, English PNG/JPEG/scanned-PDF OCR, white/invisible text signals, PDF signature marker inventory, TXT/PDF text comparison plus rendered-page PDF visual comparison. Signature markers are NOT cryptographic validation, trust or revocation checks.
- Video: MediaInfo container/codec/track metadata, MP4 tracks, approximate seek-frame extraction, six sampled thumbnails, MP4 sync flags, top-level MP4 box bounds. Not all-frame integrity, scene-change detection or frame-exact extraction. Track composition timestamps do not apply movie edit lists.
- Audio: zoomable first-30-second waveform and FFT spectrum, original MediaInfo metadata/WAV fmt, coarse 32-band spectral comparison. The comparison is NOT a unique acoustic fingerprint or identity match.
- Cryptography: raw AES key length/import/pattern checks plus AES-256-GCM demonstration envelope (secret key included, not secure storage), public RSA JWK/SPKI arithmetic/import checks and fingerprint, unverified JWT decode, X.509 ordered chain signature checks (not trust-path/root/revocation validation), ECDSA P-256 ephemeral signing and detached signature verification (not identity verification).
- Metadata: embedded EXIF, GPS and camera fields, DOCX/XLSX/PPTX properties/embedded DOCX revision claims, PDF properties. All embedded fields are editable claims; GPS is not live location.
- Timeline: imported JSON views with explicit time offsets; Investigation Timeline supports multi-file source hashing and exact evidence-ID/time-window correlation candidates. No inferred events, verified handoffs or automated missing-custody detection.
- Utilities: UTF-8 Base64, URL component encoding, bounded hex preview, UUID v4, explicit-unit timestamps, QR generation and image QR decoding. QR content is displayed as text and never opened.

## Live-dependent, not confirmed end-to-end here

Blockchain category has authenticated read-only Amoy receipt, block, evidence hash/record and recent Stored/Sealed-event routes. Unit tests exercise success/failure branches. The local environment cannot resolve the configured public Amoy RPC, so live operation remains unconfirmed and status stays amber until an actual successful read. Recent events cover 2000 blocks / 200 logs, not a complete custody chain. One local IPFS raw-block tool is tested: CIDv1 raw codec / SHA-256 file hash verification and bounded text/hex preview. It does not retrieve gateways or support DAG-PB, multi-block UnixFS files, directories or pin status.

## Skipped capabilities

Image AI detector and all four AI Assistant entries have no validated model. They stay explicitly unavailable with no simulated output. PDF cryptographic signature/certificate validation is not implemented by the Document tool. Full acoustic fingerprint identification, full legal provenance and verified custody transfer chains are not implemented. Networking supports bounded offline PCAP/PCAPNG, standard/custom fixed-offset protocol decoding and flow/candidate-rule analysis. Offline TLS Hello fields and supplied certificate-chain signatures are also implemented. Live capture, scans, DNS/WHOIS, traceroute, sockets and live authenticated TLS configuration inspection remain unavailable.

## Dependencies

Vendored dependencies carry licenses/notices. PDF.js 4.10.38 is used with dynamic evaluation disabled; English OCR uses a local Tesseract engine/model. The CSP adds only wasm-unsafe-eval for OCR, self workers, and blob media for local video. New crypto and QR parser bundles are local. Dependency advisory checks are a snapshot, not a security guarantee for the repository.

## Validation

Run `npm test -- --runInBand` for unit and existing regression tests. The desktop smoke runner documented alongside this file uses installed Chrome and performs real parsing/decoding/crypto. Backend RPC unit tests use mocks. A separate real in-memory EVM deployment/storage/sealing check also passes, but neither is public-chain proof. Local UI fixtures do not establish that a production deployment has been updated.
