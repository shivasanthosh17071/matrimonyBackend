// File: src/services/jatakamService.js
// Purpose: Telugu Jatakam (horoscope) compatibility — Ashtakoot Guna Milan (36 points)
// Telugu terms used throughout: Jatakam, Nakshatra, Rashi, Gotram, MangalaDosham

const NAKSHATRAS = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra',
  'Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni',
  'Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
  'Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha',
  'Purva Bhadrapada','Uttara Bhadrapada','Revati',
];

const RASHIS = [
  'Mesha','Vrishabha','Mithuna','Karkataka','Simha','Kanya',
  'Tula','Vrischika','Dhanu','Makara','Kumbha','Meena',
];

// Gana classification (temperament)
const GANA_MAP = {
  Ashwini:'deva',Mrigashira:'deva',Punarvasu:'deva',Pushya:'deva',Hasta:'deva',
  Swati:'deva',Anuradha:'deva',Shravana:'deva',Revati:'deva',
  Bharani:'manushya',Rohini:'manushya',Ardra:'manushya','Purva Phalguni':'manushya',
  'Uttara Phalguni':'manushya','Purva Ashadha':'manushya','Uttara Ashadha':'manushya',
  'Purva Bhadrapada':'manushya','Uttara Bhadrapada':'manushya',
  Krittika:'rakshasa',Ashlesha:'rakshasa',Magha:'rakshasa',Chitra:'rakshasa',
  Vishakha:'rakshasa',Jyeshtha:'rakshasa',Mula:'rakshasa',Dhanishta:'rakshasa',Shatabhisha:'rakshasa',
};

// Nadi groups (pulse — same nadi = 0 points = Nadi Dosham)
const NADI_MAP = {
  Ashwini:'aadi',Ardra:'aadi',Punarvasu:'aadi','Uttara Phalguni':'aadi',Hasta:'aadi',
  Jyeshtha:'aadi',Mula:'aadi',Shatabhisha:'aadi','Purva Bhadrapada':'aadi',
  Bharani:'madhya',Mrigashira:'madhya',Pushya:'madhya','Purva Phalguni':'madhya',
  Chitra:'madhya',Anuradha:'madhya','Purva Ashadha':'madhya',Dhanishta:'madhya',
  'Uttara Bhadrapada':'madhya',
  Krittika:'antya',Rohini:'antya',Ashlesha:'antya',Magha:'antya',
  Swati:'antya',Vishakha:'antya','Uttara Ashadha':'antya',Shravana:'antya',Revati:'antya',
};

// Rashi lords
const RASHI_LORDS = ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
const PLANET_FRIENDS = {
  Sun:['Moon','Mars','Jupiter'], Moon:['Sun','Mercury'],
  Mars:['Sun','Moon','Jupiter'], Mercury:['Sun','Venus'],
  Jupiter:['Sun','Moon','Mars'], Venus:['Mercury','Saturn'], Saturn:['Mercury','Venus'],
};

const areFriends = (p1, p2) => PLANET_FRIENDS[p1]?.includes(p2);

// Tara (birth star distance compatibility)
const calcTara = (boyIdx, girlIdx) => {
  const t = ((girlIdx - boyIdx + 27) % 27) % 9;
  return [0,2,4,6,8].includes(t) ? 3 : 0;
};

// Yoni groups
const YONI_GROUPS = [
  ['Ashwini','Shatabhisha'],['Bharani','Revati'],['Krittika','Pushya'],['Rohini','Mrigashira'],
  ['Ardra','Mula'],['Punarvasu','Ashlesha'],['Magha','Purva Phalguni'],
  ['Uttara Phalguni','Uttara Bhadrapada'],['Hasta','Swati'],['Chitra','Vishakha'],
  ['Anuradha','Jyeshtha'],['Purva Ashadha','Shravana'],['Dhanishta','Purva Bhadrapada'],['Uttara Ashadha'],
];
const getYoniGroup = (n) => YONI_GROUPS.findIndex(g => g.includes(n));
const calcYoni = (b, g) => {
  const bg = getYoniGroup(b), gg = getYoniGroup(g);
  return (bg === -1 || gg === -1) ? 2 : bg === gg ? 4 : 2;
};

// Graha Maitri
const calcGrahaMaitri = (boyRashi, girlRashi) => {
  const bi = RASHIS.indexOf(boyRashi), gi = RASHIS.indexOf(girlRashi);
  if (bi === -1 || gi === -1) return 3;
  const bl = RASHI_LORDS[bi], gl = RASHI_LORDS[gi];
  if (bl === gl) return 5;
  if (areFriends(bl, gl) && areFriends(gl, bl)) return 5;
  if (areFriends(bl, gl) || areFriends(gl, bl)) return 4;
  return 1;
};

// Gana
const GANA_SCORE = {
  deva_deva:6, manushya_manushya:6, rakshasa_rakshasa:6,
  deva_manushya:5, manushya_deva:5,
  deva_rakshasa:0, rakshasa_deva:0, manushya_rakshasa:0, rakshasa_manushya:0,
};
const calcGana = (b, g) => {
  const bg = GANA_MAP[b]||'manushya', gg = GANA_MAP[g]||'manushya';
  return GANA_SCORE[`${bg}_${gg}`] ?? 3;
};

// Bhakoot
const BAD_BHAKOOT = {'1_7':true,'7_1':true,'2_12':true,'12_2':true,'6_8':true,'8_6':true};
const calcBhakoot = (br, gr) => {
  const bi = (RASHIS.indexOf(br)+1)||1, gi = (RASHIS.indexOf(gr)+1)||1;
  const d1 = Math.abs(bi-gi), d2 = 12 - d1;
  return BAD_BHAKOOT[`${d1}_${d2}`] ? 0 : 7;
};

// Nadi (most important — same nadi = Nadi Dosham, very inauspicious in Telugu tradition)
const calcNadi = (b, g) => {
  const bn = NADI_MAP[b]||'aadi', gn = NADI_MAP[g]||'madhya';
  return bn === gn ? 0 : 8;
};

/**
 * Full Ashtakoot Guna Milan calculation
 * @param {{ nakshatra, rashi, mangalaDosham }} boy
 * @param {{ nakshatra, rashi, mangalaDosham }} girl
 * @returns {{ score, outOf, percentage, breakdown, dosham, compatible }}
 */
const calculateJatakamCompatibility = (boy, girl) => {
  if (!boy.nakshatra || !girl.nakshatra) {
    return { score: null, outOf: 36, breakdown: null, dosham: [], compatible: null };
  }

  const bi = NAKSHATRAS.indexOf(boy.nakshatra);
  const gi = NAKSHATRAS.indexOf(girl.nakshatra);

  const breakdown = {
    varna:       { score: 1,                                      maxScore: 1,  label: 'Varna (వర్ణం)' },
    vashya:      { score: 2,                                      maxScore: 2,  label: 'Vashya (వశ్యం)' },
    tara:        { score: calcTara(bi, gi),                       maxScore: 3,  label: 'Tara (తార)' },
    yoni:        { score: calcYoni(boy.nakshatra, girl.nakshatra),maxScore: 4,  label: 'Yoni (యోని)' },
    grahaMaitri: { score: calcGrahaMaitri(boy.rashi, girl.rashi), maxScore: 5,  label: 'Graha Maitri (గ్రహ మైత్రి)' },
    gana:        { score: calcGana(boy.nakshatra, girl.nakshatra),maxScore: 6,  label: 'Gana (గణం)' },
    bhakoot:     { score: calcBhakoot(boy.rashi, girl.rashi),     maxScore: 7,  label: 'Bhakoot (రాశి కూటమి)' },
    nadi:        { score: calcNadi(boy.nakshatra, girl.nakshatra),maxScore: 8,  label: 'Nadi (నాడి)' },
  };

  const score = Object.values(breakdown).reduce((s, b) => s + b.score, 0);

  // Telugu-specific dosham checks
  const dosham = [];
  if (breakdown.nadi.score === 0)        dosham.push('నాడి దోషం (Nadi Dosham)');
  if (breakdown.bhakoot.score === 0)     dosham.push('రాశి దోషం (Rashi Dosham)');
  if (breakdown.gana.score === 0)        dosham.push('గణ దోషం (Gana Dosham)');
  if (boy.mangalaDosham === 'yes' && girl.mangalaDosham !== 'yes') dosham.push('మంగళ దోషం (Mangala Dosham)');

  // Gotram check — same gotram is strictly prohibited in Telugu culture
  if (boy.gotram && girl.gotram && boy.gotram.toLowerCase() === girl.gotram.toLowerCase()) {
    dosham.push('సమాన గోత్రం (Same Gotram — Marriage Not Permitted)');
  }

  return {
    score,
    outOf: 36,
    percentage: Math.round((score / 36) * 100),
    breakdown,
    dosham,
    compatible: score >= 18 && dosham.length === 0,
    // Telugu rating labels
    rating: score >= 32 ? 'అతి ఉత్తమం (Excellent)'
          : score >= 27 ? 'ఉత్తమం (Very Good)'
          : score >= 21 ? 'మధ్యమం (Good)'
          : score >= 18 ? 'సామాన్యం (Average)'
          : 'అనుకూలం కాదు (Incompatible)',
  };
};

/**
 * Overall profile compatibility score (0–100)
 * Combines jatakam + partner preference matching
 */
const calculateCompatibilityScore = (user, candidate) => {
  let score = 50;

  // Jatakam contribution (up to 30 points)
  if (user.jatakam?.nakshatra && candidate.jatakam?.nakshatra) {
    const j = calculateJatakamCompatibility(
      { nakshatra: user.jatakam.nakshatra, rashi: user.jatakam.rashi, mangalaDosham: user.jatakam.mangalaDosham, gotram: user.gotram },
      { nakshatra: candidate.jatakam.nakshatra, rashi: candidate.jatakam.rashi, mangalaDosham: candidate.jatakam.mangalaDosham, gotram: candidate.gotram }
    );
    score += Math.round(((j.score || 0) / 36) * 30);
    // Hard deduct for same gotram
    if (j.dosham.some(d => d.includes('Same Gotram'))) score -= 25;
  }

  const pref = user.partnerPreference;
  if (!pref) return Math.min(Math.max(score, 0), 100);

  const age = candidate.age;
  if (age >= (pref.ageMin || 18) && age <= (pref.ageMax || 60)) score += 5;
  if (pref.district?.includes(candidate.district)) score += 6;
  else if (pref.state?.includes(candidate.state)) score += 3;
  if (pref.religion?.includes(candidate.religion)) score += 4;
  if (pref.caste?.includes(candidate.caste)) score += 4;
  if (candidate.aadhaarVerified) score += 2;
  if (candidate.plan !== 'free') score += 2;

  return Math.max(0, Math.min(score, 100));
};

module.exports = { calculateJatakamCompatibility, calculateCompatibilityScore };
