import { connectDB, disconnectDB } from "../src/config/db.js";
import env from "../src/config/env.js";
import User from "../src/models/user.model.js";
import Biodata from "../src/models/biodata.model.js";
import ProfilePrivacy from "../src/models/profilePrivacy.model.js";
import { ROLES, USER_STATUSES, GENDERS, MARITAL_STATUSES, RELIGIONS, BIODATA_STATUSES, CONNECT_TYPES } from "../src/constants/index.js";
import { addConnectCredit, getConnectBalance } from "../src/modules/membership/connect.service.js";

const TEST_USERS = [
  {
    email: "muslim_male_1@nikahdeen.dev",
    name: "মাহমুদুল হাসান",
    gender: GENDERS.MALE,
    religion: RELIGIONS.ISLAM,
    biodataNo: "BD-1001",
    allowCrossReligion: false,
    profileImage: "/assets/member/new/muslimBoy.png",
    age: 28,
    division: "ঢাকা",
    district: "ঢাকা",
    occupation: "সফটওয়্যার প্রকৌশলী",
    education: "BSc (CSE)",
    phone: "01711001001",
  },
  {
    email: "muslim_female_1@nikahdeen.dev",
    name: "সুমাইয়া আক্তার",
    gender: GENDERS.FEMALE,
    religion: RELIGIONS.ISLAM,
    biodataNo: "BD-1002",
    allowCrossReligion: false,
    profileImage: "/assets/member/new/muslimGirl.png",
    age: 24,
    division: "ঢাকা",
    district: "ঢাকা",
    occupation: "শিক্ষক",
    education: "MA (Bangla)",
    phone: "01711001002",
  },
  {
    email: "muslim_female_cross@nikahdeen.dev",
    name: "তাসনিম জাহান",
    gender: GENDERS.FEMALE,
    religion: RELIGIONS.ISLAM,
    biodataNo: "BD-1003",
    allowCrossReligion: true, // Cross-religion allowed
    profileImage: "/assets/member/new/muslimMeye.png",
    age: 26,
    division: "চট্টগ্রাম",
    district: "চট্টগ্রাম",
    occupation: "ডাক্তার",
    education: "MBBS",
    phone: "01711001003",
  },
  {
    email: "hindu_male_1@nikahdeen.dev",
    name: "শুভ্র সেনগুপ্ত",
    gender: GENDERS.MALE,
    religion: RELIGIONS.HINDUISM,
    biodataNo: "BD-1004",
    allowCrossReligion: false,
    profileImage: "/assets/member/new/hinduBoy.png",
    age: 29,
    division: "খুলনা",
    district: "যশোর",
    occupation: "ব্যাংকার",
    education: "BBA / MBA",
    phone: "01711001004",
  },
  {
    email: "hindu_female_1@nikahdeen.dev",
    name: "অনিন্দিতা রায়",
    gender: GENDERS.FEMALE,
    religion: RELIGIONS.HINDUISM,
    biodataNo: "BD-1005",
    allowCrossReligion: false,
    profileImage: "/assets/member/new/hinduGirl.png",
    age: 25,
    division: "রাজশাহী",
    district: "রাজশাহী",
    occupation: "লেকচারার",
    education: "MSc (Math)",
    phone: "01711001005",
  },
  {
    email: "hindu_male_cross@nikahdeen.dev",
    name: "দেবব্রত চ্যাটার্জি",
    gender: GENDERS.MALE,
    religion: RELIGIONS.HINDUISM,
    biodataNo: "BD-1006",
    allowCrossReligion: true, // Cross-religion allowed
    profileImage: "/assets/member/new/hinduChele1.png",
    age: 30,
    division: "ঢাকা",
    district: "ঢাকা",
    occupation: "ব্যবসায়ী",
    education: "BCom",
    phone: "01711001006",
  },
  {
    email: "christian_male_1@nikahdeen.dev",
    name: "জন ড্যানিয়েল রোজারিও",
    gender: GENDERS.MALE,
    religion: RELIGIONS.CHRISTIANITY,
    biodataNo: "BD-1007",
    allowCrossReligion: false,
    profileImage: "/assets/member/new/christianBoy.png",
    age: 28,
    division: "ঢাকা",
    district: "গাজীপুর",
    occupation: "আইটি স্পেশালিস্ট",
    education: "BSc (CS)",
    phone: "01711001007",
  },
  {
    email: "christian_female_cross@nikahdeen.dev",
    name: "গ্রেস ক্রিস্টিনা কস্তা",
    gender: GENDERS.FEMALE,
    religion: RELIGIONS.CHRISTIANITY,
    biodataNo: "BD-1008",
    allowCrossReligion: true, // Cross-religion allowed
    profileImage: "/assets/member/new/christianGirl.png",
    age: 25,
    division: "ঢাকা",
    district: "ঢাকা",
    occupation: "নার্সিং অফিসার",
    education: "BSc (Nursing)",
    phone: "01711001008",
  },
  {
    email: "buddhist_male_1@nikahdeen.dev",
    name: "পলাশ বড়ুয়া",
    gender: GENDERS.MALE,
    religion: RELIGIONS.BUDDHISM,
    biodataNo: "BD-1009",
    allowCrossReligion: false,
    profileImage: "/assets/member/new/buddhistBoy.png",
    age: 29,
    division: "চট্টগ্রাম",
    district: "চট্টগ্রাম",
    occupation: "সরকারি কর্মকর্তা",
    education: "MSS (Economics)",
    phone: "01711001009",
  },
  {
    email: "buddhist_female_1@nikahdeen.dev",
    name: "মৈত্রী চাকমা",
    gender: GENDERS.FEMALE,
    religion: RELIGIONS.BUDDHISM,
    biodataNo: "BD-1010",
    allowCrossReligion: false,
    profileImage: "/assets/member/new/buddhistGirl.png",
    age: 24,
    division: "চট্টগ্রাম",
    district: "রাঙ্গামাটি",
    occupation: "গবেষক",
    education: "BSS (Anthropology)",
    phone: "01711001010",
  },
];

async function seed10Users() {
  await connectDB(env.MONGODB_URI);
  console.log("[seed-10] Connected to MongoDB at", env.MONGODB_URI);

  for (const item of TEST_USERS) {
    const [first, ...rest] = item.name.split(" ");
    const lastName = rest.join(" ") || "";

    let user = await User.findOne({ email: item.email });
    if (!user) {
      user = await User.create({
        firstName: first,
        lastName,
        email: item.email,
        passwordHash: "Password@123",
        role: ROLES.USER,
        status: USER_STATUSES.ACTIVE,
        phone: item.phone,
      });
      console.log(`[seed-10] Created user: ${item.email}`);
    } else {
      user.firstName = first;
      user.lastName = lastName;
      user.passwordHash = "Password@123";
      user.status = USER_STATUSES.ACTIVE;
      await user.save();
      console.log(`[seed-10] Updated user: ${item.email}`);
    }

    // Upsert ProfilePrivacy
    await ProfilePrivacy.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        allowCrossReligion: item.allowCrossReligion,
        photoVisibility: "PUBLIC",
        contactVisibility: item.allowCrossReligion ? "PUBLIC" : "PAID",
      },
      { upsert: true, new: true }
    );

    // Ensure sufficient connects for testing
    const balance = await getConnectBalance(user._id);
    if (balance < 10) {
      await addConnectCredit({
        userId: user._id,
        type: CONNECT_TYPES.ADMIN_ADJUST,
        amount: 50,
        reason: "Initial test balance for multi-religion evaluation",
      });
    }

    user.avatar = item.profileImage;
    await user.save();

    // Upsert Biodata
    const bioPayload = {
      user: user._id,
      biodataNo: item.biodataNo,
      firstName: first,
      lastName,
      fullName: item.name,
      gender: item.gender,
      religion: item.religion,
      allowCrossReligion: item.allowCrossReligion,
      profileImage: item.profileImage,
      maritalStatus: MARITAL_STATUSES.UNMARRIED,
      age: item.age,
      birthYear: new Date().getFullYear() - item.age,
      division: item.division,
      district: item.district,
      occupation: item.occupation,
      education: item.education,
      skinColor: "উজ্জ্বল ফর্সা",
      heightText: item.gender === GENDERS.MALE ? "৫'৮\"" : "৫'৪\"",
      aboutYourself: `পবিত্র বৈবাহিক জীবনের প্রত্যাশায় আমার বায়োডাটা উপস্থাপন করছি। ধর্মীয় শিষ্টাচার ও পারিবারিক মূল্যবোধ আমার অগ্রাধিকার।`,
      status: BIODATA_STATUSES.APPROVED,
      approvedAt: new Date(),
      phoneNumber: item.phone,
      agreed: true,
      agreedAt: new Date(),
    };

    let biodata = await Biodata.findOne({ user: user._id });
    if (!biodata) {
      // Check if biodataNo exists on another doc
      await Biodata.deleteOne({ biodataNo: item.biodataNo });
      biodata = await Biodata.create(bioPayload);
      console.log(`[seed-10] Created approved biodata: ${biodata.biodataNo} (${item.religion}, allowCross: ${item.allowCrossReligion})`);
    } else {
      Object.assign(biodata, bioPayload);
      await biodata.save();
      console.log(`[seed-10] Updated biodata: ${biodata.biodataNo} (${item.religion}, allowCross: ${item.allowCrossReligion})`);
    }
  }

  // Also ensure any approved biodatas without a profileImage get assigned their religion's photo
  const allBiodatas = await Biodata.find({ status: BIODATA_STATUSES.APPROVED });
  let countUpdated = 0;
  for (const b of allBiodatas) {
    if (!b.profileImage) {
      const isFemale = b.gender === GENDERS.FEMALE;
      let img = isFemale ? "/assets/member/new/girl.png" : "/assets/member/new/boy.png";
      const rel = (b.religion || "").toLowerCase();
      if (rel.includes("islam") || rel.includes("ইসলাম")) {
        img = isFemale ? "/assets/member/new/muslimGirl.png" : "/assets/member/new/muslimBoy.png";
      } else if (rel.includes("hindu") || rel.includes("সনাতন")) {
        img = isFemale ? "/assets/member/new/hinduGirl.png" : "/assets/member/new/hinduBoy.png";
      } else if (rel.includes("christ") || rel.includes("খ্রিস্ট")) {
        img = isFemale ? "/assets/member/new/christianGirl.png" : "/assets/member/new/christianBoy.png";
      } else if (rel.includes("buddh") || rel.includes("বৌদ্ধ")) {
        img = isFemale ? "/assets/member/new/buddhistGirl.png" : "/assets/member/new/buddhistBoy.png";
      }
      b.profileImage = img;
      await b.save();
      countUpdated++;
    }
  }
  if (countUpdated > 0) {
    console.log(`[seed-10] Assigned religion photos to ${countUpdated} other approved biodatas.`);
  }

  console.log("[seed-10] Successfully seeded 10 diverse test users & biodatas with religion photos!");
  await disconnectDB();
}

seed10Users().catch((err) => {
  console.error("[seed-10] Error:", err);
  process.exit(1);
});
