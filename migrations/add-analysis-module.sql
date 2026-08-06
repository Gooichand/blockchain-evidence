-- EVID-DGC Forensic Analyst Module — schema migration
-- Run this once in the Supabase SQL Editor (Dashboard > SQL > New query).
-- Idempotent: safe to re-run.

-- ============================================================================
-- 1. ANALYSIS TASKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS analysis_tasks (
    id SERIAL PRIMARY KEY,
    evidence_id INTEGER NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
    case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
    analyst_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    analyst_wallet TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    progress INTEGER NOT NULL DEFAULT 0,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    requested_by TEXT,
    notes TEXT,
    estimated_time_minutes INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_tasks_analyst ON analysis_tasks (analyst_id, status);
CREATE INDEX IF NOT EXISTS idx_analysis_tasks_evidence ON analysis_tasks (evidence_id);
CREATE INDEX IF NOT EXISTS idx_analysis_tasks_priority ON analysis_tasks (priority, status);

-- ============================================================================
-- 2. ANALYSIS REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS analysis_reports (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES analysis_tasks(id) ON DELETE CASCADE,
    evidence_id INTEGER NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
    case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
    analyst_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    analyst_wallet TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    report_hash TEXT,
    result_summary TEXT,
    findings TEXT,
    blockchain_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_analysis_reports_analyst ON analysis_reports (analyst_id, status);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_evidence ON analysis_reports (evidence_id);

-- ============================================================================
-- 3. EVIDENCE EXTENSIONS
-- ============================================================================

ALTER TABLE evidence
    ADD COLUMN IF NOT EXISTS redaction_status VARCHAR(50) NOT NULL DEFAULT 'Sealed';

-- ============================================================================
-- 4. LAB EQUIPMENT (forensic lab inventory)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lab_equipment (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'offline',
    detail TEXT,
    version TEXT,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO lab_equipment (name, category, status, detail, version, sort_order)
VALUES
    ('Imaging Workstation', 'workstation', 'online', 'Write-blocked disk imaging & cloning', 'v2.4', 1),
    ('DNA Lab', 'biology', 'available', 'STR profiling and CODIS comparison', 'v1.9', 2),
    ('GPU Cluster', 'compute', 'busy', 'Parallel hash cracking and media processing', 'v3.1', 3),
    ('Blockchain Node', 'blockchain', 'healthy', 'EVID-DGC evidence anchoring node', 'v6.2', 4),
    ('IPFS Gateway', 'storage', 'connected', 'Content-addressed evidence storage', 'v1.5', 5),
    ('Hash Verification Engine', 'verification', 'online', 'SHA-256 integrity verification', 'v2.0', 6)
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_lab_equipment_status ON lab_equipment (status);

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE analysis_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_equipment ENABLE ROW LEVEL SECURITY;

-- Analysts may read/write tasks assigned to them; service_role sees everything.
DROP POLICY IF EXISTS "analysis_tasks_select" ON analysis_tasks;
CREATE POLICY "analysis_tasks_select" ON analysis_tasks
    FOR SELECT USING (
        current_user = 'service_role'
        OR analyst_id = (SELECT id FROM users WHERE email = (current_setting('request.jwt.claims', true)::jsonb->>'email'))
        OR analyst_wallet = (current_setting('request.jwt.claims', true)::jsonb->>'email')
    );

DROP POLICY IF EXISTS "analysis_tasks_write" ON analysis_tasks;
CREATE POLICY "analysis_tasks_write" ON analysis_tasks
    FOR ALL USING (
        current_user = 'service_role'
        OR analyst_id = (SELECT id FROM users WHERE email = (current_setting('request.jwt.claims', true)::jsonb->>'email'))
        OR analyst_wallet = (current_setting('request.jwt.claims', true)::jsonb->>'email')
    )
    WITH CHECK (
        current_user = 'service_role'
        OR analyst_id = (SELECT id FROM users WHERE email = (current_setting('request.jwt.claims', true)::jsonb->>'email'))
        OR analyst_wallet = (current_setting('request.jwt.claims', true)::jsonb->>'email')
    );

DROP POLICY IF EXISTS "analysis_reports_select" ON analysis_reports;
CREATE POLICY "analysis_reports_select" ON analysis_reports
    FOR SELECT USING (
        current_user = 'service_role'
        OR analyst_id = (SELECT id FROM users WHERE email = (current_setting('request.jwt.claims', true)::jsonb->>'email'))
        OR analyst_wallet = (current_setting('request.jwt.claims', true)::jsonb->>'email')
    );

DROP POLICY IF EXISTS "analysis_reports_write" ON analysis_reports;
CREATE POLICY "analysis_reports_write" ON analysis_reports
    FOR ALL USING (
        current_user = 'service_role'
        OR analyst_id = (SELECT id FROM users WHERE email = (current_setting('request.jwt.claims', true)::jsonb->>'email'))
        OR analyst_wallet = (current_setting('request.jwt.claims', true)::jsonb->>'email')
    )
    WITH CHECK (
        current_user = 'service_role'
        OR analyst_id = (SELECT id FROM users WHERE email = (current_setting('request.jwt.claims', true)::jsonb->>'email'))
        OR analyst_wallet = (current_setting('request.jwt.claims', true)::jsonb->>'email')
    );

-- Lab equipment is read-only for everyone.
DROP POLICY IF EXISTS "lab_equipment_select" ON lab_equipment;
CREATE POLICY "lab_equipment_select" ON lab_equipment
    FOR SELECT USING (true);

-- ============================================================================
-- 6. VERIFY
-- ============================================================================

SELECT status, count(*) AS tasks FROM analysis_tasks GROUP BY status;
SELECT status, count(*) AS reports FROM analysis_reports GROUP BY status;
SELECT name, status FROM lab_equipment ORDER BY sort_order;
