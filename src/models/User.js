// File: src/models/User.js
// Purpose: Core user schema for Telugu Saptapadi matrimony platform
// Telugu-specific fields: caste (kula), gotram, nakshatra, rashi, subsect, native district

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ── Sub-schemas ───────────────────────────────────────────
const photoSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true }, // Cloudinary public_id
    url: { type: String, required: true }, // Cloudinary secure_url (permanent)
    thumbnail: { type: String }, // Cloudinary thumbnail transformation URL
    isApproved: { type: Boolean, default: false },
    isPrivate: { type: Boolean, default: false }, // premium photo privacy
    isPrimary: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const jatakamSchema = new mongoose.Schema(
  {
    // Jatakam = Telugu word for horoscope/Kundali
    dateOfBirth: Date,
    timeOfBirth: String, // "HH:MM" 24h format
    placeOfBirth: String,
    rashi: String, // Moon sign (e.g. Mesha, Vrishabha)
    nakshatra: String, // Birth star (e.g. Ashwini, Bharani, Krittika)
    gotram: String, // Telugu: gotram (same as gotra)
    mangalaDosham: {
      type: String,
      enum: ["yes", "no", "partial", "unknown"],
      default: "unknown",
    },
    // Telugu-specific: Paadam (quarter of nakshatra)
    nakshatraPaadam: { type: Number, min: 1, max: 4 },
    pdfUrl: String, // Cloudinary URL for uploaded jatakam PDF
  },
  { _id: false },
);

const partnerPreferenceSchema = new mongoose.Schema(
  {
    ageMin: { type: Number, default: 21 },
    ageMax: { type: Number, default: 35 },
    heightMin: String,
    heightMax: String,
    religion: [String],
    caste: [String], // Telugu castes
    subCaste: [String],
    gotram: [String], // preferred gotrams (NOT own gotram)
    maritalStatus: [String],
    education: [String],
    occupation: [String],
    incomeMin: Number,
    district: [String], // Andhra Pradesh / Telangana districts
    state: [String],
    country: [String],
    nriAccepted: { type: Boolean, default: true },
    mangalaDoshamAccepted: {
      type: String,
      enum: ["yes", "no", "partial", "any"],
      default: "any",
    },
    physicallyAbledAccepted: { type: Boolean, default: true },
  },
  { _id: false },
);

// ── Main User Schema ──────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    // ── Auth ─────────────────────────────────────────────────
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    mobile: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      match: [/^\+[1-9]\d{7,14}$/, "Include country code e.g. +919876543210"],
    },
    password: { type: String, minlength: 8, select: false },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    isActive: { type: Boolean, default: false }, // false until OTP verified
    isSuspended: { type: Boolean, default: false },
    suspendedReason: String,
    isUnderReview: { type: Boolean, default: false },

    // ── OTP ──────────────────────────────────────────────────
    otp: {
      code: String,
      expiresAt: Date,
      attempts: { type: Number, default: 0 },
    },
    otpLockedUntil: Date,
    mobileVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: Date,
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: Date,

    // ── Basic Profile ─────────────────────────────────────────
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    displayName: { type: String, trim: true }, // auto: "Firstname L."
    gender: { type: String, enum: ["male", "female"], required: true },
    dateOfBirth: { type: Date, required: true },
    age: Number,
    profileFor: {
      type: String,
      enum: ["myself", "son", "daughter", "brother", "sister", "relative"],
      default: "myself",
    },

    // ── Telugu Community Fields ───────────────────────────────
    religion: {
      type: String,
      enum: ["hindu", "christian", "muslim", "other"],
      default: "hindu",
    },
    // Telugu castes: Kamma, Reddy, Kapu, Brahmin, Yadav, Vysya, SC/ST, etc.
    caste: { type: String, trim: true },
    subCaste: { type: String, trim: true },
    // Gotram — critical for Telugu Hindu marriages (same-gotram is prohibited)
    gotram: { type: String, trim: true },
    // Telugu subsect (e.g. Vaidiki Brahmin, Niyogi Brahmin)
    subsect: { type: String, trim: true },
    motherTongue: {
      type: String,
      enum: ["telugu", "urdu", "hindi", "tamil", "kannada", "english", "other"],
      default: "telugu",
    },
    // Dialect region
    region: {
      type: String,
      enum: ["andhra", "telangana", "rayalaseema", "other"],
    },

    // ── Location (AP/TS focused) ──────────────────────────────
    district: { type: String, trim: true }, // e.g. "Guntur", "Warangal"
    city: { type: String, trim: true },
    state: {
      type: String,
      // AP, TS, or anywhere in India / abroad
      trim: true,
    },
    country: { type: String, default: "India", trim: true },
    isNRI: { type: Boolean, default: false },
    nriCountry: { type: String, trim: true }, // e.g. "USA", "Australia"

    // ── Physical ──────────────────────────────────────────────
    height: String, // e.g. "5'6\""
    weight: Number, // kg
    complexion: {
      type: String,
      enum: ["very_fair", "fair", "wheatish", "dusky", "dark"],  default: undefined,
    },
    bodyType: { type: String, enum: ["slim", "average", "athletic", "heavy"],  default: undefined, },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    physicallyAbled: { type: Boolean, default: false },

    // ── Lifestyle ─────────────────────────────────────────────
    maritalStatus: {
      type: String,
      enum: ["never_married", "divorced", "widowed", "awaiting_divorce"],
      default: "never_married",
    },
    hasChildren: { type: Boolean, default: false },
    diet: {
      type: String,
      enum: ["vegetarian", "non_vegetarian", "vegan", "eggetarian", "jain"],
    },
    smoking: { type: String, enum: ["no", "occasionally", "yes"] },
    drinking: { type: String, enum: ["no", "occasionally", "yes"] },
    aboutMe: { type: String, maxlength: 1000, trim: true },

    // ── Education & Career ────────────────────────────────────
    education: String,
    educationDetails: String, // college/university
    occupation: String,
    occupationDetails: String, // company name
    employedIn: {
      type: String,
      enum: [
        "private",
        "government",
        "business",
        "self_employed",
        "not_working",
        "student",
      ],
    },
    annualIncome: String, // range e.g. "₹10-15 LPA"

    // ── Family Details ────────────────────────────────────────
    fatherName: String,
    fatherStatus: {
      type: String,
      enum: ["employed", "business", "retired", "expired"],
    },
    fatherOccupation: String,
    motherName: String,
    motherStatus: {
      type: String,
      enum: ["homemaker", "employed", "business", "expired"],
    },
    motherOccupation: String,
    siblings: Number,
    brothersMarried: Number,
    sistersMarried: Number,
    familyType: { type: String, enum: ["joint", "nuclear"] },
    familyStatus: {
      type: String,
      enum: ["middle_class", "upper_middle", "rich", "affluent"],
    },
    familyValues: {
      type: String,
      enum: ["traditional", "moderate", "liberal"],
    },
    nativePlace: String, // ancestral village/town (important in Telugu culture)
    // Telugu: Kula Devata (family deity) — culturally significant
    kulaDevata: String,

    // ── Jatakam (Horoscope) ───────────────────────────────────
    jatakam: jatakamSchema,

    // ── Photos ────────────────────────────────────────────────
    photos: [photoSchema],

    // ── Partner Preferences ───────────────────────────────────
    partnerPreference: partnerPreferenceSchema,

    // ── Premium / Plan ────────────────────────────────────────
    plan: {
      type: String,
      enum: ["free", "silver", "gold", "diamond"],
      default: "free",
    },
    planExpiresAt: Date,
    planActivatedAt: Date,
    razorpayCustomerId: String,
    stripeCustomerId: String,

    // ── Engagement ────────────────────────────────────────────
    profileComplete: { type: Number, default: 0 },
    lastSeen: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
    socketId: String,
    profileViews: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    boostExpiresAt: Date,

    // ── Verification ─────────────────────────────────────────
    aadhaarVerified: { type: Boolean, default: false },
    reportCount: { type: Number, default: 0 },
    adminNotes: String,
    isAdmin: Boolean,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── Virtuals ──────────────────────────────────────────────
userSchema.virtual("computedAge").get(function () {
  if (!this.dateOfBirth) return null;
  return Math.floor(
    (Date.now() - new Date(this.dateOfBirth).getTime()) /
      (1000 * 60 * 60 * 24 * 365.25),
  );
});

userSchema.virtual("primaryPhoto").get(function () {
  return (
    this.photos.find((p) => p.isPrimary && p.isApproved) ||
    this.photos.find((p) => p.isApproved) ||
    null
  );
});

// ── Indexes ───────────────────────────────────────────────
userSchema.index({ mobile: 1 });
userSchema.index({ email: 1 });
userSchema.index({ gender: 1, plan: 1, isActive: 1 });
userSchema.index({ caste: 1, religion: 1 });
userSchema.index({ district: 1, state: 1 });
userSchema.index({ isNRI: 1 });
userSchema.index({ isFeatured: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ "jatakam.mangalaDosham": 1 });
userSchema.index({ region: 1 });

// ── Pre-save hooks ────────────────────────────────────────
userSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  if (this.fullName && !this.displayName) {
    const parts = this.fullName.trim().split(" ");
    this.displayName =
      parts.length > 1
        ? `${parts[0]} ${parts[parts.length - 1][0]}.`
        : parts[0];
  }
  if (this.dateOfBirth) {
    this.age = Math.floor(
      (Date.now() - new Date(this.dateOfBirth).getTime()) /
        (1000 * 60 * 60 * 24 * 365.25),
    );
  }
  next();
});

// ── Instance methods ──────────────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.isPremiumActive = function () {
  if (this.plan === "free") return false;
  return this.planExpiresAt && new Date(this.planExpiresAt) > new Date();
};

userSchema.methods.toPublicProfile = function () {
  return {
    _id: this._id,
    displayName: this.displayName,
    email: this.email,
    emailVerified: this.emailVerified,
    age: this.age,
    gender: this.gender,
    city: this.city,
    district: this.district,
    state: this.state,
    country: this.country,
    isNRI: this.isNRI,
    nriCountry: this.nriCountry,
    height: this.height,
    religion: this.religion,
    caste: this.caste,
    subCaste: this.subCaste,
    gotram: this.gotram,
    subsect: this.subsect,
    region: this.region,
    occupation: this.occupation,
    education: this.education,
    maritalStatus: this.maritalStatus,
    diet: this.diet,
    aboutMe: this.aboutMe,
    plan: this.plan,
    isOnline: this.isOnline,
    lastSeen: this.lastSeen,
    mobileVerified: this.mobileVerified,
    aadhaarVerified: this.aadhaarVerified,
    photos: this.photos
      .filter((p) => p.isApproved && !p.isPrivate)
      .map((p) => ({
        url: p.url,
        thumbnail: p.thumbnail,
        isPrimary: p.isPrimary,
        publicId: p.publicId,
      })),
    jatakam: this.jatakam
      ? {
          mangalaDosham: this.jatakam.mangalaDosham,
          rashi: this.jatakam.rashi,
          nakshatra: this.jatakam.nakshatra,
        }
      : null,
    profileComplete: this.profileComplete,
    isFeatured: this.isFeatured,
    nativePlace: this.nativePlace,
    kulaDevata: this.kulaDevata,
    isAdmin: this.isAdmin,
  };
};

module.exports = mongoose.model("User", userSchema);
