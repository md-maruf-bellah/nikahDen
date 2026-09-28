import mongoose from "mongoose";

/**
 * পার্টনার প্রেফারেন্স — প্রতি ইউজারের একটি ডকুমেন্ট (userId ইউনিক)।
 * ম্যাচিং ইঞ্জিন এই ফিল্ডগুলোর ভিত্তিতে APPROVED বায়োডাটা র‍্যাংক করে।
 * সব শর্ত ঐচ্ছিক — যা সেট করা নেই তা ম্যাচিংয়ে বাদ যায়।
 */
const preferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // যাকে খুঁজছেন
    gender: { type: String, enum: ["MALE", "FEMALE"], default: null },

    // বয়স ব্যান্ড
    ageMin: { type: Number, min: 16, max: 90, default: null },
    ageMax: { type: Number, min: 16, max: 90, default: null },

    // এক বা একাধিক বিভাগ (বাংলা ডিসপ্লে স্ট্রিং, যেমন "ঢাকা")
    divisions: { type: [String], default: [] },

    // ধর্ম (সিঙ্গেল) ও বৈবাহিক অবস্থা (একাধিক নির্বাচনযোগ্য)
    religion: { type: String, default: null },
    maritalStatuses: { type: [String], default: [] },

    // শিক্ষা ও পেশা — ফ্রি-টেক্সট কীওয়ার্ড (regex, case-insensitive ম্যাচ)
    education: { type: String, trim: true, maxlength: 100, default: "" },
    occupation: { type: String, trim: true, maxlength: 100, default: "" },

    // এর নিচের স্কোরের ক্যান্ডিডেট বাদ (0 = ফিল্টার অফ)
    minMatchScore: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true }
);

const Preference = mongoose.model("Preference", preferenceSchema);
export default Preference;
