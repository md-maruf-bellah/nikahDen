/**
 * OAuth ইভেন্ট হিস্ট্রি — Mongo **capped collection** (ring buffer)।
 *
 * oauthMonitor-এর ইন-মেমরি কাউন্টার/রিসেন্ট-লিস্ট প্রসেস রিস্টার্টে হারিয়ে যায়;
 * প্রতিটি ইভেন্ট এখানেও লেখা হয় বলে abuse-এর হিস্ট্রি রিস্টার্টের পরেও থাকে।
 *
 * Capped = ফিক্সড সাইজ — পুরনো ডক নিজে থেকেই overwrite হয় (কোনো ক্লিনআপ জব লাগে না),
 * লেখা append-only (দ্রুত), আর natural order == সময়ের ক্রম।
 * সর্বোচ্চ OAUTH_EVENT_CAP.max (৫০০) ডক / ২৫৬KB — কোনো PII নেই (শুধু IP + কোড)।
 */
import mongoose from "mongoose";
import { defineCappedModel, ensureCappedCollection } from "../utils/cappedCollection.js";

/** টেস্ট-হেল্পারও একই ক্যাপ ব্যবহার করে (drop → recreate)। */
export const OAUTH_EVENT_CAP = { size: 256 * 1024, max: 500 };

const oauthEventSchema = new mongoose.Schema(
  {
    event: { type: String, required: true, index: true },
    ip: { type: String, default: "" },
    provider: { type: String, default: "" },
    errorCode: { type: String, default: "" },
    path: { type: String, default: "" },
    at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

const OauthEvent = defineCappedModel("OauthEvent", oauthEventSchema, "oauth_events", OAUTH_EVENT_CAP);

/**
 * কালেকশনটা capped হিসেবে আছে কি না নিশ্চিত করে — না থাকলে (যেমন টেস্টে drop
 * করার পর) ঠিক একই ক্যাপ অপশনে আবার বানায়।
 */
export async function ensureOauthEventCapped(conn = mongoose.connection) {
  return ensureCappedCollection("oauth_events", OAUTH_EVENT_CAP, conn);
}

export default OauthEvent;
