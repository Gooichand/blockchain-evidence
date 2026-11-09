const integratedEvidenceService = require('../services/integratedEvidenceService');
const { sniffFileType, mimeCompatible } = require('../services/fileTypeSniffer');
const blockchainService = require('../services/blockchain/blockchainService');
const ipfsStorageService = require('../services/storage/ipfsStorageService');
const { getAuthUser, getStableWallet } = require('../middleware/identity');
const { canAccessCase } = require('../middleware/caseAccess');
const { isCaseClosed } = require('../services/caseHelpers');
const { supabase } = require('../config');
const crypto = require('crypto');

// SECURITY FIX: Enhanced Evidence Upload with REAL Blockchain & IPFS
// Identity is pulled from the verified session (JWT or crypto signature), never req.body
const uploadEvidence = async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    const uploadedBy = getStableWallet(req);

    if (!authUser || !uploadedBy) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { caseId, type, description, location, collectionDate, title } = req.body;

    // M6: forensic intake metadata (all optional, individually validated)
    const FORENSIC_FIELDS = {
      sourceDevice: 200,
      deviceMakeModel: 200,
      deviceSerial: 120,
      collectedBy: 200,
      acquisitionMethod: 120,
      collectionReason: 500,
      conditionNotes: 1000,
      collectionTimezone: 60,
    };
    const forensic = {};
    for (const [field, max] of Object.entries(FORENSIC_FIELDS)) {
      const v = req.body[field];
      if (v == null || String(v).trim() === '') continue;
      if (String(v).length > max) {
        return res.status(400).json({ success: false, error: `${field} must be ${max} characters or fewer` });
      }
      forensic[field] = String(v).trim();
    }
    if (collectionDate && isNaN(Date.parse(collectionDate))) {
      return res.status(400).json({ success: false, error: 'collectionDate must be a valid date/time' });
    }
    let file = req.file;
    let uploadSession = null;

    // S10: resumable chunked upload - the client sent the file in chunks
    // first (POST /api/uploads + chunk PUTs + complete) and now attaches the
    // assembled result to the case by uploadId instead of re-sending bytes.
    if (!file && req.body.uploadId) {
      const uploadSessionStore = require('../services/uploadSessionStore');
      uploadSession = await uploadSessionStore.getSession(String(req.body.uploadId));
      if (!uploadSession || !uploadSession.assembled) {
        return res.status(400).json({
          success: false,
          error: 'Unknown or incomplete upload session. Upload the file chunks and complete the session first.',
        });
      }
      if (uploadSession.createdBy !== uploadedBy) {
        return res.status(403).json({ success: false, error: 'This upload session belongs to another user' });
      }
      const assembledBuffer = await uploadSessionStore.readAssembled(uploadSession.id);
      if (!assembledBuffer) {
        return res.status(400).json({ success: false, error: 'The assembled file is no longer available - upload session may have expired' });
      }
      file = {
        buffer: assembledBuffer,
        originalname: uploadSession.filename,
        mimetype: uploadSession.mimeType || 'application/octet-stream',
        size: uploadSession.size,
      };
    }

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Zero-byte files are not evidence and previously hung the pipeline (audit M2)
    if (file.size === 0) {
      return res.status(400).json({ success: false, error: 'Empty files cannot be uploaded as evidence' });
    }

    // S2: verify the real file type from magic bytes; never trust the
    // browser-supplied MIME or extension (audit M2 accepted fake-MIME files).
    const sniff = sniffFileType(file.buffer, file.originalname);
    const verificationFlags = [];
    if (sniff.dangerous) {
      if (String(req.body.confirmDangerous) !== 'true') {
        return res.status(400).json({
          success: false,
          code: 'DANGEROUS_FILE',
          error: `This file is ${sniff.dangerReason}. Executables and scripts can only be uploaded as evidence when the investigator explicitly confirms.`,
          detected: sniff.detected || undefined,
        });
      }
      verificationFlags.push({
        code: 'dangerous_file_confirmed',
        message: `Investigator confirmed upload of ${sniff.dangerReason}.`,
      });
    }
    if (sniff.detected && sniff.detected.mime && !mimeCompatible(file.mimetype, sniff.detected.mime)) {
      verificationFlags.push({
        code: 'file_type_mismatch',
        message: `File claims to be ${file.mimetype} but its content looks like ${sniff.detected.label} (${sniff.detected.mime}).`,
      });
    }
    if (!sniff.detected && sniff.binaryTextClaim && String(file.mimetype || '').startsWith('text/')) {
      verificationFlags.push({
        code: 'content_sniff_mismatch',
        message: 'File is claimed as text but contains binary data.',
      });
    }

    if (title && String(title).length > 200) {
      return res.status(400).json({ success: false, error: 'Evidence title must be 200 characters or fewer' });
    }
    if (description && String(description).length > 5000) {
      return res.status(400).json({ success: false, error: 'Description must be 5000 characters or fewer' });
    }

    // BUG FIX: Validate caseId exists and is an integer
    const parsedCaseId = parseInt(caseId, 10);
    if (!caseId || isNaN(parsedCaseId)) {
      return res.status(400).json({ success: false, error: 'Valid Case ID is required' });
    }

    if (!type) {
      return res.status(400).json({ success: false, error: 'Evidence type is required' });
    }

    // SECURITY FIX: Verify the uploader has permissions in DB
    if (!['admin', 'investigator', 'evidence_manager', 'legal_professional', 'court_official', 'forensic_analyst'].includes(authUser.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions to upload evidence' });
    }

    // C2 fix: the case must exist and the caller must have access to it.
    // Previously any caseId (including other users' cases or 999999) was accepted.
    const { data: targetCase, error: caseLookupError } = (await supabase
      .from('cases')
      .select('id')
      .eq('id', parsedCaseId)
      .single()) || {};
    if (caseLookupError || !targetCase) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }
    if (!(await canAccessCase(authUser, parsedCaseId))) {
      return res.status(403).json({ success: false, error: 'You do not have access to this case' });
    }

    // M12: closed cases are immutable - no new evidence until reopened
    if (await isCaseClosed(parsedCaseId)) {
      return res.status(409).json({
        success: false,
        error: 'This case is closed. Reopen it before adding evidence.',
      });
    }

    // Duplicate detection by content hash within the same case (audit M2)
    const uploadHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const { data: dupRows } = (await supabase
      .from('evidence')
      .select('id, title, name')
      .eq('case_id', String(parsedCaseId))
      .eq('hash', uploadHash)
      .limit(1)) || {};
    if (dupRows && dupRows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'This exact file is already stored as evidence in this case',
        existingEvidenceId: dupRows[0].id,
        existingTitle: dupRows[0].title || dupRows[0].name,
      });
    }

    // Existence and `is_active` are already guaranteed here: `requireAuth`
    // (routes/evidenceRoutes.js) rejects unknown and deactivated users with a
    // 401 before this controller is reached, on both the JWT and wallet paths.
    // A previous version re-checked via `const { data: user, error: userError }`
    // and threw a ReferenceError on every request, turning this endpoint into a
    // guaranteed 500. The redundant query has been removed rather than restored.

    if (authUser.role === 'public_viewer') {
      return res.status(403).json({ success: false, error: 'Public viewers cannot upload evidence' });
    }

    // BUG FIX: Standardized MIME type validation with server-side size limits
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
      'text/plain': 10,
      'application/zip': 500,
      'application/x-rar-compressed': 500,
      'application/vnd.ms-excel': 50,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 50,
    };

    // An explicitly confirmed dangerous file (executable/script kept as
    // forensic evidence) bypasses the supported-type list; it still gets a
    // hard 500MB cap and carries the confirmation + mismatch flags.
    const confirmedDangerous = sniff.dangerous && String(req.body.confirmDangerous) === 'true';
    const maxSize = allowedTypes[file.mimetype] || (confirmedDangerous ? 500 : 0);
    if (!maxSize) {
      return res.status(400).json({
        success: false,
        error: `File type ${file.mimetype} not supported`,
        supportedTypes: Object.keys(allowedTypes),
      });
    }

    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size for ${file.mimetype} is ${maxSize}MB`,
        fileSize: file.size,
        maxSize: maxSizeBytes,
      });
    }

    const metadata = {
      caseId: parsedCaseId,
      type,
      title: title ? String(title).trim() : '',
      description: description || '',
      location: location || '',
      collectionDate: collectionDate || new Date().toISOString(),
      mimeType: file.mimetype,
      forensic,
      verificationFlags,
      detectedType: sniff.detected || null,
    };

    // Use integrated service for DB + Blockchain + IPFS coordination
    const results = await integratedEvidenceService.uploadEvidence(
      file.buffer,
      file.originalname,
      metadata,
      uploadedBy,
    );

    const errors = results?.errors || [];

    if (!results) {
      return res.status(500).json({ success: false, error: 'Upload service failed to return results' });
    }

    // M4: custody ledger entry for the intake of this evidence item
    try {
      const { logCustody } = require('./custodyController');
      const evRow = results?.database || {};
      await logCustody({
        evidenceId: evRow.id || null,
        caseId: parsedCaseId,
        action: 'uploaded',
        user: authUser,
        details: {
          title: title ? String(title).trim() : '',
          filename: file.originalname,
          hash: evRow.hash || null,
          size: file.size,
        },
        req,
      });
    } catch (custodyErr) {
      console.error('custody log for upload failed:', custodyErr);
    }

    // S10: a chunked-upload session is single-use - remove it once the
    // evidence record exists so its disk copy is freed
    if (uploadSession) {
      try {
        const uploadSessionStore = require('../services/uploadSessionStore');
        await uploadSessionStore.deleteSession(uploadSession.id);
      } catch (cleanupErr) {
        console.error('upload session cleanup failed:', cleanupErr);
      }
    }

    // Standardized successful response
    res.json({
      success: true,
      data: {
        ...results?.database,
        explorerUrl: results?.blockchain?.txHash
          ? blockchainService.getExplorerUrl(results.blockchain.txHash)
          : null,
        ipfsUrl: results?.ipfs?.cid ? ipfsStorageService.getGatewayUrl(results.ipfs.cid) : null,
      },
      blockchain: results?.blockchain || null,
      ipfs: results?.ipfs || null,
      message:
        errors.length > 0
          ? `Evidence uploaded with warnings: ${errors.map((e) => e.error).join(', ')}`
          : 'Evidence uploaded successfully to database, blockchain, and IPFS',
      warnings: errors,
    });
  } catch (error) {
    console.error('Evidence upload failed:', error);
    // SECURITY FIX: Never leak raw error messages in production
    const message = process.env.NODE_ENV === 'production' ? 'Internal server error during upload.' : error.message;
    res.status(500).json({ success: false, error: message });
  }
};

module.exports = {
  uploadEvidence,
};
