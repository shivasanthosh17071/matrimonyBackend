// File: src/services/emailService.js
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
transporter.verify((err, success) => {
  if (err) {
    console.error("SMTP Error:", err);
  } else {
    console.log("SMTP Ready");
  }
});
const BASE_STYLE = `
  font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;
  border: 1px solid #e5d5b0;
`;
const HEADER_STYLE = `background: #8B0000; padding: 24px; text-align: center;`;
const BODY_STYLE = `padding: 32px 24px;`;
const FOOTER_STYLE = `border-top: 1px solid #eee; padding: 16px 24px; color: #888; font-size: 12px; text-align: center;`;
const BTN_STYLE = `display:inline-block; background:#8B0000; color:white; padding:12px 28px; border-radius:6px; text-decoration:none; font-weight:bold; margin-top:16px;`;
const GOLD_BTN = `display:inline-block; background:#C9A84C; color:#1a0000; padding:12px 28px; border-radius:6px; text-decoration:none; font-weight:bold; margin-top:16px;`;

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error("Email send failed:", error);
    throw error;
  }
};
const sendWelcomeEmail = (user) =>
  sendEmail({
    to: user.email,
    subject: "Telugu Saptapadi కి స్వాగతం — Your Profile is Ready!",
    html: `
    <div style="${BASE_STYLE}">
      <div style="${HEADER_STYLE}">
        <h1 style="color:#C9A84C;margin:0;">Telugu Saptapadi</h1>
        <p style="color:#fef9e7;margin:4px 0 0;">మీ జీవిత భాగస్వామిని కనుగొనండి</p>
      </div>
      <div style="${BODY_STYLE}">
        <h2 style="color:#8B0000;">నమస్కారం, ${user.fullName}! 🌺</h2>
        <p>Telugu Saptapadi కి స్వాగతం! Your profile has been created successfully.</p>
        <p>Complete your profile including your <strong>Jatakam details</strong>, family background, and photos to get the best matches from our Telugu community.</p>
        <a href="${process.env.CLIENT_URL}/profile/wizard" style="${BTN_STYLE}">Complete Your Profile →</a>
      </div>
      <div style="${FOOTER_STYLE}">© 2025 Telugu Saptapadi. Made with ❤️ for the Telugu community.</div>
    </div>`,
  });

const sendPasswordResetEmail = (user, resetToken) =>
  sendEmail({
    to: user.email,
    subject: "Password Reset — Telugu Saptapadi",
    html: `
    <div style="${BASE_STYLE}">
      <div style="${HEADER_STYLE}"><h1 style="color:#C9A84C;margin:0;">Telugu Saptapadi</h1></div>
      <div style="${BODY_STYLE}">
        <h2 style="color:#8B0000;">Reset Your Password</h2>
        <p>Click the link below to reset your Telugu Saptapadi password. This link expires in 1 hour.</p>
        <a href="${process.env.CLIENT_URL}/reset-password/${resetToken}" style="${BTN_STYLE}">Reset Password</a>
        <p style="color:#888;margin-top:24px;font-size:13px;">If you didn't request this, please ignore this email.</p>
      </div>
      <div style="${FOOTER_STYLE}">© 2025 Telugu Saptapadi</div>
    </div>`,
  });

const sendPlanConfirmationEmail = (user, plan, expiresAt) =>
  sendEmail({
    to: user.email,
    subject: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Activated — Telugu Saptapadi`,
    html: `
    <div style="${BASE_STYLE}">
      <div style="${HEADER_STYLE}"><h1 style="color:#C9A84C;margin:0;">Telugu Saptapadi</h1></div>
      <div style="${BODY_STYLE}">
        <h2 style="color:#8B0000;">🎉 Your ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan is Active!</h2>
        <p>Congratulations! Your <strong>${plan}</strong> plan has been activated.</p>
        <p>Valid until: <strong>${new Date(expiresAt).toLocaleDateString("en-IN", { dateStyle: "long" })}</strong></p>
        <a href="${process.env.CLIENT_URL}/dashboard" style="${GOLD_BTN}">Explore Premium Benefits →</a>
      </div>
      <div style="${FOOTER_STYLE}">© 2025 Telugu Saptapadi</div>
    </div>`,
  });

const sendInterestNotificationEmail = (receiver, senderName) =>
  sendEmail({
    to: receiver.email,
    subject: `${senderName} expressed interest in your profile — Telugu Saptapadi`,
    html: `
    <div style="${BASE_STYLE}">
      <div style="${HEADER_STYLE}"><h1 style="color:#C9A84C;margin:0;">Telugu Saptapadi</h1></div>
      <div style="${BODY_STYLE}">
        <h2 style="color:#8B0000;">💌 You have a new interest!</h2>
        <p><strong>${senderName}</strong> has expressed interest in your profile.</p>
        <a href="${process.env.CLIENT_URL}/interests/inbox" style="${BTN_STYLE}">View & Respond →</a>
      </div>
      <div style="${FOOTER_STYLE}">© 2025 Telugu Saptapadi</div>
    </div>`,
  });
const sendProfileUnderReviewEmail = (user, reason) =>
  sendEmail({
    to: user.email,
    subject: "Profile Under Review — Telugu Saptapadi",
    html: `
    <div style="${BASE_STYLE}">
      <div style="${HEADER_STYLE}">
        <h1 style="color:#C9A84C;margin:0;">Telugu Saptapadi</h1>
      </div>

      <div style="${BODY_STYLE}">
        <h2 style="color:#8B0000;">Profile Under Review</h2>

        <p>నమస్కారం ${user.displayName || user.fullName},</p>

        <p>
          We have received a report regarding your profile and it has been
          placed under review by our moderation team.
        </p>

        <p>
          <strong>Reason:</strong> ${reason}
        </p>

        <p>
          During this review period, some profile features may be temporarily
          restricted.
        </p>

        <p>
          If the report is found to be incorrect, your profile status will be
          restored automatically.
        </p>

        <a href="${process.env.CLIENT_URL}/contact"
           style="${BTN_STYLE}">
          Contact Support
        </a>
      </div>

      <div style="${FOOTER_STYLE}">
        © 2025 Telugu Saptapadi. Made with ❤️ for the Telugu community.
      </div>
    </div>
    `,
  });
const sendAccountSuspendedEmail = async (user, reason) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2>Account Suspended</h2>

      <p>Dear ${user.displayName || user.fullName},</p>

      <p>
        Your account has been temporarily suspended due to a violation of our
        platform policies.
      </p>

      <p>
        <strong>Reason:</strong> ${reason}
      </p>

      <p>
        If you believe this action was taken in error, please contact our
        support team for review.
      </p>

      <p>
        Regards,<br/>
        Telugu Saptapadi Team
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: user.email,
    subject: "Your Telugu Saptapadi Account Has Been Suspended",
    html,
  });
};

const sendVerificationEmail = (user, verificationUrl) =>
  sendEmail({
    to: user.email,
    subject: "Verify your email — Telugu Saptapadi",
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5d5b0;">
      <div style="background:#14532d;padding:24px;text-align:center;">
        <h1 style="color:#f59e0b;margin:0;">Telugu Saptapadi</h1>
        <p style="color:#dcfce7;margin:4px 0 0;font-size:13px;">మీ జీవిత భాగస్వామిని కనుగొనండి</p>
      </div>
      <div style="padding:32px 24px;">
        <h2 style="color:#14532d;">నమస్కారం, ${user.fullName}! 🌺</h2>
        <p style="color:#374151;">Please verify your email address to complete your Telugu Saptapadi registration.</p>
        <p style="color:#374151;">Click the button below — this link is valid for <strong>24 hours</strong>.</p>
        <a href="${verificationUrl}"
           style="display:inline-block;background:#16a34a;color:white;padding:14px 32px;
                  border-radius:999px;text-decoration:none;font-weight:600;margin:20px 0;">
          Verify Email Address →
        </a>
        <p style="color:#6b7280;font-size:13px;margin-top:16px;">
          Or copy this link into your browser:<br/>
          <span style="color:#16a34a;word-break:break-all;">${verificationUrl}</span>
        </p>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;">
          If you did not create an account, you can safely ignore this email.
        </p>
      </div>
      <div style="border-top:1px solid #eee;padding:16px 24px;color:#9ca3af;font-size:11px;text-align:center;">
        © 2025 Telugu Saptapadi. Made with ❤️ for the Telugu community.
      </div>
    </div>`,
  });

const sendPasswordResetEmails = (user, resetUrl) =>
  sendEmail({
    to: user.email,
    subject: "Reset your password — Telugu Saptapadi",
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5d5b0;">
      <div style="background:#14532d;padding:24px;text-align:center;">
        <h1 style="color:#f59e0b;margin:0;">Telugu Saptapadi</h1>
      </div>
      <div style="padding:32px 24px;">
        <h2 style="color:#14532d;">Reset Your Password</h2>
        <p style="color:#374151;">We received a request to reset the password for your Telugu Saptapadi account.</p>
        <p style="color:#374151;">Click the button below — this link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#16a34a;color:white;padding:14px 32px;
                  border-radius:999px;text-decoration:none;font-weight:600;margin:20px 0;">
          Reset Password →
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;">
          If you did not request a password reset, please ignore this email.
          Your password will remain unchanged.
        </p>
      </div>
      <div style="border-top:1px solid #eee;padding:16px 24px;color:#9ca3af;font-size:11px;text-align:center;">
        © 2025 Telugu Saptapadi.
      </div>
    </div>`,
  });

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPlanConfirmationEmail,
  sendInterestNotificationEmail,
  sendPasswordResetEmails,
};
