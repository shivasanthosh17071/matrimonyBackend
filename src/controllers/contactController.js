// File: src/controllers/contactController.js
const ContactMessage = require("../models/ContactMessage");
const { catchAsync, AppError } = require("../utils/AppError");
const { sendSuccess } = require("../utils/apiResponse");

// ── POST /api/contact ─────────────────────────────────────
// Public endpoint — no auth required. If the sender happens to be
// logged in (Authorization header present), the message is linked
// to their account by the optional `attachUserIfPresent` middleware.
exports.submitMessage = catchAsync(async (req, res, next) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !message)
    return next(new AppError("Name, email and message are required.", 400, "VALIDATION_ERROR"));

  await ContactMessage.create({
    name,
    email,
    phone,
    subject,
    message,
    user: req.user?._id,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  return sendSuccess(res, {}, "Thanks for reaching out — we'll get back to you within one business day.", 201);
});