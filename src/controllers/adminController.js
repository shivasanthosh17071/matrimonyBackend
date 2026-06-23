// File: src/controllers/adminController.js
const User = require("../models/User");
const Payment = require("../models/Payment");
const Report = require("../models/Report");
const { catchAsync, AppError } = require("../utils/AppError");
const { sendSuccess, sendPaginated } = require("../utils/apiResponse");
const { deletePhoto } = require("../services/cloudinaryService");
const logger = require("../utils/logger");

const {
  sendProfileUnderReviewEmail,
  sendAccountSuspendedEmail,
} = require("../services/emailService");
// ── GET /api/admin/dashboard ──────────────────────────────
exports.getDashboard = catchAsync(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    premiumUsers,
    newToday,
    revenueResult,
    pendingPhotos,
    openReports,
  ] = await Promise.all([
    User.countDocuments({ role: "user" }),
    User.countDocuments({ role: "user", isActive: true }),
    User.countDocuments({ role: "user", plan: { $ne: "free" } }),
    User.countDocuments({
      role: "user",
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
    Payment.aggregate([
      { $match: { status: "captured" } },
      { $group: { _id: null, total: { $sum: "$amountPaise" } } },
    ]),
    User.countDocuments({ "photos.isApproved": false }),
    Report.countDocuments({ status: "open" }),
  ]);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const [monthlyStats, planBreakdown, regionBreakdown, casteBreakdown] =
    await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo }, role: "user" } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { role: "user" } },
        { $group: { _id: "$plan", count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { role: "user", region: { $ne: null } } },
        { $group: { _id: "$region", count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { role: "user", caste: { $ne: null } } },
        { $group: { _id: "$caste", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

  return sendSuccess(
    res,
    {
      stats: {
        totalUsers,
        activeUsers,
        premiumUsers,
        newToday,
        revenue: Math.round((revenueResult[0]?.total || 0) / 100),
      },
      pendingActions: { pendingPhotos, openReports },
      charts: { monthlyStats, planBreakdown, regionBreakdown, casteBreakdown },
    },
    "Dashboard fetched.",
    200,
  );
});

// ── GET /api/admin/users ──────────────────────────────────
exports.getUsers = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const { search, plan, status, gender, caste, region } = req.query;

  const filter = { role: "user" };

  if (plan) filter.plan = plan;
  if (gender) filter.gender = gender;
  if (caste) filter.caste = { $regex: caste, $options: "i" };
  if (region) filter.region = region;

  if (status === "suspended") {
    filter.isSuspended = true;
  } else if (status === "review") {
    filter.isUnderReview = true;
  } else if (status === "active") {
    filter.isActive = true;
    filter.isSuspended = false;
  }

  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
    ];
  }

  const total = await User.countDocuments(filter);

  const users = await User.find(filter)
    .select(
      "fullName displayName email mobile gender caste region district plan isActive isSuspended isUnderReview mobileVerified aadhaarVerified profileComplete createdAt lastSeen",
    )
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return sendPaginated(res, users, total, page, limit, "Users fetched.");
});

// ── PATCH /api/admin/users/:id/suspend ───────────────────
exports.suspendUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("User not found.", 404, "NOT_FOUND"));
  }

  const reason = req.body.reason || "Policy violation";

  user.isSuspended = true;
  user.suspendedReason = reason;
  user.isActive = false;

  await user.save({ validateBeforeSave: false });

  // Send email
  await sendAccountSuspendedEmail(user, reason);

  logger.info(`Admin ${req.user._id} suspended ${req.params.id}`);

  return sendSuccess(res, {}, "User suspended.", 200);
});

// ── PATCH /api/admin/users/:id/unsuspend ─────────────────
exports.unsuspendUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError("User not found.", 404, "NOT_FOUND"));
  user.isSuspended = false;
  user.suspendedReason = undefined;
  user.isActive = true;
  await user.save({ validateBeforeSave: false });
  return sendSuccess(res, {}, "User unsuspended.", 200);
});

// ── PATCH /api/admin/users/:id/verify-aadhaar ────────────
exports.verifyAadhaar = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { aadhaarVerified: true },
    { new: true },
  );
  if (!user) return next(new AppError("User not found.", 404, "NOT_FOUND"));
  return sendSuccess(res, {}, "Aadhaar verified.", 200);
});

// ── PATCH /api/admin/users/:id/feature ───────────────────
exports.toggleFeature = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError("User not found.", 404, "NOT_FOUND"));
  user.isFeatured = !user.isFeatured;
  if (user.isFeatured)
    user.boostExpiresAt = new Date(Date.now() + 7 * 86400000);
  await user.save({ validateBeforeSave: false });
  return sendSuccess(
    res,
    { isFeatured: user.isFeatured },
    `Profile ${user.isFeatured ? "featured" : "unfeatured"}.`,
    200,
  );
});

// ── GET /api/admin/photos/pending ────────────────────────
exports.getPendingPhotos = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1),
    limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const users = await User.find({ "photos.isApproved": false, isActive: true })
    .select("displayName fullName photos district gender")
    .skip((page - 1) * limit)
    .limit(limit);

  const photos = [];
  users.forEach((u) =>
    u.photos
      .filter((p) => !p.isApproved)
      .forEach((p) => {
        photos.push({
          userId: u._id,
          userName: u.displayName || u.fullName,
          publicId: p.publicId,
          url: p.url,
          thumbnail: p.thumbnail,
          uploadedAt: p.uploadedAt,
        });
      }),
  );

  return sendSuccess(
    res,
    { photos, page, limit },
    "Pending photos fetched.",
    200,
  );
});

// ── PATCH /api/admin/photos/approve ──────────────────────
exports.approvePhoto = catchAsync(async (req, res, next) => {
  const { userId, publicId } = req.body;
  const user = await User.findById(userId);
  if (!user) return next(new AppError("User not found.", 404, "NOT_FOUND"));
  const photo = user.photos.find((p) => p.publicId === publicId);
  if (!photo)
    return next(new AppError("Photo not found.", 404, "PHOTO_NOT_FOUND"));
  photo.isApproved = true;
  user.profileComplete = Math.min(user.profileComplete + 5, 100);
  await user.save({ validateBeforeSave: false });
  logger.info(
    `Admin ${req.user._id} approved photo ${publicId} for user ${userId}`,
  );
  return sendSuccess(res, {}, "Photo approved.", 200);
});

// ── DELETE /api/admin/photos/reject ──────────────────────
exports.rejectPhoto = catchAsync(async (req, res, next) => {
  const { userId, publicId } = req.body;
  const user = await User.findById(userId);
  if (!user) return next(new AppError("User not found.", 404, "NOT_FOUND"));
  const idx = user.photos.findIndex((p) => p.publicId === publicId);
  if (idx === -1)
    return next(new AppError("Photo not found.", 404, "PHOTO_NOT_FOUND"));
  await deletePhoto(publicId); // remove from Cloudinary
  user.photos.splice(idx, 1);
  await user.save({ validateBeforeSave: false });
  logger.info(
    `Admin ${req.user._id} rejected photo ${publicId} for user ${userId}`,
  );
  return sendSuccess(res, {}, "Photo rejected and deleted.", 200);
});

// ── GET /api/admin/reports ────────────────────────────────
exports.getReports = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const status = req.query.status || "open";

  const filter = status === "all" ? {} : { status };

  const total = await Report.countDocuments(filter);

  const reports = await Report.find(filter)
    .populate("reporter", "displayName mobile")
    .populate("reported", "displayName mobile district isSuspended")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return sendPaginated(res, reports, total, page, limit, "Reports fetched.");
});

// ── PATCH /api/admin/reports/:id/resolve ─────────────────
exports.resolveReport = catchAsync(async (req, res, next) => {
  const report = await Report.findById(req.params.id);

  if (!report) {
    return next(new AppError("Report not found.", 404, "NOT_FOUND"));
  }

  const { action } = req.body;

  const user = await User.findById(report.reported);

  if (action === "warn" && user) {
    console.log("WARN action triggered");
    console.log("User:", user.email);
    console.log("Report Reason:", report.reason);

    user.isUnderReview = true;

    await user.save({ validateBeforeSave: false });

    console.log("User saved");

    await sendProfileUnderReviewEmail(user, report.reason);

    console.log("sendProfileUnderReviewEmail completed");
  }

  if (action === "suspend" && user) {
    user.isSuspended = true;
    user.isActive = false;
    user.isUnderReview = false;
    user.suspendedReason = `Suspended due to report: ${report.reason}`;

    await user.save({ validateBeforeSave: false });
  }

  report.status = action === "dismiss" ? "dismissed" : "resolved";
  report.adminAction = action;
  report.resolvedBy = req.user._id;
  report.resolvedAt = new Date();

  await report.save();

  return sendSuccess(res, {}, `Report ${action} completed.`, 200);
});

// ── GET /api/admin/payments ───────────────────────────────
exports.getPayments = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1),
    limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const total = await Payment.countDocuments();
  const payments = await Payment.find()
    .populate("user", "fullName email mobile")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  return sendPaginated(res, payments, total, page, limit, "Payments fetched.");
});
