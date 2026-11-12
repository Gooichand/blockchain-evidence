# Contribution recheck,12 November2026

Local review only. No new push or PR. Network-category tools excluded. No production login, Supabase access, report migration or backend rollout.

## Checklist and current evidence

| Item | Local result | Still open |
| --- | --- | --- |
| SHA-256 Generator | Independent exact-byte/padding/binary tests, empty and50MiB boundary; browser digest/demo/input-preservation checks pass. Fixed obsolete rejected calculation overwriting restored inputs. | Real OS clipboard not validated in headless Chrome; API handler verified with controlled clipboard boundary. |
| Hash Comparison | All five digest lengths; match/mismatch/case/whitespace/invalid/mixed algorithms; browser result invalidation and demo input preservation pass. | No production pass claimed. |
| File Integrity Checker | Supplied baseline match, single-byte change mismatch, empty-file baseline, malformed baseline and browser demo/input preservation pass. | Baseline authenticity is the user's responsibility, not verified by this comparison. |
| Multi Hash Generator | MD5,SHA-1,SHA-256,SHA-384,SHA-512 independently checked across padding/binary cases; missing MD5 dependency fails; real browser five-digest output passes. | Weak-algorithm warning retained; no authenticity claim. |
| Blockchain Verification | Same-block contract checks, wrong-chain/config/RPC/index errors and synthetic UI positive/negative tests pass. Fixed acceptance of malformed successful responses lacking valid contract/block/evidence context. | No known public anchored sample. Live positive ANCHORED path remains unverified. Synthetic response tests do not close that gap. |
| Other owned non-Network tools |31selected suites/253tests pass;44real local desktop example workflows pass plus extended matrices. QR pixels inspected, PDF visual comparison inspected, two-source timeline correlation inspected. | Local fixture coverage is not universal format support or a new production result. |
| Analyst backend A1-A8 | Published PR385 remains open/unmerged at check time. Existing clean-candidate43suites/310tests and real disposable PostgreSQL/PostgREST evidence recorded separately. | Owner go-ahead, production duplicate inspection, service-role capability, approved migration/deployment and combined UI validation remain gates. No new access sought. |

The Hash workspace already bypasses the generic Under Development notice. No notice was removed from another tool and no tool was made complete merely by changing its label.

## Confirmed fixes

1. The Hash workspace success path rejected obsolete results, but its error path did not. Reproduced an old calculation error overwriting Return to my inputs in Chrome, then added the matching sequence guard and verified the regression no longer occurs.
2. The browser accepted9malformed/inconsistent successful blockchain responses. Added negative response tests first, observed9failures, then required a valid contract address, nonnegative safe-integer block number, and consistent positive evidence ID for an anchored result. Lookup digest/chain/status checks remain in place.

Changes are confined to the Hash workspace and its tests/harness/documentation. No wallet transaction, anchoring upload, network scanner, account change or paid service.

## Reproduction and interpretation

- `node scripts/test-hash-integrity-ui.cjs`: real local Chrome/browser engines on synthetic inputs. Uses a local503 API fixture, not live production/RPC. Clipboard OS access is controlled; digest handler is checked. Browser and server close at completion.
- Selected non-Network Jest files pass31suites/253tests. Network suites and mixed route suites are omitted from this broad recheck.
- Hash-focused non-Network subset passes4suites/105tests.
- Non-Network desktop harness run used the existing script with Network-category executions and PCAP-derived checks excluded in a temporary run-only copy.44example workflows passed. This filtered runner did not change committed Network code.
- Visual checks: local QR generator/decoder, identical-text/different-rendered-layout PDF comparison, and two-source timeline with10second candidate correlation. These do not prove code trust, certificate trust, verified handoffs or source truth.

## Remaining strict gaps

The repository's47/67strict count is a prior catalog capability baseline, not a new all-format proof. Do not increase it for this recheck. Earlier20unmet catalog promises remain: sensor/source attribution; broader double-JPEG validation; complete historical/legacy Office metadata; full concealed-text coverage; all-stream video validation; public IPFS gateway retrieval; complete custody/provenance records; universal EXIF/maker notes; verified custody handoffs; excluded Network live-native capabilities; and unavailable AI tools. No AI model substitution or paid service is included.

The5Hash tools are not declared fully closed because live positive anchoring remains unverified. Hold any new Hash PR until the five-tool completion bar is met and fresh publication approval is obtained.
