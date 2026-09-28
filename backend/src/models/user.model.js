import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ROLES, USER_STATUSES } from "../constants/index.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    lastName: { type: String, trim: true, maxlength: 100, default: "" },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true, default: "" },
    passwordHash: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUSES),
      default: USER_STATUSES.ACTIVE,
      index: true,
    },

    avatar: { type: String, default: null },

    // OAuth — সোশ্যাল লগইনের উৎস। passwordless অ্যাকাউন্টে passwordHash একটি
    // অসম্ভব random স্ট্রিং হয় (সরাসরি লগইন অসম্ভব), প্রোভাইডার-ভিত্তিক লগইনই একমাত্র পথ।
    authProvider: { type: String, enum: ["local", "google", "facebook"], default: "local", index: true },
    googleId: { type: String, default: null, index: true, sparse: true },
    facebookId: { type: String, default: null, index: true, sparse: true },

    lastLoginAt: { type: Date, default: null },
    // Plain text reason never stored; admins may attach a note.
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

userSchema.index({ firstName: 1, lastName: 1 });

userSchema.virtual("name").get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
});

userSchema.set("toObject", { virtuals: true });

const User = mongoose.model("User", userSchema);
export default User;
