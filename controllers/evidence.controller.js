const supabase = require('../config/supabase');
const auditLoggerService = require('../services/auditLogger.service');

// Get evidence for a case
exports.getEvidenceByCase = async (req, res) => {
    try {
        const { caseId } = req.params;
        const user = req.user;

        const { data: evidence, error } = await supabase
            .from('evidence')
            .select(`
                *,
                uploaded_by:uploaded_by(full_name),
                current_holder:current_holder(full_name)
            `)
            .eq('case_id', req.caseData.id)
            .order('created_at', { ascending: false });

        if (error) {
            // Log failed access attempt - Issue #32
            await auditLoggerService.logAction({
                actionType: auditLoggerService.ACTION_TYPES.ACCESS,
                evidenceId: null,
                userId: user?.wallet_address || user?.id || req.headers['x-user-wallet'],
                userRole: user?.role || 'unknown',
                status: auditLoggerService.ACTION_STATUS.FAILURE,
                details: {
                    error: error.message,
                    evidenceCount: 0
                },
                ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress,
                caseId: caseId
            });
            throw error;
        }

        // Log evidence access - Issue #32
        if (evidence && evidence.length > 0) {
            await auditLoggerService.logAction({
                actionType: auditLoggerService.ACTION_TYPES.ACCESS,
                evidenceId: evidence.map(e => e.evidence_id).join(','), // Multiple evidence IDs
                userId: user?.wallet_address || user?.id || req.headers['x-user-wallet'],
                userRole: user?.role || 'unknown',
                status: auditLoggerService.ACTION_STATUS.SUCCESS,
                details: {
                    evidenceCount: evidence.length,
                    accessType: 'LIST_VIEW'
                },
                ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress,
                caseId: caseId
            });
        }

        res.json({ evidence: evidence || [] });
    } catch (error) {
        console.error('Get evidence error:', error);
        res.status(500).json({ error: 'Failed to get evidence' });
    }
};

// Upload evidence
exports.uploadEvidence = async (req, res) => {
    try {
        const { caseId } = req.params;
        const { title, description, evidenceType, fileHash, blockchainTxHash } = req.body;
        const user = req.user;

        // Generate evidence ID
        const evidenceId = `EVID-${caseId.split('-').pop()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

        const { data: newEvidence, error } = await supabase
            .from('evidence')
            .insert({
                evidence_id: evidenceId,
                case_id: req.caseData.id,
                title,
                description,
                evidence_type: evidenceType,
                file_hash: fileHash,
                blockchain_tx_hash: blockchainTxHash,
                uploaded_by: user.id,
                status: 'UPLOADED'
            })
            .select()
            .single();

        if (error) {
            // Log failed upload attempt - Issue #32
            await auditLoggerService.logAction({
                actionType: auditLoggerService.ACTION_TYPES.CREATE,
                evidenceId: null,
                userId: user.wallet_address || user.id,
                userRole: user.role,
                status: auditLoggerService.ACTION_STATUS.FAILURE,
                details: {
                    title,
                    evidenceType,
                    error: error.message,
                    fileHash
                },
                ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress,
                caseId: caseId
            });
            throw error;
        }

        // Log successful evidence upload using centralized audit logger - Issue #32
        await auditLoggerService.logAction({
            actionType: auditLoggerService.ACTION_TYPES.CREATE,
            evidenceId: evidenceId,
            userId: user.wallet_address || user.id,
            userRole: user.role,
            status: auditLoggerService.ACTION_STATUS.SUCCESS,
            details: {
                title,
                description: description?.substring(0, 200), // Truncate for logging
                evidenceType,
                fileHash,
                blockchainTxHash,
                internalId: newEvidence.id
            },
            ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress,
            caseId: caseId
        });

        // Also log to legacy audit_logs table for backward compatibility
        await supabase
            .from('audit_logs')
            .insert({
                user_id: user.id,
                action_type: 'EVIDENCE_UPLOADED',
                entity_type: 'evidence',
                entity_id: newEvidence.id,
                new_values: { evidence_id: evidenceId, title, evidence_type: evidenceType }
            });

        res.json({ success: true, evidence: newEvidence });
    } catch (error) {
        console.error('Upload evidence error:', error);
        res.status(500).json({ error: 'Failed to upload evidence' });
    }
};
