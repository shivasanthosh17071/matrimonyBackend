// File: src/controllers/reportController.js
// BUG FIX: Was using reportedUserId but should accept BOTH reportedUserId AND reportedId
// Also added validation for required fields and better error messages.

const Report = require("../models/Report");
const User = require("../models/User");
const mongoose = require("mongoose");
const { catchAsync, AppError } = require("../utils/AppError");
const { sendSuccess } = require("../utils/apiResponse");

exports.submitReport = catchAsync(async (req, res, next) => {
  // Accept both field names: reportedUserId (old) and reportedId (new)
  const reportedUserId = req.body.reportedUserId || req.body.reportedId;
  const { reason, description } = req.body;

  // Validate required fields
  if (!reportedUserId)
    return next(
      new AppError("reportedUserId is required.", 400, "MISSING_REPORTED_USER"),
    );
  if (!reason)
    return next(new AppError("reason is required.", 400, "MISSING_REASON"));

  // Validate reportedUserId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(reportedUserId))
    return next(new AppError("Invalid user ID format.", 400, "INVALID_ID"));

  if (req.user._id.toString() === reportedUserId)
    return next(
      new AppError("You cannot report yourself.", 400, "SELF_REPORT"),
    );

  const reported = await User.findById(reportedUserId);
  if (!reported)
    return next(
      new AppError(
        "The profile you are trying to report was not found. It may have been deleted.",
        404,
        "NOT_FOUND",
      ),
    );

  const existing = await Report.findOne({
    reporter: req.user._id,
    reported: reportedUserId,
    status: "open",
  });
  if (existing)
    return next(
      new AppError(
        "You have already reported this profile. Our team is reviewing it.",
        409,
        "ALREADY_REPORTED",
      ),
    );

  await Report.create({
    reporter: req.user._id,
    reported: reportedUserId,
    reason,
    description,
  });
  await User.findByIdAndUpdate(reportedUserId, { $inc: { reportCount: 1 } });

  // Auto-flag for review after 4 reports
  const updated = await User.findById(reportedUserId);
  if (updated && updated.reportCount >= 4)
    await User.findByIdAndUpdate(reportedUserId, { isUnderReview: true });

  return sendSuccess(
    res,
    {},
    "Report submitted. Our team will review it within 24 hours.",
    201,
  );
});
