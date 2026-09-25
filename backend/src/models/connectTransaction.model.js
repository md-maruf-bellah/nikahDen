import mongoose from "mongoose";
import { CONNECT_TYPES } from "../constants/index.js";

const connectTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(CONNECT_TYPES),
      required: true,
      index: true,
    },
    // signed delta: +credit / -debit
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    reason: { type: String, trim: true, maxlength: 500, default: "" },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    biodata: { type: mongoose.Schema.Types.ObjectId, ref: "Biodata", default: null },
    viewedByUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

connectTransactionSchema.index({ user: 1, createdAt: -1 });

const ConnectTransaction = mongoose.model("ConnectTransaction", connectTransactionSchema);
export default ConnectTransaction;
