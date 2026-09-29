/**
 * UserBlock — এক user অন্য user-কে block করলে তার রেকর্ড।
 *
 * নিয়ম: block সম্পূর্ণ একমুখী — blocker ঠিক করে, blocked জানেও না (নোটিফিকেশন নেই,
 * তালিকাতেও দেখে না)। মেসেজিং *দুই দিকেই* বন্ধ: A→B block থাকলে B-ও A-কে মেসেজ
 * দিতে পারে না (silent দেয়াল) — নইলে blocked পক্ষ দুই মেসেজের ব্যবধানে বুঝে যায়।
 *
 * blocker+blocked pair-এ unique index — ডুপ্লিকেট block অসম্ভব।
 * Unblock মানে রেকর্ড মুছে যাওয়া; পুরনো conversation নষ্ট হয় না।
 */
import mongoose from "mongoose";

const userBlockSchema = new mongoose.Schema(
  {
    blocker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    blocked: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reason: { type: String, trim: true, maxlength: 200, default: "" },
  },
  { timestamps: true },
);

userBlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

const UserBlock = mongoose.models.UserBlock || mongoose.model("UserBlock", userBlockSchema);
export default UserBlock;
