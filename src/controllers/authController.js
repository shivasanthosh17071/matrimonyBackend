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
const { sendWelcomeEmail } = require("../services/emailService");
const logger = require("../utils/logger");

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
        profileComplete: 20,
        isPremium: false,
        plan: "free",
        gender: user.gender,
        photos: [],
        isVerified: true,
      },
    },
    "Account created! Meeru Telugu Rishtey family ki swagathim! 🌺",
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
