// File: src/app.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const compression = require("compression");
const hpp = require("hpp");

const errorHandler = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");
const logger = require("./utils/logger");

const paymentController = require("./controllers/paymentController");

const app = express();

// ── Security headers ──────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// ── CORS ──────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:8080",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Stripe webhook needs raw body — register BEFORE json parser ──
app.post(
  "/api/payments/stripe/webhook",
  express.raw({ type: "application/json" }),
  paymentController.stripeWebhook,
);
app.post(
  "/api/payments/razorpay/webhook",
  express.json(),
  paymentController.razorpayWebhook,
);

// ── Body parsing ──────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// ── Security ──────────────────────────────────────────────
app.use(mongoSanitize());
app.use(hpp());

// ── Compression ───────────────────────────────────────────
app.use(compression());

// ── HTTP logging ──────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(
    morgan("combined", { stream: { write: (m) => logger.http(m.trim()) } }),
  );
}

// ── Global rate limiter ───────────────────────────────────
// app.use("/api", apiLimiter);

// ── Health ────────────────────────────────────────────────
app.get("/health", (req, res) =>
  res.status(200).json({
    status: "ok",
    service: "Telugu Rishtey API",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }),
);

// ── Routes ────────────────────────────────────────────────
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/matches", require("./routes/matchRoutes"));
app.use("/api/interests", require("./routes/interestRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));

// ── 404 ───────────────────────────────────────────────────
app.use("*", (req, res) =>
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    code: "ROUTE_NOT_FOUND",
  }),
);

// ── Global error handler ──────────────────────────────────
app.use(errorHandler);

module.exports = app;