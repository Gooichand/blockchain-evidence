<div align="center">
  <img src="assets/hero.svg" alt="Evidence storage, delivery, signatures and verification layers" width="100%">
  <h1>EVID-DGC</h1>
  <p>Digital evidence management and bounded local forensic tools.</p>
</div>

> Testnet project, not a production-evidence certification. Blockchain operations target Polygon Amoy (chain 80002). The contract is unaudited. File hashes, editable metadata, imported custody claims and a successful tool run do not establish source authenticity, legal validity or complete custody.

## Current scope

The application has role-based dashboards, case/evidence workflows, uploads, IPFS storage integration, optional testnet anchoring and a browser forensic workbench. Most workbench operations process files locally. Read-only blockchain tools send digests or lookup identifiers to the configured server; they do not need to upload the file or sign a transaction.

The catalog has 67 entries. The recorded strict-capability baseline is 49/67, with 18 original promises still unmet; this is not a guarantee across all files or a new production check. Under the current no-Network work scope, 8 Network entries are excluded, leaving a 45/59 non-Network ledger baseline. See [the capability ledger](docs/forensic-lab/strict-status.json) and [remaining scope](docs/forensic-lab/REMAINING-TOOLS-2026-11-14.md). Dated reports may describe earlier local/publication states; prefer their stated timestamp and current branch state over an old headline count.

### Hash & Integrity

- SHA-256 Generator: actual file-byte digest using browser Web Crypto, up to 50 MiB.
- Hash Comparison: complete same-algorithm hexadecimal hashes, with explicit match/mismatch/invalid-input outcomes.
- File Integrity Checker: file SHA-256 compared with a supplied baseline. Baseline trust is not verified.
- Multi Hash Generator: MD5, SHA-1, SHA-256, SHA-384, SHA-512. MD5/SHA-1 are for legacy compatibility, not sole authenticity proof.
- Blockchain Verification: read-only configured Amoy contract lookup at a reported block. NOT FOUND differs from unavailable. A known public positive anchored sample remains unverified in the current recheck.

### Other local workbench capabilities

Image measurements, supported PDF/text/OCR analysis, bounded video/frame checks, waveform/spectrogram/audio fingerprints, cryptography helpers, supported metadata extraction, imported timelines and utilities have actual local implementations. Each tool's guide states its limits. Examples use bundled synthetic/original fixtures and preserve the Evidence Vault input; example output is not an analysis of the user's selected evidence.

Important limits include partial concealed-text coverage, synthetic/format-bounded compression tests, editable metadata and incomplete historical extraction, unsupported video streams, unverified custody claims and unavailable AI dependencies. PDF signature checks cover supported signed byte ranges, not certificate trust, revocation or legal admissibility. PDF visual comparison is separate from text equality. Timeline correlation is a deterministic candidate rule, not proof of causality. Do not remove an unfinished tool's warning to manufacture completion.

## Branch and rollout status

Analyst backend PR #385, legacy evidence/case lookup fix #386 and Analyst UI PR #387 are merged in main at `041b0ef`. This local quality branch is rebased onto that main revision. These changes include atomic report lifecycle transitions/revisions, versioned report digests, bounded dashboard states, assigned inventory paging, assignment-scoped snapshot PDFs and paged Queue/Reports UI with report-editor safety. A read-only live dashboard check returned successful evidence/cases/stats responses; the exact Render deployment revision and a full integrated production workflow were not verified.

Any future rollout requires separate approval and combined UI/backend validation. Do not rerun the SQL migration or deploy controllers alone. A review PR is not permission to merge or change production. Snapshot digests identify attached JSON content, not PDF bytes; PDFs are unsigned.

## Architecture

- `server.js`: Express 5, middleware and route registration.
- `routes/`, `controllers/`: authentication, roles and application APIs. Consult actual routers rather than stale endpoint counts.
- `services/integratedEvidenceService.js`: exact-byte SHA-256, metadata, IPFS/chain attempts and database persistence.
- `services/storage/`: IPFS pin/fetch helpers.
- `contracts/`: EvidenceStorage source/ABI. Stored and sealed records do not by themselves represent a full custody-transfer history.
- `public/`: role dashboards, local workbench engines, bundled workers/libraries and examples.
- `tests/`, `scripts/`: unit/route tests and local browser/SQL fixture harnesses.
- `migrations/`: schema scripts requiring individual review, not a blanket safe install sequence.

Upload storage/anchoring failures can produce a stored evidence row with warnings. That is a deliberate behavior to review, not a guarantee every upload is pinned or anchored. The local failure investigation includes resumable-upload concurrency, strict identifiers and retry-queue error handling; see [the local QA proposal](docs/qa/LOCAL-CI-PROPOSAL.md). Live retry execution and storage durability are not proven by a queue insert.

## Local setup

Requires Node `^20.19.0 || >=22.0.0` from package.json and npm.

```sh
npm ci
cp .env.example .env
# Fill private local development values outside version control.
npm start
```

The backend exits without `SUPABASE_URL` and `SUPABASE_KEY`; sessions require `JWT_SECRET`. The database key's role and privileges must match the actual backend/schema requirements. Never expose a privileged database key to browser code. Optional chain/storage operations require their own configuration. The read-only verification service does not construct a wallet; signing upload/anchor operations are separate and must not be invoked by a no-spend local test.

Use an isolated local/test database with synthetic users/data. `complete-database-setup-fixed.sql` is destructive: it drops tables. Do not point it at valuable data, and do not apply every migration blindly. Review the schema and access policy with its owner. Neither this README nor a test pass approves production access, migrations, cleanup or deployment.

## Tests and evidence

```sh
# Existing repository unit suite; includes mixed Network-related suites.
npm test -- --runInBand

# Maintained local scope excluding Network and mixed-route/PCAP suites.
node scripts/test-nonnetwork-unit.cjs

# Local Chrome required; synthetic identity/files, no live backend proof.
CHROME_PATH=/path/to/chrome node scripts/test-hash-integrity-ui.cjs
CHROME_PATH=/path/to/chrome SCREENSHOT_DIR=/tmp/be-results node scripts/test-nonnetwork-desktop.cjs
```

The non-Network runner includes upload failure and concurrency regressions. The local quality checkpoint records 43 suites / 371 tests passing after rebasing onto merged main, plus 44 real browser example workflows. These are synthetic/local results, not proof of production behavior. Do not silently omit future failures to publish a green badge.

An earlier non-Network contribution recheck recorded 31 suites/253 tests and 44 real local browser workflows, plus extended fixtures. Those counts describe that dated run, not every future branch state. New tests can change counts or reveal failures. The Hash clipboard handler uses a controlled OS boundary; native desktop clipboard remains unverified. No live positive anchored sample, production-data cleanliness or complete production end-to-end pass is claimed.

There is currently no active test-CI workflow in `.github/workflows`; the old CI badge/link was stale. Existing workflows keep a service awake or regenerate diagrams, not run the complete regression suite. [CI proposal](docs/qa/LOCAL-CI-PROPOSAL.md) is inactive and needs review, action pinning and publication approval. Test fixtures/SQL must never be run against production. Visual artifacts must be inspected, not counted passed merely because export succeeded.

## Security and deployment boundaries

Authentication, role scoping, signature middleware, rate limits, schema/RLS and secret handling need independent review. Existing comments or documentation are not proof that each boundary is safe. Login changes are deferred; this branch does not change login behavior. Do not use real account impersonation or unauthorized production probing to validate source findings.

`render.yaml` describes a service configuration, not proof that the current schema, dependencies or credentials are correct. Inspect actual runtime settings without logging secrets before any separately approved deployment. Local fixtures cannot establish production permissions, external-service reliability, public contract state or historical duplicate data.

## Documentation

- [Local contribution recheck](docs/forensic-lab/CONTRIBUTION-RECHECK-2026-11-12.md)
- [Strict capability ledger](docs/forensic-lab/strict-status.json)
- [Remaining tool scope](docs/forensic-lab/REMAINING-TOOLS-2026-11-14.md)
- [Local runner and inactive CI proposal](docs/qa/LOCAL-CI-PROPOSAL.md)
- [Developer guide](docs/DEVELOPER_GUIDE.md), [security notes](docs/SECURITY.md), [deployment guide](docs/DEPLOYMENT.md)

Some older guides/figures contain historical counts or setup assumptions. Check the source and current schema before relying on them. This README deliberately avoids static endpoint, migration and suite counts as promises.

## License

Apache-2.0, see [LICENSE](LICENSE). Contract source carries its own SPDX header.

## Current verification limits

Login/auth changes are out of scope and deferred. Passing local tests are not an authentication-safety claim. Report/UI fixture checks, isolated backend/database checks and a read-only live dashboard check are separate evidence, not one full browser-to-database end-to-end test.
