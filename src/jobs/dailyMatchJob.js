// File: src/jobs/dailyMatchJob.js
const User       = require('../models/User');
const DailyMatch = require('../models/DailyMatch');
const { calculateCompatibilityScore, calculateJatakamCompatibility } = require('../services/jatakamService');
const logger = require('../utils/logger');

const PLAN_LIMITS = { free: 3, silver: 10, gold: 20, diamond: 50 };
const BATCH_SIZE  = 100;

const generateDailyMatches = async () => {
  const today = new Date().toISOString().split('T')[0];
  logger.info(`[DailyMatch] Starting for ${today}`);
  const start = Date.now();
  let ok = 0, err = 0, skip = 0;
  let offset = 0, hasMore = true;

  while (hasMore) {
    const users = await User.find({ isActive: true, isSuspended: false, role: 'user' })
      .skip(offset).limit(BATCH_SIZE).lean();
    if (!users.length) { hasMore = false; break; }

    await Promise.allSettled(users.map(async (user) => {
      try {
        if (await DailyMatch.findOne({ user: user._id, date: today })) { skip++; return; }

        const limit  = PLAN_LIMITS[user.plan] || 3;
        const gender = user.gender === 'male' ? 'female' : 'male';

        const filter = { gender, isActive: true, isSuspended: false, _id: { $ne: user._id } };
        const pref = user.partnerPreference;
        if (pref?.religion?.length)  filter.religion = { $in: pref.religion };
        if (pref?.caste?.length)     filter.caste    = { $in: pref.caste };
        if (pref?.country?.length)   filter.country  = { $in: pref.country };
        if (pref?.ageMin || pref?.ageMax) {
          filter.age = {};
          if (pref.ageMin) filter.age.$gte = pref.ageMin;
          if (pref.ageMax) filter.age.$lte = pref.ageMax;
        }

        const candidates = await User.find(filter).limit(200).lean();

        const scored = candidates.map(c => {
          const compatibilityScore = calculateCompatibilityScore(user, c);
          let jatakamScore = null;
          if (user.jatakam?.nakshatra && c.jatakam?.nakshatra) {
            jatakamScore = calculateJatakamCompatibility(
              { nakshatra: user.jatakam.nakshatra, rashi: user.jatakam.rashi, mangalaDosham: user.jatakam.mangalaDosham, gotram: user.gotram },
              { nakshatra: c.jatakam.nakshatra,    rashi: c.jatakam.rashi,    mangalaDosham: c.jatakam.mangalaDosham,    gotram: c.gotram }
            ).score;
          }
          const reasons = [];
          if (user.district === c.district) reasons.push('Same district');
          else if (user.state === c.state)  reasons.push('Same state');
          if (user.caste === c.caste)       reasons.push('Same caste');
          if (c.aadhaarVerified)            reasons.push('Aadhaar verified');
          return { profile: c._id, compatibilityScore, jatakamScore, reasons: reasons.slice(0, 3) };
        })
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, limit);

        await DailyMatch.create({ user: user._id, date: today, matches: scored });
        ok++;
      } catch (e) { err++; logger.error(`[DailyMatch] user ${user._id}: ${e.message}`); }
    }));

    offset += BATCH_SIZE;
    if (users.length < BATCH_SIZE) hasMore = false;
  }

  logger.info(`[DailyMatch] Done — ok:${ok} skip:${skip} err:${err} (${((Date.now()-start)/1000).toFixed(1)}s)`);
};

const cleanupOldMatches = async () => {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
  const r = await DailyMatch.deleteMany({ createdAt: { $lt: cutoff } });
  logger.info(`[DailyMatch] Cleanup — removed ${r.deletedCount} old records`);
};

module.exports = { generateDailyMatches, cleanupOldMatches };
