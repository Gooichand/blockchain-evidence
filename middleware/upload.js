const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/avi',
      'video/mov',
      'audio/mp3',
      'audio/wav',
      'audio/m4a',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // A rejected MIME type is a client error. Without an explicit status the
      // Express error handler defaults to 500, so an unsupported upload was
      // reported as a server fault instead of a 400.
      const err = new Error(`File type ${file.mimetype} not supported`);
      err.status = 400;
      err.code = 'UNSUPPORTED_FILE_TYPE';
      cb(err, false);
    }
  },
});

module.exports = upload;
