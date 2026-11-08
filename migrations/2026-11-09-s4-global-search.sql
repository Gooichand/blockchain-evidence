-- S4: global search - stored FTS vectors + GIN indexes (Supabase Postgres)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='search_tsv') THEN
    ALTER TABLE cases ADD COLUMN search_tsv tsvector
      GENERATED ALWAYS AS (to_tsvector('english',
        coalesce(title,'') || ' ' || coalesce(description,'') || ' ' ||
        coalesce(case_number,'') || ' ' || coalesce(jurisdiction,'') || ' ' || coalesce(case_type,''))) STORED;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='evidence' AND column_name='search_tsv') THEN
    ALTER TABLE evidence ADD COLUMN search_tsv tsvector
      GENERATED ALWAYS AS (to_tsvector('english',
        coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(type,'') || ' ' ||
        coalesce(file_name,'') || ' ' || coalesce(hash,'') || ' ' || coalesce(exhibit_id,'') || ' ' ||
        coalesce(forensic_metadata::text,'') || ' ' || coalesce(extracted_metadata::text,''))) STORED;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='case_notes' AND column_name='search_tsv') THEN
    ALTER TABLE case_notes ADD COLUMN search_tsv tsvector
      GENERATED ALWAYS AS (to_tsvector('english',
        coalesce(content,'') || ' ' || coalesce(annotation::text,''))) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cases_search ON cases USING GIN (search_tsv);
CREATE INDEX IF NOT EXISTS idx_evidence_search ON evidence USING GIN (search_tsv);
CREATE INDEX IF NOT EXISTS idx_case_notes_search ON case_notes USING GIN (search_tsv);
CREATE INDEX IF NOT EXISTS idx_evidence_hash_prefix ON evidence (hash text_pattern_ops);
