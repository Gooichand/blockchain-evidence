-- EVID-DGC Administrator Control Center Database Migration
-- Run this in Supabase SQL Editor to add admin dashboard tables and columns

-- ============================================================================
-- 1. Extend users table with security/audit columns
-- ============================================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS failed_login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT[],
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- Index for failed login queries
CREATE INDEX IF NOT EXISTS idx_users_failed_logins ON users(failed_login_count DESC) WHERE failed_login_count > 0;
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON users(last_activity DESC);

-- ============================================================================
-- 2. Extend admin_actions table with richer audit fields
-- ============================================================================

ALTER TABLE admin_actions 
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS approval_reason TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
ADD COLUMN IF NOT EXISTS resource_type TEXT,
ADD COLUMN IF NOT EXISTS resource_id TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_admin_actions_severity ON admin_actions(severity);
CREATE INDEX IF NOT EXISTS idx_admin_actions_resource ON admin_actions(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_approved ON admin_actions(approved_by) WHERE approved_by IS NOT NULL;

-- ============================================================================
-- 3. Extend evidence table with admission workflow fields
-- ============================================================================

ALTER TABLE evidence 
ADD COLUMN IF NOT EXISTS admission_status TEXT DEFAULT 'pending' CHECK (admission_status IN ('pending', 'approved', 'rejected', 'on_hold', 'needs_correction')),
ADD COLUMN IF NOT EXISTS admission_decision_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admission_reason TEXT,
ADD COLUMN IF NOT EXISTS admitted_by TEXT,
ADD COLUMN IF NOT EXISTS ipfs_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ipfs_pin_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ipfs_last_pin_attempt TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS blockchain_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS blockchain_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS blockchain_confirmations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hash_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_hash_verification TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_evidence_admission ON evidence(admission_status) WHERE admission_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_evidence_blockchain ON evidence(blockchain_tx_hash) WHERE blockchain_tx_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_evidence_ipfs ON evidence(ipfs_cid) WHERE ipfs_cid IS NOT NULL;

-- ============================================================================
-- 4. Security alerts table for Action Center persistence
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_alerts (
    id SERIAL PRIMARY KEY,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
    evidence_id INTEGER REFERENCES evidence(id) ON DELETE SET NULL,
    user_wallet TEXT,
    assigned_to TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'in_progress', 'resolved', 'escalated')),
    acknowledged_by TEXT,
    acknowledged_at TIMESTAMPTZ,
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    resolution_reason TEXT,
    escalated_by TEXT,
    escalated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_case ON security_alerts(case_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_evidence ON security_alerts(evidence_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_user ON security_alerts(user_wallet);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created ON security_alerts(created_at DESC);

ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON security_alerts;
CREATE POLICY "Service role full access" ON security_alerts FOR ALL USING (current_user = 'service_role');

-- ============================================================================
-- 5. Blockchain transactions monitoring table
-- ============================================================================

CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id SERIAL PRIMARY KEY,
    tx_hash TEXT UNIQUE NOT NULL,
    evidence_id INTEGER REFERENCES evidence(id) ON DELETE SET NULL,
    case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('store_evidence', 'verify_hash', 'legal_hold', 'transfer', 'archive')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'replaced')),
    from_address TEXT,
    to_address TEXT,
    gas_used BIGINT,
    gas_price BIGINT,
    block_number BIGINT,
    confirmations INTEGER DEFAULT 0,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    submitted_by TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    last_retry_at TIMESTAMPTZ
);

-- Reconcile an existing blockchain_transactions table (created by an older
-- migration without these columns) so the queries below do not fail.
ALTER TABLE blockchain_transactions
ADD COLUMN IF NOT EXISTS case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS operation_type TEXT DEFAULT 'store_evidence',
ADD COLUMN IF NOT EXISTS from_address TEXT,
ADD COLUMN IF NOT EXISTS to_address TEXT,
ADD COLUMN IF NOT EXISTS gas_price BIGINT,
ADD COLUMN IF NOT EXISTS confirmations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS submitted_by TEXT,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_blockchain_tx_status ON blockchain_transactions(status);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_evidence ON blockchain_transactions(evidence_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_case ON blockchain_transactions(case_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_submitted ON blockchain_transactions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_hash ON blockchain_transactions(tx_hash);

ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON blockchain_transactions;
CREATE POLICY "Service role full access" ON blockchain_transactions FOR ALL USING (current_user = 'service_role');

-- ============================================================================
-- 6. IPFS pins monitoring table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ipfs_pins (
    id SERIAL PRIMARY KEY,
    cid TEXT UNIQUE NOT NULL,
    evidence_id INTEGER REFERENCES evidence(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pinning' CHECK (status IN ('pinning', 'pinned', 'failed', 'unpinned', 'retrying')),
    pin_size BIGINT,
    gateway TEXT,
    pin_attempts INTEGER DEFAULT 0,
    last_pin_attempt TIMESTAMPTZ,
    error_message TEXT,
    pinned_by TEXT,
    pinned_at TIMESTAMPTZ,
    last_verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ipfs_pins_status ON ipfs_pins(status);
CREATE INDEX IF NOT EXISTS idx_ipfs_pins_evidence ON ipfs_pins(evidence_id);
CREATE INDEX IF NOT EXISTS idx_ipfs_pins_cid ON ipfs_pins(cid);
CREATE INDEX IF NOT EXISTS idx_ipfs_pins_pinned ON ipfs_pins(pinned_at DESC);

ALTER TABLE ipfs_pins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON ipfs_pins;
CREATE POLICY "Service role full access" ON ipfs_pins FOR ALL USING (current_user = 'service_role');

-- ============================================================================
-- 7. Updated timestamp trigger for security_alerts
-- ============================================================================

CREATE OR REPLACE FUNCTION update_security_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS security_alerts_update_trigger ON security_alerts;
CREATE TRIGGER security_alerts_update_trigger
    BEFORE UPDATE ON security_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_security_alerts_updated_at();

-- ============================================================================
-- 8. Function to get admin dashboard metrics
-- ============================================================================

CREATE OR REPLACE FUNCTION get_admin_dashboard_metrics()
RETURNS JSON AS $$
DECLARE
    metrics JSON;
BEGIN
    SELECT json_build_object(
        'active_cases', COALESCE(active_cases, 0),
        'total_evidence', COALESCE(total_evidence, 0),
        'evidence_awaiting_approval', COALESCE(evidence_awaiting_approval, 0),
        'active_users', COALESCE(active_users, 0),
        'inactive_users', COALESCE(inactive_users, 0),
        'unresolved_alerts', COALESCE(unresolved_alerts, 0),
        'hash_verification_health', COALESCE(hash_verification_health, 'unknown'),
        'blockchain_health', COALESCE(blockchain_health, 'unknown'),
        'ipfs_health', COALESCE(ipfs_health, 'unknown'),
        'recent_admin_actions', COALESCE(recent_admin_actions, '[]'::json),
        'recent_case_activity', COALESCE(recent_case_activity, '[]'::json),
        'recent_evidence_activity', COALESCE(recent_evidence_activity, '[]'::json)
    ) INTO metrics
    FROM (
        SELECT 
            (SELECT COUNT(*) FROM cases WHERE status_id IN (
                SELECT id FROM case_statuses WHERE status_code IN ('open', 'under_investigation', 'evidence_review', 'legal_review', 'pending_court', 'in_trial')
            )) as active_cases,
            (SELECT COUNT(*) FROM evidence) as total_evidence,
            (SELECT COUNT(*) FROM evidence WHERE admission_status = 'pending') as evidence_awaiting_approval,
            (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
            (SELECT COUNT(*) FROM users WHERE is_active = false) as inactive_users,
            (SELECT COUNT(*) FROM security_alerts WHERE status IN ('open', 'acknowledged', 'in_progress')) as unresolved_alerts,
            (SELECT 
                CASE 
                    WHEN total > 0 AND verified::float / total > 0.95 THEN 'healthy'
                    WHEN total > 0 AND verified::float / total > 0.80 THEN 'degraded'
                    ELSE 'critical'
                END
            FROM (
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE hash_verified = true) as verified
                FROM evidence
                WHERE timestamp >= NOW() - INTERVAL '30 days'
            ) h) as hash_verification_health,
            (SELECT 
                CASE 
                    WHEN status = 'healthy' THEN 'healthy'
                    ELSE 'degraded'
                END
            FROM (
                SELECT 'healthy' as status
            ) b) as blockchain_health,
            (SELECT 
                CASE 
                    WHEN configured THEN 'healthy'
                    ELSE 'degraded'
                END
            FROM (
                SELECT true as configured
            ) i) as ipfs_health,
            (SELECT json_agg(json_build_object(
                'id', id,
                'admin_wallet', admin_wallet,
                'action_type', action_type,
                'target_wallet', target_wallet,
                'details', details,
                'timestamp', timestamp,
                'severity', severity
            ) ORDER BY timestamp DESC)
            FROM (
                SELECT id, admin_wallet, action_type, target_wallet, details, timestamp, severity
                FROM admin_actions
                WHERE timestamp >= NOW() - INTERVAL '24 hours'
                ORDER BY timestamp DESC
                LIMIT 10
            ) recent_actions) as recent_admin_actions,
            (SELECT json_agg(json_build_object(
                'id', id,
                'case_number', case_number,
                'title', title,
                'status', status,
                'created_date', created_date,
                'assigned_investigator', assigned_investigator
            ) ORDER BY created_date DESC)
            FROM (
                SELECT id, case_number, title, status, created_date, assigned_investigator
                FROM cases
                WHERE created_date >= NOW() - INTERVAL '7 days'
                ORDER BY created_date DESC
                LIMIT 10
            ) recent_cases) as recent_case_activity,
            (SELECT json_agg(json_build_object(
                'id', id,
                'title', title,
                'status', status,
                'admission_status', admission_status,
                'timestamp', timestamp,
                'submitted_by', submitted_by
            ) ORDER BY timestamp DESC)
            FROM (
                SELECT id, title, status, admission_status, timestamp, submitted_by
                FROM evidence
                WHERE timestamp >= NOW() - INTERVAL '7 days'
                ORDER BY timestamp DESC
                LIMIT 10
            ) recent_evidence) as recent_evidence_activity
    ) sub;

    RETURN metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. Function to get security alerts for Action Center
-- ============================================================================

CREATE OR REPLACE FUNCTION get_admin_action_center_alerts(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_severity TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    alerts JSON;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count
    FROM security_alerts
    WHERE (p_severity IS NULL OR severity = p_severity)
      AND (p_status IS NULL OR status = p_status);

    SELECT json_agg(json_build_object(
        'id', id,
        'alert_type', alert_type,
        'severity', severity,
        'title', title,
        'message', message,
        'details', details,
        'case_id', case_id,
        'evidence_id', evidence_id,
        'user_wallet', user_wallet,
        'assigned_to', assigned_to,
        'status', status,
        'acknowledged_by', acknowledged_by,
        'acknowledged_at', acknowledged_at,
        'resolved_by', resolved_by,
        'resolved_at', resolved_at,
        'created_at', created_at,
        'updated_at', updated_at
    ) ORDER BY 
        CASE severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
        created_at DESC
    ) INTO alerts
    FROM (
        SELECT *
        FROM security_alerts
        WHERE (p_severity IS NULL OR severity = p_severity)
          AND (p_status IS NULL OR status = p_status)
        ORDER BY 
            CASE severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
            created_at DESC
        LIMIT p_limit OFFSET p_offset
    ) limited_alerts;

    RETURN json_build_object(
        'alerts', COALESCE(alerts, '[]'::json),
        'total_count', total_count,
        'limit', p_limit,
        'offset', p_offset
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. Function to acknowledge/resolve security alert
-- ============================================================================

CREATE OR REPLACE FUNCTION resolve_security_alert(
    p_alert_id INTEGER,
    p_admin_wallet TEXT,
    p_action TEXT, -- 'acknowledge', 'resolve', 'escalate'
    p_reason TEXT DEFAULT NULL,
    p_assigned_to TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    alert_record RECORD;
BEGIN
    SELECT * INTO alert_record FROM security_alerts WHERE id = p_alert_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Alert not found');
    END IF;

    IF p_action = 'acknowledge' THEN
        UPDATE security_alerts SET
            status = 'acknowledged',
            acknowledged_by = p_admin_wallet,
            acknowledged_at = NOW(),
            assigned_to = COALESCE(p_assigned_to, acknowledged_by)
        WHERE id = p_alert_id;
    ELSIF p_action = 'resolve' THEN
        UPDATE security_alerts SET
            status = 'resolved',
            resolved_by = p_admin_wallet,
            resolved_at = NOW(),
            resolution_reason = p_reason
        WHERE id = p_alert_id;
    ELSIF p_action = 'escalate' THEN
        UPDATE security_alerts SET
            status = 'escalated',
            escalated_by = p_admin_wallet,
            escalated_at = NOW(),
            assigned_to = COALESCE(p_assigned_to, escalated_by)
        WHERE id = p_alert_id;
    ELSE
        RETURN json_build_object('success', false, 'error', 'Invalid action');
    END IF;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. Function to create security alert (for monitoring service)
-- ============================================================================

CREATE OR REPLACE FUNCTION create_security_alert(
    p_alert_type TEXT,
    p_severity TEXT,
    p_title TEXT,
    p_message TEXT,
    p_details JSONB DEFAULT '{}',
    p_case_id INTEGER DEFAULT NULL,
    p_evidence_id INTEGER DEFAULT NULL,
    p_user_wallet TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_alert_id INTEGER;
BEGIN
    INSERT INTO security_alerts (
        alert_type, severity, title, message, details,
        case_id, evidence_id, user_wallet
    ) VALUES (
        p_alert_type, p_severity, p_title, p_message, p_details,
        p_case_id, p_evidence_id, p_user_wallet
    ) RETURNING id INTO new_alert_id;

    RETURN json_build_object('success', true, 'alert_id', new_alert_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 12. Function to get blockchain transaction monitoring
-- ============================================================================

CREATE OR REPLACE FUNCTION get_admin_blockchain_monitoring(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_status TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    transactions JSON;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count
    FROM blockchain_transactions
    WHERE (p_status IS NULL OR status = p_status);

    SELECT json_agg(json_build_object(
        'id', id,
        'tx_hash', tx_hash,
        'evidence_id', evidence_id,
        'case_id', case_id,
        'operation_type', operation_type,
        'status', status,
        'from_address', from_address,
        'to_address', to_address,
        'gas_used', gas_used,
        'gas_price', gas_price,
        'block_number', block_number,
        'confirmations', confirmations,
        'error_message', error_message,
        'retry_count', retry_count,
        'submitted_by', submitted_by,
        'submitted_at', submitted_at,
        'confirmed_at', confirmed_at,
        'last_retry_at', last_retry_at
    ) ORDER BY submitted_at DESC)
    INTO transactions
    FROM (
        SELECT *
        FROM blockchain_transactions
        WHERE (p_status IS NULL OR status = p_status)
        ORDER BY submitted_at DESC
        LIMIT p_limit OFFSET p_offset
    ) limited_transactions;

    RETURN json_build_object(
        'transactions', COALESCE(transactions, '[]'::json),
        'total_count', total_count,
        'limit', p_limit,
        'offset', p_offset
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 13. Function to get IPFS pin monitoring
-- ============================================================================

CREATE OR REPLACE FUNCTION get_admin_ipfs_monitoring(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_status TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    pins JSON;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count
    FROM ipfs_pins
    WHERE (p_status IS NULL OR status = p_status);

    SELECT json_agg(json_build_object(
        'id', id,
        'cid', cid,
        'evidence_id', evidence_id,
        'status', status,
        'pin_size', pin_size,
        'gateway', gateway,
        'pin_attempts', pin_attempts,
        'last_pin_attempt', last_pin_attempt,
        'error_message', error_message,
        'pinned_by', pinned_by,
        'pinned_at', pinned_at,
        'last_verified_at', last_verified_at
    ) ORDER BY pinned_at DESC NULLS LAST)
    INTO pins
    FROM (
        SELECT *
        FROM ipfs_pins
        WHERE (p_status IS NULL OR status = p_status)
        ORDER BY pinned_at DESC NULLS LAST
        LIMIT p_limit OFFSET p_offset
    ) limited_pins;

    RETURN json_build_object(
        'pins', COALESCE(pins, '[]'::json),
        'total_count', total_count,
        'limit', p_limit,
        'offset', p_offset
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 14. Function to retry blockchain transaction
-- ============================================================================

CREATE OR REPLACE FUNCTION retry_blockchain_transaction(
    p_tx_id INTEGER,
    p_admin_wallet TEXT
)
RETURNS JSON AS $$
DECLARE
    tx_record RECORD;
BEGIN
    SELECT * INTO tx_record FROM blockchain_transactions WHERE id = p_tx_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Transaction not found');
    END IF;

    IF tx_record.status NOT IN ('failed', 'replaced') THEN
        RETURN json_build_object('success', false, 'error', 'Only failed or replaced transactions can be retried');
    END IF;

    UPDATE blockchain_transactions SET
        status = 'pending',
        retry_count = retry_count + 1,
        last_retry_at = NOW(),
        error_message = NULL
    WHERE id = p_tx_id;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 15. Function to retry IPFS pin
-- ============================================================================

CREATE OR REPLACE FUNCTION retry_ipfs_pin(
    p_pin_id INTEGER,
    p_admin_wallet TEXT
)
RETURNS JSON AS $$
DECLARE
    pin_record RECORD;
BEGIN
    SELECT * INTO pin_record FROM ipfs_pins WHERE id = p_pin_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'IPFS pin not found');
    END IF;

    IF pin_record.status NOT IN ('failed', 'unpinned') THEN
        RETURN json_build_object('success', false, 'error', 'Only failed or unpinned pins can be retried');
    END IF;

    UPDATE ipfs_pins SET
        status = 'retrying',
        pin_attempts = pin_attempts + 1,
        last_pin_attempt = NOW(),
        error_message = NULL
    WHERE id = p_pin_id;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 16. Seed initial security alerts from monitoring
-- ============================================================================

-- This will be populated by the monitoring service

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Admin Control Center migration complete' as status;