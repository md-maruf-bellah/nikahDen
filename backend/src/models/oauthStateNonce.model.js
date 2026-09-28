/**
 * OAuth state nonce — CSRF state-এর একবার-ব্যবহারযোগ্য নোন্স।
 *
 * আগে state ছিল শুধু HMAC-স্বাক্ষরিত (stateless) — স্বাক্ষর সঠিক হলে একই state
 * বারবার replay করা যেত (TTL-এর মধ্যে)। এখন প্রতিটি state-এর নোন্স Mongo-তে
 * রেকর্ড হয় এবং callback-এ consume হয় (atomic findAndDelete) — একই state
 * দ্বিতীয়বার এলে `OAUTH_STATE_INVALID`। TTL index (10 মিনিট) মেয়াদোত্তীর্ণ
 * নোন্স নিজে থেকেই মুছে দেয়।
 *
 * হ্যান্ডঅফ কোডের মতোই এটাও Mongo-ভিত্তিক — multi-instance-safe।
 */
import mongoose from "mongoose";

const oauthStateNonceSchema = new mongoose.Schema(
  {
    nonce: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Mongo-র TTL মনিটর প্রতি ~৬০ সেকেন্ডে চলে — মেয়াদ শেষ নোন্স স্বয়ংক্রিয়ভাবে মুছে যাবে।
oauthStateNonceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OauthStateNonce =
  mongoose.models.OauthStateNonce ||
  mongoose.model("OauthStateNonce", oauthStateNonceSchema);

export default OauthStateNonce;
