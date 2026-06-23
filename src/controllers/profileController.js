// File: src/controllers/profileController.js
const User = require('../models/User');
const { catchAsync, AppError } = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const { uploadPhoto, deletePhoto, getPrivacyBlurredUrl, uploadJatakamPDF } = require('../services/cloudinaryService');
const logger = require('../utils/logger');

const recalcCompletion = (user) => {
  let s = 20;
  if (user.height && user.complexion) s += 10;
  if (user.education && user.occupation) s += 10;
  if (user.fatherName && user.familyType) s += 10;
  if (user.jatakam?.nakshatra) s += 10;
  if (user.aboutMe) s += 10;
  if (user.partnerPreference?.ageMin) s += 15;
  if (user.mobileVerified) s += 5;
  if (user.photos.filter(p => p.isApproved).length > 0) s += 10;
  return Math.min(s, 100);
};

// ── PUT /api/profile/wizard/step/:step ────────────────────
exports.updateWizardStep = catchAsync(async (req, res, next) => {
  const { step } = req.params;
  const b = req.body;
  let update = {};

  switch (step) {
    case '1': update = { height: b.height, weight: b.weight, complexion: b.complexion, bodyType: b.bodyType, bloodGroup: b.bloodGroup, physicallyAbled: b.physicallyAbled }; break;
    case '2': update = { education: b.education, educationDetails: b.educationDetails, occupation: b.occupation, occupationDetails: b.occupationDetails, employedIn: b.employedIn, annualIncome: b.annualIncome }; break;
    case '3': update = { fatherName: b.fatherName, fatherStatus: b.fatherStatus, fatherOccupation: b.fatherOccupation, motherName: b.motherName, motherStatus: b.motherStatus, motherOccupation: b.motherOccupation, siblings: b.siblings, brothersMarried: b.brothersMarried, sistersMarried: b.sistersMarried, familyType: b.familyType, familyStatus: b.familyStatus, familyValues: b.familyValues, nativePlace: b.nativePlace, kulaDevata: b.kulaDevata }; break;
    case '4': update = { jatakam: { dateOfBirth: b.dateOfBirth, timeOfBirth: b.timeOfBirth, placeOfBirth: b.placeOfBirth, rashi: b.rashi, nakshatra: b.nakshatra, nakshatraPaadam: b.nakshatraPaadam, gotram: b.gotram || req.user.gotram, mangalaDosham: b.mangalaDosham } }; break;
    case '5': update = { diet: b.diet, smoking: b.smoking, drinking: b.drinking, maritalStatus: b.maritalStatus, hasChildren: b.hasChildren, aboutMe: b.aboutMe }; break;
    case '6': update = { partnerPreference: b.partnerPreference }; break;
    case '7': update = { district: b.district, city: b.city, state: b.state, country: b.country, isNRI: b.country && b.country !== 'India', nriCountry: b.nriCountry, region: b.region }; break;
    default: return next(new AppError('Invalid wizard step (1-7).', 400, 'INVALID_STEP'));
  }

  const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true, runValidators: true });
  user.profileComplete = recalcCompletion(user);
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, { profileComplete: user.profileComplete, step: parseInt(step) }, `Step ${step} saved.`, 200);
});

// ── POST /api/profile/photos ──────────────────────────────
exports.uploadPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please select an image to upload.', 400, 'NO_FILE'));

  const user = await User.findById(req.user._id);
  const MAX_PHOTOS = parseInt(process.env.MAX_PHOTOS_PER_USER || '10');
  if (user.photos.length >= MAX_PHOTOS)
    return next(new AppError(`Maximum ${MAX_PHOTOS} photos allowed. Delete one to add more.`, 400, 'MAX_PHOTOS'));

  // Upload buffer to Cloudinary
  const { publicId, url, thumbnail } = await uploadPhoto(req.file.buffer, req.user._id.toString());

  const isFirst = user.photos.length === 0;
  user.photos.push({ publicId, url, thumbnail, isApproved: false, isPrivate: false, isPrimary: isFirst });
  user.profileComplete = recalcCompletion(user);
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, {
    photo: { publicId, url, thumbnail, isApproved: false, isPrimary: isFirst },
    profileComplete: user.profileComplete,
  }, 'Photo uploaded. Pending admin approval.', 201);
});

// ── DELETE /api/profile/photos/:publicId ─────────────────
exports.deletePhoto = catchAsync(async (req, res, next) => {
  // publicId may contain slashes — use URL-encoded param
  const pid = decodeURIComponent(req.params.publicId);
  const user = await User.findById(req.user._id);

  const idx = user.photos.findIndex(p => p.publicId === pid);
  if (idx === -1) return next(new AppError('Photo not found.', 404, 'PHOTO_NOT_FOUND'));

  // Delete from Cloudinary
  await deletePhoto(pid);

  const wasPrimary = user.photos[idx].isPrimary;
  user.photos.splice(idx, 1);
  if (wasPrimary && user.photos.length > 0) {
    const first = user.photos.find(p => p.isApproved);
    if (first) first.isPrimary = true;
  }
  user.profileComplete = recalcCompletion(user);
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, { profileComplete: user.profileComplete }, 'Photo deleted.', 200);
});

// ── PATCH /api/profile/photos/:publicId/primary ───────────
exports.setPrimaryPhoto = catchAsync(async (req, res, next) => {
  const pid = decodeURIComponent(req.params.publicId);
  const user = await User.findById(req.user._id);
  const photo = user.photos.find(p => p.publicId === pid);
  if (!photo) return next(new AppError('Photo not found.', 404, 'PHOTO_NOT_FOUND'));
  if (!photo.isApproved) return next(new AppError('Only approved photos can be set as primary.', 400, 'NOT_APPROVED'));
  user.photos.forEach(p => { p.isPrimary = false; });
  photo.isPrimary = true;
  await user.save({ validateBeforeSave: false });
  return sendSuccess(res, {}, 'Primary photo updated.', 200);
});

// ── PATCH /api/profile/photos/:publicId/privacy ───────────
exports.togglePhotoPrivacy = catchAsync(async (req, res, next) => {
  if (!req.user.isPremiumActive())
    return next(new AppError('Photo privacy requires Silver plan or higher.', 403, 'UPGRADE_REQUIRED'));
  const pid = decodeURIComponent(req.params.publicId);
  const user = await User.findById(req.user._id);
  const photo = user.photos.find(p => p.publicId === pid);
  if (!photo) return next(new AppError('Photo not found.', 404, 'PHOTO_NOT_FOUND'));
  photo.isPrivate = !photo.isPrivate;
  await user.save({ validateBeforeSave: false });
  return sendSuccess(res, { isPrivate: photo.isPrivate }, `Photo is now ${photo.isPrivate ? 'private' : 'public'}.`, 200);
});

// ── POST /api/profile/jatakam/pdf ────────────────────────
exports.uploadJatakamPDF = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please select a PDF file.', 400, 'NO_FILE'));
  const { publicId, url } = await uploadJatakamPDF(req.file.buffer, req.user._id.toString());
  await User.findByIdAndUpdate(req.user._id, { 'jatakam.pdfUrl': url, 'jatakam.pdfPublicId': publicId });
  return sendSuccess(res, { pdfUrl: url }, 'Jatakam PDF uploaded.', 201);
});

// ── GET /api/profile/:id ──────────────────────────────────
exports.getProfile = catchAsync(async (req, res, next) => {
  const profile = await User.findById(req.params.id);
  if (!profile || !profile.isActive)
    return next(new AppError('Profile not found or no longer available.', 404, 'PROFILE_NOT_FOUND'));

  if (req.user && req.user._id.toString() !== req.params.id)
    await User.findByIdAndUpdate(req.params.id, { $inc: { profileViews: 1 } });

  const data = profile.toPublicProfile();

  // For private photos, serve Cloudinary blurred version instead of hiding
  if (!req.user?.isPremiumActive()) {
    data.photos = data.photos.map(p => {
      const orig = profile.photos.find(ph => ph.publicId === p.publicId);
      if (orig?.isPrivate) return { ...p, url: getPrivacyBlurredUrl(p.publicId), thumbnail: getPrivacyBlurredUrl(p.publicId), isPrivate: true };
      return p;
    });
  }

  return sendSuccess(res, { profile: data }, 'Profile fetched.', 200);
});

// ── GET /api/profile/me ───────────────────────────────────
exports.getMyProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  return sendSuccess(res, { profile: user }, 'Your profile fetched.', 200);
});
