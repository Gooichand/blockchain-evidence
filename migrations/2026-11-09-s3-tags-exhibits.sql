-- S3: tags, labels and exhibit numbers
-- 1) Court-style exhibit IDs on evidence (EXH-YYYY-NNNN), auto-assigned on insert
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS exhibit_id TEXT UNIQUE;

CREATE SEQUENCE IF NOT EXISTS exhibit_seq;

-- Backfill existing evidence in id order, numbered from the item's own year
WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY id) AS rn
  FROM evidence
  WHERE exhibit_id IS NULL
)
UPDATE evidence e
SET exhibit_id = 'EXH-' || to_char(COALESCE(e.timestamp, now()), 'YYYY') || '-' || lpad(o.rn::text, 4, '0')
FROM ordered o
WHERE e.id = o.id;

SELECT setval('exhibit_seq', GREATEST((SELECT count(*) FROM evidence), 1));

CREATE OR REPLACE FUNCTION assign_exhibit_id() RETURNS trigger AS $$
BEGIN
  IF NEW.exhibit_id IS NULL THEN
    NEW.exhibit_id := 'EXH-' || to_char(COALESCE(NEW.timestamp, now()), 'YYYY') || '-' || lpad(nextval('exhibit_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_exhibit_id ON evidence;
CREATE TRIGGER trg_assign_exhibit_id
BEFORE INSERT ON evidence
FOR EACH ROW EXECUTE FUNCTION assign_exhibit_id();

CREATE INDEX IF NOT EXISTS idx_evidence_exhibit ON evidence(exhibit_id);

-- 2) Keep tags.usage_count truthful
UPDATE tags t SET usage_count = (SELECT count(*) FROM evidence_tags et WHERE et.tag_id = t.id);

CREATE OR REPLACE FUNCTION sync_tag_usage() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tags SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = OLD.tag_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_tag_usage_ins ON evidence_tags;
CREATE TRIGGER trg_sync_tag_usage_ins
AFTER INSERT ON evidence_tags
FOR EACH ROW EXECUTE FUNCTION sync_tag_usage();

DROP TRIGGER IF EXISTS trg_sync_tag_usage_del ON evidence_tags;
CREATE TRIGGER trg_sync_tag_usage_del
AFTER DELETE ON evidence_tags
FOR EACH ROW EXECUTE FUNCTION sync_tag_usage();

CREATE INDEX IF NOT EXISTS idx_evidence_tags_tag ON evidence_tags(tag_id);

-- 3) Saved tag filters per user
CREATE TABLE IF NOT EXISTS saved_filters (
  id SERIAL PRIMARY KEY,
  user_key TEXT NOT NULL,
  name TEXT NOT NULL,
  filter JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_key, name)
);

CREATE INDEX IF NOT EXISTS idx_saved_filters_user ON saved_filters(user_key);
