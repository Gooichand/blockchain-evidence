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

## Batch 2: 41/67 strict, three more public-read tools

Actual current repository controllers were bundled with a read-only ethers public-RPC adapter and executed against https://polygon-amoy-bor-rpc.publicnode.com at 02:21 IST on November 12. This is not a claim that the deployed authenticated website has these unpublished changes. The archived public JSON is PUBLIC-AMOY-CHECK-2026-11-12.json. No wallet, private key, spend, transaction submission or deployment was involved.

- Transaction Verification: genuine receipt for transaction 0x0d4d9667d1fd5c2b31c4daeb684e1b6105e87fc5b782ab16b01bc9f6d34424ff matched block 52607676/hash 0x6608c66533de25d2183885f994e136b85d1345dad4c5e448472f1585dd430969. Its successful execution is NOT an evidence-anchoring claim.
- Block Explorer: actual block 52607676, two transaction hashes, chain 80002, timestamp and point-in-time confirmations returned by the actual controller.
- Evidence Verification: known public synthetic digest 111...111 matched evidence ID1 at block52607678; zero digest was absent. A real compatibility bug was found and fixed: the deployed old contract indexes that record's SHA-256 string with a 0x prefix, while the newer input normalizes to bare hex. Both variants are now checked at the same block, the stored digest is normalized/cross-checked, and conflicting IDs fail closed. This is not proof of authenticity, physical custody or admissibility.

Public RPCs can deny a particular runtime/network. The old example RPC hostname did not resolve from the local runner; dRPC/PublicNode returned403 to its non-browser HTTP client. PublicNode responded successfully from the independent browser network. No paid API or secret was used. Source endpoints were grounded from https://docs.polygon.technology/pos/reference/rpc-endpoints and https://onfinality.io/en/rpc-assistant/polygon-amoy-testnet; the provider page resolved as https://polygon.publicnode.com/?amoy.

IPFS improvement is deliberately NOT another strict count: local multi-block UnixFS CAR reconstruction, every-block CID verification, directories, duplicate handling, untrusted previews and exact reconstructed bytes pass. A fixed-origin, authenticated, rate-limited, size/time-limited gateway route has no arbitrary URL/redirect/authentication/pinning/upload capability. Public IPFS.io/dweb.link CAR requests redirect to trustless-gateway.link; both independent public example CIDs timed out there. So live retrieval remains unconfirmed. Local examples never pretend to be retrieved/pinned objects. The default UI is local CAR verification and public mode discloses the CID only after the user clicks Run.

Gateway semantics were checked against https://docs.ipfs.tech/reference/http/gateway/ and https://specs.ipfs.tech/http-gateways/trustless-gateway/. CAR header roots are treated as hints, not authority; the actually requested CID and every traversed block/link are verified. Duplicate blocks are accepted after hash verification. Missing linked blocks and changed bytes fail. No symlink opening or content execution. Isolated IPFS dependencies/licenses/notices are pinned separately; production audit reports zero advisories at this checkpoint, not a whole-repository clearance.

Full suite: 28 suites /194 tests pass; all48 real desktop examples plus the existing extended tests pass. Updated real local-EVM deployment/store/seal/read tests pass after the legacy hash fix. Public Amoy test-evidence image and the actual local UnixFS UI were visually inspected. Strict count41/67=61.2%, bounded count53 unchanged. Existing PR381-383 remain untouched at their approved34-tool checkpoint.


## Batch 3: live public DNS and registration reads

Strict checkpoint: 42/67 locally, eight additions to the published 34-tool stack. No push or production deployment.

- Exact catalog promise: resolve domains, reverse DNS and WHOIS records. RDAP is the supported current replacement for public gTLD WHOIS, not a claim to recover private/redacted registration details. ICANN sunset notice: https://www.icann.org/en/announcements/details/icann-update-launching-rdap-sunsetting-whois-27-01-2025-en .
- Server Resolver performs A/AAAA/MX/NS/TXT/SOA/CAA and IPv4/IPv6 PTR; no connection to the queried host, port scanning, packet capture, DNSSEC validation or ownership verdict. Per-type ENODATA/errors stay explicit.
- Static official IANA HTTPS bootstrap snapshot: https://data.iana.org/rdap/dns.json , publication2026-10-28T22:00:04Z. Sources and refresh requirements preserved in data/README.md. Only an IANA-listed HTTPS origin and normalized domain path are used; redirects disabled, 7-second timeout, 1MiB JSON cap, exact returned-domain cross-check. Stale/unsupported endpoints return errors, not fabricated WHOIS.
- Authenticated /api/network/dns?query= route, 5/minute limit, no-store response. Private/special-use IPs, local names, URLs, unusual numeric-IP spellings and path/query injection rejected. RDAP data is rendered inert as text.
- Example uses an actual public example.com lookup; preserves typed query and Evidence Vault. Explicitly discloses that only the requested query goes to server resolver/registry. No automatic query on page load.
- Real local service and actual UI read example.com DNS and https://rdap.verisign.com/com/v1/domain/example.com successfully; public IPv4 and IPv6 Google-DNS PTR each returned dns.google. Screenshots label the local QA HTTP adapter honestly. Separate actual middleware tests cover anonymous denial and authenticated bad-input rejection. This does not establish deployed production UI/auth availability.
- 29 suites/202 tests pass; 48 Chrome examples plus extended checks and actual live domain/PTR UI checks pass. Focused lint clean. Raw public source results are in PUBLIC-DNS-CHECK-2026-11-12.json.
