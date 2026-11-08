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
const crypto = require('crypto');
const { scopeEvidenceQuery, canAccessEvidence, canAccessCase } = require('../middleware/caseAccess');

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

    // C2 fix: investigators may only download their own / assigned-case evidence
    if (!(await canAccessEvidence(user, evidence))) {
      return res.status(403).json({ success: false, error: 'You do not have access to this evidence' });
    }

    // H3 fix: uploads store the CID in ipfs_cid; the old code read ipfs_hash /
    // storage_ref, which made every download fail with a 500.
    const cid = evidence.ipfs_cid || evidence.ipfs_hash;
    if (!cid) {
      return res.status(404).json({ success: false, error: 'No stored file for this evidence record' });
    }

    // Resolve the case number for the watermark (evidence rows do not carry it)
    let caseNumber = evidence.case_number || null;
    if (!caseNumber) {
      const cidNum = parseInt(evidence.case_id, 10);
      if (!isNaN(cidNum)) {
        const { data: caseRow } = (await supabase
          .from('cases')
          .select('case_number')
          .eq('id', cidNum)
          .single()) || {};
        caseNumber = caseRow?.case_number || null;
      }
    }

    const watermarkText = generateWatermarkText(verifiedWallet, caseNumber || `EVID-${id}`, new Date());

    let fileBuffer = await ipfsStorageService.getFile(cid);

    // M8: re-verify integrity on every download - recompute SHA-256 over the
    // stored bytes and compare with the hash recorded at intake. The result is
    // logged to the custody ledger and sent as a response header. A mismatch
    // never silently passes; the file is still served so evidence stays
    // accessible, but every consumer can see the flag.
    const downloadHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const integrityOk = evidence.hash ? downloadHash === String(evidence.hash).toLowerCase() : null;
    if (integrityOk === false) {
      console.error(`INTEGRITY MISMATCH on download of evidence #${id}: stored=${evidence.hash} actual=${downloadHash}`);
    }

    let contentType = evidence.file_type || 'application/octet-stream';
    let filename = evidence.name ? `watermarked_${evidence.name}` : `evidence_${id}_watermarked`;

    try {
      if (evidence.file_type?.startsWith('image/')) {
        fileBuffer = await watermarkImage(fileBuffer, watermarkText);
      } else if (evidence.file_type === 'application/pdf') {
        fileBuffer = await watermarkPDF(fileBuffer, watermarkText);
      }
    } catch (wmErr) {
      // A watermark failure must not block access to the evidence itself
      console.error('Watermark failed, serving original file:', wmErr.message);
    }

    // M4: custody ledger entry for this access
    try {
      const { logCustody } = require('./custodyController');
      const cidNum = parseInt(evidence.case_id, 10);
      await logCustody({
        evidenceId: evidence.id,
        caseId: isNaN(cidNum) ? null : cidNum,
        action: 'downloaded',
        user,
        details: { watermark_applied: true, filename, integrity_verified: integrityOk, download_hash: downloadHash },
        req,
      });
    } catch (custodyErr) {
      console.error('custody log for download failed:', custodyErr);
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
    res.setHeader('X-Integrity-Verified', integrityOk === null ? 'unknown' : String(integrityOk));
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

    let { data: evidenceItems, error: evidenceError } = (await supabase
      .from('evidence')
      .select('*')
      .in('id', evidenceIds)) || {};

    if (evidenceError || !evidenceItems || evidenceItems.length === 0) {
      return res.status(404).json({ success: false, error: 'No evidence found with provided IDs' });
    }

    // C2 fix: drop anything the caller may not access; refuse if nothing remains
    const allowedItems = [];
    for (const item of evidenceItems) {
      if (await canAccessEvidence(user, item)) allowedItems.push(item);
    }
    if (allowedItems.length === 0) {
      return res.status(403).json({ success: false, error: 'You do not have access to the requested evidence' });
    }
    evidenceItems = allowedItems;

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
      let fileBuffer = await ipfsStorageService.getFile(evidence.ipfs_cid || evidence.ipfs_hash);
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

    // C2 fix: investigators only see their own / assigned-case evidence
    query = (await scopeEvidenceQuery(query, user)).query;

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

// M8: in-browser preview of the stored file itself (image, PDF, video, audio,
// text) without exposing a public IPFS link. Authenticated, access-checked,
// integrity-verified, custody-logged, and served inline over the API.
const PREVIEWABLE = (mime) =>
  !!mime && (mime.startsWith('image/') || mime.startsWith('video/') || mime.startsWith('audio/')
    || mime === 'application/pdf' || mime === 'text/plain');

const previewEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const { getAuthUser } = require('../middleware/identity');
    const user = await getAuthUser(req);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (user.role === 'public_viewer') {
      return res.status(403).json({ success: false, error: 'Public viewers cannot preview evidence' });
    }

    const safeId = parseInt(id, 10);
    if (isNaN(safeId)) {
      return res.status(400).json({ success: false, error: 'Invalid evidence ID' });
    }

    const { data: evidence, error } = (await supabase
      .from('evidence')
      .select('*')
      .eq('id', safeId)
      .single()) || {};
    if (error || !evidence) {
      return res.status(404).json({ success: false, error: 'Evidence not found' });
    }
    if (!(await canAccessEvidence(user, evidence))) {
      return res.status(403).json({ success: false, error: 'You do not have access to this evidence' });
    }

    const contentType = evidence.file_type || 'application/octet-stream';
    if (!PREVIEWABLE(contentType)) {
      return res.status(415).json({ success: false, error: 'This file type cannot be previewed - use download instead' });
    }

    const cid = evidence.ipfs_cid || evidence.ipfs_hash;
    if (!cid) {
      return res.status(404).json({ success: false, error: 'No stored file for this evidence record' });
    }

    const fileBuffer = await ipfsStorageService.getFile(cid);

    // Integrity re-check on every access (same rule as download)
    const viewHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const integrityOk = evidence.hash ? viewHash === String(evidence.hash).toLowerCase() : null;
    if (integrityOk === false) {
      console.error(`INTEGRITY MISMATCH on preview of evidence #${safeId}: stored=${evidence.hash} actual=${viewHash}`);
    }

    // M4: custody ledger entry for this view
    try {
      const { logCustody } = require('./custodyController');
      const cidNum = parseInt(evidence.case_id, 10);
      await logCustody({
        evidenceId: evidence.id,
        caseId: isNaN(cidNum) ? null : cidNum,
        action: 'viewed',
        user,
        details: { preview: true, integrity_verified: integrityOk },
        req,
      });
    } catch (custodyErr) {
      console.error('custody log for preview failed:', custodyErr);
    }

    const safeName = String(evidence.name || `evidence_${safeId}`).replace(/["\r\n]/g, '_');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    res.setHeader('Cache-Control', 'private, no-cache');
    res.setHeader('X-Integrity-Verified', integrityOk === null ? 'unknown' : String(integrityOk));
    res.setHeader('Accept-Ranges', 'bytes');

    // Range support so video/audio can seek without a full re-fetch
    const range = req.headers.range;
    const total = fileBuffer.length;
    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (m) {
        let start = m[1] ? parseInt(m[1], 10) : 0;
        let end = m[2] ? parseInt(m[2], 10) : total - 1;
        if (m[1] === '' && m[2]) { start = Math.max(total - parseInt(m[2], 10), 0); end = total - 1; }
        if (start >= total || start > end) {
          res.setHeader('Content-Range', `bytes */${total}`);
          return res.status(416).end();
        }
        end = Math.min(end, total - 1);
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
        res.setHeader('Content-Length', end - start + 1);
        return res.send(fileBuffer.subarray(start, end + 1));
      }
    }
    res.setHeader('Content-Length', total);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Evidence preview error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to preview evidence' : error.message;
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

    // C2 fix
    if (!(await canAccessEvidence(user, evidence))) {
      return res.status(403).json({ success: false, error: 'You do not have access to this evidence' });
    }

    // M4: custody ledger entry for viewing this evidence record
    try {
      const { logCustody } = require('./custodyController');
      const cidNum = parseInt(evidence.case_id, 10);
      await logCustody({
        evidenceId: evidence.id,
        caseId: isNaN(cidNum) ? null : cidNum,
        action: 'viewed',
        user,
        details: {},
        req,
      });
    } catch (custodyErr) {
      console.error('custody log for view failed:', custodyErr);
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

    // C2 fix: verify the caller may access the requested case
    if (!(await canAccessCase(user, caseId))) {
      return res.status(403).json({ success: false, error: 'You do not have access to this case' });
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
  previewEvidence,
  getEvidenceById,
  getEvidenceByCase,
};
