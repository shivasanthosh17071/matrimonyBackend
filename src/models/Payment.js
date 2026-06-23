// File: src/models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan:         { type: String, enum: ['silver', 'gold', 'diamond'], required: true },
  gateway:      { type: String, enum: ['razorpay', 'stripe'], required: true },
  currency:     { type: String, enum: ['INR', 'USD', 'GBP', 'CAD', 'AUD'], default: 'INR' },
  amountPaise:  { type: Number, required: true },
  billingCycle: { type: String, enum: ['monthly', 'annual'], default: 'monthly' },
  status:       { type: String, enum: ['created', 'pending', 'captured', 'failed', 'refunded'], default: 'created' },

  razorpayOrderId:   String,
  razorpayPaymentId: String,
  razorpaySignature: String,

  stripePaymentIntentId: String,
  stripeSessionId:       String,

  webhookReceivedAt: Date,
  webhookEvent:      String,
  planStartDate:     Date,
  planEndDate:       Date,
  failureReason:     String,
}, { timestamps: true });

paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
