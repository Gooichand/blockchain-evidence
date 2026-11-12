# A6 Analyst snapshot export scope

Local review candidate. No deployment or migration is included.

## Deliberate policy choice

The approved export choice is assignment-scoped Analyst PDFs at the case/evidence snapshot entry points only. An existing task matches analyst_id or analyst_wallet against the authenticated user's wallet/email. Any existing task state counts as assignment. Shared caseAccess and other roles' access rules stay unchanged.

An Analyst case PDF includes assigned evidence only. It excludes custody/notes associated with unassigned evidence, case-wide notes and the case-wide checklist. Those case-wide records cannot safely be attributed to assigned evidence. Case metadata is retained. The PDF visibly labels this scope; the attached JSON also records scope. Evidence PDFs require an evidence assignment before reading that evidence row. Assignment lookups fail closed.

IDs use strict positive32-bit validation. Unassigned Analyst requests return403 before private rows load. Source failures and capped/incomplete assigned-evidence results return500 with no PDF. No silent fallback to wider access exists.

## Verification

-43Jest suites/310tests pass, including15new export-access cases.
-Real local PostgreSQL14.24/PostgREST16.5 export harness passed assignment scope,1500duplicate-task parent deduplication, email identity fallback, cross-analyst case/evidence denials, linked custody/notes filtering, checklist omission and exact snapshot attachment inspection.
-Rendered the resulting two-page synthetic Analyst case PDF. Inspected the scope notice, content, page break and footer. This is not a full case export.

Run tests/report-export-access-fixture.sql only after tests/analyst-inventory-fixture.sql in a disposable local database. It is TEST ONLY schema/data. Then run BE_TEST_POSTGREST_URL=http://127.0.0.1:PORT node tests/report-export-postgrest.cjs. BE_TEST_PDF_PATH optionally writes the synthetic PDF for inspection. No production connection, role middleware proof or production data test is claimed.

## Remaining gates and limits

This change is not a serializable database snapshot or a guarantee against a concurrent assignment revocation after the initial lookup. No new shared-access policy, unique constraint, cleanup, package/lock change, UI change or production migration is included. Existing broader rollout gates still apply: service-role capability, historical duplicate inspection, approved migration/backend rollout and combined UI lifecycle/download checks.
