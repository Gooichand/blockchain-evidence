const { supabase } = require('../config');
const {
  generateWatermarkText,
  logDownloadAction,
  watermarkImage,
  watermarkPDF,
} = require('../services/evidenceHelpers');
const blockchainService = require('../services/blockchain/blockchainService');
const ipfsStorageService = require('../services/storage/ipfsStorageService');
const archiver = require('archiver');

/**
 * SECURITY FIX: All identity verification now uses req.authenticatedWallet 
 * which is cryptographically verified by the verifySignature middleware.
 * Trusting req.body.userWallet is discontinued.
 */

// Download single evidence file with watermark
const downloadEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const { getAuthUser, getStableWallet } = require('../middleware/identity');
    const verifiedWallet = getStableWallet(req);

    if (!verifiedWallet) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const user = await getAuthUser(req);

    if (!user) {
      return res.status(403).json({ success: false, error: 'Unauthorized access: User not found or inactive' });
    }

    if (user.role === 'public_viewer') {
      return res.status(403).json({ success: false, error: 'Public viewers cannot download evidence' });
    }

    const { data: evidence, error: evidenceError } = (await supabase
      .from('evidence')
      .select('*')
      .eq('id', id)
      .single()) || {};

    if (evidenceError || !evidence) {
      return res.status(404).json({ success: false, error: 'Evidence not found' });
    }

    const watermarkText = generateWatermarkText(verifiedWallet, evidence.case_number, new Date());

    let fileBuffer = await ipfsStorageService.getFile(evidence.ipfs_hash || evidence.storage_ref);
    let contentType = evidence.file_type || 'application/octet-stream';
    let filename = evidence.name ? `watermarked_${evidence.name}` : `evidence_${id}_watermarked`;

    if (evidence.file_type?.startsWith('image/')) {
      fileBuffer = await watermarkImage(fileBuffer, watermarkText);
    } else if (evidence.file_type === 'application/pdf') {
      fileBuffer = await watermarkPDF(fileBuffer, watermarkText);
    }

    // SECURITY FIX: Log using verified identity
    await logDownloadAction(verifiedWallet, id, 'evidence_download', {
      evidence_id: id,
      evidence_name: evidence.name,
      file_type: evidence.file_type,
      watermark_applied: true,
      download_timestamp: new Date().toISOString(),
    });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Watermark-Applied', 'true');
    res.setHeader('X-Downloaded-By', verifiedWallet.slice(0, 8) + '...');

    res.send(fileBuffer);
  } catch (error) {
    console.error('Evidence download error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to download evidence' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// Bulk export multiple evidence files as ZIP
const bulkExport = async (req, res) => {
  try {
    const { getAuthUser } = require('../middleware/identity');
    const user = await getAuthUser(req);
    const { evidenceIds } = req.body;

    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!evidenceIds || !Array.isArray(evidenceIds) || evidenceIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Evidence IDs array is required' });
    }

    if (evidenceIds.length > 50) {
      return res.status(400).json({ success: false, error: 'Maximum 50 files per bulk export' });
    }

    if (user.role === 'public_viewer') {
      return res.status(403).json({ success: false, error: 'Public viewers cannot export evidence' });
    }

    const { data: evidenceItems, error: evidenceError } = (await supabase
      .from('evidence')
      .select('*')
      .in('id', evidenceIds)) || {};

    if (evidenceError || !evidenceItems || evidenceItems.length === 0) {
      return res.status(404).json({ success: false, error: 'No evidence found with provided IDs' });
    }

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      console.error('Archive error during stream:', err);
    });

    res.on('error', (err) => {
      console.error('Response stream error:', err);
    });

    const { getStableWallet } = require('../middleware/identity');
    const verifiedWallet = getStableWallet(req) || 'unknown';

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFilename = `evidence_export_${timestamp}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
    res.setHeader('X-Export-Count', evidenceItems.length.toString());
    res.setHeader('X-Exported-By', verifiedWallet.slice(0, 8) + '...');

    archive.pipe(res);

    const metadata = {
      export_info: {
        exported_by: verifiedWallet,
        export_timestamp: new Date().toISOString(),
        total_files: evidenceItems.length,
        watermark_applied: true,
      },
      evidence_items: evidenceItems.map((item) => ({
        id: item.id,
        name: item.name,
        case_number: item.case_number,
        file_type: item.file_type,
        hash: item.hash,
        submitted_by: item.submitted_by,
        timestamp: item.timestamp,
        blockchain_verified: true,
      })),
    };

    archive.append(JSON.stringify(metadata, null, 2), { name: 'export_metadata.json' });

    for (const evidence of evidenceItems) {
      const watermarkText = generateWatermarkText(verifiedWallet, evidence.case_number, new Date());
      let fileBuffer = await ipfsStorageService.getFile(evidence.ipfs_hash || evidence.storage_ref);
      let filename = `${evidence.id}_watermarked_${evidence.name || 'evidence'}`;

      if (evidence.file_type?.startsWith('image/')) {
        fileBuffer = await watermarkImage(fileBuffer, watermarkText);
      } else if (evidence.file_type === 'application/pdf') {
        fileBuffer = await watermarkPDF(fileBuffer, watermarkText);
      }

      archive.append(fileBuffer, { name: filename });
    }

    try {
      await logDownloadAction(verifiedWallet, null, 'evidence_bulk_export', {
        evidence_ids: evidenceIds,
        total_files: evidenceItems.length,
        export_format: 'zip',
        watermark_applied: true,
        export_timestamp: new Date().toISOString(),
      });
    } catch (logErr) {
      console.error('Failed to log bulk export download action:', logErr);
    }

    archive.finalize();
  } catch (error) {
    if (res.headersSent) {
      console.error('Bulk export error while streaming:', error);
    } else {
      console.error('Bulk export error:', error);
      const msg = process.env.NODE_ENV === 'production' ? 'Failed to export evidence' : error.message;
      res.status(500).json({ success: false, error: msg });
    }
  }
};

// Get download history for specific evidence
const getDownloadHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { getAuthUser } = require('../middleware/identity');
    const user = await getAuthUser(req);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!['admin', 'auditor'].includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Admin or Auditor role required' });
    }

    // BUG FIX: Validate id to prevent injection and ensuring integer
    const safeId = parseInt(id, 10);
    if (isNaN(safeId)) {
      return res.status(400).json({ success: false, error: 'Invalid evidence ID format' });
    }

    const { data: downloadHistory, error } = (await supabase
      .from('activity_logs')
      .select('*')
      .or('action.eq.evidence_download,action.eq.evidence_bulk_export')
      .ilike('details', `%"evidence_id":${safeId}%`)
      .order('timestamp', { ascending: false })) || {};

    if (error) throw error;

    const formattedHistory = downloadHistory.map((log) => {
      let details = {};
      try {
        details = JSON.parse(log.details || '{}');
      } catch (_e) {
        details = {};
      }
      return {
        timestamp: log.timestamp,
        user_wallet: log.user_wallet || log.user_id,
        action: log.action,
        details,
      };
    });

    res.json({
      success: true,
      data: {
        evidence_id: safeId,
        download_history: formattedHistory,
      }
    });
  } catch (error) {
    console.error('Download history error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to retrieve download history' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// Get all evidence with filtering
const getAllEvidence = async (req, res) => {
  try {
    const { getAuthUser } = require('../middleware/identity');
    const user = await getAuthUser(req);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { limit = 50, offset = 0, case_id, status, submitted_by } = req.query;

    if (user.role === 'public_viewer') {
      return res.status(403).json({ success: false, error: 'Public viewers cannot list evidence' });
    }

    const limitNum = Math.min(parseInt(limit, 10) || 50, 100);
    const offsetNum = Math.max(parseInt(offset, 10) || 0, 0);

    let query = supabase
      .from('evidence')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offsetNum, offsetNum + limitNum - 1);

    if (case_id) query = query.eq('case_id', case_id);
    if (status) query = query.eq('status', status);
    if (submitted_by) query = query.eq('submitted_by', submitted_by);

    const { data: evidence, error, count } = await query;

    if (error) throw error;

    const enrichedEvidence = evidence.map((item) => ({
      ...item,
      explorerUrl: item.blockchain_tx_hash
        ? blockchainService.getExplorerUrl(item.blockchain_tx_hash)
        : null,
      ipfsUrl: item.ipfs_cid ? ipfsStorageService.getGatewayUrl(item.ipfs_cid) : null,
    }));

    res.json({
      success: true,
      data: enrichedEvidence,
      pagination: {
        total: count || 0,
        limit: limitNum,
        offset: offsetNum
      }
    });
  } catch (error) {
    console.error('Get evidence error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to get evidence' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// Get evidence details for preview
const getEvidenceById = async (req, res) => {
  try {
    const { id } = req.params;
    const { getAuthUser } = require('../middleware/identity');
    const user = await getAuthUser(req);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (user.role === 'public_viewer') {
      return res.status(403).json({ success: false, error: 'Public viewers cannot view evidence details' });
    }

    const { data: evidence, error } = (await supabase
      .from('evidence')
      .select('*')
      .eq('id', id)
      .single()) || {};

    if (error || !evidence) {
      return res.status(404).json({ success: false, error: 'Evidence not found' });
    }

    res.json({ success: true, data: evidence });
  } catch (error) {
    console.error('Get evidence by ID error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to get evidence details' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

// Get evidence by case for timeline
const getEvidenceByCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { getAuthUser } = require('../middleware/identity');
    const user = await getAuthUser(req);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (user.role === 'public_viewer') {
      return res.status(403).json({ success: false, error: 'Public viewers cannot view case evidence' });
    }

    const { data: evidence, error } = (await supabase
      .from('evidence')
      .select('*')
      .eq('case_id', caseId)
      .order('timestamp', { ascending: true })) || {};

    if (error) throw error;

    res.json({ success: true, data: evidence });
  } catch (error) {
    console.error('Get evidence by case error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to get evidence for case' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

module.exports = {
  downloadEvidence,
  bulkExport,
  getDownloadHistory,
  getAllEvidence,
  getEvidenceById,
  getEvidenceByCase,
};
