/* eslint-disable no-console */
/**
 * Seed the database with the minimum data the platform needs to run:
 *   - SUPERADMIN + demo staff/member accounts
 *   - The 4 membership plans shown on /member (699/899/1099/1299)
 *   - Connect packs, a welcome coupon
 *   - Sample approved biodata (mirrors the demo profiles in the frontend)
 *
 * Usage:
 *   npm run seed            # idempotent — safe to re-run
 *   npm run seed -- --reset # drop the database first
 */
import { connectDB, disconnectDB } from "../src/config/db.js";
import env from "../src/config/env.js";
import User from "../src/models/user.model.js";
import Biodata from "../src/models/biodata.model.js";
import MembershipPlan from "../src/models/membershipPlan.model.js";
import ConnectPack from "../src/models/connectPack.model.js";
import Coupon from "../src/models/coupon.model.js";
import { ROLES, USER_STATUSES, GENDERS, MARITAL_STATUSES, RELIGIONS } from "../src/constants/index.js";

const reset = process.argv.includes("--reset");

const log = (...args) => console.log("[seed]", ...args);

const PLANS = [
  {
    name: "Monthly",
    nameBn: "মান্থলি",
    slug: "monthly",
    description: "1 month membership with 10 connects.",
    durationDays: 30,
    price: 699,
    connectCount: 10,
    acceptProposalLimit: 0, // ✗ cannot accept proposals
    isPopular: false,
    sortOrder: 1,
  },
  {
    name: "Bimonthly",
    nameBn: "দ্বিমাসিক",
    slug: "bimonthly",
    description: "2 months membership with 15 connects.",
    durationDays: 60,
    price: 899,
    connectCount: 15,
    acceptProposalLimit: 15,
    isPopular: false,
    sortOrder: 2,
  },
  {
    name: "Quarterly",
    nameBn: "ত্রৈমাসিক",
    slug: "quarterly",
    description: "3 months membership with 25 connects.",
    durationDays: 90,
    price: 1099,
    connectCount: 25,
    acceptProposalLimit: 25,
    isPopular: true, // landing page "পপুলার প্লান - ২০% ছাড়"
    discountPercent: 20,
    sortOrder: 3,
  },
  {
    name: "Semi-annual",
    nameBn: "ষাণ্মাসিক",
    slug: "semi-annual",
    description: "6 months membership with 50 connects & unlimited proposals.",
    durationDays: 180,
    price: 1299,
    connectCount: 50,
    acceptProposalLimit: -1, // অসংখ্য (unlimited)
    isPopular: false,
    sortOrder: 4,
  },
];

const PACKS = [
  { name: "১০ কানেক্ট", connects: 10, price: 99, sortOrder: 1 },
  { name: "২৫ কানেক্ট", connects: 25, price: 199, sortOrder: 2 },
  { name: "৫০ কানেক্ট", connects: 50, price: 349, sortOrder: 3 },
  { name: "১০০ কানেক্ট", connects: 100, price: 599, sortOrder: 4 },
];

async function upsertUser({ firstName, lastName, email, password, role, status }) {
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ firstName, lastName, email, passwordHash: password, role, status });
    log(`created user: ${email} (${role})`);
  } else {
    log(`user exists: ${email}`);
  }
  return user;
}

async function seedCatalog() {
  for (const plan of PLANS) {
    await MembershipPlan.updateOne({ slug: plan.slug }, { $set: plan }, { upsert: true });
  }
  log(`plans: ${PLANS.length} upserted`);

  for (const pack of PACKS) {
    await ConnectPack.updateOne({ name: pack.name, connects: pack.connects }, { $set: pack }, { upsert: true });
  }
  log(`connect packs: ${PACKS.length} upserted`);

  await Coupon.updateOne(
    { code: "WELCOME20" },
    { $set: { discountPercent: 20, description: "20% off — welcome offer", isActive: true, maxUses: null } },
    { upsert: true }
  );
  log("coupon WELCOME20 ready");
}

// Sample profiles mirroring the Bengali demo cards in the frontend.
const SAMPLES = [
  { name: "আবদুল করিম", gender: GENDERS.MALE, religion: RELIGIONS.ISLAM, age: 28, division: "ঢাকা", district: "ঢাকা", profession: "সফটওয়্যার ইঞ্জিনিয়ার", education: "BSc (CSE)", height: "৫'৮\"", color: "উজ্জ্বল ফর্সা" },
  { name: "মোহাম্মদ রাফি", gender: GENDERS.MALE, religion: RELIGIONS.ISLAM, age: 30, division: "চট্টগ্রাম", district: "চট্টগ্রাম", profession: "ডাক্তার", education: "MBBS", height: "৫'১০\"", color: "উজ্জ্বল শ্যামলা" },
  { name: "আরিফুল ইসলাম", gender: GENDERS.MALE, religion: RELIGIONS.ISLAM, age: 26, division: "খুলনা", district: "খুলনা", profession: "ব্যবসায়ী", education: "BBA", height: "৫'৯\"", color: "শ্যামলা" },
  { name: "অরিন্দম চক্রবর্তী", gender: GENDERS.MALE, religion: RELIGIONS.HINDUISM, age: 29, division: "রাজশাহী", district: "রাজশাহী", profession: "ব্যাংকার", education: "MBA", height: "৫'৮\"", color: "ফর্সা" },
  { name: "সৌরভ দাস", gender: GENDERS.MALE, religion: RELIGIONS.HINDUISM, age: 27, division: "খুলনা", district: "যশোর", profession: "শিক্ষক", education: "B.Ed", height: "৫'৭\"", color: "উজ্জ্বল শ্যামলা" },
  { name: "জন পিটার", gender: GENDERS.MALE, religion: RELIGIONS.CHRISTIANITY, age: 28, division: "ঢাকা", district: "ঢাকা", profession: "আইটি অফিসার", education: "BSc (CSE)", height: "৫'৯\"", color: "উজ্জ্বল ফর্সা" },
  { name: "সঞ্জয় বড়ুয়া", gender: GENDERS.MALE, religion: RELIGIONS.BUDDHISM, age: 29, division: "চট্টগ্রাম", district: "কক্সবাজার", profession: "সরকারি চাকরি", education: "MSS", height: "৫'৮\"", color: "উজ্জ্বল শ্যামলা" },
  { name: "আফরিন খানম", gender: GENDERS.FEMALE, religion: RELIGIONS.ISLAM, age: 24, division: "ঢাকা", district: "ঢাকা", profession: "শিক্ষার্থী", education: "BBA", height: "৫'৪\"", color: "উজ্জ্বল ফর্সা" },
  { name: "সাবরিনা রহমান", gender: GENDERS.FEMALE, religion: RELIGIONS.ISLAM, age: 26, division: "চট্টগ্রাম", district: "চট্টগ্রাম", profession: "ডাক্তার", education: "MBBS", height: "৫'৩\"", color: "উজ্জ্বল শ্যামলা" },
  { name: "নাফিসা রহমান", gender: GENDERS.FEMALE, religion: RELIGIONS.ISLAM, age: 23, division: "সিলেট", district: "সিলেট", profession: "শিক্ষক", education: "MA", height: "৫'৫\"", color: "ফর্সা" },
  { name: "প্রিয়া রায়", gender: GENDERS.FEMALE, religion: RELIGIONS.HINDUISM, age: 25, division: "খুলনা", district: "খুলনা", profession: "ব্যাংকার", education: "MBA", height: "৫'৩\"", color: "ফর্সা" },
  { name: "মারিয়া গোমেজ", gender: GENDERS.FEMALE, religion: RELIGIONS.CHRISTIANITY, age: 26, division: "ঢাকা", district: "ঢাকা", profession: "নার্স", education: "BSc (Nursing)", height: "৫'৪\"", color: "উজ্জ্বল ফর্সা" },
  { name: "সুচিত্রা বড়ুয়া", gender: GENDERS.FEMALE, religion: RELIGIONS.BUDDHISM, age: 24, division: "চট্টগ্রাম", district: "কক্সবাজার", profession: "শিক্ষার্থী", education: "BSS", height: "৫'৪\"", color: "উজ্জ্বল শ্যামলা" },
];

async function createUserForSample(sample, i) {
  const email = `member${i + 1}@nikahdeen.dev`;
  let user = await User.findOne({ email });
  if (!user) {
    const [first, ...rest] = sample.name.split(" ");
    user = await User.create({
      firstName: first,
      lastName: rest.join(" "),
      email,
      passwordHash: "Member@12345",
      role: ROLES.USER,
      status: USER_STATUSES.ACTIVE,
      phone: `0171${String(10000000 + i * 137).slice(0, 8)}`,
    });
  }
  return user;
}

async function seedBiodata() {
  const existing = await Biodata.countDocuments();
  if (existing > 0) {
    log(`biodata already present (${existing}) — skipping samples`);
    return;
  }

  for (let i = 0; i < SAMPLES.length; i += 1) {
    const s = SAMPLES[i];
    const user = await createUserForSample(s, i);
    const year = new Date().getFullYear() - s.age;
    const [first, ...rest] = s.name.split(" ");
    await Biodata.create({
      user: user._id,
      gender: s.gender,
      religion: s.religion,
      maritalStatus: MARITAL_STATUSES.UNMARRIED,
      firstName: first,
      lastName: rest.join(" "),
      birthYear: year,
      division: s.division,
      district: s.district,
      occupation: s.profession,
      education: s.education,
      heightText: s.height,
      skinColor: s.color,
      mobile: `0181${String(20000000 + i * 173).slice(0, 8)}`,
      presentAddress: `${s.district}, বাংলাদেশ`,
      permanentAddress: `${s.district}, বাংলাদেশ`,
      aboutYourself: `আমি ${s.profession}। সৎ ও ধার্মিক জীবনসঙ্গী খুঁজছি।`,
      agreed: true,
      agreedAt: new Date(),
      status: "APPROVED",
      submittedAt: new Date(),
      approvedAt: new Date(),
    });
  }
  log(`sample biodata: ${SAMPLES.length} approved profiles`);
}

async function main() {
  log(`connecting ${env.MONGODB_URI}`);
  await connectDB(env.MONGODB_URI);

  if (reset) {
    const { mongoose } = await import("mongoose");
    await mongoose.connection.dropDatabase();
    log("database dropped");
  }

  await upsertUser({
    firstName: "নিকাহ",
    lastName: "দ্বীন",
    email: "admin@nikahdeen.dev",
    password: "Admin@12345",
    role: ROLES.SUPERADMIN,
    status: USER_STATUSES.ACTIVE,
  });

  await upsertUser({
    firstName: "Demo",
    lastName: "Admin",
    email: "staff@nikahdeen.dev",
    password: "Admin@12345",
    role: ROLES.ADMIN,
    status: USER_STATUSES.ACTIVE,
  });

  await upsertUser({
    firstName: "ডেমো",
    lastName: "সদস্য",
    email: "demo@nikahdeen.dev",
    password: "Demo@12345",
    role: ROLES.USER,
    status: USER_STATUSES.ACTIVE,
  });

  await seedCatalog();
  await seedBiodata();

  log("done ✔");
  console.log("\nSeeded login accounts:");
  console.log("  SUPERADMIN  admin@nikahdeen.dev / Admin@12345");
  console.log("  ADMIN       staff@nikahdeen.dev / Admin@12345");
  console.log("  USER        demo@nikahdeen.dev  / Demo@12345");
  console.log("  members     member1..13@nikahdeen.dev / Member@12345\n");

  await disconnectDB();
  // Explicit exit: mongoose's driver can leave the event loop open after
  // disconnect in some environments.
  process.exit(0);
}

main().catch(async (err) => {
  console.error("[seed] failed:", err);
  await disconnectDB();
  process.exit(1);
});
