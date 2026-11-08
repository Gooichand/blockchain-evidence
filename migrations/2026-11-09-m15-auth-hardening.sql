-- M15: Authentication hardening
-- Adds TOTP two-factor authentication, login lockout tracking, and
-- persistent session revocation support.
-- Run in the Supabase SQL editor for project vkqswulxmuuganmjqumb.

ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until timestamptz;

-- Links a recorded session to the JWT issued for it so a session can be
-- revoked server-side (remote sign-out).
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS token_jti text;
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_jti ON user_sessions (token_jti);
