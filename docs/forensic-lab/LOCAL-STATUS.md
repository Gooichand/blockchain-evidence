# Local upgrade checkpoint, November 12 11:32 IST

Current local branch local/strict-upgrades-20261112 adds thirteen validated tools to the published stack: 47/67 strict, not 80%. See STRICT-UPGRADES-2026-11-12.md and strict-status.json. Published PR381-383 retain their original 34-tool checkpoint until separately approved publication.

RSA now checks supported private-key arithmetic/CRT/probable primes and an OAEP roundtrip. Frame extraction is exact for supported MP4/H.264 samples using WebCodecs. PDF metadata includes preserved incremental revisions. PDF signature verification now checks supported detached CMS signatures against signed bytes, NOT certificate trust/revocation/legal validity or later unsigned content.

Public DNS/reverse-DNS and registry RDAP (the current WHOIS successor) now work through an explicit authenticated read route. No scanning, raw-port WHOIS, DNSSEC or ownership verdict. Public Amoy tx/block/hash controller reads and multi-block local CAR/UnixFS verification also work; live IPFS gateway retrieval remains unconfirmed.

Audio fingerprinting now uses actual time-ordered spectral landmark hashes and consistent offset matching, with silence/simple-tone/repeated-content safeguards and real MP3/AAC/trim/gain/noise tests. It is a pairwise candidate match, not a unique identity/database/tamper verdict or a broad accuracy claim.

Clone Detection now groups nonlocal ORB feature correspondences by RANSAC homographies, with translated/rotated/scaled/recompressed fixtures and unique/flat negatives. Candidate repeated regions are not an edit verdict; natural repetitions can match. Classical features only, no trained model.

Keyframe Analysis now decodes/measures every supported MP4/H264 frame, groups GOPs and reports deterministic anomaly candidates. Timeline Viewer now uses all-frame visual-change measurements, exact segment-start thumbnails and near-black/low-change intervals. Neither provides semantic event understanding or authenticity; Video Inspector remains strictNo because audio/other streams and concealed corruption are not validated.

TLS Inspector now performs explicit public-port443 handshakes for certificate/chain/hostname/default-root/cipher/ALPN and TLS1.2/1.3 observations. Private/special-use IPs and mixed DNS answers blocked; same validated IP pinned. Real valid/wrong-host/expired cases pass. No full cipher/vulnerability/revocation scan.

Concealed-text precision now uses actual graphics-state/rendered-white-region measurements, including white-on-dark negatives. Hidden Text remainsNo for complex/unmapped/extraction-omitted content. JPEG compression analysis now uses original quantized AC histograms and narrow aligned lattice candidates; it remainsNo because five genuine doubles are known misses and no independent photo benchmark exists. No new strict credit for these two improvements.

## Validation and delivery state

36suites239tests pass. All48actual Chrome examples pass, plus extended RSA/PDF/exact-frame/all-frame/acoustic/clone/concealed/JPEG matrices. Real external Amoy, DNS/RDAP and TLS checks have separate recorded evidence. Public IPFS gateway recheck11:31IST returned526, so retrieval is still unconfirmed. No private upload,AI,paid service,push,PRedit or deployment.

Current local source is on local/strict-upgrades-20261112, not the deployed website. Published PR381-383 are still the earlier34/67 checkpoint. Local QA does not prove production auth/configuration or browser support on every device.

Earlier implementation claims are retained separately in ARCHIVED-LOCAL-STATUS-2026-11-12.md, clearly historical, so they cannot be mistaken for current limitations. Remaining strictNo tools and dependencies are listed in REMAINING-TOOLS-2026-11-12.md.

JPEG coefficient limits now reject invalid/9MP input before browser pixel-preview allocation; actual worker/preview-interception negatives pass. Strict count unchanged.

Local-only post-PR384 hardening: vendor manifest now covers227assets (two JPEG records added), with a permanent exact recursive checksum/size/coverage regression. PublishedPR384 retains35suites238tests; this newer localtree has36suites239tests and is not pushed. No browser/executable change.
