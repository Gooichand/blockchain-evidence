# Non-Network test workflow proposal

Inactive proposal only. No workflow file is installed under .github/workflows and no hosted run is claimed. Activation/publication needs owner approval. No package/lock change.

Local commands:

```
node scripts/test-nonnetwork-unit.cjs
CHROME_PATH=/path/to/chrome SCREENSHOT_DIR=/tmp/be-desktop-results node scripts/test-nonnetwork-desktop.cjs
HASH_UI_SCREENSHOT=/tmp/be-hash-ui.png node scripts/test-hash-integrity-ui.cjs
SCREENSHOT_DIR=/tmp/be-negative-results node scripts/test-negative-document-fixtures.cjs
```

Unit runner uses an explicit excluded list and refuses newly discovered mixed Network suites. Tests may use synthetic local databases/stubs; these do not establish production behavior. Desktop runner uses local synthetic identity/files, serves public assets on loopback, responds 503 to all API requests and never runs Network-category tools. Screenshots must still be inspected, not counted as passed just because a file exists.

Proposed hosted job after approval:

```yaml
name: Non-Network local-fixture regression
on:
  pull_request:
  workflow_dispatch:
permissions:
  contents: read
jobs:
  fixtures:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@<REVIEWED_FULL_COMMIT_SHA>
      - uses: actions/setup-node@<REVIEWED_FULL_COMMIT_SHA>
        with:
          node-version: '22'
          cache: npm
      - run: npm ci --ignore-scripts
      - run: node scripts/test-nonnetwork-unit.cjs
      - run: node scripts/test-hash-integrity-ui.cjs
        env:
          CHROME_PATH: /usr/bin/google-chrome
      - run: node scripts/test-nonnetwork-desktop.cjs
        env:
          CHROME_PATH: /usr/bin/google-chrome
          SCREENSHOT_DIR: /tmp/be-desktop-results
```

Before activation, select and verify immutable action commit SHAs; confirm browser availability; review whether ignored install scripts affect native packages; decide artifact upload/retention and pin its action if needed. Placeholder SHAs intentionally prevent copying this as a working workflow. No repository secrets, deployment hooks, external storage/RPC credentials, auth/session values or production database are required. Package install/action downloads use ordinary hosted network access, not Network-category forensic tools.

The upload regressions first exposed ten failing assertions. Narrow local fixes now pass those checks; future failures must be reported rather than excluded to obtain a green badge. A passing CI result would only cover these fixtures, never universal authenticity, certificate trust, custody completeness or a positive public anchored sample.
