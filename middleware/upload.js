const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    // Hard ceiling only; the per-type limits in EvidenceUploadController
    // (10MB-500MB by MIME type) are what actually govern each upload.
    fileSize: 500 * 1024 * 1024,
  },
  // No MIME filtering here: EvidenceUploadController is the single gate.
  // It sniffs the real type from magic bytes (S2), returns a proper 400
  // JSON for unsupported or dangerous files, and lets an investigator
  // explicitly confirm an executable kept as forensic evidence. Rejecting
  // here instead would bypass the sniff + confirmation flow, and multipart
  // field order decides whether confirmDangerous is even parsed yet.
  fileFilter: (req, file, cb) => cb(null, true),
});

module.exports = upload;
