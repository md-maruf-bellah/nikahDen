import mongoose from "mongoose";

const marriageSchema = new mongoose.Schema(
  {
    // Groom (বর) details
    groom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    groomBiodata: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Biodata",
      default: null,
      index: true,
    },
    groomBiodataNo: { type: String, trim: true, default: "" },
    groomName: { type: String, trim: true, required: true },
    groomPhone: { type: String, trim: true, default: "" },
    groomPhoto: { type: String, trim: true, default: "" },

    // Bride (কনে) details
    bride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    brideBiodata: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Biodata",
      default: null,
      index: true,
    },
    brideBiodataNo: { type: String, trim: true, default: "" },
    brideName: { type: String, trim: true, required: true },
    bridePhone: { type: String, trim: true, default: "" },
    bridePhoto: { type: String, trim: true, default: "" },

    // Who reported the marriage
    declaredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    declaredRole: { type: String, enum: ["GROOM", "BRIDE", "ADMIN", "OTHER"], default: "GROOM" },

    marriageDate: { type: Date, default: null, index: true },
    story: { type: String, trim: true, default: "" },
    feedback: { type: String, trim: true, default: "" },

    // Status: PENDING_VERIFICATION, VERIFIED, COMPLETED, CANCELLED
    status: {
      type: String,
      enum: ["PENDING_VERIFICATION", "VERIFIED", "COMPLETED", "CANCELLED"],
      default: "VERIFIED",
      index: true,
    },

    // Whether couple's story can be shown publicly on landing page
    isPublicSuccessStory: { type: Boolean, default: true, index: true },

    // Visibility flags for both profiles
    groomHidden: { type: Boolean, default: true },
    brideHidden: { type: Boolean, default: true },

    adminNotes: { type: String, trim: true, default: "" },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

marriageSchema.index({ createdAt: -1 });

const Marriage = mongoose.model("Marriage", marriageSchema);
export default Marriage;
