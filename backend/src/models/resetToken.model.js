import mongoose from "mongoose";

const resetTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    purpose: { type: String, enum: ["PASSWORD_RESET", "EMAIL_VERIFY"], default: "PASSWORD_RESET" },
  },
  { timestamps: true }
);

resetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ResetToken = mongoose.model("ResetToken", resetTokenSchema);
export default ResetToken;
