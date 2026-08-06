const { supabase } = require('../config');
const integratedEvidenceService = require('../services/integratedEvidenceService');
const blockchainService = require('../services/blockchain/blockchainService');

/**
 * SECURITY FIX: Shared helper: verify user is active admin or auditor
 * Now uses the cryptographically verified identity from req.authenticatedWallet.
 * Discontinued reliance on client-supplied userWallet fields.
 */
const authorizeAdminOrAuditor = async (req, res) => {
  const wallet = req.authenticatedWallet;
  
  if (!wallet) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return null;
  }

  const { data: user, error: userError } = (await supabase
    .from('users')
    .select('id, role')
    .eq('wallet_address', wallet.toLowerCase())
    .eq('is_active', true)
    .single()) || {};

  if (userError || !user || !['admin', 'auditor'].includes(user.role)) {
    res.status(403).json({ success: false, error: 'Unauthorized: Admin or Auditor role required' });
    return null;
  }

  return user;
};

// Verify evidence hash against blockchain
const verifyEvidenceHash = async (req, res) => {
  try {
    const { id } = req.params;
    
    // SECURITY FIX: Authorization check using verified session
    const user = await authorizeAdminOrAuditor(req, res);
    if (!user) return;

    // BUG FIX: Validate ID
    const safeId = parseInt(id, 10);
    if (isNaN(safeId)) {
      return res.status(400).json({ success: false, error: 'Invalid evidence ID' });
    }

    const { data: evidence, error } = (await supabase
      .from('evidence')
      .select('id, blockchain_tx_hash')
      .eq('id', safeId)
      .single()) || {};

    if (error || !evidence) {
      return res.status(404).json({ success: false, error: 'Evidence not found' });
    }

    const verification = await integratedEvidenceService.verifyEvidence(safeId);

    res.json({
      success: true,
      data: {
        valid: verification.overallValid,
        hash: verification.databaseHash,
        blockchainVerified: verification.blockchainVerified,
        ipfsVerified: verification.ipfsVerified,
        explorerUrl: evidence.blockchain_tx_hash
          ? blockchainService.getExplorerUrl(evidence.blockchain_tx_hash)
          : null,
        errors: verification.errors,
      }
    });
  } catch (error) {
    console.error('Verify evidence error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to verify evidence' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// Get blockchain proof for specific evidence
const getBlockchainProof = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await authorizeAdminOrAuditor(req, res);
    if (!user) return;

    const safeId = parseInt(id, 10);
    if (isNaN(safeId)) {
      return res.status(400).json({ success: false, error: 'Invalid evidence ID' });
    }

    const { data: evidence, error } = (await supabase
      .from('evidence')
      .select('id, timestamp, blockchain_tx_hash')
      .eq('id', safeId)
      .single()) || {};

    if (error || !evidence) {
      return res.status(404).json({ success: false, error: 'Evidence not found' });
    }

    const proof = await integratedEvidenceService.getEvidenceProof(safeId);

    res.json({
      success: true,
      data: {
        ...proof,
        verification_status: proof.verificationStatus || proof.status || proof.result || 'unknown',
        blockchain_network: proof.blockchain_network || proof.network || 'Polygon',
        verification_method: proof.verification_method || proof.method || 'SHA-256',
        chain_of_custody: {
          created: evidence.timestamp,
          last_accessed: new Date().toISOString(),
          ...proof.chain_of_custody,
        },
        integrity_check: {
          status:
            typeof proof.integrity?.status === 'string' && proof.integrity.status
              ? proof.integrity.status
              : typeof proof.integrity === 'string'
                ? proof.integrity
                : 'unknown',
          verified_at: proof.verificationTimestamp || proof.verified_at || null,
        },
      },
    });
  } catch (error) {
    console.error('Blockchain proof error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to retrieve blockchain proof' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// Verify file integrity against blockchain (Available to users who can provide hash/id)
const verifyIntegrity = async (req, res) => {
  try {
    const { fileName, fileSize, calculatedHash, evidenceId } = req.body;

    if (!calculatedHash || typeof calculatedHash !== 'string' || calculatedHash.trim() === '') {
      return res
        .status(400)
        .json({ success: false, error: 'calculatedHash is required and must be a non-empty string' });
    }

    let evidence = null;
    let safeEvidence = null;
    let verified = false;
    let blockchainHash = null;

    if (evidenceId) {
      const safeId = parseInt(evidenceId, 10);
      if (isNaN(safeId)) {
        return res.status(400).json({ success: false, error: 'Invalid evidenceId' });
      }

      const { data: evidenceData, error: errorById } = (await supabase
        .from('evidence')
        .select('*')
        .eq('id', safeId)
        .single()) || {};

      if (errorById && errorById.code !== 'PGRST116') {
        throw errorById;
      }

      if (evidenceData) {
        evidence = evidenceData;
        blockchainHash = evidenceData.hash;
        verified = calculatedHash === blockchainHash;
      }
    } else {
      // Find by hash
      const { data: evidenceData, error: errorByHash } = (await supabase
        .from('evidence')
        .select('*')
        .eq('hash', calculatedHash)
        .single()) || {};

      if (errorByHash && errorByHash.code !== 'PGRST116') {
        throw errorByHash;
      }

      if (evidenceData) {
        evidence = evidenceData;
        blockchainHash = evidenceData.hash;
        verified = true;
      }
    }

    if (evidence) {
      safeEvidence = {
        id: evidence.id,
        hash: evidence.hash,
        timestamp: evidence.timestamp,
        case_id: evidence.case_id,
        name: evidence.name,
      };
    }

    // Audit log
    const { error: auditLogError } = (await supabase.from('activity_logs').insert({
      user_id: req.authenticatedWallet || 'anonymous_verification',
      action: 'evidence_verification',
      details: JSON.stringify({
        fileName: fileName || 'unknown',
        fileSize: fileSize || 0,
        calculatedHash: calculatedHash.substring(0, 16) + '...',
        verified,
        evidenceId,
      }),
      timestamp: new Date().toISOString(),
    })) || {};
    
    if (auditLogError) {
      console.error('Failed to log verification activity:', auditLogError);
    }

    res.json({
      success: true,
      data: {
        verified,
        calculatedHash,
        blockchainHash,
        evidence: safeEvidence,
        verificationUrl: `${req.protocol}://${req.get('host')}/verify/${encodeURIComponent(calculatedHash)}`,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Verification failed:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Verification failed' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// Generate verification certificate
const generateVerificationCertificate = async (req, res) => {
  try {
    const { evidenceId } = req.body;

    const user = await authorizeAdminOrAuditor(req, res);
    if (!user) return;

    const safeId = parseInt(evidenceId, 10);
    if (!evidenceId || isNaN(safeId)) {
      return res.status(400).json({ success: false, error: 'Valid numeric evidenceId is required' });
    }

    const { data: evidence, error } = (await supabase
      .from('evidence')
      .select('*')
      .eq('id', safeId)
      .single()) || {};

    if (error || !evidence) {
      return res.status(404).json({ success: false, error: 'Evidence not found' });
    }

    const verification = await integratedEvidenceService.verifyEvidence(safeId);
    const verificationResult = verification.overallValid ? 'PASSED' : 'FAILED';
    const validTimestamp = new Date();
    const fileName = evidence.title || evidence.file_name || evidence.name || `evidence_${safeId}`;

    // Sanitize fileName for Content-Disposition to prevent header injection
    const sanitizedFileName = (fileName || 'certificate')
      .replace(/[\r\n"]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 100);

    const textContent = `
EVIDENCE VERIFICATION CERTIFICATE

Certificate ID: CERT-${Date.now()}
File Name: ${sanitizedFileName}
Verification Result: ${verificationResult.toUpperCase()}
Verification Date: ${validTimestamp.toISOString()}
Issued By: EVID-DGC Blockchain Evidence System

This certificate confirms the integrity verification of the above evidence file.
        `;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="verification_certificate_${sanitizedFileName}_${Date.now()}.txt"`,
    );
    res.send(Buffer.from(textContent));
  } catch (error) {
    console.error('Certificate generation error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to generate certificate' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// Public verification endpoint
const publicVerify = async (req, res) => {
  try {
    const { hash } = req.params;

    if (!hash || typeof hash !== 'string') {
      return res.status(400).json({ success: false, error: 'Hash is required' });
    }

    const { data: evidence, error } = (await supabase
      .from('evidence')
      .select('id, title, case_id, timestamp, submitted_by, hash')
      .eq('hash', hash)
      .single()) || {};

    if (error || !evidence) {
      return res.status(404).json({ success: false, error: 'Evidence not found' });
    }

    res.json({
      success: true,
      data: {
        verified: true,
        evidence: {
          id: evidence.id,
          title: evidence.title,
          case_id: evidence.case_id,
          timestamp: evidence.timestamp,
          submitted_by: evidence.submitted_by
            ? evidence.submitted_by.substring(0, 8) + '...'
            : 'unknown',
          hash: evidence.hash,
        },
        verification_timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Public verification error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Verification failed' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// Get verification history
const getVerificationHistory = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const user = await authorizeAdminOrAuditor(req, res);
    if (!user) return;

    const parsedLimit = parseInt(limit, 10);
    const sanitizedLimit =
      !isNaN(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 500) : 100;

    const { data: history, error } = (await supabase
      .from('activity_logs')
      .select('*')
      .eq('action', 'evidence_verification')
      .order('timestamp', { ascending: false })
      .limit(sanitizedLimit)) || {};

    if (error) throw error;

    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Verification history error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to get verification history' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// Get multiple evidence items for comparison
const compareEvidence = async (req, res) => {
  try {
    const { ids } = req.query;

    const user = await authorizeAdminOrAuditor(req, res);
    if (!user) return;

    if (!ids) {
      return res.status(400).json({ success: false, error: 'Evidence IDs are required' });
    }

    const evidenceIds = ids
      .split(',')
      .map((id) => id.trim())
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id) && id > 0);

    if (evidenceIds.length < 2) {
      return res
        .status(400)
        .json({ success: false, error: 'Please provide at least 2 valid numeric evidence IDs' });
    }

    if (evidenceIds.length > 4) {
      return res.status(400).json({ success: false, error: 'Please provide 2-4 evidence IDs' });
    }

    const { data: evidenceItems, error } = (await supabase
      .from('evidence')
      .select('id, title, case_id, type, timestamp, hash, blockchain_tx_hash, ipfs_cid')
      .in('id', evidenceIds)) || {};

    if (error) throw error;

    if (!evidenceItems || evidenceItems.length === 0) {
      return res.status(404).json({ success: false, error: 'No evidence found with provided IDs' });
    }

    const enrichedEvidence = evidenceItems.map((item) => ({
      ...item,
      has_blockchain_tx: !!item.blockchain_tx_hash,
      comparison_requested_at: new Date().toISOString(),
    }));

    res.json({
      success: true,
      data: enrichedEvidence,
      count: enrichedEvidence.length
    });
  } catch (error) {
    console.error('Evidence comparison error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to fetch evidence for comparison' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// Create comparison report
const createComparisonReport = async (req, res) => {
  try {
    const { evidenceIds, reportData } = req.body;
    const generatedBy = req.authenticatedWallet;

    const user = await authorizeAdminOrAuditor(req, res);
    if (!user) return;

    if (!evidenceIds || !Array.isArray(evidenceIds) || evidenceIds.length < 2) {
      return res.status(400).json({ success: false, error: 'At least 2 evidence IDs required' });
    }

    const sanitizedIds = evidenceIds
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id) && id > 0);

    if (sanitizedIds.length < 2) {
      return res.status(400).json({ success: false, error: 'At least 2 valid numeric evidence IDs required' });
    }

    const reportRecord = {
      evidence_ids: sanitizedIds,
      report_data: reportData || {},
      generated_by: generatedBy,
      generated_at: new Date().toISOString(),
      report_type: 'evidence_comparison',
    };

    const { data: insertedReport, error: insertError } = (await supabase
      .from('comparison_reports')
      .insert(reportRecord)
      .select()
      .single()) || {};

    if (insertError) throw insertError;

    // Audit log
    await supabase.from('activity_logs').insert({
      user_id: generatedBy,
      action: 'evidence_comparison_report_generated',
      details: JSON.stringify({
        evidenceCount: sanitizedIds.length,
        reportId: insertedReport.id
      }),
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Comparison report generated successfully',
      data: insertedReport,
    });
  } catch (error) {
    console.error('Comparison report error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to generate comparison report' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

module.exports = {
  verifyEvidenceHash,
  getBlockchainProof,
  verifyIntegrity,
  generateVerificationCertificate,
  publicVerify,
  getVerificationHistory,
  compareEvidence,
  createComparisonReport,
};
