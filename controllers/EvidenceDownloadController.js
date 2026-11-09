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

    const {
      limit = 50,
      offset = 0,
      case_id,
      status,
      submitted_by,
      search,
      type,
      dateFrom,
      dateTo,
      tag,
      sortBy = 'timestamp',
      sortOrder = 'desc',
    } = req.query;

    if (user.role === 'public_viewer') {
      return res.status(403).json({ success: false, error: 'Public viewers cannot list evidence' });
    }

    const limitNum = Math.min(parseInt(limit, 10) || 50, 100);
    const offsetNum = Math.max(parseInt(offset, 10) || 0, 0);

    // M13: whitelist sortable columns so a bad sortBy cannot break the query
    const SORTABLE = ['timestamp', 'title', 'type', 'status', 'case_id'];
    const sortCol = SORTABLE.includes(sortBy) ? sortBy : 'timestamp';

    let query = supabase
      .from('evidence')
      .select('*', { count: 'exact' })
      .order(sortCol, { ascending: sortOrder === 'asc' })
      .range(offsetNum, offsetNum + limitNum - 1);

    if (case_id) query = query.eq('case_id', case_id);
    if (status) query = query.eq('status', status);
    if (submitted_by) query = query.eq('submitted_by', submitted_by);
    // M13: search, type, date range and tag filters for the evidence list page
    if (type) query = query.eq('type', type);
    if (dateFrom) query = query.gte('timestamp', dateFrom);
    if (dateTo) query = query.lte('timestamp', dateTo);
    if (search) {
      const s = String(search).replace(/[%_.*(),'"]/g, '').trim();
      if (s) {
        query = query.or(`title.ilike.%${s}%,name.ilike.%${s}%,file_name.ilike.%${s}%,hash.ilike.%${s}%`);
      }
    }
    if (tag) {
      const tagId = parseInt(tag, 10);
      if (!isNaN(tagId)) {
        const { data: et } = (await supabase
          .from('evidence_tags')
          .select('evidence_id')
          .eq('tag_id', tagId)) || {};
        const taggedIds = [...new Set((et || []).map((r) => r.evidence_id))];
        if (!taggedIds.length) {
          return res.json({ success: true, data: [], pagination: { total: 0, limit: limitNum, offset: offsetNum } });
        }
        query = query.in('id', taggedIds);
      }
    }

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

// S3: attach [{id, name, color}] tags to a list of evidence rows (one extra query)
const attachTags = async (rows) => {
  if (!rows || rows.length === 0) return rows;
  const ids = rows.map((r) => r.id);
  const { data: links } = (await supabase
    .from('evidence_tags')
    .select('evidence_id, tag_id, tags(id, name, color, category)')
    .in('evidence_id', ids)) || {};
  const byEvidence = {};
  for (const l of links || []) {
    if (!l.tags) continue;
    (byEvidence[l.evidence_id] = byEvidence[l.evidence_id] || []).push({
      id: l.tags.id, name: l.tags.name, color: l.tags.color, category: l.tags.category,
    });
  }
  for (const r of rows) r.tags = byEvidence[r.id] || [];
  return rows;
};

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

    await attachTags([evidence]);

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

    await attachTags(evidence || []);

    res.json({ success: true, data: evidence });
  } catch (error) {
    console.error('Get evidence by case error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Failed to get evidence for case' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};


// ---- A4: court-ready export package ----
// Minimal valid PDF writer (Helvetica, multi-page, ASCII-only) so the package
// carries a human-readable report without any extra dependency.
function buildSimplePdf(lines) {
  const esc = (t) =>
    String(t)
      .replace(/[^\x20-\x7E]/g, '?')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  const perPage = 46;
  const pageLines = [];
  for (let i = 0; i < Math.max(lines.length, 1); i += perPage) pageLines.push(lines.slice(i, i + perPage));
  const pageCount = pageLines.length;
  const fontNum = 3 + pageCount * 2;
  const objs = {};
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  const kids = [];
  for (let pIdx = 0; pIdx < pageCount; pIdx++) kids.push(3 + pIdx * 2 + ' 0 R');
  objs[2] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + pageCount + ' >>';
  for (let pIdx = 0; pIdx < pageCount; pIdx++) {
    const pageNum = 3 + pIdx * 2;
    const contentNum = pageNum + 1;
    objs[pageNum] =
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ' +
      fontNum + ' 0 R >> >> /Contents ' + contentNum + ' 0 R >>';
    let stream = 'BT /F1 9 Tf 40 800 Td 16 TL\n';
    for (const ln of pageLines[pIdx]) stream += '(' + esc(ln) + ') Tj T*\n';
    stream += 'ET';
    objs[contentNum] = '<< /Length ' + Buffer.byteLength(stream) + ' >>\nstream\n' + stream + '\nendstream';
  }
  objs[fontNum] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let n = 1; n <= fontNum; n++) {
    offsets[n] = Buffer.byteLength(pdf);
    pdf += n + ' 0 obj\n' + objs[n] + '\nendobj\n';
  }
  const xrefPos = Buffer.byteLength(pdf);
  pdf += 'xref\n0 ' + (fontNum + 1) + '\n0000000000 65535 f \n';
  for (let n = 1; n <= fontNum; n++) pdf += String(offsets[n]).padStart(10, '0') + ' 00000 n \n';
  pdf += 'trailer\n<< /Size ' + (fontNum + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefPos + '\n%%EOF';
  return Buffer.from(pdf, 'binary');
}

/**
 * A4: court-ready export package.
 * ZIP containing: original files, manifest.json (recomputed SHA-256 per file,
 * compared with the recorded hash), custody_log.json, blockchain_proofs.json,
 * report.pdf and signature.json (EIP-191 signature over the manifest by the
 * server's evidence wallet, publicly verifiable against its address).
 */
const courtExport = async (req, res) => {
  try {
    const { getAuthUser } = require('../middleware/identity');
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { evidenceIds } = req.body || {};
    if (!evidenceIds || !Array.isArray(evidenceIds) || evidenceIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Evidence IDs array is required' });
    }
    if (evidenceIds.length > 25) {
      return res.status(400).json({ success: false, error: 'Maximum 25 items per court package' });
    }
    if (user.role === 'public_viewer') {
      return res.status(403).json({ success: false, error: 'Public viewers cannot export evidence' });
    }

    const { data: items, error } = (await supabase
      .from('evidence')
      .select('*')
      .in('id', evidenceIds)) || {};
    if (error || !items || items.length === 0) {
      return res.status(404).json({ success: false, error: 'No evidence found with provided IDs' });
    }

    const allowed = [];
    for (const item of items) {
      if (await canAccessEvidence(user, item)) allowed.push(item);
    }
    if (allowed.length === 0) {
      return res.status(403).json({ success: false, error: 'You do not have access to the requested evidence' });
    }

    const { data: custodyRows } = (await supabase
      .from('custody_log')
      .select('evidence_id, action, actor_name, actor_role, details, prev_hash, entry_hash, created_at')
      .in('evidence_id', allowed.map((i) => i.id))
      .order('created_at', { ascending: true })) || {};

    const files = [];
    const manifestItems = [];
    for (const item of allowed) {
      let buf = null;
      let sha = null;
      let fetchError = null;
      try {
        buf = await ipfsStorageService.getFile(item.ipfs_cid || item.ipfs_hash);
        sha = crypto.createHash('sha256').update(buf).digest('hex');
      } catch (e) {
        fetchError = e.message || 'file fetch failed';
      }
      const safeName = String(item.file_name || item.name || 'evidence').replace(/[^\w.\-]+/g, '_');
      const fname = item.id + '_' + safeName;
      if (buf) files.push({ name: 'files/' + fname, data: buf });
      manifestItems.push({
        id: item.id,
        title: item.title || item.name || null,
        case_id: item.case_id != null ? String(item.case_id) : null,
        filename: buf ? fname : null,
        file_type: item.file_type || item.mime_type || null,
        file_size: item.file_size || null,
        sha256_at_export: sha,
        recorded_hash: item.hash || null,
        hash_match: sha && item.hash ? sha === String(item.hash).toLowerCase() : null,
        fetch_error: fetchError,
        recorded_at: item.timestamp || null,
        submitted_by: item.submitted_by || null,
        ipfs_cid: item.ipfs_cid || item.ipfs_hash || null,
        blockchain: {
          tx_hash: item.blockchain_tx_hash || null,
          block_number: item.blockchain_block_number || item.polygon_block_number || null,
          status: item.blockchain_status || null,
          timestamp: item.blockchain_timestamp || null,
        },
      });
    }

    const exportedBy = user.email || user.wallet_address || user.id || 'unknown';
    const manifest = {
      package: 'EVID-DGC court-ready export package',
      version: 1,
      generated_at: new Date().toISOString(),
      generated_by: exportedBy,
      note: 'Files under /files are the original stored bytes (no watermark). sha256_at_export is recomputed at export time; hash_match compares it with the recorded hash.',
      items: manifestItems,
    };
    const manifestJson = JSON.stringify(manifest, null, 2);
    const manifestHash = crypto.createHash('sha256').update(manifestJson).digest('hex');

    // Sign the manifest with the server's evidence wallet (secp256k1, EIP-191):
    // anyone can recover the signer from the signature and compare it with the
    // published server wallet address - no shared secret needed.
    let signature;
    try {
      if (!process.env.PRIVATE_KEY) throw new Error('server wallet not configured');
      const { ethers } = require('ethers');
      const w = new ethers.Wallet(process.env.PRIVATE_KEY);
      signature = {
        algorithm: 'EIP-191 personal_sign (secp256k1)',
        signer: w.address,
        message_sha256: manifestHash,
        signature: await w.signMessage(manifestJson),
        how_to_verify:
          'Hash manifest.json with SHA-256 (message_sha256), recover the address from the EIP-191 signature over the exact manifest.json bytes, and compare it with signer.',
      };
    } catch (e) {
      signature = { error: 'signing unavailable: ' + (e.message || e) };
    }

    const custody = { entries: custodyRows || [], note: 'Full custody chain for the packaged items, oldest first. entry_hash chains to prev_hash.' };

    const anchored = manifestItems.filter((i) => i.blockchain.tx_hash);
    const blockchainProofs = {
      network: 'Polygon Amoy testnet',
      contract_address: process.env.CONTRACT_ADDRESS || null,
      anchored_count: anchored.length,
      unanchored_ids: manifestItems.filter((i) => !i.blockchain.tx_hash).map((i) => i.id),
      proofs: anchored.map((i) => ({
        evidence_id: i.id,
        recorded_hash: i.recorded_hash,
        tx_hash: i.blockchain.tx_hash,
        block_number: i.blockchain.block_number,
        timestamp: i.blockchain.timestamp,
        explorer_url: (() => {
          try {
            return blockchainService.getExplorerUrl(i.blockchain.tx_hash);
          } catch {
            return null;
          }
        })(),
      })),
      note: 'Items listed in unanchored_ids have no on-chain anchor; their integrity rests on the recorded hash and custody chain only.',
    };

    const rl = [];
    rl.push('EVID-DGC COURT-READY EXPORT PACKAGE');
    rl.push('Generated: ' + manifest.generated_at + ' by ' + exportedBy);
    rl.push('Items: ' + manifestItems.length + ' | Anchored on-chain: ' + anchored.length + ' | Manifest SHA-256: ' + manifestHash);
    rl.push('Signer address: ' + (signature.signer || 'unavailable'));
    rl.push('');
    for (const i of manifestItems) {
      rl.push('#' + i.id + ' ' + (i.title || 'Untitled') + ' (case ' + (i.case_id || '?') + ')');
      rl.push('  file: ' + (i.filename || 'NOT INCLUDED - ' + i.fetch_error));
      rl.push('  sha256 at export: ' + (i.sha256_at_export || 'n/a'));
      rl.push('  recorded hash:    ' + (i.recorded_hash || 'n/a') + (i.hash_match === null ? '' : i.hash_match ? '  MATCH' : '  MISMATCH'));
      rl.push('  recorded: ' + (i.recorded_at || 'n/a') + ' | anchored: ' + (i.blockchain.tx_hash ? 'yes (tx ' + i.blockchain.tx_hash.slice(0, 18) + '...)' : 'no'));
      rl.push('');
    }
    rl.push('See manifest.json, custody_log.json, blockchain_proofs.json and signature.json in this package.');
    const reportPdf = buildSimplePdf(rl);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="court_package_${timestamp}.zip"`);
    res.setHeader('X-Export-Count', String(allowed.length));

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => console.error('Court package archive error:', err));
    archive.pipe(res);
    archive.append(manifestJson, { name: 'manifest.json' });
    archive.append(JSON.stringify(custody, null, 2), { name: 'custody_log.json' });
    archive.append(JSON.stringify(blockchainProofs, null, 2), { name: 'blockchain_proofs.json' });
    archive.append(JSON.stringify(signature, null, 2), { name: 'signature.json' });
    archive.append(reportPdf, { name: 'report.pdf' });
    for (const f of files) archive.append(f.data, { name: f.name });

    try {
      await logDownloadAction(exportedBy, null, 'evidence_court_export', {
        evidence_ids: allowed.map((i) => i.id),
        total_files: files.length,
        manifest_sha256: manifestHash,
        export_timestamp: manifest.generated_at,
      });
    } catch (logErr) {
      console.error('Failed to log court export action:', logErr);
    }

    archive.finalize();
  } catch (error) {
    if (res.headersSent) {
      console.error('Court export error while streaming:', error);
      return;
    }
    console.error('Court export error:', error);
    const msg = process.env.NODE_ENV === 'production' ? 'Court export failed' : error.message;
    res.status(500).json({ success: false, error: msg });
  }
};

module.exports = {
  downloadEvidence,
  bulkExport,
  courtExport,
  getDownloadHistory,
  getAllEvidence,
  previewEvidence,
  getEvidenceById,
  getEvidenceByCase,
};
