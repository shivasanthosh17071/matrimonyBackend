// File: src/routes/authRoutes.js
const router = require("express").Router();
const c = require("../controllers/authController");
const { authLimiter, otpLimiter } = require("../middleware/rateLimiter");

// router.post('/register/step1',    authLimiter, c.registerStep1);
router.post("/register/step1", c.registerStep1);
router.post("/register/step2", authLimiter, c.registerStep2);
router.post("/verify-otp", otpLimiter, c.verifyOTP);
router.post("/resend-otp", otpLimiter, c.resendOTP);
router.post("/login", authLimiter, c.loginEmail);
router.post("/login/otp", otpLimiter, c.loginOTPRequest);
router.post("/login/otp/verify", otpLimiter, c.loginOTPVerify);
router.post("/logout", require("../middleware/auth").protect, c.logout);
router.get("/me", require("../middleware/auth").protect, c.getMe);
router.post(
  "/send-verification-email",
  require("../middleware/auth").protect,
  c.sendVerificationEmail,
);
router.get("/verify-email", c.verifyEmail); // public — called from email link
router.post("/forgot-password", c.forgotPassword);
router.post("/reset-password", c.resetPassword);
router.put(
  "/change-password",
  require("../middleware/auth").protect,
  c.changePassword,
);
module.exports = router;
