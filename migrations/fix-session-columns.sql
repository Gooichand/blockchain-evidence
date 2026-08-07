-- ============================================================================
-- EVID-DGC repair — missing user_sessions columns
-- The user_sessions table exists but lacks device/browser/location/last_active.
-- Safe to re-run (ADD COLUMN IF NOT EXISTS).
-- ============================================================================

ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS device VARCHAR(128);
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS browser VARCHAR(128);
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS location VARCHAR(128);
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ NOT NULL DEFAULT NOW();
