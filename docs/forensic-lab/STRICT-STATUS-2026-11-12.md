# Strict tool status, November 12 local checkpoint

47 yes / 67 catalog tools. Updated after local upgrade batch 7; the published PR381-383 stack remains the earlier 34-tool checkpoint. A no can still have useful bounded behavior. These are not authenticity or legal-admissibility verdicts. Normal file/size/format limits remain in every guide. No count credit for renaming a partial tool.

Hash > Blockchain Verification is yes based on the user's original Nov11 15:54:46 IST report of successful live read-only Amoy/contract availability. The health check reads chain/block/contract and verification interfaces. This does not prove any particular evidence hash is anchored. Batch 2 adds public read-only confirmation for transaction, block and hash lookup controllers. Custody/provenance promises remain incomplete; IPFS gateway retrieval remains unconfirmed.

52 bounded local desktop implementations = 48 new original-data examples plus 4 old local Hash tools. Add the old user-confirmed live Hash lookup for 53 bounded implementations, NOT 53 complete tools. All five newer Blockchain reads have local-EVM tests. Transaction, block and hash lookup controllers now also have public-Amoy read checks; custody and provenance remain local-only and incomplete.

| Category | Original catalog tool | Strict yes/no | Reason / limits |
|---|---|---|---|
| Hash & Integrity | SHA-256 Generator | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Hash & Integrity | Hash Comparison | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Hash & Integrity | File Integrity Checker | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Hash & Integrity | Blockchain Verification | Yes | User confirmed live read-only Amoy lookup availability Nov11 15:54:46 IST; not proof that a supplied hash is anchored. |
| Hash & Integrity | Multi Hash Generator | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Image Forensics | Error Level Analysis | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Image Forensics | Clone Detection | Yes | Actual nonlocal ORB/Hamming correspondences and homography RANSAC groups in a CSP-safe local worker. Off-grid translation, rotation/scale and JPEG-recompression positives; unique/flat negatives pass. Candidate repeated regions, not edit/authenticity proof; natural repetitions can match and low texture/heavy changes can be missed. |
| Image Forensics | Noise Analysis | No | Residual visualization, no sensor/camera attribution. |
| Image Forensics | Metadata Viewer | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Image Forensics | Histogram Analysis | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Image Forensics | Compression Analysis | No | JPEG tables only, no double-compression detection. |
| Image Forensics | Color Channel Analysis | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Image Forensics | Edge Detection | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Image Forensics | AI Tampering Detection | No | No validated model; no result fabricated. |
| Document Forensics | PDF Inspector | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Document Forensics | Metadata Viewer | No | Modern properties/embedded DOCX revisions; no full history or legacy formats. |
| Document Forensics | OCR Engine | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Document Forensics | Hidden Text Detector | No | Actual invisible/opacity and rendered-white-region signals with white-on-dark negative; complex clipping/overpainting/masks/Type3/unmatched/extraction-omitted text still incomplete. No extra strict credit. |
| Document Forensics | Signature Verification | Yes | Real detached CMS signed-byte verification for supported SHA-256/384/512 PDF signatures, tamper failures and older signed-revision/unsigned-append distinction. No trust/revocation/timestamp/permission-policy or legal-validity claim. |
| Document Forensics | Document Comparison | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Video Forensics | Metadata Viewer | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Video Forensics | Frame Extraction | Yes | Exact MP4/H.264 WebCodecs sample extraction with presentation index/PTS/edit adjustment; real B-frame/CFR/VFR checks and independent FFmpeg pixel comparison. Unsupported codecs/edits/rotations fail closed; browser color conversion differs. |
| Video Forensics | Timeline Viewer | Yes | All supported H264 frames measured with visual-change segment boundaries, exact segment-start thumbnails and near-black/low-change intervals. Real three-cut/black/freeze fixtures pass; no semantic event, completeness or authenticity claim. MP4/H2641-2000frames only. |
| Video Forensics | Keyframe Analysis | Yes | All supported H264 frames decoded and measured, grouped into GOPs with sync thumbnails, deterministic timing/GOP/visual-change/black/low-change candidates. Bframes/VFR counts/timestamps independently match ffprobe. Candidate anomalies, not edit/authenticity proof; audio/other streams not validated. |
| Video Forensics | Video Inspector | No | MP4 structure only, no all-stream/all-frame integrity validation. |
| Audio Forensics | Waveform Viewer | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Audio Forensics | Spectrogram | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Audio Forensics | Metadata Viewer | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Audio Forensics | Audio Fingerprinting | Yes | Actual time-ordered spectral landmark hashes and offset voting in a bounded local worker. WAV/gain/noise, trimmed MP3 and resampled AAC positives, reordered/different/repeated/simple-tone/silence negatives or inconclusives tested. Pairwise candidate acoustic correspondence, no unique identity/database/tamper or broad real-world accuracy claim. |
| Blockchain | Transaction Verification | Yes | Actual repository receipt/block controller passed public Amoy read-only RPC checks Nov12 02:21 IST and real local-EVM positive/negative tests. Receipt/block hashes agree; execution is not evidence anchoring. Not yet published/deployed. |
| Blockchain | Evidence Verification | Yes | Actual hash controller passed public Amoy present/absent tests Nov12 02:21 IST, including legacy 0x-prefixed SHA-256 index; cross-checks stored record at same block and rejects conflicting indexes. Anchoring is not authenticity/legal provenance. Not yet published/deployed. |
| Blockchain | Block Explorer | Yes | Actual repository block/confirmation controller passed public Amoy read-only RPC check at block 52607676 Nov12 02:21 IST. First 100 transaction hashes, chain80002 only; reorgs possible. Not yet published/deployed. |
| Blockchain | IPFS Viewer | No | Multi-block CAR/UnixFS verification now works locally; live gateway retrieval remains unconfirmed. |
| Blockchain | Chain of Custody | No | Real local-EVM tested; public Amoy not confirmed, no complete custody/provenance history. |
| Blockchain | Evidence Provenance | No | Real local-EVM tested; public Amoy not confirmed, no complete custody/provenance history. |
| Cryptography | AES Analysis | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Cryptography | RSA Analysis | Yes | Public RSA checks plus two-prime private JWK/PKCS8 arithmetic, 32-round probable-prime checks, CRT consistency and actual OAEP roundtrip; tested 2048/4096 bits. Not randomness/security certification. |
| Cryptography | JWT Decoder | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Cryptography | Certificate Viewer | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Cryptography | Digital Signature | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Metadata | EXIF Viewer | No | Supported embedded tags only, not universal full-format extraction. |
| Metadata | GPS Viewer | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Metadata | Camera Information | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Metadata | Office Metadata | No | Modern properties and embedded DOCX revisions; no complete Office history/legacy formats. |
| Metadata | PDF Metadata | Yes | Current properties plus preserved Prev-linked incremental revision snapshots/property changes and hashes, including standard xref tables/streams. Rewritten-away history is not recovered; author/date claims remain unverified. |
| Timeline | Evidence Timeline | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Timeline | Investigation Timeline | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Timeline | Chain of Custody Timeline | No | Imported claims, no verified signed handoffs. |
| Utilities | Base64 | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Utilities | URL Encoder | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Utilities | Hex Viewer | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Utilities | UUID Generator | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Utilities | Timestamp Converter | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Utilities | QR Generator | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Utilities | QR Scanner | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Networking Tools | PCAP Analyzer | No | Offline PCAP/PCAPNG parsing; no live capture. |
| Networking Tools | Port Scanner | No | No live/native execution service. |
| Networking Tools | DNS / WHOIS Lookup | Yes | Live A/AAAA/MX/NS/TXT/SOA/CAA and public IPv4/IPv6 PTR plus IANA-bootstrapped HTTPS RDAP registration reads. Actual example.com registry and dns.google PTR checks passed Nov12 02:45-02:47 IST. RDAP replaces legacy WHOIS; no DNSSEC, private registration data or ownership claim. Not deployed. |
| Networking Tools | Traceroute / Path Analysis | No | No live/native execution service. |
| Networking Tools | Connection Monitor | No | No live/native execution service. |
| Networking Tools | SSL/TLS Inspector | Yes | Actual fixed-port public TLS handshakes inspect peer certificate chain/signatures, Node-default-root authorization, hostname/validity, negotiated cipher/ALPN and TLS1.2/1.3 attempts. Real example.com positive and wrong-host/expired negatives pass. Not revocation, full cipher/vulnerability scan or browser trust. Private DNS answers blocked/pinned. |
| Networking Tools | Traffic Flow Analysis | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| Networking Tools | Protocol Decoder | Yes | Working within stated formats/limits; see tool guide and overnight validation notes. |
| AI Assistant | AI Investigation Assistant | No | No validated model; no result fabricated. |
| AI Assistant | AI Evidence Summary | No | No validated model; no result fabricated. |
| AI Assistant | AI Report Generator | No | No validated model; no result fabricated. |
| AI Assistant | AI Tampering Detection | No | No validated model; no result fabricated. |
