/**
 * অ্যাডমিন অডিট — রেকর্ডিং ও পড়ার সার্ভিস (oauthMonitor-এর প্যাটার্নে)।
 *
 * recordAdminAction() কখনোই থ্রো করে না — অডিট-লেখা ব্যর্থ হলে আসল অ্যাকশন
 * ব্যর্থ হবে না (মনিটরিং মূল ফ্লোতে বাধা দেয় না — cappedCollection.js-এর
 * দর্শন অনুযায়ী)। পড়ার দিক GET /admin/audit/events দিয়ে (নিচে ওয়্যারিং)।
 */
import AdminAuditEvent, { ensureAdminAuditCapped } from "../../models/adminAuditEvent.model.js";
import { ROLES } from "../../constants/index.js";

/** ইমেইল হল্যাক — সম্পূর্ণ PII রাখে না, শুধু শনাক্তকরণে যথেষ্ট। */
export function maskEmail(email) {
  const value = String(email || "");
  if (!value) return "";
  const at = value.lastIndexOf("@");
  if (at <= 0) return "***";
  const domain = value.slice(at);
  return `***${domain}`;
}

/** রোল-পরিবর্তনের অন্যান্য পরিবর্তন-ক্ষেত্র থেকে আলাদা রাখা। */
function diffRole(before, after) {
  if (!before || !after || before.role === after.role) return null;
  return { roleBefore: before.role, roleAfter: after.role };
}

/**
 * কেন্দ্রীয় রেকর্ডার — action: UNLOCK / USER_UPDATE / DELETE।
 * target: { id, email }, extra: { roleBefore, roleAfter, failedAttempts }
 */
export async function recordAdminAction(action, actor, target, extra = {}) {
  try {
    await ensureAdminAuditCapped();
    await AdminAuditEvent.create({
      action,
      actorId: actor?._id?.toString() || actor?.id || "",
      actorRole: actor?.role || "",
      actorEmail: maskEmail(actor?.email),
      targetId: target?.id || "",
      targetEmail: maskEmail(target?.email),
      roleBefore: extra.roleBefore || "",
      roleAfter: extra.roleAfter || "",
      failedAttempts: Number.isInteger(extra.failedAttempts) ? extra.failedAttempts : null,
      result: extra.result || "SUCCESS",
    });
  } catch {
    /* অডিট-লেখা ব্যর্থতা মূল অ্যাকশন ব্যর্থ করে না */
  }
}

/** GET /admin/audit/events?action=&limit= — নতুন থেকে পুরনো ক্রম। */
export async function auditHistory({ action, limit = 100 } = {}) {
  await ensureAdminAuditCapped();
  const filter = {};
  if (action) filter.action = action;
  const capped = Math.min(Math.max(Number(limit) || 100, 1), 500);
  return AdminAuditEvent.find(filter).sort({ $natural: -1 }).limit(capped).lean();
}

/** রোল-পরিবর্তন diff — updateUser ফ্লো থেকে। */
export { diffRole };
