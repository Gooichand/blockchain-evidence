# Desktop integration smoke test

Install the lockfile dependencies with `npm ci`, then run:

```
CHROME_PATH=/path/to/your/chrome npm run test:desktop-forensics
```

On the current Linux desktop test machine Chrome is `/usr/bin/google-chrome`. The runner uses a 1440 x 1100 desktop viewport and the real `dashboard-analyst.html`, scripts and CSS served by an isolated local static server. No real account/token is used. External optional icon/ethers CDNs are deliberately blocked. Live API routes return a labeled unavailable response, never invented successful records.

The runner performs 48 real synthetic examples plus eight media formats, scanned-PDF OCR and three Office format checks, checks concrete expected results and preservation of user file/typed inputs, asserts explicit model unavailable states and live-lookup failure states, and writes screenshots to `test-results/desktop-forensics`. Set `SCREENSHOT_DIR` to choose another directory. Screenshots still need human visual inspection; a saved file is not a visual pass.

Unit tests exercise algorithms, invalid input, failed authentication/tag checks and mocked read-only controller branches. `npm test -- --runInBand` runs the full unit/regression suite. Live Amoy success, real production sessions, deployed app behavior, and other desktop browsers require separate checks. Do not describe the local fixtures as production or live-chain proof.

## Real local EVM check (optional)

`scripts/test-local-chain-inspection.cjs` compiles the actual EvidenceStorage contract and deploys it into an in-memory Ganache chain. It really stores/seals synthetic evidence and checks present/absent hashes, receipt/block consistency, records and event ordering through the new controllers. It uses no production wallet, funds, RPC configuration or `.env` file. The fixture chain ID is 80002 solely to exercise the Amoy-only guard; it is **not public Amoy**.

Install Ganache 7.9.2 in a disposable test directory, then pass its installed module path with `GANACHE_MODULE=/path/to/node_modules/ganache node scripts/test-local-chain-inspection.cjs`. Ganache is not a production dependency. Its optional native uWS binary may fall back to JavaScript on newer Node versions. A passing local-EVM test does not confirm public RPC connectivity.

## Rebuild new parser bundles

`cd scripts/vendor-build && npm ci && npm run build` rebuilds the X.509, QR, CID, MediaInfo and pdf-lib browser bundles plus PDF.js font/CMap assets from pinned direct versions and the accompanying lockfile. Existing PDF/OCR/image parser assets carry their own versioned names/licenses. Keep vendor license/notice files with the assets. Advisory checks are a dated snapshot, not a claim that the whole app is vulnerability-free.
