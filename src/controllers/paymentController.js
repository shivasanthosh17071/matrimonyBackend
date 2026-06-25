// File: src/controllers/paymentController.js
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Stripe = require("stripe");
const Payment = require("../models/Payment");
const User = require("../models/User");
const { catchAsync, AppError } = require("../utils/AppError");
const { sendSuccess } = require("../utils/apiResponse");
const { sendPlanConfirmationEmail } = require("../services/emailService");
const logger = require("../utils/logger");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Prices in smallest unit (paise for INR, cents for others)
const PRICES = {
  silver: { INR: 99900, USD: 1200, GBP: 1000, CAD: 1600, AUD: 1800 },
  gold: { INR: 199900, USD: 2400, GBP: 1900, CAD: 3200, AUD: 3600 },
  diamond: { INR: 399900, USD: 4900, GBP: 3900, CAD: 6500, AUD: 7200 },
};
const ANNUAL_MONTHS = 10; // pay 10 get 12
const planDays = (cycle) => (cycle === "annual" ? 365 : 30);

const activatePlan = async (userId, plan, billingCycle, paymentId) => {
  const expiresAt = new Date(Date.now() + planDays(billingCycle) * 86400000);
  await User.findByIdAndUpdate(userId, {
    plan,
    planActivatedAt: new Date(),
    planExpiresAt: expiresAt,
  });
  const p = await Payment.findByIdAndUpdate(
    paymentId,
    { status: "captured", planStartDate: new Date(), planEndDate: expiresAt },
    { new: true },
  );
  const user = await User.findById(userId);
  if (user?.email)
    sendPlanConfirmationEmail(user, plan, expiresAt).catch((e) =>
      logger.error(`Plan email: ${e.message}`),
    );
  return expiresAt;
};

// ── POST /api/payments/razorpay/create-order ──────────────
exports.createRazorpayOrder = catchAsync(async (req, res, next) => {
  const { plan, billingCycle = "monthly" } = req.body;
  if (!PRICES[plan])
    return next(new AppError("Invalid plan.", 400, "INVALID_PLAN"));

  let amount = PRICES[plan].INR;
  if (billingCycle === "annual") amount *= ANNUAL_MONTHS;

  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: `tr_${req.user._id}_${Date.now()}`,
    notes: { userId: req.user._id.toString(), plan, billingCycle },
  });

  const payment = await Payment.create({
    user: req.user._id,
    plan,
    gateway: "razorpay",
    currency: "INR",
    amountPaise: amount,
    billingCycle,
    status: "created",
    razorpayOrderId: order.id,
  });

  return sendSuccess(
    res,
    {
      orderId: order.id,
      amount,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
      paymentId: payment._id,
      prefill: {
        name: req.user.fullName,
        email: req.user.email || "",
        contact: req.user.mobile || "",
      },
    },
    "Razorpay order created.",
    201,
  );
});

// ── POST /api/payments/razorpay/verify ────────────────────
exports.verifyRazorpayPayment = catchAsync(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expected !== razorpay_signature)
    return next(
      new AppError(
        "Payment verification failed. Contact support if amount was deducted.",
        400,
        "SIGNATURE_MISMATCH",
      ),
    );

  const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
  if (!payment)
    return next(
      new AppError("Payment record not found.", 404, "PAYMENT_NOT_FOUND"),
    );

  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  await payment.save();

  const expiresAt = await activatePlan(
    req.user._id,
    payment.plan,
    payment.billingCycle,
    payment._id,
  );
  return sendSuccess(
    res,
    { plan: payment.plan, planExpiresAt: expiresAt },
    `${payment.plan} plan activated!`,
    200,
  );
});

// ── POST /api/payments/stripe/create-session ──────────────
exports.createStripeSession = catchAsync(async (req, res, next) => {
  const { plan, billingCycle = "monthly", currency = "USD" } = req.body;
  if (!PRICES[plan])
    return next(new AppError("Invalid plan.", 400, "INVALID_PLAN"));
  if (!PRICES[plan][currency])
    return next(
      new AppError("Currency not supported.", 400, "INVALID_CURRENCY"),
    );

  let amount = PRICES[plan][currency];
  if (billingCycle === "annual") amount *= ANNUAL_MONTHS;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: req.user.email,
    metadata: { userId: req.user._id.toString(), plan, billingCycle, currency },
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: `Telugu Saptapadi — ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
            description: `${billingCycle === "annual" ? "Annual" : "Monthly"} membership`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.CLIENT_URL}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/premium?cancelled=true`,
  });

  await Payment.create({
    user: req.user._id,
    plan,
    gateway: "stripe",
    currency,
    amountPaise: amount,
    billingCycle,
    status: "pending",
    stripeSessionId: session.id,
  });

  return sendSuccess(
    res,
    { sessionId: session.id, url: session.url },
    "Stripe session created.",
    201,
  );
});

// ── POST /api/payments/razorpay/webhook ───────────────────
exports.razorpayWebhook = async (req, res) => {
  const sig = req.headers["x-razorpay-signature"];
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest("hex");
  if (sig !== expected) return res.status(400).json({ received: false });

  const { event, payload } = req.body;
  if (event === "payment.captured") {
    try {
      const entity = payload?.payment?.entity;
      const payment = await Payment.findOne({
        razorpayOrderId: entity?.order_id,
      });
      if (payment && payment.status !== "captured") {
        payment.webhookReceivedAt = new Date();
        payment.webhookEvent = event;
        await payment.save();
        await activatePlan(
          payment.user,
          payment.plan,
          payment.billingCycle,
          payment._id,
        );
      }
    } catch (e) {
      logger.error(`Razorpay webhook error: ${e.message}`);
    }
  }
  if (event === "payment.failed") {
    const entity = payload?.payment?.entity;
    await Payment.findOneAndUpdate(
      { razorpayOrderId: entity?.order_id },
      {
        status: "failed",
        failureReason: entity?.error_description,
        webhookReceivedAt: new Date(),
      },
    );
  }
  res.json({ received: true });
};

// ── POST /api/payments/stripe/webhook ────────────────────
exports.stripeWebhook = async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (e) {
    logger.warn(`Stripe webhook error: ${e.message}`);
    return res.status(400).json({ received: false });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { userId, plan, billingCycle } = session.metadata;
    try {
      const payment = await Payment.findOne({ stripeSessionId: session.id });
      if (payment && payment.status !== "captured") {
        payment.stripePaymentIntentId = session.payment_intent;
        payment.webhookReceivedAt = new Date();
        payment.webhookEvent = event.type;
        await payment.save();
        await activatePlan(userId, plan, billingCycle, payment._id);
      }
    } catch (e) {
      logger.error(`Stripe webhook error: ${e.message}`);
    }
  }
  if (event.type === "payment_intent.payment_failed") {
    await Payment.findOneAndUpdate(
      { stripePaymentIntentId: event.data.object.id },
      {
        status: "failed",
        failureReason: event.data.object.last_payment_error?.message,
        webhookReceivedAt: new Date(),
      },
    );
  }
  res.json({ received: true });
};

// ── GET /api/payments/history ─────────────────────────────
exports.getPaymentHistory = catchAsync(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .select("-razorpaySignature -stripeCustomerId");
  return sendSuccess(res, { payments }, "Payment history fetched.", 200);
});
