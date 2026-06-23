// File: src/models/DailyMatch.js
const mongoose = require('mongoose');

const dailyMatchSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:  { type: String, required: true },  // "YYYY-MM-DD"
  matches: [{
    profile:            { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    compatibilityScore: { type: Number, min: 0, max: 100 },
    jatakamScore:       { type: Number, min: 0, max: 36 },
    reasons:            [String],
  }],
  generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

dailyMatchSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyMatch', dailyMatchSchema);
