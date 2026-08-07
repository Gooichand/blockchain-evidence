-- ============================================================================
-- EVID-DGC Phase 2 — Production feature support
-- New tables: legal opinions, court orders, legal holds, sessions, resets
-- Column additions: evidence archive support
-- Safe to re-run (IF NOT EXISTS guards everywhere).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Legal opinions (Legal dashboard — issueLegalOpinion)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS legal_opinions (
    id BIGSERIAL PRIMARY KEY,
    case_id VARCHAR(64),
    evidence_id BIGINT,
    opinion TEXT NOT NULL,
    action VARCHAR(64) NOT NULL DEFAULT 'VERIFIED',
    created_by VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2. Court orders (Court dashboard — issueCourtOrder)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS court_orders (
    id BIGSERIAL PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL,
    order_content TEXT NOT NULL,
    order_type VARCHAR(64) DEFAULT 'ORDER',
    created_by VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 3. Legal holds (Legal hold management)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS legal_holds (
    id BIGSERIAL PRIMARY KEY,
    case_id VARCHAR(64),
    evidence_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    reason TEXT NOT NULL,
    legal_basis TEXT,
    court_order TEXT,
    start_date DATE,
    end_date DATE,
    created_by VARCHAR(128) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    release_reason TEXT
);

-- ---------------------------------------------------------------------------
-- 4. User sessions (account-settings active sessions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    wallet_address VARCHAR(64),
    ip_address VARCHAR(64),
    user_agent TEXT,
    device VARCHAR(128),
    browser VARCHAR(128),
    location VARCHAR(128),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 5. Password reset tokens (forgot-password flow)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_resets (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(128) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 6. Evidence archive columns (retention archive flow)
-- ---------------------------------------------------------------------------
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS archive_location VARCHAR(255);
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS archived_by VARCHAR(128);

-- Indexes for audit/session lookups
CREATE INDEX IF NOT EXISTS idx_legal_holds_case ON legal_holds (case_id);
CREATE INDEX IF NOT EXISTS idx_legal_holds_active ON legal_holds (is_active);
CREATE INDEX IF NOT EXISTS idx_court_orders_case ON court_orders (case_id);
CREATE INDEX IF NOT EXISTS idx_legal_opinions_evidence ON legal_opinions (evidence_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets (token);
CREATE INDEX IF NOT EXISTS idx_evidence_archived ON evidence (archived);
