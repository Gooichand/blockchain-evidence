-- S7: Case team and collaboration - case comments with @mentions
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS case_comments (
    id SERIAL PRIMARY KEY,
    case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    author_name TEXT,
    author_role TEXT,
    content TEXT NOT NULL,
    mentions TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_comments_case ON case_comments (case_id, id);
