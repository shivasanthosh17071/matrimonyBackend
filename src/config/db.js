// File: src/config/db.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');

let retryCount = 0;
const MAX_RETRIES = 5;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    retryCount = 0;
  } catch (err) {
    logger.error(`MongoDB error: ${err.message}`);
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      const delay = Math.min(1000 * 2 ** retryCount, 30000);
      logger.info(`Retrying in ${delay / 1000}s (attempt ${retryCount}/${MAX_RETRIES})`);
      setTimeout(connectDB, delay);
    } else {
      logger.error('Max retries reached. Exiting.');
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => { logger.warn('MongoDB disconnected. Reconnecting...'); connectDB(); });
mongoose.connection.on('error', (err) => logger.error(`MongoDB error: ${err.message}`));

module.exports = connectDB;
