// File: src/server.js
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");
const initializeSocket = require("./socket/socketHandler");
const {
  generateDailyMatches,
  cleanupOldMatches,
} = require("./jobs/dailyMatchJob");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;

// ── HTTP server ───────────────────────────────────────────
const server = http.createServer(app);

// ── Socket.IO ─────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.set("io", io);
initializeSocket(io);

// ── Simple daily cron (no external lib) ──────────────────
// Fires at 07:00 AM IST = 01:30 UTC every day
const scheduleCron = () => {
  const msUntilNext = () => {
    const now = new Date();
    const next = new Date();
    next.setUTCHours(1, 30, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    return next.getTime() - now.getTime();
  };
  const tick = async () => {
    try {
      await generateDailyMatches();
      await cleanupOldMatches();
    } catch (e) {
      logger.error(`Cron error: ${e.message}`);
    }
    setTimeout(tick, msUntilNext());
  };
  setTimeout(tick, msUntilNext());
  logger.info(
    `Daily match cron scheduled — next run in ${Math.round(msUntilNext() / 60000)} min`,
  );
};

// ── Graceful shutdown ─────────────────────────────────────
const shutdown = (signal) => {
  logger.info(`${signal} — shutting down...`);
  server.close(async () => {
    const mongoose = require("mongoose");
    await mongoose.connection.close();
    logger.info("MongoDB closed. Bye 👋");
    process.exit(0);
  });
  setTimeout(() => {
    logger.error("Forced exit");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (e) => {
  logger.error(`UnhandledRejection: ${e.message}`);
  shutdown("UNHANDLED_REJECTION");
});
process.on("uncaughtException", (e) => {
  logger.error(`UncaughtException: ${e.message}`);
  process.exit(1);
});

// ── Boot ──────────────────────────────────────────────────
(async () => {
  await connectDB();
  server.listen(PORT, () => {
    logger.info(
      `🚀 Telugu Saptapadi API running on port ${PORT} [${process.env.NODE_ENV}]`,
    );
    logger.info(`📸 Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    logger.info(`🌐 CORS: ${process.env.CLIENT_URL}`);
  });
  if (process.env.NODE_ENV !== "test") scheduleCron();
})();

module.exports = server;
