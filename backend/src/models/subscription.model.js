import mongoose from "mongoose";
import { SUBSCRIPTION_STATUSES } from "../constants/index.js";

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: "MembershipPlan", required: true },
    planSnapshot: {
      name: String,
      nameBn: String,
      durationDays: Number,
      price: Number,
      connectCount: Number,
    },
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUSES),
      default: SUBSCRIPTION_STATUSES.ACTIVE,
      index: true,
    },
    startsAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: true },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

subscriptionSchema.virtual("isActive").get(function () {
  return this.status === "ACTIVE" && this.expiresAt > new Date();
});

subscriptionSchema.set("toJSON", { virtuals: true });
subscriptionSchema.set("toObject", { virtuals: true });

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
