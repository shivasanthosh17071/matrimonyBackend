// File: src/controllers/authController.js
const User = require("../models/User");
const { catchAsync, AppError } = require("../utils/AppError");
const { sendSuccess } = require("../utils/apiResponse");
const {
  generateAccessToken,
  generateRefreshToken,
  setTokenCookie,
  clearTokenCookie,
} = require("../utils/jwt");
const { sendOTP, createOTPData, verifyOTP } = require("../services/otpService");

const logger = require("../utils/logger");
const crypto = require("crypto");

const {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordResetEmails,
} = require("../services/emailService");

// ── POST /api/auth/register/step1 ─────────────────────────
exports.registerStep1 = catchAsync(async (req, res, next) => {
  const { fullName, mobile, email, password, profileFor, gender, dateOfBirth } =
    req.body;

  const age = Math.floor(
    (Date.now() - new Date(dateOfBirth)) / (1000 * 60 * 60 * 24 * 365.25),
  );
  if (age < 18)
    return next(
      new AppError("You must be 18 or older to register.", 400, "UNDERAGE"),
    );

  if (mobile && (await User.findOne({ mobile })))
    return next(
      new AppError(
        "This mobile number is already registered. Try logging in.",
        409,
        "MOBILE_EXISTS",
      ),
    );
  if (email && (await User.findOne({ email: email.toLowerCase() })))
    return next(
      new AppError(
        "This email is already registered. Try logging in.",
        409,
        "EMAIL_EXISTS",
      ),
    );

  const user = await User.create({
    fullName,
    mobile,
    email: email?.toLowerCase(),
    password,
    profileFor,
    gender,
    dateOfBirth: new Date(dateOfBirth),
    isActive: false,
  });
  return sendSuccess(
    res,
    { userId: user._id },
    "Step 1 saved. Please complete step 2.",
    201,
  );
});

// ── POST /api/auth/register/step2 ─────────────────────────
exports.registerStep2 = catchAsync(async (req, res, next) => {
  const {
    userId,
    religion,
    caste,
    subCaste,
    gotram,
    subsect,
    motherTongue,
    region,
    district,
    city,
    state,
    country,
  } = req.body;

  const user = await User.findById(userId);
  if (!user)
    return next(
      new AppError(
        "Session expired. Please restart registration.",
        404,
        "USER_NOT_FOUND",
      ),
    );

  Object.assign(user, {
    religion,
    caste,
    subCaste,
    gotram,
    subsect,
    motherTongue,
    region,
    district,
    city,
    state,
    country: country || "India",
    isNRI: country && country !== "India",
  });

  const otpData = createOTPData();
  user.otp = otpData;
  await user.save({ validateBeforeSave: false });
  await sendOTP(user.mobile, otpData.code);

  return sendSuccess(
    res,
    { userId: user._id },
    `OTP sent to ${user.mobile}. Valid for ${process.env.OTP_EXPIRY_MINUTES} minutes.`,
    200,
  );
});

// ── POST /api/auth/verify-otp ─────────────────────────────
exports.verifyOTP = catchAsync(async (req, res, next) => {
  const { userId, otp } = req.body;
  const user = await User.findById(userId);
  if (!user)
    return next(new AppError("User not found.", 404, "USER_NOT_FOUND"));

  const result = verifyOTP(user, otp);
  if (!result.valid) {
    user.otp.attempts = (user.otp.attempts || 0) + 1;
    if (result.shouldLock)
      user.otpLockedUntil = new Date(Date.now() + result.lockDuration);
    await user.save({ validateBeforeSave: false });
    return next(new AppError(result.error, 400, result.code));
  }

  user.mobileVerified = true;
  user.isActive = true;
  user.otp = undefined;
  user.otpLockedUntil = undefined;
  user.profileComplete = 20;
  await user.save({ validateBeforeSave: false });
  console.log(user);
  if (user.email)
    sendWelcomeEmail(user).catch((e) =>
      logger.error(`Welcome email: ${e.message}`),
    );

  const token = generateAccessToken(user._id, user.role);
  setTokenCookie(res, token);

  return sendSuccess(
    res,
    {
      token,
      refreshToken: generateRefreshToken(user._id),
      user: {
        _id: user._id,
        fullName: user.fullName,
        displayName: user.displayName,
        email: user.email,
        emailVerified: false,
        profileComplete: 20,
        isPremium: false,
        plan: "free",
        gender: user.gender,
        photos: [],
        isVerified: true,
      },
    },
    "Account created! Meeru Telugu Saptapadi family ki swagathim! 🌺",
    200,
  );
});

// ── POST /api/auth/resend-otp ─────────────────────────────
exports.resendOTP = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.body.userId);
  if (!user)
    return next(new AppError("User not found.", 404, "USER_NOT_FOUND"));
  if (user.otpLockedUntil && new Date(user.otpLockedUntil) > new Date()) {
    const mins = Math.ceil(
      (new Date(user.otpLockedUntil) - new Date()) / 60000,
    );
    return next(
      new AppError(
        `OTP locked. Try again in ${mins} minutes.`,
        429,
        "OTP_LOCKED",
      ),
    );
  }
  const otpData = createOTPData();
  user.otp = otpData;
  await user.save({ validateBeforeSave: false });
  await sendOTP(user.mobile, otpData.code);
  return sendSuccess(res, {}, `OTP resent to ${user.mobile}.`, 200);
});

// ── POST /api/auth/login ──────────────────────────────────
exports.loginEmail = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );
  if (!user || !(await user.comparePassword(password)))
    return next(
      new AppError("Incorrect email or password.", 401, "INVALID_CREDENTIALS"),
    );
  if (user.isSuspended)
    return next(
      new AppError(
        `Account suspended: ${user.suspendedReason || "Contact support"}`,
        403,
        "ACCOUNT_SUSPENDED",
      ),
    );
  if (user.isUnderReview)
    return next(
      new AppError(
        "Profile under verification. We'll notify you within 24 hours.",
        403,
        "UNDER_REVIEW",
      ),
    );
  if (!user.isActive)
    return next(
      new AppError(
        "Account not verified. Complete OTP verification.",
        403,
        "NOT_VERIFIED",
      ),
    );

  user.lastSeen = new Date();
  await user.save({ validateBeforeSave: false });
  const token = generateAccessToken(user._id, user.role);
  setTokenCookie(res, token);

  return sendSuccess(
    res,
    {
      token,
      refreshToken: generateRefreshToken(user._id),
      user: {
        _id: user._id,
        role: user.role,
        fullName: user.fullName,
        displayName: user.displayName,
        email: user.email, // ← ADD
        emailVerified: user.emailVerified, // ← ADD
        profileComplete: user.profileComplete,
        isPremium: user.isPremiumActive(),
        plan: user.plan,
        gender: user.gender,
        photos: user.photos.filter((p) => p.isPrimary),
        isVerified: user.mobileVerified,
        isAdmin: user.isAdmin,
      },
    },
    "Login successful.",
    200,
  );
});

// ── POST /api/auth/login/otp ──────────────────────────────
exports.loginOTPRequest = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ mobile: req.body.mobile });
  if (!user)
    return next(
      new AppError(
        "No account with this mobile number. Register instead?",
        404,
        "USER_NOT_FOUND",
      ),
    );
  if (user.isSuspended)
    return next(new AppError("Account suspended.", 403, "ACCOUNT_SUSPENDED"));

  const otpData = createOTPData();
  user.otp = otpData;
  await user.save({ validateBeforeSave: false });
  await sendOTP(req.body.mobile, otpData.code);
  return sendSuccess(
    res,
    { userId: user._id },
    `OTP sent to ${req.body.mobile}.`,
    200,
  );
});

// ── POST /api/auth/login/otp/verify ──────────────────────
exports.loginOTPVerify = catchAsync(async (req, res, next) => {
  const { userId, otp } = req.body;
  const user = await User.findById(userId);
  if (!user)
    return next(new AppError("User not found.", 404, "USER_NOT_FOUND"));

  const result = verifyOTP(user, otp);
  if (!result.valid) {
    user.otp.attempts = (user.otp.attempts || 0) + 1;
    if (result.shouldLock)
      user.otpLockedUntil = new Date(Date.now() + result.lockDuration);
    await user.save({ validateBeforeSave: false });
    return next(new AppError(result.error, 400, result.code));
  }
  user.otp = undefined;
  user.lastSeen = new Date();
  await user.save({ validateBeforeSave: false });
  const token = generateAccessToken(user._id, user.role);
  setTokenCookie(res, token);
  return sendSuccess(
    res,
    {
      token,
      refreshToken: generateRefreshToken(user._id),
      user: {
        _id: user._id,
        fullName: user.fullName,
        displayName: user.displayName,
        profileComplete: user.profileComplete,
        isPremium: user.isPremiumActive(),
        plan: user.plan,
        isAdmin: user.isAdmin,
      },
    },
    "Login successful.",
    200,
  );
});

// ── POST /api/auth/logout ─────────────────────────────────
exports.logout = catchAsync(async (req, res) => {
  clearTokenCookie(res);
  return sendSuccess(res, {}, "Logged out.", 200);
});

// ── GET /api/auth/me ──────────────────────────────────────
exports.getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  return sendSuccess(
    res,
    { user: user.toPublicProfile() },
    "User fetched.",
    200,
  );
});

// ── POST /api/auth/send-verification-email ───────────────
// Sends/resends verification email to the logged-in user's email address.
exports.sendVerificationEmail = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user.email) {
    return next(
      new AppError(
        "No email address on your account. Add one in profile settings.",
        400,
        "NO_EMAIL",
      ),
    );
  }

  if (user.emailVerified) {
    return next(
      new AppError("Your email is already verified.", 400, "ALREADY_VERIFIED"),
    );
  }

  // Rate-limit: prevent spam — one email per 2 minutes
  if (user.emailVerificationExpires) {
    const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000);
    if (
      new Date(user.emailVerificationExpires) >
      new Date(Date.now() + 22 * 60 * 60 * 1000)
    ) {
      // Token was created less than 2 minutes ago (expires > 22h from now)
      return next(
        new AppError(
          "Verification email already sent. Please wait 2 minutes before requesting again.",
          429,
          "EMAIL_RATE_LIMIT",
        ),
      );
    }
  }

  // Generate token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await user.save({ validateBeforeSave: false });

  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

  await sendVerificationEmail(user, verificationUrl);

  return sendSuccess(
    res,
    {},
    `Verification email sent to ${user.email}. Valid for 24 hours.`,
    200,
  );
});

// ── GET /api/auth/verify-email?token=xxx&email=xxx ────────
// Called when user clicks the link in their email.
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { token, email } = req.query;

  if (!token || !email) {
    return next(
      new AppError(
        "Invalid verification link. Please request a new one.",
        400,
        "INVALID_LINK",
      ),
    );
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    email: decodeURIComponent(email).toLowerCase(),
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: new Date() },
  }).select("+emailVerificationToken +emailVerificationExpires");

  if (!user) {
    return next(
      new AppError(
        "Verification link is invalid or has expired. Please request a new one.",
        400,
        "INVALID_OR_EXPIRED_TOKEN",
      ),
    );
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  // If request comes from browser (not API client), redirect to frontend
  const acceptHeader = req.headers["accept"] || "";
  if (acceptHeader.includes("text/html")) {
    return res.redirect(
      `${process.env.CLIENT_URL}/email-verified?success=true`,
    );
  }

  return sendSuccess(
    res,
    { emailVerified: true },
    "Email verified successfully! Your account is now fully verified.",
    200,
  );
});

// ── POST /api/auth/forgot-password ───────────────────────
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email)
    return next(
      new AppError("Please provide your email address.", 400, "MISSING_EMAIL"),
    );

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always return success even if email not found — prevents email enumeration attacks
  if (!user) {
    return sendSuccess(
      res,
      {},
      "If an account exists with this email, you will receive a reset link shortly.",
      200,
    );
  }

  // Rate-limit: one reset email per 10 minutes
  if (
    user.passwordResetExpires &&
    new Date(user.passwordResetExpires) > new Date(Date.now() + 50 * 60 * 1000)
  ) {
    return sendSuccess(
      res,
      {},
      "If an account exists with this email, you will receive a reset link shortly.",
      200,
    );
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

  await sendPasswordResetEmails(user, resetUrl);

  return sendSuccess(
    res,
    {},
    "If an account exists with this email, you will receive a reset link shortly.",
    200,
  );
});

// ── POST /api/auth/reset-password ────────────────────────
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token, email, password, confirmPassword } = req.body;

  if (!token || !email || !password) {
    return next(
      new AppError(
        "Token, email, and new password are required.",
        400,
        "MISSING_FIELDS",
      ),
    );
  }

  if (password !== confirmPassword) {
    return next(
      new AppError("Passwords do not match.", 400, "PASSWORD_MISMATCH"),
    );
  }

  if (password.length < 8) {
    return next(
      new AppError(
        "Password must be at least 8 characters.",
        400,
        "WEAK_PASSWORD",
      ),
    );
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    email: decodeURIComponent(email).toLowerCase(),
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires +password");

  if (!user) {
    return next(
      new AppError(
        "Password reset link is invalid or has expired. Please request a new one.",
        400,
        "INVALID_OR_EXPIRED_TOKEN",
      ),
    );
  }

  user.password = password; // bcrypt hash applied in pre-save hook
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); // run full validation so bcrypt hook fires

  // Auto-login: generate token so user is logged in immediately after reset
  const jwtToken = generateAccessToken(user._id, user.role);
  setTokenCookie(res, jwtToken);

  return sendSuccess(
    res,
    {
      token: jwtToken,
      message: "Password reset successful. You are now logged in.",
    },
    "Password reset successful.",
    200,
  );
});

// ── put /api/auth/change-password ──────────────────────
// For logged-in users changing their own password.
exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return next(
      new AppError(
        "Current password, new password, and confirmation are required.",
        400,
        "MISSING_FIELDS",
      ),
    );
  }

  if (newPassword !== confirmNewPassword) {
    return next(
      new AppError("New passwords do not match.", 400, "PASSWORD_MISMATCH"),
    );
  }

  if (newPassword.length < 8) {
    return next(
      new AppError(
        "New password must be at least 8 characters.",
        400,
        "WEAK_PASSWORD",
      ),
    );
  }

  if (currentPassword === newPassword) {
    return next(
      new AppError(
        "New password must be different from your current password.",
        400,
        "SAME_PASSWORD",
      ),
    );
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(currentPassword))) {
    return next(
      new AppError("Current password is incorrect.", 401, "WRONG_PASSWORD"),
    );
  }

  user.password = newPassword;
  await user.save();

  return sendSuccess(res, {}, "Password changed successfully.", 200);
});
