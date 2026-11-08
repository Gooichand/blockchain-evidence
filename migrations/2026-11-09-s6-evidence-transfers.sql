-- S6: Evidence transfer with acceptance
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS evidence_transfers (
    id SERIAL PRIMARY KEY,
    evidence_id INTEGER NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
    case_id INTEGER,
    from_user TEXT NOT NULL,
    from_name TEXT,
    to_user TEXT NOT NULL,
    to_name TEXT,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_evidence_transfers_to ON evidence_transfers (to_user, status);
CREATE INDEX IF NOT EXISTS idx_evidence_transfers_from ON evidence_transfers (from_user, status);
CREATE INDEX IF NOT EXISTS idx_evidence_transfers_evidence ON evidence_transfers (evidence_id, status);
