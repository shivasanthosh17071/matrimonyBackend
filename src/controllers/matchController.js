// File: src/controllers/matchController.js
const User = require("../models/User");
const DailyMatch = require("../models/DailyMatch");
const { catchAsync, AppError } = require("../utils/AppError");
const { sendSuccess, sendPaginated } = require("../utils/apiResponse");
const {
  calculateCompatibilityScore,
  calculateJatakamCompatibility,
} = require("../services/jatakamService");

const BROWSE_LIMITS = { free: 10, silver: 50, gold: 100, diamond: 200 };
const DAILY_LIMITS = { free: 3, silver: 10, gold: 20, diamond: 50 };

// ── GET /api/matches/browse ───────────────────────────────
exports.browseProfiles = catchAsync(async (req, res) => {
  const viewer = req.user;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(
    parseInt(req.query.limit) || 12,
    BROWSE_LIMITS[viewer?.plan] || 10,
  );
  const gender = viewer?.gender === "male" ? "female" : "male";

  const filter = {
    role: { $ne: "admin" }, // Exclude admin profiles
    gender,
    isActive: true,
    isSuspended: false,
    _id: { $ne: viewer?._id },
  };

  // Telugu-specific filters
  if (req.query.religion) filter.religion = req.query.religion;
  if (req.query.caste) filter.caste = req.query.caste;
  if (req.query.subCaste) filter.subCaste = req.query.subCaste;
  if (req.query.region) filter.region = req.query.region;
  if (req.query.district)
    filter.district = { $regex: req.query.district, $options: "i" };
  if (req.query.city) filter.city = { $regex: req.query.city, $options: "i" };
  if (req.query.state) filter.state = req.query.state;
  if (req.query.country) filter.country = req.query.country;
  if (req.query.isNRI === "true") filter.isNRI = true;
  if (req.query.nriCountry) filter.nriCountry = req.query.nriCountry;
  if (req.query.maritalStatus) filter.maritalStatus = req.query.maritalStatus;
  if (req.query.mangalaDosham)
    filter["jatakam.mangalaDosham"] = req.query.mangalaDosham;
  if (req.query.motherTongue) filter.motherTongue = req.query.motherTongue;
  if (req.query.physicallyAbled === "false") filter.physicallyAbled = false;

  // Gotram filter — premium only
  if (req.query.gotram) {
    if (!viewer?.isPremiumActive())
      return sendSuccess(
        res,
        { data: [], upgradeRequired: true },
        "Gotram filter requires Silver plan or higher.",
        200,
      );
    filter.gotram = { $regex: req.query.gotram, $options: "i" };
  }

  // Age range
  if (req.query.ageMin || req.query.ageMax) {
    filter.age = {};
    if (req.query.ageMin) filter.age.$gte = parseInt(req.query.ageMin);
    if (req.query.ageMax) filter.age.$lte = parseInt(req.query.ageMax);
  }

  // Sort
  const sortMap = {
    newest: { createdAt: -1 },
    activity: { lastSeen: -1 },
    completion: { profileComplete: -1 },
  };
  const sort = sortMap[req.query.sort] || { isFeatured: -1, lastSeen: -1 };

  const total = await User.countDocuments(filter);
  const profiles = await User.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const data = profiles.map((p) => ({
    _id: p._id,
    displayName: p.displayName,
    age: p.age,
    city: p.city,
    district: p.district,
    state: p.state,
    country: p.country,
    isNRI: p.isNRI,
    nriCountry: p.nriCountry,
    height: p.height,
    religion: p.religion,
    caste: p.caste,
    subCaste: p.subCaste,
    gotram: p.gotram,
    region: p.region,
    occupation: p.occupation,
    education: p.education,
    maritalStatus: p.maritalStatus,
    plan: p.plan,
    isOnline: p.isOnline,
    lastSeen: p.lastSeen,
    mobileVerified: p.mobileVerified,
    aadhaarVerified: p.aadhaarVerified,
    isFeatured: p.isFeatured,
    primaryPhoto:
      (p.photos || []).find(
        (ph) => ph.isPrimary && ph.isApproved && !ph.isPrivate,
      ) || null,
    compatibilityScore: viewer
      ? calculateCompatibilityScore(viewer.toObject?.() || viewer, p)
      : null,
    jatakam: p.jatakam ? { mangalaDosham: p.jatakam.mangalaDosham } : null,
  }));

  return sendPaginated(res, data, total, page, limit, "Profiles fetched.");
});

// ── GET /api/matches/daily ────────────────────────────────
exports.getDailyMatches = catchAsync(async (req, res) => {
  const user = req.user;
  const today = new Date().toISOString().split("T")[0];
  const limit = DAILY_LIMITS[user.plan] || 3;

  const daily = await DailyMatch.findOne({
    user: user._id,
    date: today,
  }).populate({
    path: "matches.profile",
    select:
      "displayName age city district state occupation religion caste photos plan isOnline lastSeen mobileVerified aadhaarVerified jatakam",
  });

  if (!daily || daily.matches.length === 0) {
    // On-the-fly generation (fallback before cron runs)
    const gender = user.gender === "male" ? "female" : "male";
    const candidates = await User.find({
      gender,
      isActive: true,
      isSuspended: false,
      _id: { $ne: user._id },
    })
      .limit(60)
      .lean();

    const scored = candidates
      .map((c) => ({
        profile: c,
        compatibilityScore: calculateCompatibilityScore(user.toObject(), c),
        jatakamScore:
          user.jatakam?.nakshatra && c.jatakam?.nakshatra
            ? calculateJatakamCompatibility(
                {
                  nakshatra: user.jatakam.nakshatra,
                  rashi: user.jatakam.rashi,
                  mangalaDosham: user.jatakam.mangalaDosham,
                  gotram: user.gotram,
                },
                {
                  nakshatra: c.jatakam.nakshatra,
                  rashi: c.jatakam.rashi,
                  mangalaDosham: c.jatakam.mangalaDosham,
                  gotram: c.gotram,
                },
              ).score
            : null,
        reasons: buildReasons(user, c),
      }))
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, limit);

    return sendSuccess(
      res,
      {
        matches: scored.map((s) => ({ ...s, profile: miniProfile(s.profile) })),
        date: today,
        plan: user.plan,
        limit,
      },
      "Daily matches generated.",
      200,
    );
  }

  const matches = daily.matches.slice(0, limit).map((m) => ({
    ...m.toObject(),
    profile: m.profile ? miniProfile(m.profile.toObject()) : null,
  }));
  return sendSuccess(
    res,
    { matches, date: today, plan: user.plan, limit },
    "Daily matches fetched.",
    200,
  );
});

// ── GET /api/matches/jatakam/:profileId ──────────────────
exports.getJatakamCompatibility = catchAsync(async (req, res, next) => {
  const user = req.user;
  if (!user.jatakam?.nakshatra)
    return sendSuccess(
      res,
      {
        score: null,
        message: "Complete your Jatakam details to see compatibility.",
      },
      "Jatakam missing.",
      200,
    );

  const candidate = await User.findById(req.params.profileId);
  if (!candidate)
    return next(new AppError("Profile not found.", 404, "PROFILE_NOT_FOUND"));
  if (!candidate.jatakam?.nakshatra)
    return sendSuccess(
      res,
      {
        score: null,
        message: `${candidate.displayName}'s Jatakam is incomplete.`,
      },
      "Candidate Jatakam missing.",
      200,
    );

  const result = calculateJatakamCompatibility(
    {
      nakshatra: user.jatakam.nakshatra,
      rashi: user.jatakam.rashi,
      mangalaDosham: user.jatakam.mangalaDosham,
      gotram: user.gotram,
    },
    {
      nakshatra: candidate.jatakam.nakshatra,
      rashi: candidate.jatakam.rashi,
      mangalaDosham: candidate.jatakam.mangalaDosham,
      gotram: candidate.gotram,
    },
  );

  const fullReport =
    user.isPremiumActive() && ["gold", "diamond"].includes(user.plan);
  return sendSuccess(
    res,
    {
      score: result.score,
      outOf: result.outOf,
      percentage: result.percentage,
      rating: result.rating,
      compatible: result.compatible,
      dosham: result.dosham,
      breakdown: fullReport ? result.breakdown : null,
      upgradeForFullReport: !fullReport,
    },
    "Jatakam compatibility calculated.",
    200,
  );
});

// ── Helpers ───────────────────────────────────────────────
const miniProfile = (p) => ({
  _id: p._id,
  displayName: p.displayName,
  age: p.age,
  city: p.city,
  district: p.district,
  state: p.state,
  occupation: p.occupation,
  education: p.education,
  religion: p.religion,
  caste: p.caste,
  plan: p.plan,
  isOnline: p.isOnline,
  lastSeen: p.lastSeen,
  mobileVerified: p.mobileVerified,
  aadhaarVerified: p.aadhaarVerified,
  primaryPhoto:
    (p.photos || []).find(
      (ph) => ph.isPrimary && ph.isApproved && !ph.isPrivate,
    ) || null,
  jatakam: p.jatakam ? { mangalaDosham: p.jatakam.mangalaDosham } : null,
});

const buildReasons = (user, c) => {
  const r = [];
  if (user.district === c.district) r.push("Same district");
  else if (user.state === c.state) r.push("Same state");
  if (user.caste === c.caste) r.push("Same caste");
  if (user.region === c.region) r.push("Same region");
  if (c.aadhaarVerified) r.push("Aadhaar verified");
  if (c.isOnline) r.push("Active now");
  return r.slice(0, 3);
};
