/**
 * অ্যাডমিন অ্যাকশন অডিট-ট্রেইল — Mongo **capped collection** (ring buffer)।
 *
 * অ্যাডমিন-ক্ষমতাসম্পন্ন প্রতিটি সংবেদনশীল অ্যাকশন (ইউজার আনলক, ডিঅ্যাক্টিভেট/
 * ডিলিট, রোল-পরিবর্তন) প্রশ্ন ছাড়াই এখানে লেখা হয় — কে (actor id + role),
 * কবে (server timestamp), কী (action + target)। সুরক্ষা-তদন্ত ও দায়বদ্ধতার
 * ভিত্তি: অ্যাডমিন নিজে নিজের অ্যাকশনের রেকর্ড মুছতে পারে না (capped-এ কোনো
 * ডিলিট এন্ডপয়েন্ট নেই; পুরনো ডক শুধু ক্যাপ-রিং দিয়েই ঘূর্ণায়মান হয়)।
 *
 * ক্যাপ: ৫০০ ডক / ২৫৬KB (oauth_events/contact_events-এর সাথে সামঞ্জস্যপূর্ণ)।
 * IP/ইমেইল হল্যাক লেভেলে থাকে — টেস্ট ও পড়ার সুবিধার জন্য সংক্ষিপ্ত ডোমেন-শেষ,
 * শুধু "কোন অ্যাকাউন্ট ছিল" সনাক্ত করার জন্য, সম্পূর্ণ PII কনফিগারেশন নয়।
 */
import mongoose from "mongoose";
import { defineCappedModel, ensureCappedCollection } from "../utils/cappedCollection.js";

export const ADMIN_AUDIT_CAP = { size: 256 * 1024, max: 500 };

const auditEventSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "UNLOCK",
        "USER_UPDATE",
        "DELETE",
        "GUARDIAN_DECLARE",
        "GUARDIAN_SESSION_OPENED",
        "GUARDIAN_CONSENT",
        "GUARDIAN_VERIFY",
        "GUARDIAN_REVOKE",
        "GUARDIAN_CONTACT_REQUEST",
        "GUARDIAN_CONTACT_APPROVE",
        "GUARDIAN_CONTACT_DENY",
        "GUARDIAN_CONTACT_TEARDOWN",
      ],
    },
    // যে অ্যাডমিন করেছে
    actorId: { type: String, default: "" },
    actorRole: { type: String, default: "" },
    actorEmail: { type: String, default: "" },
    // যার ওপর হয়েছে
    targetId: { type: String, default: "" },
    targetEmail: { type: String, default: "" },
    // রোল-পরিবর্তনে আগে/পরে পদবী; আনলকে ভুল-কাউন্ট; বাকির ক্ষেত্রে ফাঁকা
    roleBefore: { type: String, default: "" },
    roleAfter: { type: String, default: "" },
    failedAttempts: { type: Number, default: null },
    result: { type: String, default: "SUCCESS" },
    at: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false },
);

const AdminAuditEvent = defineCappedModel("AdminAuditEvent", auditEventSchema, "admin_audit_events", ADMIN_AUDIT_CAP);

export async function ensureAdminAuditCapped(conn = mongoose.connection) {
  return ensureCappedCollection("admin_audit_events", ADMIN_AUDIT_CAP, conn);
}

export default AdminAuditEvent;
