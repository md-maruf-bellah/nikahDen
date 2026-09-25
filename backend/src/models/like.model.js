import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, // liker
    biodata: { type: mongoose.Schema.Types.ObjectId, ref: "Biodata", required: true, index: true },
    targetOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Becomes true when the target owner likes back (mutual match).
    isMutual: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

likeSchema.index({ user: 1, biodata: 1 }, { unique: true });
likeSchema.index({ targetOwner: 1, createdAt: -1 });

const Like = mongoose.model("Like", likeSchema);
export default Like;
