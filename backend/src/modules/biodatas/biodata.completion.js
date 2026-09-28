/**
 * বায়োডাটা কমপ্লিশন ক্যালকুলেটর।
 *
 * ফিল্ডগুলো যৌক্তিক গ্রুপে ভাগ করা — প্রতিটি গ্রুপের ওজন আলাদা, যাতে
 * "মৌলিক তথ্য শূন্য" বায়োডাটা "শুধু শখের ঘর ফাঁকা" বায়োডাটার চেয়ে
 * কম স্কোর পায়। গ্রুপের ভেতরে সব ফিল্ড সমান ভাগে ওজন পায়।
 *
 * completion = পূর্ণ গ্রুপ-পয়েন্টের সমষ্টি, রাউন্ডেড শতাংশ।
 * প্রতিটি গ্রুপের অগ্রগতিও রিপোর্ট হয় — UI-তে কোন অংশ বাকি তা সরাসরি দেখানো যায়।
 */

// গ্রুপ → { ওজন, ফিল্ড: [key, বাংলা লেবেল] }। label_bn ব্যবহার করলে বাংলা লেবেল,
// না দিলে ফিল্ড-কী-ই লেবেল।
const GROUPS = [
  {
    key: "basic",
    weight: 20,
    fields: [
      ["gender", "পাত্র/পাত্রী"],
      ["maritalStatus", "বৈবাহিক অবস্থা"],
      ["birthYear", "জন্মসাল"],
      ["religion", "ধর্ম"],
      ["division", "বিভাগ"],
      ["district", "জেলা"],
    ],
  },
  {
    key: "personal",
    weight: 15,
    fields: [
      ["clothingStyle"],
      ["healthCondition"],
      ["entertainmentHabit"],
      ["politicalView"],
      ["favoriteBooksPeople"],
      ["aboutYourself", "নিজের সম্পর্কে"],
      ["specialCategories"],
    ],
  },
  {
    key: "religious",
    weight: 15,
    fields: [
      ["sectOrDenomination", "মাজহাব"],
      ["religiousPracticeLevel", "ধর্মীয় চর্চা"],
      ["placeOfWorshipAttendance"],
      ["holyBookReading"],
      ["religiousEducation"],
      ["religiousDressPreference"],
      ["charityActivity"],
      ["religiousOrganization"],
      ["dietaryPractice"],
      ["futureReligiousGoal"],
      ["partnerReligiousExpectation"],
    ],
  },
  {
    key: "education",
    weight: 15,
    fields: [
      ["education", "শিক্ষা মাধ্যম"],
      ["degree", "সর্বোচ্চ যোগ্যতা"],
      ["institution", "প্রতিষ্ঠান"],
      ["subject", "বিষয়"],
      ["result", "ফলাফল"],
    ],
  },
  {
    key: "profession",
    weight: 15,
    fields: [
      ["occupation", "পেশা"],
      ["occupationDetails"],
      ["monthlyIncome", "মাসিক আয়"],
      ["company"],
      ["experienceYears"],
    ],
  },
  {
    key: "family",
    weight: 10,
    fields: [
      ["fatherName", "বাবার নাম"],
      ["fatherOccupation", "বাবার পেশা"],
      ["motherName", "মায়ের নাম"],
      ["motherOccupation", "মায়ের পেশা"],
      ["siblings", "ভাই-বোন"],
    ],
  },
  {
    key: "contact",
    weight: 5,
    fields: [["mobile", "মোবাইল নম্বর"]],
  },
  {
    key: "media",
    weight: 5,
    fields: [["profileImage", "প্রোফাইল ছবি"]],
  },
];

function isFilled(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  return Boolean(value);
}

export const COMPLETION_TOTAL_WEIGHT = GROUPS.reduce((a, g) => a + g.weight, 0);

/** একটি গ্রুপের অগ্রগতি: { key, filled, total, points, maxPoints } */
export function groupProgress(group, doc) {
  const total = group.fields.length;
  const filled = group.fields.filter(([key]) => isFilled(doc?.[key])).length;
  return {
    key: group.key,
    filled,
    total,
    points: group.weight * (filled / total),
    maxPoints: group.weight,
  };
}

/**
 * পূর্ণ কমপ্লিশন রিপোর্ট।
 * @returns {{ percent:number, groups:Array, missing:Array<{field,label}> }}
 */
export function computeCompletion(doc) {
  const groups = GROUPS.map((g) => groupProgress(g, doc));
  const totalPoints = groups.reduce((a, g) => a + g.points, 0);
  const percent = Math.round((totalPoints / COMPLETION_TOTAL_WEIGHT) * 100);

  const missing = [];
  for (const g of GROUPS) {
    for (const [key, labelBn] of g.fields) {
      if (!isFilled(doc?.[key])) {
        missing.push({ field: key, label: labelBn || key, group: g.key });
      }
    }
  }

  return { percent, groups, missing };
}

/** সাবমিটের আগে যেসব ফিল্ড অবশ্যই থাকতে হবে (ব্যাকএন্ড missingCoreFields-এর সাথে সামঞ্জস্যপূর্ণ)। */
export const REQUIRED_FIELDS = [
  ["gender", "পাত্র/পাত্রী"],
  ["maritalStatus", "বৈবাহিক অবস্থা"],
  ["religion", "ধর্ম"],
  ["division", "বিভাগ"],
  ["birthYear", "জন্মসাল"],
  ["occupation", "পেশা"],
  ["education", "শিক্ষা মাধ্যম"],
  ["mobile", "মোবাইল নম্বর"],
  ["agreed", "অঙ্গীকার"],
];

export function missingRequired(doc) {
  return REQUIRED_FIELDS.filter(([key]) => !isFilled(doc?.[key])).map(([, label]) => label);
}
