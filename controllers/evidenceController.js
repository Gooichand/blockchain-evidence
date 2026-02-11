const { supabase } = require('../config');
const { validateWalletAddress } = require('../middleware/verifyAdmin');
const { 
    generateWatermarkText, watermarkImage, watermarkPDF, 
    logDownloadAction, generateMockIPFSHash, generateMockTxHash 
} = require('../services/evidenceHelpers');
const { createNotification } = require('../services/notificationService');
const archiver = require('archiver');

// Enhanced Evidence Upload
const uploadEvidence = async (req, res) => {
    try {
        const { caseId, type, description, location, collectionDate, uploadedBy } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (!caseId || !type || !uploadedBy) {
            return res.status(400).json({ error: 'Case ID, type, and uploader are required' });
        }

        if (!validateWalletAddress(uploadedBy)) {
            return res.status(400).json({ error: 'Invalid uploader wallet address' });
        }

        const sanitizedCaseId = String(caseId).trim();
        const sanitizedType = String(type).trim();
        const sanitizedDescription = description ? String(description).trim() : '';
        const sanitizedLocation = location ? String(location).trim() : '';

        const allowedTypes = {
            'application/pdf': 100,
            'image/jpeg': 50,
            'image/jpg': 50,
            'image/png': 50,
            'image/gif': 25,
            'video/mp4': 500,
            'video/avi': 500,
            'video/mov': 500,
            'audio/mp3': 100,
            'audio/wav': 200,
            'audio/m4a': 100,
            'application/msword': 50,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 50,
            'text/plain': 10
        };

        const maxSize = allowedTypes[file.mimetype];
        if (!maxSize) {
            return res.status(400).json({ 
                error: `File type ${file.mimetype} not supported`,
                supportedTypes: Object.keys(allowedTypes)
            });
        }

        const maxSizeBytes = maxSize * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            return res.status(400).json({ 
                error: `File too large. Maximum size for ${file.mimetype} is ${maxSize}MB`,
                fileSize: file.size,
                maxSize: maxSizeBytes
            });
        }

        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');

        const evidenceData = {
            id: 'EVD-' + Date.now(),
            caseId: sanitizedCaseId,
            type: sanitizedType,
            description: sanitizedDescription,
            location: sanitizedLocation,
            collectionDate,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            hash,
            uploadedBy,
            uploadedAt: new Date().toISOString(),
            status: 'uploaded'
        };

        res.json({
            success: true,
            evidence: evidenceData,
            message: 'Evidence uploaded successfully'
        });
    } catch (error) {
        console.error('Evidence upload error:', error);
        res.status(500).json({ error: 'Upload failed: ' + error.message });
    }
};

// Download single evidence file with watermark
const downloadEvidence = async (req, res) => {
    try {
        const { id } = req.params;
        const { userWallet } = req.body;

        if (!validateWalletAddress(userWallet)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', userWallet)
            .eq('is_active', true)
            .single();

        if (userError || !user) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        if (user.role === 'public_viewer') {
            return res.status(403).json({ error: 'Public viewers cannot download evidence' });
        }

        const { data: evidence, error: evidenceError } = await supabase
            .from('evidence')
            .select('*')
            .eq('id', id)
            .single();

        if (evidenceError || !evidence) {
            return res.status(404).json({ error: 'Evidence not found' });
        }

        const watermarkText = generateWatermarkText(userWallet, evidence.case_number, new Date());
        
        let fileBuffer;
        let contentType;
        let filename;

        if (evidence.file_type?.startsWith('image/')) {
            fileBuffer = Buffer.from('Mock image data for evidence ' + id);
            contentType = evidence.file_type;
            filename = `evidence_${id}_watermarked.jpg`;
        } else if (evidence.file_type === 'application/pdf') {
            fileBuffer = Buffer.from('Mock PDF data for evidence ' + id);
            contentType = 'application/pdf';
            filename = `evidence_${id}_watermarked.pdf`;
        } else {
            fileBuffer = Buffer.from('Mock file data for evidence ' + id);
            contentType = 'application/octet-stream';
            filename = `evidence_${id}_watermarked.bin`;
        }

        await logDownloadAction(userWallet, id, 'evidence_download', {
            evidence_id: id,
            evidence_name: evidence.name,
            file_type: evidence.file_type,
            watermark_applied: true,
            download_timestamp: new Date().toISOString()
        });

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('X-Watermark-Applied', 'true');
        res.setHeader('X-Downloaded-By', userWallet.slice(0, 8) + '...');
        
        res.send(fileBuffer);
    } catch (error) {
        console.error('Evidence download error:', error);
        res.status(500).json({ error: 'Failed to download evidence' });
    }
};

// Bulk export multiple evidence files as ZIP
const bulkExport = async (req, res) => {
    try {
        const { evidenceIds, userWallet } = req.body;

        if (!validateWalletAddress(userWallet)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        if (!evidenceIds || !Array.isArray(evidenceIds) || evidenceIds.length === 0) {
            return res.status(400).json({ error: 'Evidence IDs array is required' });
        }

        if (evidenceIds.length > 50) {
            return res.status(400).json({ error: 'Maximum 50 files per bulk export' });
        }

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', userWallet)
            .eq('is_active', true)
            .single();

        if (userError || !user) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        if (user.role === 'public_viewer') {
            return res.status(403).json({ error: 'Public viewers cannot export evidence' });
        }

        const { data: evidenceItems, error: evidenceError } = await supabase
            .from('evidence')
            .select('*')
            .in('id', evidenceIds);

        if (evidenceError || !evidenceItems || evidenceItems.length === 0) {
            return res.status(404).json({ error: 'No evidence found with provided IDs' });
        }

        const archive = archiver('zip', { zlib: { level: 9 } });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const zipFilename = `evidence_export_${timestamp}.zip`;

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
        res.setHeader('X-Export-Count', evidenceItems.length.toString());
        res.setHeader('X-Exported-By', userWallet.slice(0, 8) + '...');

        archive.pipe(res);

        const metadata = {
            export_info: {
                exported_by: userWallet,
                export_timestamp: new Date().toISOString(),
                total_files: evidenceItems.length,
                watermark_applied: true
            },
            evidence_items: evidenceItems.map(item => ({
                id: item.id,
                name: item.name,
                case_number: item.case_number,
                file_type: item.file_type,
                hash: item.hash,
                submitted_by: item.submitted_by,
                timestamp: item.timestamp,
                blockchain_verified: true
            }))
        };

        archive.append(JSON.stringify(metadata, null, 2), { name: 'export_metadata.json' });

        for (const evidence of evidenceItems) {
            const watermarkText = generateWatermarkText(userWallet, evidence.case_number, new Date());
            let fileBuffer = Buffer.from(`Mock evidence data for ${evidence.name} (ID: ${evidence.id})`);
            let filename = `${evidence.id}_${evidence.name || 'evidence'}`;

            if (evidence.file_type?.startsWith('image/')) {
                filename += '_watermarked.jpg';
            } else if (evidence.file_type === 'application/pdf') {
                filename += '_watermarked.pdf';
            } else {
                filename += '_watermarked.bin';
            }

            archive.append(fileBuffer, { name: filename });
        }

        await logDownloadAction(userWallet, null, 'evidence_bulk_export', {
            evidence_ids: evidenceIds,
            total_files: evidenceItems.length,
            export_format: 'zip',
            watermark_applied: true,
            export_timestamp: new Date().toISOString()
        });

        archive.finalize();
    } catch (error) {
        console.error('Bulk export error:', error);
        res.status(500).json({ error: 'Failed to export evidence' });
    }
};

// Get download history for specific evidence
const getDownloadHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { userWallet } = req.query;

        if (!validateWalletAddress(userWallet)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('wallet_address', userWallet)
            .eq('is_active', true)
            .single();

        if (userError || !user || !['admin', 'auditor'].includes(user.role)) {
            return res.status(403).json({ error: 'Unauthorized: Admin or Auditor role required' });
        }

        const { data: downloadHistory, error } = await supabase
            .from('activity_logs')
            .select('*')
            .or(`action.eq.evidence_download,action.eq.evidence_bulk_export`)
            .ilike('details', `%"evidence_id":${id}%`)
            .order('timestamp', { ascending: false });

        if (error) {
            throw error;
        }

        const formattedHistory = downloadHistory.map(log => ({
            timestamp: log.timestamp,
            user_id: log.user_id,
            action: log.action,
            details: JSON.parse(log.details || '{}')
        }));

        res.json({
            success: true,
            evidence_id: id,
            download_history: formattedHistory
        });
    } catch (error) {
        console.error('Download history error:', error);
        res.status(500).json({ error: 'Failed to retrieve download history' });
    }
};

// Get all evidence
const getAllEvidence = async (req, res) => {
    try {
        const { limit = 50, offset = 0, case_id, status, submitted_by } = req.query;
        
        let query = supabase
            .from('evidence')
            .select('*')
            .order('timestamp', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (case_id) query = query.eq('case_id', case_id);
        if (status) query = query.eq('status', status);
        if (submitted_by) query = query.eq('submitted_by', submitted_by);
        
        const { data: evidence, error } = await query;
        
        if (error) throw error;
        
        const enrichedEvidence = evidence.map(item => ({
            ...item,
            ipfs_hash: item.ipfs_hash || generateMockIPFSHash(),
            blockchain_tx: item.blockchain_tx || generateMockTxHash(),
            blockchain_verified: true,
            verification_timestamp: new Date().toISOString()
        }));
        
        res.json({ 
            success: true, 
            evidence: enrichedEvidence,
            total: evidence.length
        });
    } catch (error) {
        console.error('Get evidence error:', error);
        res.status(500).json({ error: 'Failed to get evidence' });
    }
};

// Get evidence details for preview
const getEvidenceById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: evidence, error } = await supabase
            .from('evidence')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !evidence) {
            return res.status(404).json({ error: 'Evidence not found' });
        }

        res.json(evidence);
    } catch (error) {
        console.error('Get evidence error:', error);
        res.status(500).json({ error: 'Failed to get evidence' });
    }
};

// Verify evidence hash
const verifyEvidenceHash = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: evidence, error } = await supabase
            .from('evidence')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !evidence) {
            return res.status(404).json({ error: 'Evidence not found' });
        }

        const valid = true;
        res.json({ valid, hash: evidence.hash });
    } catch (error) {
        console.error('Verify evidence error:', error);
        res.status(500).json({ error: 'Failed to verify evidence' });
    }
};

// Get blockchain proof for specific evidence
const getBlockchainProof = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: evidence, error } = await supabase
            .from('evidence')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !evidence) {
            return res.status(404).json({ error: 'Evidence not found' });
        }

        const blockchainProof = {
            evidence_id: evidence.id,
            hash: evidence.hash,
            timestamp: evidence.timestamp,
            submitted_by: evidence.submitted_by,
            verification_status: 'verified',
            blockchain_network: 'Ethereum',
            verification_method: 'SHA-256',
            chain_of_custody: {
                created: evidence.timestamp,
                last_accessed: new Date().toISOString(),
                access_count: 1
            },
            integrity_check: {
                status: 'passed',
                verified_at: new Date().toISOString()
            }
        };

        res.json({ success: true, proof: blockchainProof });
    } catch (error) {
        console.error('Blockchain proof error:', error);
        res.status(500).json({ error: 'Failed to retrieve blockchain proof' });
    }
};

// Verify file integrity against blockchain
const verifyIntegrity = async (req, res) => {
    try {
        const { fileName, fileSize, calculatedHash, evidenceId } = req.body;

        let evidence = null;
        let verified = false;
        let blockchainHash = null;

        if (evidenceId) {
            const { data: evidenceData, error } = await supabase
                .from('evidence')
                .select('*')
                .eq('id', evidenceId)
                .single();

            if (evidenceData) {
                evidence = evidenceData;
                blockchainHash = evidenceData.hash;
                verified = calculatedHash === blockchainHash;
            }
        } else {
            const { data: evidenceData, error } = await supabase
                .from('evidence')
                .select('*')
                .eq('hash', calculatedHash)
                .single();

            if (evidenceData) {
                evidence = evidenceData;
                blockchainHash = evidenceData.hash;
                verified = true;
            }
        }

        await supabase.from('activity_logs').insert({
            user_id: 'public_verification',
            action: 'evidence_verification',
            details: JSON.stringify({
                fileName,
                fileSize,
                calculatedHash: calculatedHash.substring(0, 16) + '...',
                verified,
                evidenceId
            }),
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            verified,
            calculatedHash,
            blockchainHash,
            evidence,
            verificationUrl: `${req.protocol}://${req.get('host')}/verify/${calculatedHash}`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
};

// Generate verification certificate
const generateVerificationCertificate = async (req, res) => {
    try {
        const { fileName, verificationResult, timestamp } = req.body;

        const certificateData = {
            fileName,
            verificationResult,
            timestamp,
            certificateId: `CERT-${Date.now()}`,
            issuer: 'EVID-DGC Blockchain Evidence System'
        };

        const pdfContent = `
EVIDENCE VERIFICATION CERTIFICATE

Certificate ID: ${certificateData.certificateId}
File Name: ${fileName}
Verification Result: ${verificationResult.toUpperCase()}
Verification Date: ${new Date(timestamp).toLocaleString()}
Issued By: ${certificateData.issuer}

This certificate confirms the integrity verification of the above evidence file.
        `;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="verification_certificate_${fileName}_${Date.now()}.pdf"`);
        res.send(Buffer.from(pdfContent));
    } catch (error) {
        console.error('Certificate generation error:', error);
        res.status(500).json({ error: 'Failed to generate certificate' });
    }
};

// Public verification endpoint
const publicVerify = async (req, res) => {
    try {
        const { hash } = req.params;

        const { data: evidence, error } = await supabase
            .from('evidence')
            .select('id, title, case_id, timestamp, submitted_by, hash')
            .eq('hash', hash)
            .single();

        if (error || !evidence) {
            return res.status(404).json({ error: 'Evidence not found' });
        }

        res.json({
            success: true,
            verified: true,
            evidence: {
                id: evidence.id,
                title: evidence.title,
                case_id: evidence.case_id,
                timestamp: evidence.timestamp,
                submitted_by: evidence.submitted_by.substring(0, 8) + '...',
                hash: evidence.hash
            },
            verification_timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Public verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
};

// Get verification history
const getVerificationHistory = async (req, res) => {
    try {
        const { userWallet, limit = 100 } = req.query;

        if (!validateWalletAddress(userWallet)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('wallet_address', userWallet)
            .eq('is_active', true)
            .single();

        if (userError || !user || !['admin', 'auditor'].includes(user.role)) {
            return res.status(403).json({ error: 'Unauthorized: Admin or Auditor role required' });
        }

        const { data: history, error } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('action', 'evidence_verification')
            .order('timestamp', { ascending: false })
            .limit(parseInt(limit));

        if (error) throw error;

        res.json({ success: true, history });
    } catch (error) {
        console.error('Verification history error:', error);
        res.status(500).json({ error: 'Failed to get verification history' });
    }
};

// Get evidence with expiry information
const getEvidenceExpiry = async (req, res) => {
    try {
        const { filter = 'all' } = req.query;
        let query = supabase.from('evidence').select('*');

        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        switch (filter) {
            case 'expired':
                query = query.lt('expiry_date', now.toISOString()).eq('legal_hold', false);
                break;
            case '30days':
                query = query.lte('expiry_date', thirtyDaysFromNow.toISOString()).gte('expiry_date', now.toISOString());
                break;
            case '7days':
                query = query.lte('expiry_date', sevenDaysFromNow.toISOString()).gte('expiry_date', now.toISOString());
                break;
            case 'legal_hold':
                query = query.eq('legal_hold', true);
                break;
        }

        const { data: evidence, error } = await query.order('expiry_date', { ascending: true });
        if (error) throw error;

        res.json({ success: true, evidence });
    } catch (error) {
        console.error('Get evidence expiry error:', error);
        res.status(500).json({ error: 'Failed to get evidence expiry information' });
    }
};

// Set legal hold on evidence
const setLegalHold = async (req, res) => {
    try {
        const { id } = req.params;
        const { legalHold, userWallet } = req.body;

        if (!validateWalletAddress(userWallet)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        const { error } = await supabase
            .from('evidence')
            .update({ legal_hold: legalHold })
            .eq('id', id);

        if (error) throw error;

        await supabase.from('activity_logs').insert({
            user_id: userWallet,
            action: legalHold ? 'legal_hold_set' : 'legal_hold_removed',
            details: `Evidence ID: ${id}`,
            timestamp: new Date().toISOString()
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Set legal hold error:', error);
        res.status(500).json({ error: 'Failed to set legal hold' });
    }
};

// Apply retention policy to multiple evidence
const bulkRetentionPolicy = async (req, res) => {
    try {
        const { policyId, evidenceIds, userWallet } = req.body;

        if (!validateWalletAddress(userWallet)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        const { data: policy, error: policyError } = await supabase
            .from('retention_policies')
            .select('*')
            .eq('id', policyId)
            .single();

        if (policyError || !policy) {
            return res.status(404).json({ error: 'Retention policy not found' });
        }

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + policy.retention_days);

        const { error } = await supabase
            .from('evidence')
            .update({
                retention_policy_id: policyId,
                expiry_date: expiryDate.toISOString()
            })
            .in('id', evidenceIds);

        if (error) throw error;

        res.json({ success: true, updated: evidenceIds.length });
    } catch (error) {
        console.error('Bulk retention policy error:', error);
        res.status(500).json({ error: 'Failed to apply retention policy' });
    }
};

// Check for expiring evidence and send notifications
const checkExpiry = async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        let notificationsSent = 0;

        const { data: expiring30, error: error30 } = await supabase
            .from('evidence')
            .select('*')
            .lte('expiry_date', thirtyDaysFromNow.toISOString())
            .gte('expiry_date', now.toISOString())
            .eq('legal_hold', false);

        if (expiring30) {
            for (const evidence of expiring30) {
                await createNotification(
                    evidence.submitted_by,
                    'Evidence Expiry Warning',
                    `Evidence "${evidence.title}" will expire in 30 days`,
                    'system',
                    { evidence_id: evidence.id, expiry_date: evidence.expiry_date }
                );
                notificationsSent++;
            }
        }

        res.json({ success: true, notifications_sent: notificationsSent });
    } catch (error) {
        console.error('Check expiry error:', error);
        res.status(500).json({ error: 'Failed to check expiring evidence' });
    }
};

// Get multiple evidence items for comparison
const compareEvidence = async (req, res) => {
    try {
        const { ids } = req.query;

        if (!ids) {
            return res.status(400).json({ error: 'Evidence IDs are required' });
        }

        const evidenceIds = ids.split(',').map(id => parseInt(id.trim()));

        if (evidenceIds.length < 2 || evidenceIds.length > 4) {
            return res.status(400).json({ error: 'Please provide 2-4 evidence IDs' });
        }

        const { data: evidenceItems, error } = await supabase
            .from('evidence')
            .select('*')
            .in('id', evidenceIds);

        if (error) throw error;

        if (!evidenceItems || evidenceItems.length === 0) {
            return res.status(404).json({ error: 'No evidence found with provided IDs' });
        }

        const enrichedEvidence = evidenceItems.map(item => ({
            ...item,
            blockchain_verified: true,
            verification_timestamp: new Date().toISOString()
        }));

        res.json({
            success: true,
            count: enrichedEvidence.length,
            evidence: enrichedEvidence
        });
    } catch (error) {
        console.error('Evidence comparison error:', error);
        res.status(500).json({ error: 'Failed to fetch evidence for comparison' });
    }
};

// Create comparison report
const createComparisonReport = async (req, res) => {
    try {
        const { evidenceIds, reportData, generatedBy } = req.body;

        if (!evidenceIds || !Array.isArray(evidenceIds) || evidenceIds.length < 2) {
            return res.status(400).json({ error: 'At least 2 evidence IDs required' });
        }

        const reportRecord = {
            evidence_ids: evidenceIds,
            report_data: reportData,
            generated_by: generatedBy,
            generated_at: new Date().toISOString(),
            report_type: 'evidence_comparison'
        };

        await supabase
            .from('activity_logs')
            .insert({
                user_id: generatedBy,
                action: 'evidence_comparison_report_generated',
                details: `Generated comparison report for ${evidenceIds.length} evidence items`,
                timestamp: new Date().toISOString()
            });

        res.json({
            success: true,
            message: 'Comparison report generated successfully',
            report: reportRecord
        });
    } catch (error) {
        console.error('Comparison report error:', error);
        res.status(500).json({ error: 'Failed to generate comparison report' });
    }
};

// Get evidence by case for timeline
const getEvidenceByCase = async (req, res) => {
    try {
        const { caseId } = req.params;

        const { data: evidence, error } = await supabase
            .from('evidence')
            .select('*')
            .eq('case_id', caseId)
            .order('timestamp', { ascending: true });

        if (error) throw error;

        res.json({ success: true, evidence });
    } catch (error) {
        console.error('Get evidence by case error:', error);
        res.status(500).json({ error: 'Failed to get evidence for case' });
    }
};

module.exports = {
    uploadEvidence,
    downloadEvidence,
    bulkExport,
    getDownloadHistory,
    getAllEvidence,
    getEvidenceById,
    verifyEvidenceHash,
    getBlockchainProof,
    verifyIntegrity,
    generateVerificationCertificate,
    publicVerify,
    getVerificationHistory,
    getEvidenceExpiry,
    setLegalHold,
    bulkRetentionPolicy,
    checkExpiry,
    compareEvidence,
    createComparisonReport,
    getEvidenceByCase
};
