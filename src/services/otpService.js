// File: src/services/otpService.js
const twilio = require("twilio");
const logger = require("../utils/logger");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

const OTP_EXPIRY_MS =
  parseInt(process.env.OTP_EXPIRY_MINUTES || "10") * 60 * 1000;
const MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || "3");
const LOCKOUT_MS =
  parseInt(process.env.OTP_LOCKOUT_MINUTES || "30") * 60 * 1000;

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const sendOTP = async (mobile, otp) => {
  if (process.env.NODE_ENV === "development") {
    logger.info(`[DEV OTP] ${mobile} → ${otp}`);
    return { sid: "dev_mock_sid" };
  }
  const msg = await client.messages.create({
    body: `Your Telugu Rishtey verification code is ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES} minutes. Do not share this with anyone.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: mobile,
  });
  logger.info(`OTP sent to ${mobile}, SID: ${msg.sid}`);
  return msg;
};

const createOTPData = () => ({
  code: generateOTP(),
  expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
  attempts: 0,
});

const verifyOTP = (user, submittedCode) => {
  const { otp, otpLockedUntil } = user;

  if (otpLockedUntil && new Date(otpLockedUntil) > new Date()) {
    const mins = Math.ceil((new Date(otpLockedUntil) - new Date()) / 60000);
    return {
      valid: false,
      error: `OTP locked. Try again in ${mins} minutes.`,
      code: "OTP_LOCKED",
    };
  }
  if (!otp?.code)
    return {
      valid: false,
      error: "No OTP found. Request a new one.",
      code: "OTP_NOT_FOUND",
    };
  if (new Date(otp.expiresAt) < new Date())
    return {
      valid: false,
      error: "OTP expired. Request a new one.",
      code: "OTP_EXPIRED",
    };

  if (otp.code !== submittedCode) {
    const attemptsLeft = MAX_ATTEMPTS - (otp.attempts + 1);
    return {
      valid: false,
      shouldLock: attemptsLeft <= 0,
      lockDuration: LOCKOUT_MS,
      error:
        attemptsLeft > 0
          ? `Incorrect OTP. ${attemptsLeft} attempt(s) remaining.`
          : "Too many incorrect attempts. OTP locked for 30 minutes.",
      code: "OTP_INVALID",
    };
  }
  return { valid: true };
};

module.exports = { sendOTP, createOTPData, verifyOTP };
