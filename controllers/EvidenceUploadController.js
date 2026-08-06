const { supabase } = require('../config');
const integratedEvidenceService = require('../services/integratedEvidenceService');
const blockchainService = require('../services/blockchain/blockchainService');
const ipfsStorageService = require('../services/storage/ipfsStorageService');

// SECURITY FIX: Enhanced Evidence Upload with REAL Blockchain & IPFS
// Identity is now pulled from req.authenticatedWallet (cryptographically verified)
const uploadEvidence = async (req, res) => {
  try {
    // SECURITY FIX: Identity is now pulled from the verified session, not req.body
    const uploadedBy = req.authenticatedWallet;
    
    if (!uploadedBy) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { caseId, type, description, location, collectionDate } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // BUG FIX: Validate caseId exists and is an integer
    const parsedCaseId = parseInt(caseId, 10);
    if (!caseId || isNaN(parsedCaseId)) {
      return res.status(400).json({ success: false, error: 'Valid Case ID is required' });
    }

    if (!type) {
      return res.status(400).json({ success: false, error: 'Evidence type is required' });
    }

    // SECURITY FIX: Verify the uploader exists and has permissions in DB
    const { data: user, error: userError } = (await supabase
      .from('users')
      .select('id, role')
      .eq('wallet_address', uploadedBy.toLowerCase())
      .eq('is_active', true)
      .single()) || {};

    if (userError || !user) {
      return res.status(403).json({ success: false, error: 'Unauthorized access: User not found or inactive' });
    }

    if (user.role === 'public_viewer') {
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

    const maxSize = allowedTypes[file.mimetype];
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
      description: description || '',
      location: location || '',
      collectionDate: collectionDate || new Date().toISOString(),
      mimeType: file.mimetype,
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
