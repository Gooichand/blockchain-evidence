-- S1: automatic metadata/EXIF extraction on upload.
-- extracted_metadata: camera/device, timestamps, GPS, software, dimensions,
--   PDF and Office document properties, read from the file itself.
-- metadata_flags: mismatch warnings (e.g. EXIF date after upload date).
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS extracted_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS metadata_flags jsonb NOT NULL DEFAULT '[]'::jsonb;
