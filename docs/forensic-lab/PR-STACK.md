# Three-part review order

All changes start from main ce120516550087871ec5994ae0076c55fae1bf65. Preserve its PR380 dashboard/controller fixes.

1. review/01-visual-document-foundation -> main: shared parser/build/CSP/UI foundation, Hash examples, Image, Document, Video.
2. review/02-evidence-analysis-tools -> review/01-visual-document-foundation: Audio, read-only Blockchain, Crypto, Metadata, Timeline, Utilities.
3. review/03-networking-status-qa -> review/02-evidence-analysis-tools: offline Networking/TLS, AI-unavailable states and combined validation/status ledger.

Review and merge in order. Do not merge part 2 or 3 independently into main. After merging a base, retarget the next PR to main and inspect the diff before merge. Gopi owns merges. No automatic merge.

Shared vendor assets, including later groups' parser dependencies, are intentionally in part 1 so later PRs do not duplicate or replace the CSP/build/manifest foundation. Final category scripts contain all tested support fixes, not stale earlier tips. Desktop runner is scoped to the installed categories in each part; part 3 restores the full combined regression runner.

## Validation after integration with main ce12051

- Part 1: 16 suites / 107 tests; 19 real Chrome examples plus extra media, scanned-PDF, Office safety and PDF object/visual checks.
- Part 2: 22 suites / 143 tests; 44 real Chrome examples plus extra formats/parser/signing checks; real local-EVM deployment/store/seal/read pass.
- Part 3 / combined: 25 suites / 159 tests; 48 real Chrome examples plus the full extended regression checks.

The earlier overnight snapshot's 24 suites / 155 tests predates integrating main's four newer PR380 regression tests. No tests were removed from the combined result. The PCAP chronology unit test is introduced with part 3, where its capture parser and fixture exist. Part 1 and 2 runners deliberately cover only their installed categories.

The combined source tree matches the previously tested current-main integration (dc9e13e), apart from this review-order/validation note. Shared vendor assets total 26,071,868 bytes (26.1 MB / 24.9 MiB); this is not the initial page-transfer size.
