# IPFS Viewer public gateway confirmation, November 14

Branch: review/ipfs-public-gateway-20261114, on merged main `43da534`. Local only; no production deployment, upload, pinning, wallet or credentials.

## What changed

- Added a second fixed public gateway, 4everland.io, used in subdomain form `https://<cid>.ipfs.4everland.io/?format=car&dag-scope=all`. Subdomain CIDs must fit one DNS label (63 base32 characters); longer CIDs are rejected before any request. trustless-gateway.link remains offered unchanged.
- Same fixed-template security posture as before: allowlisted operators only, no arbitrary URLs, redirects disabled, no credentials, 10 MiB / 15 s caps, non-CAR responses rejected. The signed-in rate-limited route is unchanged.
- The UI gateway selector lists both operators, and the guide now says the CID is disclosed to the chosen gateway and that an unavailable gateway fails closed instead of fabricating an object.
- The catalog status light needed no change: the module readiness check already reports Available because local verification works.

## Live evidence

`scripts/check-public-ipfs-20261114.cjs` retrieved two long-standing public CIDs through the real, unmocked service and verified every block and link with the actual `inspectCAR` verifier. Raw output: `PUBLIC-IPFS-CHECK-2026-11-14.json`.

- Empty UnixFS directory (`bafybeiczsscdsbs...bgf354`, CIDv1 of QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn): 100 bytes, 1 block, CID verified.
- Public docs directory (`bafybeie5nqv6kd3...d2ho34`, CIDv1 of QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG): 6,689 bytes, 7 blocks, all links and hashes verified.

Gateway reachability on 2026-11-14 from the test network: trustless-gateway.link timed out directly and returned 525 after redirects; ipfs.io/dweb.link rate-limited (429) or redirect to trustless-gateway.link; w3s.link and nftstorage.link redirect onward; 4everland.io answered 200 CAR for both CIDs. Reachability varies by network and time; an unreachable gateway produces an explicit error, never a fabricated object.

## What this does not claim

Pin status, authorship, malware safety, persistence or continued availability of any retrieved object. No guarantee a particular CID resolves at any future time. Retrieval is disclosure of the CID to a third-party gateway operator; evidence files are never uploaded. Strict credit covers the original promise (inspect IPFS-stored objects) with local verification plus one confirmed public path, not universal gateway availability.

## Validation

- tests/ipfs-read-only-service.test.js: existing fixed-origin/redirect/credential guards unchanged, new subdomain URL construction and over-label CID rejection.
- Full non-Network Jest scope: 43 suites / 372 tests pass (371 plus the new gateway test).
- Real-browser desktop runner: 44 example workflows plus extended matrices pass.
- scripts/test-ipfs-public-ui.cjs: real controller/service live retrieval of the public empty-directory CID through the signed-in route shape, verified again in an actual browser (cidVerified, 1 block); screenshot inspected, output honestly marks pinStatus/authorship/contentSafety as not checked.
- git diff --check clean.
