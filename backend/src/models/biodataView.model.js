import mongoose from "mongoose";

const biodataViewSchema = new mongoose.Schema(
  {
    viewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    biodata: { type: mongoose.Schema.Types.ObjectId, ref: "Biodata", required: true, index: true },
    targetOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    count: { type: Number, default: 1, min: 1 },
    firstViewedAt: { type: Date, default: Date.now },
    lastViewedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

biodataViewSchema.index({ viewer: 1, biodata: 1 }, { unique: true });
biodataViewSchema.index({ targetOwner: 1, lastViewedAt: -1 });

const BiodataView = mongoose.model("BiodataView", biodataViewSchema);
export default BiodataView;
