// File: src/middleware/upload.js
// Uses memoryStorage — buffer is piped directly to Cloudinary (no disk write)
const multer = require('multer');
const { AppError } = require('../utils/AppError');
const { MAX_FILE_BYTES } = require('../services/cloudinaryService');

const ALLOWED_TYPES = ['image/jpeg','image/jpg','image/png','image/webp'];

const fileFilter = (req, file, cb) =>
  ALLOWED_TYPES.includes(file.mimetype)
    ? cb(null, true)
    : cb(new AppError('Only JPEG, PNG, and WebP images are allowed.', 400, 'INVALID_FILE_TYPE'), false);

const storage = multer.memoryStorage();

// Single photo upload (profile photos)
const upload = multer({ storage, limits: { fileSize: MAX_FILE_BYTES, files: 1 }, fileFilter });

// PDF upload (jatakam)
const uploadPDF = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    file.mimetype === 'application/pdf'
      ? cb(null, true)
      : cb(new AppError('Only PDF files are allowed for Jatakam upload.', 400, 'INVALID_FILE_TYPE'), false),
});

module.exports = { upload, uploadPDF };
