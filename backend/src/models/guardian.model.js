/**
 * Guardian/Family system — সদস্যↅঅভিভাবক (guardianship link) মডেল।
 *
 * স্টেট-মেশিন (link.status):
 *   DECLARED — সদস্য অভিভাবক ঘোষণা করেছেন; অভিভাবক consent লাভ হয়নি
 *   CONSENTED — অভিভাবক consent (verify/contact সম্মতি) রেকর্ড; প্ল্যাটফর্ম যাচাই বাকি
 *   VERIFIED — অভিভাবক-পরিচয় যাচাই সম্পন্ন (verify token মিলেছে)
 *   REVOKED — যেকোনো স্তর থেকে সদস্য ঘোষণা বাতিল; রিং-হিস্ট্রিতে থাকে
 *
 * একজন সদস্যের একবারে সর্বোচ্চ একটি ACTIVE (non-REVOKED) লিংক —
 * user:index-এ partial unique filter দিয়ে জোর করা। ভাঙা consent-token পুনঃব্যবহার
 * নিষিদ্ধ: tokenRevokedAt দিয়ে এক-বার-ব্যবহার নিশ্চিত।
 */
import mongoose from "mongoose";

export const GUARDIAN_STATUSES = Object.freeze({
  DECLARED: "DECLARED",
  CONSENTED: "CONSENTED",
  VERIFIED: "VERIFIED",
  REVOKED: "REVOKED",
});

export const GUARDIAN_RELATIONS = Object.freeze({
  FATHER: "FATHER",
  MOTHER: "MOTHER",
  BROTHER: "BROTHER",
  SISTER: "SISTER",
  UNCLE: "UNCLE",
  AUNT: "AUNT",
  ELDER_BROTHER_IN_LAW: "ELDER_BROTHER_IN_LAW",
  OTHER: "OTHER",
});

const guardianSchema = new mongoose.Schema(
  {
    // সদস্য (যার অভিভাবক) — member-এর index নিচের partial-unique-ই বহন করে
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // অভিভাবকের তথ্য — অভিভাবকের নিজের অ্যাকাউন্ট আবশ্যক নয়
    // (অভিভাবক অ্যাকাউন্ট প্রস্তুত হলে guardianUser-এ লিংক, টেস্ট = OFFLINE_CONSENT)
    name: { type: String, required: true, trim: true, maxlength: 200 },
    relation: {
      type: String,
      enum: Object.values(GUARDIAN_RELATIONS),
      default: GUARDIAN_RELATIONS.OTHER,
    },
    contactPhone: { type: String, required: true, trim: true, maxlength: 20 },
    contactEmail: { type: String, trim: true, lowercase: true, maxlength: 200, default: "" },

    status: {
      type: String,
      enum: Object.values(GUARDIAN_STATUSES),
      default: GUARDIAN_STATUSES.DECLARED,
      index: true,
    },

    // অভিভাবক consent — নির্দিষ্ট কোনো চ্যানেলে (SMS/ইমেইল/ম্যানুয়াল)
    consentAt: { type: Date, default: null },
    consentChannel: {
      type: String,
      enum: ["SMS", "EMAIL", "MANUAL", null],
      default: null,
    },

    // সাইনড এক-বার-ব্যবহার consent link — member declare-এ একবার ফেরত,
    // অভিভাবক exchange করে নিজের guardian-session নেয়; hash দিয়ে one-time নিশ্চিত
    consentLinkHash: { type: String, select: false, default: null },
    consentLinkIssuedAt: { type: Date, default: null },
    consentLinkExpiresAt: { type: Date, default: null },
    consentLinkUsedAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },

    // রদবদল/অডিট প্ল্যাটফর্ম-লগ (মানব-পড়ার জন্য, রিং-আডিটের পরিপূরক)
    revokedAt: { type: Date, default: null },
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
  },
  { timestamps: true },
);

// সদস্য-প্রতি সর্বোচ্চ একটি non-REVOKED লিংক
guardianSchema.index(
  { member: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: Object.values(GUARDIAN_STATUSES).filter((s) => s !== GUARDIAN_STATUSES.REVOKED) } },
  },
);

// consent-link hash — exchange-এ এক-বার-ব্যবহার যাচাই (লুকানো ফিল্ড, select:false)
guardianSchema.index({ consentLinkHash: 1 }, { sparse: true });

const Guardian = mongoose.model("Guardian", guardianSchema);

export default Guardian;
