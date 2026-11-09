-- S9: guided collection checklist (ISO 27037 phases), one row per case.
CREATE TABLE IF NOT EXISTS case_checklists (
  case_id     INT PRIMARY KEY REFERENCES cases(id) ON DELETE CASCADE,
  items       JSONB NOT NULL DEFAULT '[]',
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
