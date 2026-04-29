-- EVID-DGC Security Hardening - RLS Policies
-- This script hardens the Row Level Security (RLS) to prevent unauthorized access 
-- via the 'anon' or authenticated user keys if they are ever exposed.

-- ============================================================================
-- 1. CLEANUP WEAK POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view evidence" ON evidence;
DROP POLICY IF EXISTS "Users can view cases" ON cases;
DROP POLICY IF EXISTS "Users can view active users" ON users;
DROP POLICY IF EXISTS "Users can view tags" ON tags;
DROP POLICY IF EXISTS "Users can view evidence tags" ON evidence_tags;

-- ============================================================================
-- 2. HARDENED POLICIES
-- ============================================================================

-- Evidence: Only authorized roles can view evidence
-- Public can only see evidence if marked as 'is_public' (requires adding column)
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

CREATE POLICY "Authorized roles can view evidence" ON evidence 
FOR SELECT USING (
    -- Service role always has access
    current_user = 'service_role' OR
    -- Evidence is public
    is_public = true OR
    -- User is authenticated and has a restricted role
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.wallet_address = (current_setting('request.jwt.claims', true)::jsonb->>'wallet_address')
        AND u.is_active = true 
        AND u.role IN ('investigator', 'forensic_analyst', 'legal_professional', 'court_official', 'evidence_manager', 'auditor', 'admin')
    )
);

-- Cases: Only authorized roles can view cases
ALTER TABLE cases ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

CREATE POLICY "Authorized roles can view cases" ON cases 
FOR SELECT USING (
    current_user = 'service_role' OR
    is_public = true OR
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.wallet_address = (current_setting('request.jwt.claims', true)::jsonb->>'wallet_address')
        AND u.is_active = true 
        AND u.role IN ('investigator', 'legal_professional', 'court_official', 'evidence_manager', 'auditor', 'admin')
    )
);

-- Users: Users can only see their own full profile, or public info of others
CREATE POLICY "Users can view their own profile" ON users
FOR SELECT USING (
    current_user = 'service_role' OR
    wallet_address = (current_setting('request.jwt.claims', true)::jsonb->>'wallet_address') OR
    email = (current_setting('request.jwt.claims', true)::jsonb->>'email')
);

CREATE POLICY "Public can view basic user info" ON users
FOR SELECT USING (
    is_active = true
);

-- Activity Logs: ONLY service role/admin
CREATE POLICY "Admin/Service only activity logs" ON activity_logs
FOR ALL USING (
    current_user = 'service_role' OR
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.wallet_address = (current_setting('request.jwt.claims', true)::jsonb->>'wallet_address')
        AND u.role = 'admin'
    )
);

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
FOR SELECT USING (
    current_user = 'service_role' OR
    user_wallet = (current_setting('request.jwt.claims', true)::jsonb->>'wallet_address')
);

-- ============================================================================
-- 3. VERIFICATION
-- ============================================================================

-- Ensure all tables have RLS enabled (re-affirming)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_tags ENABLE ROW LEVEL SECURITY;
