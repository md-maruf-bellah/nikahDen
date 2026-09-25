import mongoose from "mongoose";
import { ORDER_KINDS, ORDER_STATUSES } from "../constants/index.js";

const billingSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    address: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    zip: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, unique: true, index: true },
    invoiceNo: { type: String, unique: true, sparse: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    kind: { type: String, enum: Object.values(ORDER_KINDS), required: true, index: true },
    // Snapshot of what was bought (plans/packs can change later).
    item: {
      refId: { type: mongoose.Schema.Types.ObjectId, default: null },
      title: { type: String, required: true, trim: true },
      titleBn: { type: String, default: "" },
      unitPrice: { type: Number, required: true, min: 0 },
      quantity: { type: Number, default: 1 },
      connectCount: { type: Number, default: 0 },
      durationDays: { type: Number, default: 0 },
    },

    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, default: null },
    total: { type: Number, required: true, min: 0 }, // integer BDT

    status: {
      type: String,
      enum: Object.values(ORDER_STATUSES),
      default: ORDER_STATUSES.PENDING,
      index: true,
    },
    paymentMethod: { type: String, default: null },
    transactionId: { type: String, default: null },
    paidAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    failureReason: { type: String, default: "" },

    billing: { type: billingSchema, default: () => ({}) },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
