// File: src/services/cloudinaryService.js
// Purpose: All Cloudinary operations — upload from buffer, delete, generate thumbnails
// Replaces AWS S3. Photos are stored with permanent URLs (no signed URL expiry).

const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const logger = require('../utils/logger');

const FOLDER = process.env.CLOUDINARY_FOLDER || 'telugu-rishtey/profiles';
const MAX_FILE_BYTES = parseInt(process.env.MAX_PHOTO_SIZE_MB || '5') * 1024 * 1024;

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} buffer - raw image buffer from multer memoryStorage
 * @param {string} userId  - owner user ID (used for folder path)
 * @returns {{ publicId, url, thumbnail }}
 */
const uploadPhoto = (buffer, userId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `${FOLDER}/${userId}`,
        resource_type: 'image',
        // Auto quality + format (WebP where supported)
        transformation: [
          { width: 1200, height: 1600, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
        ],
        // Face detection for smart cropping on thumbnails
        eager: [
          { width: 400, height: 500, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'auto' },
          { width: 150, height: 150, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'auto' },
        ],
        eager_async: false,
        tags: ['profile_photo', `user_${userId}`],
      },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload error: ${error.message}`);
          return reject(error);
        }
        logger.info(`Photo uploaded to Cloudinary: ${result.public_id}`);
        resolve({
          publicId:  result.public_id,
          url:       result.secure_url,                   // full-size permanent URL
          thumbnail: result.eager?.[0]?.secure_url || result.secure_url,  // 400x500 face crop
          thumb150:  result.eager?.[1]?.secure_url || result.secure_url,  // 150x150 avatar
        });
      }
    );

    // Pipe the buffer into the upload stream
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Delete a photo from Cloudinary by publicId
 * @param {string} publicId - Cloudinary public_id
 */
const deletePhoto = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    logger.info(`Cloudinary delete: ${publicId} → ${result.result}`);
    return result;
  } catch (err) {
    logger.error(`Cloudinary delete error (${publicId}): ${err.message}`);
    throw err;
  }
};

/**
 * Generate a blurred/watermarked URL for privacy-locked photos
 * Uses Cloudinary on-the-fly transformations — no extra upload needed
 * @param {string} publicId
 */
const getPrivacyBlurredUrl = (publicId) => {
  return cloudinary.url(publicId, {
    effect: 'blur:800',
    quality: 'auto',
    fetch_format: 'auto',
    width: 400,
    height: 500,
    crop: 'fill',
    gravity: 'face',
    secure: true,
  });
};

/**
 * Generate a thumbnail URL from existing publicId (no re-upload)
 */
const getThumbnailUrl = (publicId, width = 400, height = 500) => {
  return cloudinary.url(publicId, {
    width, height,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto',
    secure: true,
  });
};

/**
 * Upload a Jatakam (horoscope) PDF to Cloudinary
 */
const uploadJatakamPDF = (buffer, userId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `${FOLDER}/${userId}/jatakam`,
        resource_type: 'raw',
        format: 'pdf',
        tags: ['jatakam', `user_${userId}`],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ publicId: result.public_id, url: result.secure_url });
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

module.exports = {
  uploadPhoto,
  deletePhoto,
  getPrivacyBlurredUrl,
  getThumbnailUrl,
  uploadJatakamPDF,
  MAX_FILE_BYTES,
};
