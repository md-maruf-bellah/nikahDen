import mongoose from "mongoose";
import { MESSAGE_STATUSES } from "../constants/index.js";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, required: true, trim: true, minlength: 1, maxlength: 5000 },
    status: {
      type: String,
      enum: Object.values(MESSAGE_STATUSES),
      default: MESSAGE_STATUSES.SENT,
      index: true,
    },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
