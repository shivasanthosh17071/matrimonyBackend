// File: src/constants/masterData.js
// ═══════════════════════════════════════════════════════════════════════
//  Telugu Saptapadi — MASTER DROPDOWN DATA
//  All select/dropdown options used across frontend forms and backend.
//  Single source of truth. Edit here only.
//  Used by: profile wizard, registration, browse filters, admin panel.
// ═══════════════════════════════════════════════════════════════════════

// ── RELIGION ────────────────────────────────────────────────────────────
const RELIGIONS = [
  { value: "hindu", label: "Hindu" },
  { value: "christian", label: "Christian" },
  { value: "muslim", label: "Muslim" },
  { value: "other", label: "Other" },
];

// ── CASTES (Telugu community) ────────────────────────────────────────────
const CASTES = [
  { value: "Kamma", label: "Kamma" },
  { value: "Reddy", label: "Reddy" },
  { value: "Kapu", label: "Kapu / Naidu" },
  { value: "Brahmin_Vaidiki", label: "Brahmin (Vaidiki)" },
  { value: "Brahmin_Niyogi", label: "Brahmin (Niyogi)" },
  { value: "Brahmin_Smarta", label: "Brahmin (Smarta)" },
  { value: "Velama", label: "Velama" },
  { value: "Yadav", label: "Yadav / Golla" },
  { value: "Vysya", label: "Vysya / Komati" },
  { value: "Balija", label: "Balija" },
  { value: "Kamma_Naidu", label: "Kamma Naidu" },
  { value: "Munnuru_Kapu", label: "Munnuru Kapu" },
  { value: "Telaga", label: "Telaga" },
  { value: "Rajaka", label: "Rajaka" },
  { value: "Padmashali", label: "Padmashali" },
  { value: "Koppula_Velama", label: "Koppula Velama" },
  { value: "Turpu_Kapu", label: "Turpu Kapu" },
  { value: "Agnikula_Kshatriya", label: "Agnikula Kshatriya" },
  { value: "SC_Mala", label: "SC / Mala" },
  { value: "SC_Madiga", label: "SC / Madiga" },
  { value: "ST", label: "ST (Scheduled Tribe)" },
  { value: "Muslim", label: "Muslim (General)" },
  { value: "Christian", label: "Christian (General)" },
  { value: "Inter_Caste", label: "Open to Inter-Caste" },
  { value: "Other", label: "Other" },
];

// ── REGION ───────────────────────────────────────────────────────────────
const REGIONS = [
  { value: "andhra", label: "Andhra Pradesh" },
  { value: "telangana", label: "Telangana" },
  { value: "rayalaseema", label: "Rayalaseema" },
  { value: "other", label: "Other" },
];

// ── DISTRICTS ────────────────────────────────────────────────────────────
const AP_DISTRICTS = [
  // Andhra Pradesh
  { value: "Srikakulam", label: "Srikakulam", region: "andhra" },
  { value: "Vizianagaram", label: "Vizianagaram", region: "andhra" },
  { value: "Visakhapatnam", label: "Visakhapatnam", region: "andhra" },
  { value: "East_Godavari", label: "East Godavari", region: "andhra" },
  { value: "West_Godavari", label: "West Godavari", region: "andhra" },
  { value: "Krishna", label: "Krishna", region: "andhra" },
  { value: "Guntur", label: "Guntur", region: "andhra" },
  { value: "Prakasam", label: "Prakasam", region: "andhra" },
  { value: "Nellore", label: "Nellore (SPSR)", region: "andhra" },
  { value: "Kurnool", label: "Kurnool", region: "rayalaseema" },
  { value: "Kadapa", label: "Kadapa (YSR)", region: "rayalaseema" },
  { value: "Chittoor", label: "Chittoor", region: "rayalaseema" },
  { value: "Anantapur", label: "Anantapur", region: "rayalaseema" },
  // Telangana
  { value: "Hyderabad", label: "Hyderabad", region: "telangana" },
  { value: "Rangareddy", label: "Ranga Reddy", region: "telangana" },
  { value: "Medchal", label: "Medchal-Malkajgiri", region: "telangana" },
  { value: "Sangareddy", label: "Sangareddy", region: "telangana" },
  { value: "Medak", label: "Medak", region: "telangana" },
  { value: "Nizamabad", label: "Nizamabad", region: "telangana" },
  { value: "Kamareddy", label: "Kamareddy", region: "telangana" },
  { value: "Karimnagar", label: "Karimnagar", region: "telangana" },
  { value: "Peddapalli", label: "Peddapalli", region: "telangana" },
  { value: "Jagtial", label: "Jagtial", region: "telangana" },
  { value: "Rajanna_Sircilla", label: "Rajanna Sircilla", region: "telangana" },
  { value: "Warangal", label: "Warangal", region: "telangana" },
  { value: "Hanamkonda", label: "Hanamkonda", region: "telangana" },
  { value: "Jangaon", label: "Jangaon", region: "telangana" },
  { value: "Mahabubabad", label: "Mahabubabad", region: "telangana" },
  { value: "Khammam", label: "Khammam", region: "telangana" },
  { value: "Suryapet", label: "Suryapet", region: "telangana" },
  { value: "Nalgonda", label: "Nalgonda", region: "telangana" },
  { value: "Yadadri", label: "Yadadri Bhuvanagiri", region: "telangana" },
  { value: "Nagarkurnool", label: "Nagarkurnool", region: "telangana" },
  { value: "Wanaparthy", label: "Wanaparthy", region: "telangana" },
  { value: "Mahabubnagar", label: "Mahabubnagar", region: "telangana" },
  { value: "Gadwal", label: "Jogulamba Gadwal", region: "telangana" },
  { value: "Vikarabad", label: "Vikarabad", region: "telangana" },
  { value: "Siddipet", label: "Siddipet", region: "telangana" },
  { value: "Bhadradri", label: "Bhadradri Kothagudem", region: "telangana" },
  { value: "Mulugu", label: "Mulugu", region: "telangana" },
  { value: "Asifabad", label: "Kumuram Bheem Asifabad", region: "telangana" },
  { value: "Mancherial", label: "Mancherial", region: "telangana" },
  { value: "Adilabad", label: "Adilabad", region: "telangana" },
  { value: "Nirmal", label: "Nirmal", region: "telangana" },
  // Outside AP/TS
  { value: "Other_India", label: "Other (India)", region: "other" },
  { value: "Abroad", label: "Abroad / NRI", region: "other" },
];

// ── STATES ───────────────────────────────────────────────────────────────
const INDIAN_STATES = [
  { value: "Andhra Pradesh", label: "Andhra Pradesh" },
  { value: "Telangana", label: "Telangana" },
  { value: "Tamil Nadu", label: "Tamil Nadu" },
  { value: "Karnataka", label: "Karnataka" },
  { value: "Maharashtra", label: "Maharashtra" },
  { value: "Delhi", label: "Delhi" },
  { value: "Gujarat", label: "Gujarat" },
  { value: "Rajasthan", label: "Rajasthan" },
  { value: "Uttar Pradesh", label: "Uttar Pradesh" },
  { value: "West Bengal", label: "West Bengal" },
  { value: "Madhya Pradesh", label: "Madhya Pradesh" },
  { value: "Kerala", label: "Kerala" },
  { value: "Punjab", label: "Punjab" },
  { value: "Haryana", label: "Haryana" },
  { value: "Bihar", label: "Bihar" },
  { value: "Odisha", label: "Odisha" },
  { value: "Jharkhand", label: "Jharkhand" },
  { value: "Assam", label: "Assam" },
  { value: "Chhattisgarh", label: "Chhattisgarh" },
  { value: "Uttarakhand", label: "Uttarakhand" },
  { value: "Himachal Pradesh", label: "Himachal Pradesh" },
  { value: "Goa", label: "Goa" },
  { value: "Other", label: "Other" },
];

// ── COUNTRIES ─────────────────────────────────────────────────────────────
const COUNTRIES = [
  { value: "India", label: "India 🇮🇳" },
  { value: "USA", label: "United States 🇺🇸" },
  { value: "UK", label: "United Kingdom 🇬🇧" },
  { value: "Australia", label: "Australia 🇦🇺" },
  { value: "Canada", label: "Canada 🇨🇦" },
  { value: "UAE", label: "UAE 🇦🇪" },
  { value: "Singapore", label: "Singapore 🇸🇬" },
  { value: "Saudi Arabia", label: "Saudi Arabia 🇸🇦" },
  { value: "Qatar", label: "Qatar 🇶🇦" },
  { value: "Kuwait", label: "Kuwait 🇰🇼" },
  { value: "New Zealand", label: "New Zealand 🇳🇿" },
  { value: "Germany", label: "Germany 🇩🇪" },
  { value: "Netherlands", label: "Netherlands 🇳🇱" },
  { value: "Malaysia", label: "Malaysia 🇲🇾" },
  { value: "Japan", label: "Japan 🇯🇵" },
  { value: "South Africa", label: "South Africa 🇿🇦" },
  { value: "Other", label: "Other" },
];

// ── HEIGHT ────────────────────────────────────────────────────────────────
const HEIGHTS = [
  { value: "4'6\"", label: "4'6\" (137 cm)" },
  { value: "4'7\"", label: "4'7\" (139 cm)" },
  { value: "4'8\"", label: "4'8\" (142 cm)" },
  { value: "4'9\"", label: "4'9\" (144 cm)" },
  { value: "4'10\"", label: "4'10\" (147 cm)" },
  { value: "4'11\"", label: "4'11\" (149 cm)" },
  { value: "5'0\"", label: "5'0\" (152 cm)" },
  { value: "5'1\"", label: "5'1\" (154 cm)" },
  { value: "5'2\"", label: "5'2\" (157 cm)" },
  { value: "5'3\"", label: "5'3\" (160 cm)" },
  { value: "5'4\"", label: "5'4\" (162 cm)" },
  { value: "5'5\"", label: "5'5\" (165 cm)" },
  { value: "5'6\"", label: "5'6\" (167 cm)" },
  { value: "5'7\"", label: "5'7\" (170 cm)" },
  { value: "5'8\"", label: "5'8\" (172 cm)" },
  { value: "5'9\"", label: "5'9\" (175 cm)" },
  { value: "5'10\"", label: "5'10\" (177 cm)" },
  { value: "5'11\"", label: "5'11\" (180 cm)" },
  { value: "6'0\"", label: "6'0\" (182 cm)" },
  { value: "6'1\"", label: "6'1\" (185 cm)" },
  { value: "6'2\"", label: "6'2\" (187 cm)" },
  { value: "6'3\"", label: "6'3\" (190 cm)" },
  { value: "6'4\"", label: "6'4\" (193 cm)" },
];

// ── COMPLEXION ────────────────────────────────────────────────────────────
const COMPLEXIONS = [
  { value: "very_fair", label: "Very Fair" },
  { value: "fair", label: "Fair" },
  { value: "wheatish", label: "Wheatish" },
  { value: "dusky", label: "Dusky" },
  { value: "dark", label: "Dark" },
];

// ── BODY TYPE ─────────────────────────────────────────────────────────────
const BODY_TYPES = [
  { value: "slim", label: "Slim" },
  { value: "average", label: "Average" },
  { value: "athletic", label: "Athletic" },
  { value: "heavy", label: "Heavy" },
];

// ── BLOOD GROUP ───────────────────────────────────────────────────────────
const BLOOD_GROUPS = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
];

// ── EDUCATION ─────────────────────────────────────────────────────────────
const EDUCATION_LEVELS = [
  { value: "Below_10th", label: "Below 10th" },
  { value: "SSLC_10th", label: "SSLC / 10th" },
  { value: "HSC_12th", label: "HSC / 12th / Intermediate" },
  { value: "Diploma", label: "Diploma" },
  { value: "ITI", label: "ITI" },
  { value: "BCA", label: "BCA" },
  { value: "BBA", label: "BBA" },
  { value: "BA", label: "BA (Arts)" },
  { value: "BSc", label: "B.Sc (Science)" },
  { value: "BCom", label: "B.Com (Commerce)" },
  { value: "BTech", label: "B.Tech / BE" },
  { value: "MBBS", label: "MBBS" },
  { value: "BDS", label: "BDS (Dentist)" },
  { value: "BPharm", label: "B.Pharm" },
  { value: "BNursing", label: "B.Sc Nursing" },
  { value: "LLB", label: "LLB (Law)" },
  { value: "BArch", label: "B.Arch" },
  { value: "MCA", label: "MCA" },
  { value: "MBA", label: "MBA / PGDM" },
  { value: "MA", label: "MA (Arts)" },
  { value: "MSc", label: "M.Sc (Science)" },
  { value: "MCom", label: "M.Com" },
  { value: "MTech", label: "M.Tech / ME" },
  { value: "MD", label: "MD / MS (Medicine)" },
  { value: "LLM", label: "LLM (Law PG)" },
  { value: "MPhil", label: "M.Phil" },
  { value: "PhD", label: "Ph.D / Doctorate" },
  { value: "CA", label: "CA (Chartered Accountant)" },
  { value: "CS", label: "CS (Company Secretary)" },
  { value: "ICWA", label: "ICWA / CMA" },
  { value: "Other", label: "Other" },
];

// ── OCCUPATION ────────────────────────────────────────────────────────────
const OCCUPATIONS = [
  { value: "Software_Engineer", label: "Software Engineer / IT" },
  { value: "Doctor", label: "Doctor / Physician" },
  { value: "Engineer", label: "Engineer (Non-IT)" },
  { value: "Teacher", label: "Teacher / Professor" },
  { value: "Government_Employee", label: "Government Employee" },
  { value: "Bank_Employee", label: "Bank Employee" },
  { value: "Lawyer", label: "Lawyer / Advocate" },
  { value: "Accountant", label: "Accountant / CA" },
  { value: "Businessman", label: "Businessman / Entrepreneur" },
  { value: "Farmer", label: "Farmer / Agriculture" },
  { value: "Police", label: "Police / Army / Defense" },
  { value: "Nurse", label: "Nurse / Paramedic" },
  { value: "Architect", label: "Architect / Designer" },
  { value: "Media", label: "Media / Journalist" },
  { value: "Hospitality", label: "Hotel / Hospitality" },
  { value: "NRI_Professional", label: "NRI Professional" },
  { value: "Homemaker", label: "Homemaker" },
  { value: "Student", label: "Student" },
  { value: "Not_Working", label: "Not Working" },
  { value: "Other", label: "Other" },
];

// ── EMPLOYED IN ───────────────────────────────────────────────────────────
const EMPLOYED_IN = [
  { value: "private", label: "Private Sector" },
  { value: "government", label: "Government / PSU" },
  { value: "business", label: "Business / Self-Employed" },
  { value: "self_employed", label: "Freelancer / Consultant" },
  { value: "not_working", label: "Not Working" },
  { value: "student", label: "Student" },
];

// ── ANNUAL INCOME ─────────────────────────────────────────────────────────
const ANNUAL_INCOMES = [
  { value: "No_Income", label: "No Income" },
  { value: "Below_1L", label: "Below ₹1 Lakh" },
  { value: "1L_to_2L", label: "₹1–2 Lakhs" },
  { value: "2L_to_5L", label: "₹2–5 Lakhs" },
  { value: "5L_to_10L", label: "₹5–10 Lakhs" },
  { value: "10L_to_15L", label: "₹10–15 Lakhs" },
  { value: "15L_to_20L", label: "₹15–20 Lakhs" },
  { value: "20L_to_30L", label: "₹20–30 Lakhs" },
  { value: "30L_to_50L", label: "₹30–50 Lakhs" },
  { value: "50L_to_75L", label: "₹50–75 Lakhs" },
  { value: "75L_to_1Cr", label: "₹75L – 1 Crore" },
  { value: "Above_1Cr", label: "Above ₹1 Crore" },
];

// ── FAMILY TYPE ───────────────────────────────────────────────────────────
const FAMILY_TYPES = [
  { value: "joint", label: "Joint Family" },
  { value: "nuclear", label: "Nuclear Family" },
];

// ── FAMILY STATUS ─────────────────────────────────────────────────────────
const FAMILY_STATUSES = [
  { value: "middle_class", label: "Middle Class" },
  { value: "upper_middle", label: "Upper Middle Class" },
  { value: "rich", label: "Rich" },
  { value: "affluent", label: "Affluent / Very Rich" },
];

// ── FAMILY VALUES ─────────────────────────────────────────────────────────
const FAMILY_VALUES = [
  { value: "traditional", label: "Traditional" },
  { value: "moderate", label: "Moderate" },
  { value: "liberal", label: "Liberal" },
];

// ── FATHER / MOTHER STATUS ────────────────────────────────────────────────
const FATHER_STATUSES = [
  { value: "employed", label: "Employed" },
  { value: "business", label: "Business" },
  { value: "retired", label: "Retired" },
  { value: "expired", label: "Expired (Late)" },
];

const MOTHER_STATUSES = [
  { value: "homemaker", label: "Homemaker" },
  { value: "employed", label: "Employed" },
  { value: "business", label: "Business" },
  { value: "expired", label: "Expired (Late)" },
];

// ── MARITAL STATUS ────────────────────────────────────────────────────────
const MARITAL_STATUSES = [
  { value: "never_married", label: "Never Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
  { value: "awaiting_divorce", label: "Awaiting Divorce" },
];

// ── DIET ──────────────────────────────────────────────────────────────────
const DIETS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "non_vegetarian", label: "Non-Vegetarian" },
  { value: "eggetarian", label: "Eggetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "jain", label: "Jain" },
];

// ── SMOKING / DRINKING ────────────────────────────────────────────────────
const SMOKING_OPTIONS = [
  { value: "no", label: "No" },
  { value: "occasionally", label: "Occasionally" },
  { value: "yes", label: "Yes" },
];

const DRINKING_OPTIONS = [
  { value: "no", label: "No" },
  { value: "occasionally", label: "Occasionally" },
  { value: "yes", label: "Yes" },
];

// ── MOTHER TONGUE ─────────────────────────────────────────────────────────
const MOTHER_TONGUES = [
  { value: "telugu", label: "Telugu" },
  { value: "urdu", label: "Urdu" },
  { value: "hindi", label: "Hindi" },
  { value: "tamil", label: "Tamil" },
  { value: "kannada", label: "Kannada" },
  { value: "english", label: "English" },
  { value: "other", label: "Other" },
];

// ── RASHI (Moon Signs - Telugu names) ────────────────────────────────────
const RASHIS = [
  { value: "Mesha", label: "Mesha (మేషం) — Aries" },
  { value: "Vrishabha", label: "Vrishabha (వృషభం) — Taurus" },
  { value: "Mithuna", label: "Mithuna (మిథునం) — Gemini" },
  { value: "Karkataka", label: "Karkataka (కర్కాటకం) — Cancer" },
  { value: "Simha", label: "Simha (సింహం) — Leo" },
  { value: "Kanya", label: "Kanya (కన్య) — Virgo" },
  { value: "Tula", label: "Tula (తుల) — Libra" },
  { value: "Vrischika", label: "Vrischika (వృశ్చికం) — Scorpio" },
  { value: "Dhanu", label: "Dhanu (ధనుస్సు) — Sagittarius" },
  { value: "Makara", label: "Makara (మకరం) — Capricorn" },
  { value: "Kumbha", label: "Kumbha (కుంభం) — Aquarius" },
  { value: "Meena", label: "Meena (మీనం) — Pisces" },
];

// ── NAKSHATRA (27 Birth Stars) ────────────────────────────────────────────
const NAKSHATRAS = [
  { value: "Ashwini", label: "Ashwini (అశ్విని)", rashi: "Mesha" },
  { value: "Bharani", label: "Bharani (భరణి)", rashi: "Mesha" },
  { value: "Krittika", label: "Krittika (కృత్తిక)", rashi: "Mesha" },
  { value: "Rohini", label: "Rohini (రోహిణి)", rashi: "Vrishabha" },
  { value: "Mrigashira", label: "Mrigashira (మృగశిర)", rashi: "Mithuna" },
  { value: "Ardra", label: "Ardra (ఆర్ద్ర)", rashi: "Mithuna" },
  { value: "Punarvasu", label: "Punarvasu (పునర్వసు)", rashi: "Karkataka" },
  { value: "Pushya", label: "Pushya (పుష్యమి)", rashi: "Karkataka" },
  { value: "Ashlesha", label: "Ashlesha (ఆశ్లేష)", rashi: "Karkataka" },
  { value: "Magha", label: "Magha (మఘ)", rashi: "Simha" },
  {
    value: "Purva Phalguni",
    label: "Purva Phalguni (పూర్వ ఫల్గుణి)",
    rashi: "Simha",
  },
  {
    value: "Uttara Phalguni",
    label: "Uttara Phalguni (ఉత్తర ఫల్గుణి)",
    rashi: "Kanya",
  },
  { value: "Hasta", label: "Hasta (హస్త)", rashi: "Kanya" },
  { value: "Chitra", label: "Chitra (చిత్త)", rashi: "Tula" },
  { value: "Swati", label: "Swati (స్వాతి)", rashi: "Tula" },
  { value: "Vishakha", label: "Vishakha (విశాఖ)", rashi: "Vrischika" },
  { value: "Anuradha", label: "Anuradha (అనూరాధ)", rashi: "Vrischika" },
  { value: "Jyeshtha", label: "Jyeshtha (జ్యేష్ఠ)", rashi: "Vrischika" },
  { value: "Mula", label: "Mula (మూల)", rashi: "Dhanu" },
  {
    value: "Purva Ashadha",
    label: "Purva Ashadha (పూర్వాషాఢ)",
    rashi: "Dhanu",
  },
  {
    value: "Uttara Ashadha",
    label: "Uttara Ashadha (ఉత్తరాషాఢ)",
    rashi: "Makara",
  },
  { value: "Shravana", label: "Shravana (శ్రవణం)", rashi: "Makara" },
  { value: "Dhanishta", label: "Dhanishta (ధనిష్ఠ)", rashi: "Kumbha" },
  { value: "Shatabhisha", label: "Shatabhisha (శతభిష)", rashi: "Kumbha" },
  {
    value: "Purva Bhadrapada",
    label: "Purva Bhadrapada (పూర్వభాద్ర)",
    rashi: "Kumbha",
  },
  {
    value: "Uttara Bhadrapada",
    label: "Uttara Bhadrapada (ఉత్తరభాద్ర)",
    rashi: "Meena",
  },
  { value: "Revati", label: "Revati (రేవతి)", rashi: "Meena" },
];

// ── NAKSHATRA PAADAM ──────────────────────────────────────────────────────
const NAKSHATRA_PAADAMS = [
  { value: 1, label: "Paadam 1 (పాదం 1)" },
  { value: 2, label: "Paadam 2 (పాదం 2)" },
  { value: 3, label: "Paadam 3 (పాదం 3)" },
  { value: 4, label: "Paadam 4 (పాదం 4)" },
];

// ── MANGALA DOSHAM ────────────────────────────────────────────────────────
const MANGALA_DOSHAM_OPTIONS = [
  { value: "no", label: "No Dosham" },
  { value: "yes", label: "Yes — Mangala Dosham" },
  { value: "partial", label: "Partial Dosham" },
  { value: "unknown", label: "Not Known" },
];

// ── PROFILE FOR ───────────────────────────────────────────────────────────
const PROFILE_FOR_OPTIONS = [
  { value: "myself", label: "Myself" },
  { value: "son", label: "My Son" },
  { value: "daughter", label: "My Daughter" },
  { value: "brother", label: "My Brother" },
  { value: "sister", label: "My Sister" },
  { value: "relative", label: "My Relative" },
];

// ── GENDER ────────────────────────────────────────────────────────────────
const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

// ── REPORT REASONS ────────────────────────────────────────────────────────
const REPORT_REASONS = [
  { value: "fake_profile", label: "Fake Profile" },
  { value: "inappropriate_photo", label: "Inappropriate Photo" },
  { value: "harassment", label: "Harassment / Abuse" },
  { value: "spam", label: "Spam / Scam" },
  { value: "wrong_info", label: "Wrong Information" },
  { value: "already_married", label: "Already Married" },
  { value: "other", label: "Other" },
];

// ── SORT OPTIONS (Browse page) ────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "featured", label: "Featured First" },
  { value: "newest", label: "Newest Members" },
  { value: "activity", label: "Recently Active" },
  { value: "completion", label: "Profile Completeness" },
];

// ═══════════════════════════════════════════════════════════════════════
//  API ENDPOINT — serves all dropdown data to frontend
//  GET /api/master/dropdowns   → returns all of the above
//  GET /api/master/districts?region=andhra → filtered districts
// ═══════════════════════════════════════════════════════════════════════

const getAllDropdowns = () => ({
  religions: RELIGIONS,
  castes: CASTES,
  regions: REGIONS,
  districts: AP_DISTRICTS,
  states: INDIAN_STATES,
  countries: COUNTRIES,
  heights: HEIGHTS,
  complexions: COMPLEXIONS,
  bodyTypes: BODY_TYPES,
  bloodGroups: BLOOD_GROUPS,
  educationLevels: EDUCATION_LEVELS,
  occupations: OCCUPATIONS,
  employedIn: EMPLOYED_IN,
  annualIncomes: ANNUAL_INCOMES,
  familyTypes: FAMILY_TYPES,
  familyStatuses: FAMILY_STATUSES,
  familyValues: FAMILY_VALUES,
  fatherStatuses: FATHER_STATUSES,
  motherStatuses: MOTHER_STATUSES,
  maritalStatuses: MARITAL_STATUSES,
  diets: DIETS,
  smokingOptions: SMOKING_OPTIONS,
  drinkingOptions: DRINKING_OPTIONS,
  motherTongues: MOTHER_TONGUES,
  rashis: RASHIS,
  nakshatras: NAKSHATRAS,
  nakshatrapaadams: NAKSHATRA_PAADAMS,
  mangalaDoshamOptions: MANGALA_DOSHAM_OPTIONS,
  profileForOptions: PROFILE_FOR_OPTIONS,
  genders: GENDERS,
  reportReasons: REPORT_REASONS,
  sortOptions: SORT_OPTIONS,
});

module.exports = {
  RELIGIONS,
  CASTES,
  REGIONS,
  AP_DISTRICTS,
  INDIAN_STATES,
  COUNTRIES,
  HEIGHTS,
  COMPLEXIONS,
  BODY_TYPES,
  BLOOD_GROUPS,
  EDUCATION_LEVELS,
  OCCUPATIONS,
  EMPLOYED_IN,
  ANNUAL_INCOMES,
  FAMILY_TYPES,
  FAMILY_STATUSES,
  FAMILY_VALUES,
  FATHER_STATUSES,
  MOTHER_STATUSES,
  MARITAL_STATUSES,
  DIETS,
  SMOKING_OPTIONS,
  DRINKING_OPTIONS,
  MOTHER_TONGUES,
  RASHIS,
  NAKSHATRAS,
  NAKSHATRA_PAADAMS,
  MANGALA_DOSHAM_OPTIONS,
  PROFILE_FOR_OPTIONS,
  GENDERS,
  REPORT_REASONS,
  SORT_OPTIONS,
  getAllDropdowns,
};
