-- EVID-DGC Public Viewer Portal — schema migration
-- Run this once in the Supabase SQL Editor (Dashboard > SQL > New query).
-- It is idempotent: safe to re-run.

-- ============================================================================
-- 1. COLUMNS
-- ============================================================================

-- cases: explicit public-release contract
ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS publication_status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    ADD COLUMN IF NOT EXISTS published_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS public_title TEXT,
    ADD COLUMN IF NOT EXISTS public_summary TEXT;

-- evidence: explicit public-release flag + release date
ALTER TABLE evidence
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS published_date TIMESTAMPTZ;

-- ============================================================================
-- 2. BACKFILL (preserve existing data semantics)
-- ============================================================================

-- Any case previously marked is_public is treated as a published release.
UPDATE cases
SET publication_status = 'Published',
    published_date     = COALESCE(published_date, last_status_change, created_date)
WHERE is_public = TRUE
  AND publication_status = 'Draft';

-- Existing public evidence gets a release date.
UPDATE evidence
SET published_date = COALESCE(published_date, timestamp)
WHERE is_public = TRUE
  AND published_date IS NULL;

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cases_public_release
    ON cases (publication_status, published_date DESC)
    WHERE is_public = TRUE;

CREATE INDEX IF NOT EXISTS idx_cases_is_public ON cases (is_public);
CREATE INDEX IF NOT EXISTS idx_evidence_is_public ON evidence (is_public);
CREATE INDEX IF NOT EXISTS idx_evidence_public_key ON evidence (is_public, blockchain_verified);

-- ============================================================================
-- 4. ROW LEVEL SECURITY — Public users must never see private rows
-- ============================================================================

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;

-- Public viewers (role claim) may SELECT only explicitly published cases.
DROP POLICY IF EXISTS "public_viewer_read_published_cases" ON cases;
CREATE POLICY "public_viewer_read_published_cases" ON cases
    FOR SELECT
    USING (
        current_user = 'service_role'
        OR (is_public = TRUE AND publication_status = 'Published')
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.email = (current_setting('request.jwt.claims', true)::jsonb->>'email')
              AND u.is_active = TRUE
              AND u.role IN ('investigator','forensic_analyst','legal_professional','court_official','evidence_manager','auditor','admin')
        )
    );

-- Public viewers may SELECT only released evidence.
DROP POLICY IF EXISTS "public_viewer_read_released_evidence" ON evidence;
CREATE POLICY "public_viewer_read_released_evidence" ON evidence
    FOR SELECT USING (
        current_user = 'service_role'
        OR is_public = TRUE
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.email = (current_setting('request.jwt.claims', true)::jsonb->>'email')
              AND u.is_active = TRUE
              AND u.role IN ('investigator','forensic_analyst','legal_professional','court_official','evidence_manager','auditor','admin')
        )
    );

-- ============================================================================
-- 5. VERIFY
-- ============================================================================

SELECT is_public, publication_status, count(*) AS cases
FROM cases GROUP BY is_public, publication_status ORDER BY is_public;

SELECT is_public, count(*) AS evidence_items
FROM evidence GROUP BY is_public;