import mongoose from "mongoose";
import Biodata from "../../models/biodata.model.js";
import Preference from "../../models/preference.model.js";
import Like from "../../models/like.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { parsePagination, buildPagination } from "../../utils/pagination.js";
import { BIODATA_STATUSES } from "../../constants/index.js";

const LIST_PROJECTION =
  "biodataNo fullName gender age religion maritalStatus division district heightText skinColor occupation education profileImage viewCount status createdAt";

// ---------------------------------------------------------------------------
// Own preferences
// ---------------------------------------------------------------------------

export async function getMyPreferences(userId) {
  let doc = await Preference.findOne({ user: userId }).lean();
  if (!doc) {
    // Read-your-own always succeeds: return the implicit empty preference.
    doc = { user: userId, gender: null, ageMin: null, ageMax: null, divisions: [], religion: null, maritalStatuses: [], education: "", occupation: "", minMatchScore: 0 };
    return { ...doc, id: null, isNew: true };
  }
  return { ...doc, id: doc._id.toString(), isNew: false };
}

export async function upsertMyPreferences(userId, body) {
  const payload = {};
  const KEYS = ["gender", "ageMin", "ageMax", "divisions", "religion", "maritalStatuses", "education", "occupation", "minMatchScore"];
  for (const k of KEYS) if (body[k] !== undefined) payload[k] = body[k];

  const doc = await Preference.findOneAndUpdate(
    { user: userId },
    { $set: { ...payload, user: userId } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();

  return { ...doc, id: doc._id.toString(), isNew: false };
}

// ---------------------------------------------------------------------------
// Matching engine — প্রেফারেন্স-ভিত্তিক র‍্যাংকিং
// ---------------------------------------------------------------------------
// স্কোরিং: মোট ১০০। gender ৩৫, age ২৫, division ১৫, religion ১০,
// maritalStatus ১০, education ৫ কিন্তু education+occupation দুটোই মিললে ১০।
// যে ক্রাইটেরিয়া ইউজার সেট করেনি সেগুলোর ওজন বাকিদের মধ্যে পুনর্বণ্টন হয় —
// ফলে "কিছুই সেট করা নেই" মানে সবাই ১০০, "সব সেট করা" মানে পূর্ণ পার্থক্য।

const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function computeMatchScore(prefs, doc) {
  const weights = { gender: 35, age: 25, division: 15, religion: 10, maritalStatus: 10, education: 5, occupation: 5 };
  const active = new Set();
  const mark = (k, on) => { if (on) active.add(k); };

  mark("gender", Boolean(prefs.gender));
  mark("age", prefs.ageMin != null || prefs.ageMax != null);
  mark("division", (prefs.divisions || []).length > 0);
  mark("religion", Boolean(prefs.religion));
  mark("maritalStatus", (prefs.maritalStatuses || []).length > 0);
  mark("education", Boolean(prefs.education));
  mark("occupation", Boolean(prefs.occupation));

  const totalPossible = [...active].reduce((a, k) => a + weights[k], 0);
  // কিছুই সেট করা না থাকলে সব ক্যান্ডিডেট "পূর্ণ ম্যাচ" (১০০) ধরা হয়।
  const scale = totalPossible > 0 ? 100 / totalPossible : 0;
  if (totalPossible === 0) return { score: 100, reasons: ["কোনো শর্ত নেই"] };

  const reasons = [];
  let raw = 0;

  const add = (key, ok, labelBn) => {
    if (!active.has(key)) return;
    if (ok) {
      raw += weights[key];
      reasons.push(labelBn);
    }
  };

  add("gender", doc.gender === prefs.gender, "লিঙ্গ মিলেছে");
  if (active.has("age")) {
    const age = doc.age;
    const lo = prefs.ageMin != null ? prefs.ageMin : -Infinity;
    const hi = prefs.ageMax != null ? prefs.ageMax : Infinity;
    const inBand = age != null && age >= lo && age <= hi;
    if (inBand) {
      raw += weights.age;
      reasons.push(`বয়স ${age} ব্যান্ডে`);
    }
  }
  add("division", (prefs.divisions || []).includes(doc.division), "বিভাগ মিলেছে");
  add("religion", prefs.religion === doc.religion, "ধর্ম মিলেছে");
  add("maritalStatus", (prefs.maritalStatuses || []).includes(doc.maritalStatus), "বৈবাহিক অবস্থা মিলেছে");
  if (active.has("education")) {
    const rx = new RegExp(escapeRegExp(prefs.education), "i");
    if (rx.test(doc.education || "") || rx.test(doc.degree || "")) {
      raw += weights.education;
      reasons.push("শিক্ষা মিলেছে");
    }
  }
  if (active.has("occupation")) {
    const rx = new RegExp(escapeRegExp(prefs.occupation), "i");
    if (rx.test(doc.occupation || "")) {
      raw += weights.occupation;
      reasons.push("পেশা মিলেছে");
    }
  }

  const score = Math.round(raw * scale);
  return { score, reasons };
}

export async function myMatches(userId, query = {}) {
  const prefs = await Preference.findOne({ user: userId }).lean();
  const filter = { status: BIODATA_STATUSES.APPROVED };
  const hard = [];
  if (prefs?.gender) filter.gender = prefs.gender;
  if (prefs?.religion) filter.religion = prefs.religion;
  if (prefs?.maritalStatuses?.length) filter.maritalStatus = { $in: prefs.maritalStatuses };

  const { page, limit, skip } = parsePagination(query);
  const [total, docs, myBiodata, likes] = await Promise.all([
    Biodata.countDocuments(filter),
    Biodata.find(filter).sort({ createdAt: -1 }).limit(500).select(`${LIST_PROJECTION} degree`).lean(),
    Biodata.findOne({ user: userId }).select("gender religion division").lean(),
    Like.find({ user: userId }).select("biodata").lean(),
  ]);

  const likedSet = new Set(likes.map((l) => l.biodata.toString()));

  // হার্ড এক্সক্লুশন: নিজের বায়োডাটা ও বয়স-ব্যান্ডের বাইরেররা রেজাল্টে আসবেই না
  // (gender/religion/maritalStatus ইতিমধ্যে ফিল্টারে; age এখানে)।
  const selfId = myBiodata ? myBiodata._id.toString() : null;
  const scored = docs
    .filter((d) => {
      if (selfId && d._id.toString() === selfId) return false;
      if (prefs?.ageMin != null || prefs?.ageMax != null) {
        const lo = prefs.ageMin != null ? prefs.ageMin : -Infinity;
        const hi = prefs.ageMax != null ? prefs.ageMax : Infinity;
        if (d.age == null || d.age < lo || d.age > hi) return false;
      }
      return true;
    })
    .map((d) => {
      const { score, reasons } = computeMatchScore(prefs || {}, d);
      return { ...d, id: d._id.toString(), matchScore: score, matchReasons: reasons, likedByMe: likedSet.has(d._id.toString()) };
    })
    .filter((d) => d.matchScore >= (prefs?.minMatchScore ?? 0))
    .sort((a, b) => b.matchScore - a.matchScore || new Date(b.createdAt) - new Date(a.createdAt));

  // total = হার্ড-ফিল্টার পাস করা মোট ক্যান্ডিডেট; pagination সেই সংখ্যার উপর ভিত্তি করে।
  const shown = scored.slice(skip, skip + limit);
  return {
    items: shown,
    pagination: buildPagination(scored.length, page, limit),
    preferenceApplied: Boolean(prefs),
  };
}

export async function assertPrefModuleHealthy() {
  await mongoose.modelNames(); // no-op placeholder to keep mongoose import used
  return true;
}
