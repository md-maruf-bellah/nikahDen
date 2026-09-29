import mongoose from "mongoose";

const membershipPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Monthly"
    nameBn: { type: String, required: true, trim: true }, // e.g. "মান্থলি"
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, trim: true, default: "" },

    durationDays: { type: Number, required: true, min: 1 }, // 30/60/90/180
    price: { type: Number, required: true, min: 0 }, // integer BDT

    connectCount: { type: Number, required: true, min: 0 },
    // Proposal limits per the /member pricing table:
    //   monthly ✗ , bimonthly 15, quarterly 25, semi-annual -1 (unlimited)
    acceptProposalLimit: { type: Number, default: 0 }, // -1 = unlimited

    // Messaging entitlement (messagingGuard.service.js-এ প্রয়োগ হয়):
    //   messagingEnabled false ⇒ প্ল্যানে মেসেজিং পুরোপুরি বন্ধ (৪০৩ NO_MESSAGING_PACKAGE)
    //   messagingLimit: -1 সীমাহীন, 0 ⇒ ম্যাচ-পূর্ব মেসেজও নয় (৪০২ MESSAGING_UPGRADE_REQUIRED),
    //   n>0 ⇒ ম্যাচ না হলে প্রতি sender+recipient জোড়ায় সর্বোচ্চ n-টি মেসেজ
    messagingEnabled: { type: Boolean, default: true },
    messagingLimit: { type: Number, default: -1 }, // -1 = unlimited (match হলে সবসময় সীমাহীন)

    canCreateBiodata: { type: Boolean, default: true },
    canSendBiodata: { type: Boolean, default: true },
    canReceiveBiodata: { type: Boolean, default: true },

    isActive: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const MembershipPlan = mongoose.model("MembershipPlan", membershipPlanSchema);
export default MembershipPlan;
