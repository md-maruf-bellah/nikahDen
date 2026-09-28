/**
 * OAuth handoff code — একবার-ব্যবহারযোগ্য, স্বল্পস্থায়ী code যা callback থেকে
 * frontend /auth/callback-এ সেশন টোকেন না-পাঠিয়ে পৌঁছে দেয়।
 *
 * আগে এটা ইন-মেমোরি Map-এ ছিল — একাধিক ব্যাকএন্ড ইনস্ট্যান্স বা restart-এ কোড হারাত।
 * এখন Mongo-তে থাকে, তাই যেকোনো ইনস্ট্যান্স exchange পয়েন্টে সেশন দিতে পারে।
 * TTL index (60s) মেয়াদোত্তীর্ণ কোড Mongo নিজেই মুছে দেয়।
 */
import mongoose from "mongoose";

const oauthHandoffSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    session: { type: mongoose.Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Mongo-র TTL মনিটর প্রতি ~৬০ সেকেন্ডে চলে — মেয়াদ শেষ কোড স্বয়ংক্রিয়ভাবে মুছে যাবে।
oauthHandoffSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OauthHandoff =
  mongoose.models.OauthHandoff || mongoose.model("OauthHandoff", oauthHandoffSchema);

export default OauthHandoff;
