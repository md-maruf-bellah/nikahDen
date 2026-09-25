import mongoose from "mongoose";
import {
  BIODATA_STATUSES,
  GENDERS,
  MARITAL_STATUSES,
  RELIGIONS,
  RELIGIOUS_PRACTICE_LEVELS,
} from "./biodata.constants.js";
import { getNextSequence } from "./counter.model.js";
import { ageFrom } from "../utils/helpers.js";

const biodataSchema = new mongoose.Schema(
  {
    biodataNo: { type: String, unique: true, index: true },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(BIODATA_STATUSES),
      default: BIODATA_STATUSES.DRAFT,
      index: true,
    },

    // ------------------------------------------------------------
    // "সাধারণ" / directory fields — used by cards, filters, sorting
    // ------------------------------------------------------------
    gender: {
      type: String,
      enum: Object.values(GENDERS),
      default: null,
      index: true,
    },
    maritalStatus: {
      type: String,
      enum: Object.values(MARITAL_STATUSES),
      default: MARITAL_STATUSES.UNMARRIED,
      index: true,
    },
    religion: { type: String, enum: Object.values(RELIGIONS), default: null, index: true },
    sectOrDenomination: { type: String, trim: true, maxlength: 100, default: "" },

    division: { type: String, trim: true, default: "", index: true },
    district: { type: String, trim: true, default: "", index: true },
    thana: { type: String, trim: true, default: "" },

    firstName: { type: String, trim: true, maxlength: 100, default: "" },
    lastName: { type: String, trim: true, maxlength: 100, default: "" },
    fullName: { type: String, trim: true, maxlength: 220, index: true },

    dateOfBirth: { type: Date, default: null },
    birthYear: { type: Number, min: 1920, max: 2100, default: null },
    age: { type: Number, min: 16, max: 90, default: null, index: true },

    heightText: { type: String, trim: true, default: "" }, // e.g. ৫'৮"
    heightCm: { type: Number, min: 100, max: 230, default: null },
    weightKg: { type: Number, min: 20, max: 300, default: null },
    skinColor: { type: String, trim: true, default: "", index: true },
    bloodGroup: { type: String, trim: true, maxlength: 10, default: "" },
    nationality: { type: String, trim: true, default: "বাংলাদেশী" },
    nidNumber: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },

    // ------------------------------------------------------------
    // Section 1 — ব্যক্তিগত তথ্য (personal / lifestyle)
    // ------------------------------------------------------------
    clothingStyle: { type: String, trim: true, default: "" },
    healthCondition: { type: String, trim: true, default: "" },
    entertainmentHabit: { type: String, trim: true, default: "" },
    politicalView: { type: String, trim: true, default: "" },
    favoriteBooksPeople: { type: String, trim: true, default: "" },
    aboutYourself: { type: String, trim: true, maxlength: 5000, default: "" },
    specialCategories: { type: String, trim: true, default: "" },

    // ------------------------------------------------------------
    // Section 2 — ধর্মীয় তথ্য (religious)
    // ------------------------------------------------------------
    religiousPracticeLevel: {
      type: String,
      enum: Object.values(RELIGIOUS_PRACTICE_LEVELS),
      default: null,
    },
    placeOfWorshipAttendance: { type: String, trim: true, default: "" },
    holyBookReading: { type: String, trim: true, default: "" },
    religiousEducation: { type: String, trim: true, default: "" },
    religiousDressPreference: { type: String, trim: true, default: "" },
    charityActivity: { type: String, trim: true, default: "" },
    religiousOrganization: { type: String, trim: true, default: "" },
    dietaryPractice: { type: String, trim: true, default: "" },
    futureReligiousGoal: { type: String, trim: true, default: "" },
    partnerReligiousExpectation: { type: String, trim: true, default: "" },

    // ------------------------------------------------------------
    // Section 3 — শিক্ষাগত যোগ্যতা (education)
    // ------------------------------------------------------------
    education: { type: String, trim: true, maxlength: 200, default: "", index: true },
    degree: { type: String, trim: true, default: "" },
    institution: { type: String, trim: true, default: "" },
    board: { type: String, trim: true, default: "" },
    subject: { type: String, trim: true, default: "" },
    result: { type: String, trim: true, default: "" },
    passingYear: { type: String, trim: true, default: "" },
    deeniEducation: { type: String, trim: true, default: "" },

    // ------------------------------------------------------------
    // Section 4 — পেশাগত তথ্য (profession)
    // ------------------------------------------------------------
    occupation: { type: String, trim: true, maxlength: 200, default: "", index: true },
    occupationDetails: { type: String, trim: true, maxlength: 2000, default: "" },
    monthlyIncome: { type: Number, min: 0, default: null },
    company: { type: String, trim: true, default: "" },
    experienceYears: { type: String, trim: true, default: "" },

    // ------------------------------------------------------------
    // Section 5 — পারিবারিক তথ্য (family)
    // ------------------------------------------------------------
    fatherName: { type: String, trim: true, default: "" },
    fatherOccupation: { type: String, trim: true, default: "" },
    motherName: { type: String, trim: true, default: "" },
    motherOccupation: { type: String, trim: true, default: "" },
    siblings: { type: String, trim: true, default: "" },

    // ------------------------------------------------------------
    // Section 6 — যোগাযোগ ও ঠিকানা (contact)
    // ------------------------------------------------------------
    phoneNumber: { type: String, trim: true, default: "" },
    mobile: { type: String, trim: true, default: "" },
    fatherMobile: { type: String, trim: true, default: "" },
    presentAddress: { type: String, trim: true, default: "" },
    permanentAddress: { type: String, trim: true, default: "" },

    // ------------------------------------------------------------
    // Section 7 — অঙ্গীকার (agreement)
    // ------------------------------------------------------------
    agreed: { type: Boolean, default: false },
    agreedAt: { type: Date, default: null },

    // ------------------------------------------------------------
    // Media & moderation
    // ------------------------------------------------------------
    profileImage: { type: String, default: null },
    photos: [{ type: String }],

    submittedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    rejectionReason: { type: String, trim: true, maxlength: 1000, default: "" },

    viewCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Compound index powering the public directory query.
biodataSchema.index({ status: 1, gender: 1, createdAt: -1 });
biodataSchema.index({ status: 1, approvedAt: -1 });

// Unique per-user counter based biodata number NKD-YYYY-000001
biodataSchema.pre("save", async function () {
  if (this.isNew && !this.biodataNo) {
    const seq = await getNextSequence("biodata_no");
    const year = new Date().getFullYear();
    this.biodataNo = `NKD-${year}-${String(seq).padStart(6, "0")}`;
  }

  if (this.isModified("firstName") || this.isModified("lastName")) {
    this.fullName = [this.firstName, this.lastName].filter(Boolean).join(" ").trim();
  }

  // Keep the derived age in sync.
  if (this.isModified("dateOfBirth") || this.isModified("birthYear") || this.isNew) {
    if (this.dateOfBirth) {
      const age = ageFrom(this.dateOfBirth);
      if (age !== undefined) this.age = age;
    } else if (this.birthYear) {
      this.age = new Date().getFullYear() - this.birthYear;
    } else {
      this.age = null;
    }
  }
});

const Biodata = mongoose.model("Biodata", biodataSchema);
export default Biodata;
