import mongoose from "mongoose";
import { NOTIFICATION_TYPES } from "../constants/index.js";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      default: NOTIFICATION_TYPES.SYSTEM,
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: "", maxlength: 2000 },
    isRead: { type: Boolean, default: false, index: true },
    // Structured link target, e.g. { kind: "biodata", id: "..." }
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
