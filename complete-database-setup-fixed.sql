-- EVID-DGC Complete Database Setup - FIXED VERSION
-- Run this ONCE in Supabase SQL Editor to set up the entire system
-- This includes all tables, SECURE policies, indexes, and the first admin user

-- ============================================================================
-- CLEAN SLATE - DROP EXISTING TABLES AND POLICIES
-- ============================================================================

DROP TABLE IF EXISTS case_status_history CASCADE;
DROP TABLE IF EXISTS case_status_transitions CASCADE;
DROP TABLE IF EXISTS case_statuses CASCADE;
DROP TABLE IF EXISTS case_assignments CASCADE;
DROP TABLE IF EXISTS user_profile_updates CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS role_change_requests CASCADE;
DROP TABLE IF EXISTS evidence_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS admin_actions CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS evidence CASCADE;
DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- TABLES CREATION
-- ============================================================================

-- Users table with role-based access
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    wallet_address TEXT UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('public_viewer', 'investigator', 'forensic_analyst', 'legal_professional', 'court_official', 'evidence_manager', 'auditor', 'admin')),
    department TEXT,
    jurisdiction TEXT,
    badge_number TEXT,
    account_type TEXT DEFAULT 'real' CHECK (account_type IN ('real', 'test')),
    auth_type TEXT DEFAULT 'wallet' CHECK (auth_type IN ('wallet', 'email', 'both')),
    email_verified BOOLEAN DEFAULT FALSE,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT users_auth_check CHECK (
        (wallet_address IS NOT NULL) OR (email IS NOT NULL)
    )
);

-- Case status definitions table
CREATE TABLE case_statuses (
    id SERIAL PRIMARY KEY,
    status_code VARCHAR(50) UNIQUE NOT NULL,
    status_name VARCHAR(100) NOT NULL,
    description TEXT,
    color_code VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'folder',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cases table with enhanced workflow
CREATE TABLE cases (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    created_by TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_date TIMESTAMPTZ DEFAULT NOW(),
    status_id INTEGER REFERENCES case_statuses(id),
    priority_level INTEGER DEFAULT 3 CHECK (priority_level BETWEEN 1 AND 5),
    assigned_investigator TEXT,
    assigned_prosecutor TEXT,
    assigned_judge TEXT,
    court_date TIMESTAMPTZ,
    deadline_date TIMESTAMPTZ,
    case_number VARCHAR(50) UNIQUE,
    jurisdiction VARCHAR(100),
    case_type VARCHAR(50) DEFAULT 'criminal',
    estimated_completion TIMESTAMPTZ,
    actual_completion TIMESTAMPTZ,
    case_tags TEXT[],
    metadata JSONB DEFAULT '{}',
    last_status_change TIMESTAMPTZ DEFAULT NOW(),
    status_changed_by TEXT
);

-- Evidence table
CREATE TABLE evidence (
    id SERIAL PRIMARY KEY,
    case_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    file_data TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    hash TEXT NOT NULL,
    submitted_by TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending'
);

-- Activity logs table
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT
);

-- Admin actions table
CREATE TABLE admin_actions (
    id SERIAL PRIMARY KEY,
    admin_wallet TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_wallet TEXT,
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_wallet TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('evidence_upload', 'evidence_verification', 'evidence_assignment', 'comment', 'mention', 'system', 'urgent')),
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Tags table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    category TEXT,
    parent_id INTEGER REFERENCES tags(id),
    usage_count INTEGER DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evidence tags junction table
CREATE TABLE evidence_tags (
    evidence_id INTEGER REFERENCES evidence(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    tagged_by TEXT NOT NULL,
    tagged_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (evidence_id, tag_id)
);

-- Role change requests table
CREATE TABLE role_change_requests (
    id SERIAL PRIMARY KEY,
    requesting_admin VARCHAR(42) NOT NULL,
    target_wallet VARCHAR(42) NOT NULL,
    old_role VARCHAR(50) NOT NULL,
    new_role VARCHAR(50) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by VARCHAR(42),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_by VARCHAR(42),
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    wallet_address TEXT,
    email TEXT,
    login_type TEXT CHECK (login_type IN ('wallet', 'email')),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    is_active BOOLEAN DEFAULT TRUE
);

-- User permissions table
CREATE TABLE user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permission_name TEXT NOT NULL,
    granted_by INTEGER REFERENCES users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- User profile updates table
CREATE TABLE user_profile_updates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT
);

-- Case status transitions table
CREATE TABLE case_status_transitions (
    id SERIAL PRIMARY KEY,
    from_status_id INTEGER REFERENCES case_statuses(id),
    to_status_id INTEGER REFERENCES case_statuses(id),
    required_role VARCHAR(50) NOT NULL,
    requires_approval BOOLEAN DEFAULT FALSE,
    approval_role VARCHAR(50),
    transition_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_status_id, to_status_id, required_role)
);

-- Case status history table
CREATE TABLE case_status_history (
    id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    from_status_id INTEGER REFERENCES case_statuses(id),
    to_status_id INTEGER REFERENCES case_statuses(id),
    changed_by TEXT NOT NULL,
    change_reason TEXT,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case assignments table
CREATE TABLE case_assignments (
    id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    assigned_to TEXT NOT NULL,
    assigned_by TEXT NOT NULL,
    role_type VARCHAR(50) NOT NULL,
    assignment_type VARCHAR(50) DEFAULT 'primary' CHECK (assignment_type IN ('primary', 'secondary', 'observer')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    unassigned_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_status_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECURE RLS POLICIES
-- ============================================================================

-- Users table policies
CREATE POLICY "Users can view active users" ON users FOR SELECT USING (is_active = true);
CREATE POLICY "Users can register themselves" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role full access" ON users FOR ALL USING (current_user = 'service_role');

-- Evidence table policies
CREATE POLICY "Users can view evidence" ON evidence FOR SELECT USING (true);
CREATE POLICY "Authorized users can insert evidence" ON evidence FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.wallet_address = submitted_by AND u.is_active = true AND u.role IN ('investigator', 'forensic_analyst', 'evidence_manager', 'admin'))
);
CREATE POLICY "Service role full access" ON evidence FOR ALL USING (current_user = 'service_role');

-- Cases table policies
CREATE POLICY "Users can view cases" ON cases FOR SELECT USING (true);
CREATE POLICY "Authorized users can create cases" ON cases FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.wallet_address = created_by AND u.is_active = true AND u.role IN ('investigator', 'legal_professional', 'court_official', 'admin'))
);
CREATE POLICY "Service role full access" ON cases FOR ALL USING (current_user = 'service_role');

-- Activity logs policies
CREATE POLICY "Service role full access" ON activity_logs FOR ALL USING (current_user = 'service_role');

-- Admin actions policies
CREATE POLICY "Service role full access" ON admin_actions FOR ALL USING (current_user = 'service_role');

-- Notifications policies
CREATE POLICY "Service role full access" ON notifications FOR ALL USING (current_user = 'service_role');

-- Tags policies
CREATE POLICY "Users can view tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON tags FOR ALL USING (current_user = 'service_role');

-- Evidence tags policies
CREATE POLICY "Users can view evidence tags" ON evidence_tags FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON evidence_tags FOR ALL USING (current_user = 'service_role');

-- Role change requests policies
CREATE POLICY "Service role full access" ON role_change_requests FOR ALL USING (current_user = 'service_role');

-- User sessions policies
CREATE POLICY "Service role full access" ON user_sessions FOR ALL USING (current_user = 'service_role');

-- User permissions policies
CREATE POLICY "Service role full access" ON user_permissions FOR ALL USING (current_user = 'service_role');

-- User profile updates policies
CREATE POLICY "Service role full access" ON user_profile_updates FOR ALL USING (current_user = 'service_role');

-- Case statuses policies
CREATE POLICY "Users can view case statuses" ON case_statuses FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON case_statuses FOR ALL USING (current_user = 'service_role');

-- Case status transitions policies
CREATE POLICY "Users can view case status transitions" ON case_status_transitions FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON case_status_transitions FOR ALL USING (current_user = 'service_role');

-- Case status history policies
CREATE POLICY "Users can view case status history" ON case_status_history FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON case_status_history FOR ALL USING (current_user = 'service_role');

-- Case assignments policies
CREATE POLICY "Users can view case assignments" ON case_assignments FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON case_assignments FOR ALL USING (current_user = 'service_role');

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_type ON users(auth_type);
CREATE INDEX idx_evidence_case ON evidence(case_id);
CREATE INDEX idx_evidence_submitted ON evidence(submitted_by);
CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_wallet);
CREATE INDEX idx_notifications_user ON notifications(user_wallet);
CREATE INDEX idx_notifications_unread ON notifications(user_wallet, is_read);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_category ON tags(category);
CREATE INDEX idx_tags_usage_count ON tags(usage_count DESC);
CREATE INDEX idx_evidence_tags_evidence_id ON evidence_tags(evidence_id);
CREATE INDEX idx_evidence_tags_tag_id ON evidence_tags(tag_id);
CREATE INDEX idx_role_change_requests_status ON role_change_requests(status);
CREATE INDEX idx_role_change_requests_target ON role_change_requests(target_wallet);
CREATE INDEX idx_role_change_requests_requesting ON role_change_requests(requesting_admin);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active, expires_at);
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_profile_updates_user_id ON user_profile_updates(user_id);
CREATE INDEX idx_cases_status_id ON cases(status_id);
CREATE INDEX idx_cases_case_number ON cases(case_number);
CREATE INDEX idx_cases_priority_level ON cases(priority_level);
CREATE INDEX idx_cases_assigned_investigator ON cases(assigned_investigator);
CREATE INDEX idx_cases_assigned_prosecutor ON cases(assigned_prosecutor);
CREATE INDEX idx_cases_assigned_judge ON cases(assigned_judge);
CREATE INDEX idx_cases_court_date ON cases(court_date);
CREATE INDEX idx_cases_deadline_date ON cases(deadline_date);
CREATE INDEX idx_cases_case_type ON cases(case_type);
CREATE INDEX idx_cases_jurisdiction ON cases(jurisdiction);
CREATE INDEX idx_cases_last_status_change ON cases(last_status_change);
CREATE INDEX idx_case_status_history_case_id ON case_status_history(case_id);
CREATE INDEX idx_case_status_history_created_at ON case_status_history(created_at);
CREATE INDEX idx_case_assignments_case_id ON case_assignments(case_id);
CREATE INDEX idx_case_assignments_assigned_to ON case_assignments(assigned_to);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Password hashing handled in Node.js using bcrypt

-- Update trigger for last_updated
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_update_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated();

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update role change requests timestamp
CREATE OR REPLACE FUNCTION update_role_change_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log case status changes
CREATE OR REPLACE FUNCTION log_case_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
        INSERT INTO case_status_history (
            case_id,
            from_status_id,
            to_status_id,
            changed_by,
            change_reason,
            metadata
        ) VALUES (
            NEW.id,
            OLD.status_id,
            NEW.status_id,
            NEW.status_changed_by,
            'Status updated via system',
            jsonb_build_object(
                'previous_status', OLD.status,
                'new_status', NEW.status,
                'change_timestamp', NOW()
            )
        );

        -- Update last status change timestamp
        NEW.last_status_change = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-assign case numbers
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.case_number IS NULL THEN
        NEW.case_number := 'CASE-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEW.id::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Email user creation function
CREATE OR REPLACE FUNCTION create_email_user(
    p_email TEXT,
    p_password_hash TEXT,
    p_full_name TEXT,
    p_role TEXT,
    p_department TEXT DEFAULT 'General',
    p_jurisdiction TEXT DEFAULT 'General'
)
RETURNS JSON AS $$
DECLARE
    new_user_id INTEGER;
    result JSON;
BEGIN
    -- Validate role
    IF p_role NOT IN ('public_viewer', 'investigator', 'forensic_analyst', 'legal_professional', 'court_official', 'evidence_manager', 'auditor') THEN
        RETURN json_build_object('error', 'Invalid role for regular user');
    END IF;

    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
        RETURN json_build_object('error', 'Email already registered');
    END IF;

    -- Insert new user
    INSERT INTO users (
        email, password_hash, full_name, role, department, jurisdiction,
        auth_type, account_type, created_by, is_active, email_verified
    ) VALUES (
        p_email, p_password_hash, p_full_name, p_role, p_department, p_jurisdiction,
        'email', 'real', 'email_registration', true, true
    ) RETURNING id INTO new_user_id;

    -- Return success with user data
    SELECT json_build_object(
        'success', true,
        'user', json_build_object(
            'id', id, 'email', email, 'full_name', full_name, 'role', role,
            'department', department, 'jurisdiction', jurisdiction, 'auth_type', auth_type, 'created_at', created_at
        )
    ) INTO result FROM users WHERE id = new_user_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user by identifier function
CREATE OR REPLACE FUNCTION get_user_by_identifier(p_identifier TEXT)
RETURNS JSON AS $$
DECLARE
    user_data JSON;
BEGIN
    SELECT json_build_object(
        'id', id,
        'wallet_address', wallet_address,
        'email', email,
        'full_name', full_name,
        'role', role,
        'department', department,
        'jurisdiction', jurisdiction,
        'badge_number', badge_number,
        'auth_type', auth_type,
        'is_active', is_active,
        'created_at', created_at
    ) INTO user_data
    FROM users
    WHERE (email = p_identifier OR wallet_address = p_identifier)
    AND is_active = true;

    RETURN user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all users function
CREATE OR REPLACE FUNCTION get_all_users(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_role_filter TEXT DEFAULT NULL,
    p_active_only BOOLEAN DEFAULT true
)
RETURNS JSON AS $$
DECLARE
    users_data JSON;
    total_count INTEGER;
BEGIN
    -- Get total count
    SELECT COUNT(*) INTO total_count
    FROM users
    WHERE (p_active_only = false OR is_active = true)
    AND (p_role_filter IS NULL OR role = p_role_filter);

    -- Get users
    SELECT json_agg(
        json_build_object(
            'id', id,
            'wallet_address', wallet_address,
            'email', email,
            'full_name', full_name,
            'role', role,
            'department', department,
            'jurisdiction', jurisdiction,
            'badge_number', badge_number,
            'auth_type', auth_type,
            'is_active', is_active,
            'created_at', created_at,
            'last_updated', last_updated
        )
    ) INTO users_data
    FROM (
        SELECT *
        FROM users
        WHERE (p_active_only = false OR is_active = true)
        AND (p_role_filter IS NULL OR role = p_role_filter)
        ORDER BY created_at DESC
        LIMIT p_limit OFFSET p_offset
    ) u;

    RETURN json_build_object(
        'users', COALESCE(users_data, '[]'::json),
        'total_count', total_count,
        'limit', p_limit,
        'offset', p_offset
    );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user profile function
CREATE OR REPLACE FUNCTION update_user_profile(
    p_user_id INTEGER,
    p_full_name TEXT DEFAULT NULL,
    p_department TEXT DEFAULT NULL,
    p_jurisdiction TEXT DEFAULT NULL,
    p_badge_number TEXT DEFAULT NULL,
    p_updated_by INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    old_data RECORD;
    result JSON;
BEGIN
    -- Get current data
    SELECT * INTO old_data FROM users WHERE id = p_user_id;

    IF old_data IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;

    -- Update user
    UPDATE users SET
        full_name = COALESCE(p_full_name, full_name),
        department = COALESCE(p_department, department),
        jurisdiction = COALESCE(p_jurisdiction, jurisdiction),
        badge_number = COALESCE(p_badge_number, badge_number),
        last_updated = NOW()
    WHERE id = p_user_id;

    -- Log changes
    IF p_full_name IS NOT NULL AND p_full_name != old_data.full_name THEN
        INSERT INTO user_profile_updates (user_id, field_name, old_value, new_value, updated_by)
        VALUES (p_user_id, 'full_name', old_data.full_name, p_full_name, p_updated_by);
    END IF;

    IF p_department IS NOT NULL AND p_department != old_data.department THEN
        INSERT INTO user_profile_updates (user_id, field_name, old_value, new_value, updated_by)
        VALUES (p_user_id, 'department', old_data.department, p_department, p_updated_by);
    END IF;

    RETURN json_build_object('success', true, 'message', 'Profile updated successfully');

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER trigger_update_tag_usage
    AFTER INSERT OR DELETE ON evidence_tags
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

CREATE TRIGGER role_change_requests_updated_at_trigger
    BEFORE UPDATE ON role_change_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_role_change_requests_updated_at();

CREATE TRIGGER case_status_change_log_trigger
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION log_case_status_change();

CREATE TRIGGER case_number_generation_trigger
    BEFORE INSERT ON cases
    FOR EACH ROW
    EXECUTE FUNCTION generate_case_number();

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Default case statuses
INSERT INTO case_statuses (status_code, status_name, description, color_code, icon, sort_order) VALUES
('open', 'Open', 'Case created, initial evidence being collected', '#3B82F6', 'folder-open', 1),
('under_investigation', 'Under Investigation', 'Active investigation, evidence being processed', '#F59E0B', 'search', 2),
('evidence_review', 'Evidence Review', 'Evidence collected, under forensic analysis', '#8B5CF6', 'microscope', 3),
('legal_review', 'Legal Review', 'Case under legal professional review', '#10B981', 'scale', 4),
('pending_court', 'Pending Court', 'Ready for court review, awaiting judicial decision', '#EF4444', 'gavel', 5),
('in_trial', 'In Trial', 'Case currently in court proceedings', '#DC2626', 'courthouse', 6),
('closed', 'Closed', 'Case concluded and archived', '#6B7280', 'archive', 7),
('suspended', 'Suspended', 'Case temporarily suspended', '#F97316', 'pause-circle', 8),
('reopened', 'Reopened', 'Previously closed case reopened for new evidence', '#06B6D4', 'refresh-cw', 9);

-- First admin user (supports both wallet and email)
INSERT INTO users (
    wallet_address, email, full_name, role, department, jurisdiction,
    badge_number, account_type, auth_type, created_by, is_active, email_verified
) VALUES (
    '0x29bb7718d5c6da6e787deae8fd6bb3459e8539f2', 'admin@evid-dgc.com',
    'System Administrator', 'admin', 'Administration', 'System',
    'ADMIN-001', 'real', 'both', 'system_setup', true, true
) ON CONFLICT (wallet_address) DO NOTHING;

-- Insert email admin user for gc67766@gmail.com
INSERT INTO users (
    email,
    password_hash,
    full_name,
    role,
    department,
    jurisdiction,
    badge_number,
    account_type,
    auth_type,
    created_by,
    is_active
) VALUES (
    'gc67766@gmail.com',
    -- Insert admin via the app registration flow
    'PLACEHOLDER_HASH_REPLACE_VIA_APP',
    'System Administrator',
    'admin',
    'Administration',
    'System',
    'ADMIN-002',
    'real',
    'email',
    'system_setup',
    true
) ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Sample email users for testing
INSERT INTO users (
    email, password_hash, full_name, role, department, jurisdiction,
    auth_type, account_type, created_by, is_active, email_verified
) VALUES
('investigator@evid-dgc.com', 'hashed_password_123', 'John Investigator', 'investigator', 'Criminal Investigation', 'City Police', 'email', 'real', 'system_setup', true, true),
('analyst@evid-dgc.com', 'hashed_password_456', 'Sarah Analyst', 'forensic_analyst', 'Digital Forensics', 'State Bureau', 'email', 'real', 'system_setup', true, true),
('legal@evid-dgc.com', 'hashed_password_789', 'Michael Legal', 'legal_professional', 'District Attorney', 'County Court', 'email', 'real', 'system_setup', true, true)
ON CONFLICT (email) DO NOTHING;

-- Default tags
INSERT INTO tags (name, color, category, created_by) VALUES
('urgent', '#EF4444', 'priority', 'system'),
('pending-review', '#F59E0B', 'status', 'system'),
('court-ready', '#10B981', 'status', 'system'),
('witness-statement', '#8B5CF6', 'type', 'system'),
('surveillance-footage', '#06B6D4', 'type', 'system'),
('forensic-analysis', '#EC4899', 'type', 'system'),
('confidential', '#DC2626', 'sensitivity', 'system'),
('public', '#059669', 'sensitivity', 'system')
ON CONFLICT (name) DO NOTHING;

-- Update existing cases with default status
UPDATE cases SET status_id = 1 WHERE status_id IS NULL;

-- Generate case numbers for existing cases
UPDATE cases SET case_number = 'CASE-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(id::TEXT, 6, '0') WHERE case_number IS NULL;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify setup
SELECT 'Database setup complete' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN auth_type = 'email' THEN 1 END) as email_users,
    COUNT(CASE WHEN auth_type = 'wallet' THEN 1 END) as wallet_users,
    COUNT(CASE WHEN auth_type = 'both' THEN 1 END) as both_auth_users
FROM users;

-- Show RLS status
SELECT schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'evidence', 'cases', 'activity_logs', 'admin_actions', 'notifications', 'tags', 'evidence_tags', 'role_change_requests')
ORDER BY tablename;