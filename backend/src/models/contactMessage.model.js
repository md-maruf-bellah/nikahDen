import mongoose from "mongoose";
import { CONTACT_STATUSES } from "../constants/index.js";

const contactMessageSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 100 },
    lastName: { type: String, trim: true, maxlength: 100, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 5000 },
    reply: { type: String, trim: true, maxlength: 2000, default: "" },
    status: {
      type: String,
      enum: Object.values(CONTACT_STATUSES),
      default: CONTACT_STATUSES.NEW,
      index: true,
    },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    repliedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

contactMessageSchema.index({ createdAt: -1 });

const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);
export default ContactMessage;
