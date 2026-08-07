-- ============================================================================
-- EVID-DGC repair — case_id column types
-- evidence.case_id stores case NUMBER strings (e.g. CASE-2025-000001),
-- so the new feature tables must use VARCHAR for case_id, not BIGINT.
-- Safe to re-run.
-- ============================================================================

ALTER TABLE legal_opinions ALTER COLUMN case_id TYPE VARCHAR(64);
ALTER TABLE court_orders ALTER COLUMN case_id TYPE VARCHAR(64);
ALTER TABLE legal_holds ALTER COLUMN case_id TYPE VARCHAR(64);
