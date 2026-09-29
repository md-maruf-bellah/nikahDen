/**
 * Contact spam/abuse ইভেন্ট হিস্ট্রি — Mongo **capped collection** (ring buffer)।
 *
 * contact ফর্মের honeypot/time-trap স্প্যাম-ড্রপ ইভেন্ট এখানে persist হয় —
 * রিস্টার্টের পরেও অ্যাডমিন দেখতে পায় (কে কখন বট-আচরণ করেছে)।
 * oauth_events-এর মতোই: সর্বোচ্চ ৫০০ ডক / ২৫৬KB, পুরনোগুলো অটো-ওভাররাইট।
 * কোনো PII নেই — শুধু IP + কোন সিগন্যালে ধরা পড়েছে।
 */
import mongoose from "mongoose";
import { defineCappedModel, ensureCappedCollection } from "../utils/cappedCollection.js";

/** টেস্ট-হেল্পারও একই ক্যাপ ব্যবহার করে (drop → recreate)। */
export const CONTACT_EVENT_CAP = { size: 256 * 1024, max: 500 };

const contactEventSchema = new mongoose.Schema(
  {
    // "spam_dropped" — ভবিষ্যতে rate-limited/একই-ইমেইল-ব্যার্স্ট ইত্যাদিও এখানে আসতে পারে
    event: { type: String, required: true, index: true },
    ip: { type: String, default: "" },
    // কোন সিগন্যালে ধরা পড়ল: "honeypot" | "time_trap"
    reason: { type: String, default: "" },
    detail: { type: String, default: "" },
    at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

const ContactEvent = defineCappedModel("ContactEvent", contactEventSchema, "contact_events", CONTACT_EVENT_CAP);

export async function ensureContactEventCapped(conn = mongoose.connection) {
  return ensureCappedCollection("contact_events", CONTACT_EVENT_CAP, conn);
}

export default ContactEvent;
