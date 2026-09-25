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
