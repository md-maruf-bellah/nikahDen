/**
 * Guardian-to-Guardian contact request — দুই ম্যাচ-কৃত সদস্যের অভিভাবকের
 * মধ্যে যোগাযোগ-চ্যানেল চালু করার অনুরোধ।
 *
 * স্টেট-মেশিন (status):
 *   PENDING   — অনুরোধ গেট পাস করে তৈরি; প্রাপক-পক্ষের অভিভাবকের approval অপেক্ষায়
 *   APPROVED  — approval হয়েছে; দুই অভিভাবকের contact পারস্পরিকভাবে প্রকাশিত
 *   DENIED    — প্রাপক-পক্ষ approval দেয়নি; চ্যানেল খোলে না
 *   TEARDOWN  — যেকোনো পক্ষের গার্ডিয়ান-লিংক revoke/unverify হলে access ভেঙে ফেলা হয়েছে
 *
 * গেট-স্ন্যাপশট: matchedAt — অনুরোধ তৈরির মুহূর্তে mutual match + উভয়
 * VERIFIED গার্ডিয়ান প্রমাণিত; approval ও contact-read-এ এটি নয়, *বর্তমান*
 * অবস্থা আবার যাচাই হয় (re-verify) — stale snapshot দিয়ে access চলে না।
 *
 * contact exchange শুধু APPROVED ও বর্তমানে উভয় লিংক VERIFIED থাকলেই;
 * TEARDOWN হলে (revoke-হুক) বা পড়ার সময় যাচাই ফেলে গেলে contact ফাঁস হয় না।
 */
import mongoose from "mongoose";

export const CONTACT_REQUEST_STATUSES = Object.freeze({
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  DENIED: "DENIED",
  TEARDOWN: "TEARDOWN",
});

const ACTIVE_STATUSES = [CONTACT_REQUEST_STATUSES.PENDING, CONTACT_REQUEST_STATUSES.APPROVED];

const guardianContactRequestSchema = new mongoose.Schema(
  {
    // অনুরোধকারী সদস্য ও প্রাপক সদস্য (দুইদিকের অভিভাবকের চ্যানেল)
    requesterMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // অনুরোধ তৈরির সময় যে দুটি গার্ডিয়ান-লিংক গেট পাস করেছিল (snapshot id)
    requesterGuardian: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guardian",
      required: true,
    },
    targetGuardian: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guardian",
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(CONTACT_REQUEST_STATUSES),
      default: CONTACT_REQUEST_STATUSES.PENDING,
      index: true,
    },

    // গেট-স্ন্যাপশট — mutual match + উভয় VERIFIED প্রমাণিত হওয়ার সময়
    matchedAt: { type: Date, default: null },

    // approval/DENIED কে রেকর্ড করেছে (প্রাপক-পক্ষের সদস্য — guardian session নেই)
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    respondedAt: { type: Date, default: null },
    denialReason: { type: String, trim: true, maxlength: 500, default: "" },

    // revoke/unverify হুক করেছে — কেন ও কে
    tornDownAt: { type: Date, default: null },
    tornDownBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    teardownReason: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true },
);

// একই দিকে সর্বোচ্চ একটি সক্রিয় (PENDING/APPROVED) অনুরোধ — বিপরীত দিকের
// ডুপ্লিকেট service-স্তরে যাচাই হয় (unordered pair এক-ই ইনডেক্সে ধরা যায় না)।
guardianContactRequestSchema.index(
  { requesterMember: 1, targetMember: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: Object.values(CONTACT_REQUEST_STATUSES).filter((s) => ACTIVE_STATUSES.includes(s)) },
    },
  },
);

const GuardianContactRequest = mongoose.model("GuardianContactRequest", guardianContactRequestSchema);

export default GuardianContactRequest;
