// File: src/models/Interest.js
const mongoose = require('mongoose');

const interestSchema = new mongoose.Schema({
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:   { type: String, enum: ['pending', 'accepted', 'declined', 'blocked'], default: 'pending' },
  message:  { type: String, maxlength: 300 },
  respondedAt: Date,
}, { timestamps: true });

interestSchema.index({ sender: 1, receiver: 1 }, { unique: true });
interestSchema.index({ receiver: 1, status: 1 });
interestSchema.index({ sender: 1, status: 1 });

module.exports = mongoose.model('Interest', interestSchema);
