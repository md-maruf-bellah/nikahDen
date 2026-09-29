import ContactMessage from "../../models/contactMessage.model.js";
import ContactEvent, { CONTACT_EVENT_CAP } from "../../models/contactEvent.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { parsePagination, buildPagination } from "../../utils/pagination.js";
import { isValidObjectId } from "../../utils/helpers.js";

// ---- স্প্যাম সিগনাল থ্রেশহোল্ড ----
// ফর্ম রেন্ডার থেকে সাবমিট — মানুষ কমপক্ষে কয়েক সেকেন্ড নেয়; বট/স্ক্রিপ্ট প্রায় সাথে সাথে জমা দেয়।
const MIN_FORM_FILL_MS = 2_500;

/**
 * honeypot + টাইম-ট্র্যাপ যাচাই — স্প্যাম হলে false।
 * বট-কে সাইলেন্টি ফেলতে হয় (সফল রেসপন্সের অনুকরণ), তাই কলার সাইলেন্ট 201 দেবে —
 * বট জানবেই না ধরা পড়েছে, এভাবে তারা টিউনিং করতে পারে না।
 */
export function looksLikeSpam({ website, formElapsedMs }) {
  if (website && website.trim().length > 0) return { spam: true, reason: "honeypot" };
  const elapsed = Number(formElapsedMs) || 0;
  if (elapsed > 0 && elapsed < MIN_FORM_FILL_MS) {
    return { spam: true, reason: "time_trap", detail: `${elapsed}ms < ${MIN_FORM_FILL_MS}ms` };
  }
  return { spam: false, reason: "", detail: "" };
}

/** স্প্যাম-ড্রপ ইভেন্ট capped collection-এ persist (fire-and-forget) — রিস্টার্ট-সহনশীল হিস্ট্রি। */
function persistSpamDrop(ip, { reason, detail }) {
  ContactEvent.create({ event: "spam_dropped", ip: ip ?? "", reason, detail })
    .catch((err) => console.error("[contact] event persist failed:", err.message));
}

/** পারসিস্টেড স্প্যাম-ইভেন্ট হিস্ট্রি — admin GET /admin/contact/events (নতুনগুলো আগে)। */
export async function recentSpamEvents({ limit = 100, ip } = {}) {
  const { ensureContactEventCapped } = await import("../../models/contactEvent.model.js");
  await ensureContactEventCapped();
  const filter = { event: "spam_dropped" };
  if (ip) filter.ip = ip;
  return ContactEvent.find(filter).sort({ $natural: -1 }).limit(Math.min(limit, CONTACT_EVENT_CAP.max)).lean();
}

/**
 * spam-drop রেকর্ডিং — controller কল করে (বট-প্রতারণার সাইলেন্ট 201-এর *আগে*)।
 * কনকারেন্ট লেখায় capped count-cap সামান্য overshoot করতে পারে — আচরণটা bounded,
 * ডকুমেন্টেড (oauth_events-এর মতোই)।
 */
export function recordSpamDrop(ip, verdict) {
  persistSpamDrop(ip, verdict);
}

export async function createMessage(data) {
  // একই ইমেইলে চলমান NEW আবেদন থাকলে ডুপ্লিকেট স্প্যাম নয় — বিদ্যমানটিই ফেরত (idempotent)।
  // স্টাফ REPLIED/CLOSED করে দিলে পরের মেসেজ স্বাভাবিকভাবে নতুন টিকেট হিসেবে ঢুকবে।
  const existing = await ContactMessage.findOne({ email: data.email, status: "NEW" }).lean();
  if (existing) {
    return { id: existing._id.toString(), createdAt: existing.createdAt, status: existing.status, duplicate: true };
  }
  const doc = await ContactMessage.create(data);
  _newCountCache = { value: 0, at: 0 }; // ক্যাশ ভাঙা — ব্যাজ সাথে সাথে বাড়বে
  return { id: doc._id.toString(), createdAt: doc.createdAt, status: doc.status, duplicate: false };
}

// নতুন (NEW) মেসেজের কাউন্টার — সাইডবার ব্যাজ ৩০ সেকেন্ডে পোল করে, তাই
// ১০ সেকেন্ডের মাইক্রো-ক্যাশ দিয়ে সস্তা রাখা হয়েছে (polling-friendly)।
let _newCountCache = { value: 0, at: 0 };
export async function countNewMessages() {
  if (Date.now() - _newCountCache.at < 10_000) return _newCountCache.value;
  const value = await ContactMessage.countDocuments({ status: "NEW" });
  _newCountCache = { value, at: Date.now() };
  return value;
}

export async function listMessages(query) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.search) {
    const rx = { $regex: query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }, { phone: rx }, { message: rx }];
  }

  const { page, limit, skip } = parsePagination(query);
  const [total, docs] = await Promise.all([
    ContactMessage.countDocuments(filter),
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);
  return { items: docs.map(decorate), pagination: buildPagination(total, page, limit) };
}

export async function getMessage(id) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid message id", "INVALID_ID");
  const doc = await ContactMessage.findById(id).lean();
  if (!doc) throw ApiError.notFound("Message not found", "MESSAGE_NOT_FOUND");
  return decorate(doc);
}

export async function updateMessage(id, { status, reply = "" }, actor) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid message id", "INVALID_ID");
  const doc = await ContactMessage.findById(id);
  if (!doc) throw ApiError.notFound("Message not found", "MESSAGE_NOT_FOUND");

  doc.status = status;
  if (status !== "NEW") {
    doc.handledBy = actor.id;
    doc.repliedAt = new Date();
  }
  if (reply) doc.reply = reply;
  await doc.save();
  _newCountCache = { value: 0, at: 0 }; // স্ট্যাটাস বদলালেই কাউন্ট বদলায়
  return decorate(doc.toObject());
}

export async function deleteMessage(id) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid message id", "INVALID_ID");
  const doc = await ContactMessage.findByIdAndDelete(id);
  if (!doc) throw ApiError.notFound("Message not found", "MESSAGE_NOT_FOUND");
  _newCountCache = { value: 0, at: 0 };
  return { id };
}

function decorate(doc) {
  const obj = { ...doc, id: doc._id.toString() };
  delete obj._id;
  delete obj.__v;
  return obj;
}

export default { createMessage, listMessages, getMessage, updateMessage, deleteMessage };
