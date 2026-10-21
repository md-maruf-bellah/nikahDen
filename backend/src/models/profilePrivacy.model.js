import mongoose from "mongoose";

/**
 * প্রোফাইল প্রাইভেসি — প্রতি ইউজারের একটি ডকুমেন্ট (user ইউনিক)।
 *
 * ডিফল্ট মানগুলো ইচ্ছাকৃতভাবে আগের আচরণের সমান (ব্রেকিং নয়):
 *   photoVisibility  = PUBLIC   → সবাই ছবি দেখতে পারে (আগের মতোই)
 *   contactVisibility = PAID    → কনেক্ট খরচ করে ফুল ভিউতে যোগাযোগের তথ্য (আগের মতোই)
 *
 * PHOTO_VISIBILITY:
 *   PUBLIC  — সব (গেস্টসহ) ছবি দেখতে পারে
 *   MEMBERS — লগইন করা সক্রিয় সদস্য দেখতে পারে
 *   MATCHED — শুধু পারস্পরিক লাইক/ম্যাচ করা সদস্য দেখতে পারে
 *   UNLOCK  → পয়েন্ট খরচ করে আনলক করতে হবে (PHOTO_UNLOCK লেজার) —
 *             তবে যে সদস্য ইতিমধ্যে ফুল বায়োডাটা ভিউ কেনেছে তার জন্য বিনামূল্যে
 *             (একই অ্যাকশন দুইবার চার্জ নয়)।
 *
 * CONTACT_VISIBILITY:
 *   PAID    — কনেক্ট খরচে ফুল ভিউ (আগের মতোই, ডিফল্ট)
 *   MATCHED — ম্যাচ করা সদস্যের জন্য ফ্রি, বাকিরা আগের মতোই পেমেন্ট করে
 *   PUBLIC  — যোগাযোগের তথ্য সবার জন্য উন্মুক্ত (মালিকের সচেতন পছন্দ)
 */
const profilePrivacySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    photoVisibility: {
      type: String,
      enum: ["PUBLIC", "MEMBERS", "MATCHED", "UNLOCK"],
      default: "PUBLIC",
    },
    contactVisibility: {
      type: String,
      enum: ["PAID", "MATCHED", "PUBLIC"],
      default: "PAID",
    },
    allowCrossReligion: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const ProfilePrivacy = mongoose.model("ProfilePrivacy", profilePrivacySchema);
export default ProfilePrivacy;
