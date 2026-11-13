# Local project quality checkpoint: 13 November 2026

Branch: review/local-project-quality-20261113, based on unpublished Hash recheck 42d168b. Local only. No push, PR, login/auth change, Network tool work, Supabase access, migration or rollout.

## Upload/recovery fixes

The first 25 regression tests exposed ten failing assertions. Narrow local fixes now:

- Reject suffix, decimal, negative, zero, out-of-range and array case IDs before any storage pipeline call. Accept ordinary positive integer string/number IDs.
- Return 503 without side effects if duplicate lookup returns an error or an unusable result, instead of treating it as no duplicate.
- Serialize chunk saves and assembly per session inside this Node process, reread fresh session metadata and use unique temporary names. Concurrent distinct chunks preserve both receipts; same-chunk retries do not collide. Completed sessions reject stale chunk writes.
- Inspect returned retry-queue errors and thrown errors, add a safe RETRY_QUEUE_FAILED warning, and remove the promise that anchoring will automatically succeed. No actual retry, queue consumer or chain action was added.

The lock is not distributed. Multiple Node processes sharing an upload volume still need shared coordination. It does not make upload-to-evidence completion globally exactly-once or eliminate database duplicate-insert races. Queue insertion is not proof of eventual recovery; no consumer was found in searched services/scripts, but an external job was not ruled out.

Upload subset now has 31 tests, all passing. Files and owners are synthetic; storage/chain/database calls are stubs except the actual disposable filesystem session tests. Covers exact-byte sequential assembly, concurrency, failed-operation lock release, duplicate/ID guards, expiration, missing chunks, metadata/IPFS/chain/database failures and safe queue warnings. No live upload or production-data result is claimed.

## Test runner and inactive CI proposal

Added maintained scripts/test-nonnetwork-unit.cjs with explicit exclusions and a source-token guard against newly mixed Network suites. Added scripts/test-nonnetwork-desktop.cjs so no temporary source filtering is needed. It runs real browser examples on localhost with synthetic identity/files and no successful live API responses. The Hash UI runner now accepts CHROME_PATH. No dependency/lock change.

Final local unit run: 35 suites, 299 tests, all passing. Final desktop run: 44 real example workflows plus extended matrices, passing. These counts describe this branch/run, not production readiness. Original unfiltered tests include excluded Network/mixed suites and were not run under this assignment.

CI is a proposal under docs/qa only, not an active workflow. Immutable action SHAs, browser install, ignored native install scripts and artifact retention need review before activation. No hosted CI run is claimed.

## README

Removed stale CI badge and old claims of only SHA-256 working, three suites/17 tests and no MFA code. Grounded capabilities in source paths and bounded tests. Separated merged main, unpublished local work and unmerged backend PR #385. Rendered and visually inspected top/test sections. No assets changed. Existing authentication code is not a proof of safe authentication; login work remains deferred.

## Negative fixtures

Added 12 metadata tests for invalid/missing GPS, zero and boundary coordinates, camera field allowlist, unsupported names and size cap. Added three concealed-text cases for graphics-state restoration, operator limits and a visible black-text negative. The two unit suites contain 19 passing tests.

New real-browser generator makes a four-page synthetic PDF. Visible black text and white-on-dark text have no false candidates. Overpainted and fully clipped text also have no candidates: these are two confirmed detection limitations, not successes. The rendered pixels show the visible text and the blank concealed pages. Actual Office ZIP/XML fixtures reject entity declarations, malformed XML and oversized properties.

These results do not close universal concealed-text detection, editable metadata authenticity, certificate trust, complete custody, native clipboard or a public positive anchored sample. PR #385 remains a separate held backend review; no merge or rollout is implied.
