# Three-part review order

All changes start from main ce120516550087871ec5994ae0076c55fae1bf65. Preserve its PR380 dashboard/controller fixes.

1. review/01-visual-document-foundation -> main: shared parser/build/CSP/UI foundation, Hash examples, Image, Document, Video.
2. review/02-evidence-analysis-tools -> review/01-visual-document-foundation: Audio, read-only Blockchain, Crypto, Metadata, Timeline, Utilities.
3. review/03-networking-status-qa -> review/02-evidence-analysis-tools: offline Networking/TLS, AI-unavailable states and combined validation/status ledger.

Review and merge in order. Do not merge part 2 or 3 independently into main. After merging a base, retarget the next PR to main and inspect the diff before merge. Gopi owns merges. No automatic merge.

Shared vendor assets, including later groups' parser dependencies, are intentionally in part 1 so later PRs do not duplicate or replace the CSP/build/manifest foundation. Final category scripts contain all tested support fixes, not stale earlier tips. Desktop runner is scoped to the installed categories in each part; part 3 restores the full combined regression runner.
