-- M16: Complete audit log
-- Captures client IP and per-event result (success / failure / denied) on
-- every activity log entry.
-- Run in the Supabase SQL editor for project vkqswulxmuuganmjqumb.

ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS ip_address text;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS result text NOT NULL DEFAULT 'success';
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_time ON activity_logs (user_id, timestamp DESC);
