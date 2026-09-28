import ContactMessage from "../../models/contactMessage.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { parsePagination, buildPagination } from "../../utils/pagination.js";
import { isValidObjectId } from "../../utils/helpers.js";

export async function createMessage(data) {
  // একই ইমেইলে চলমান NEW আবেদন থাকলে ডুপ্লিকেট স্প্যাম নয় — বিদ্যমানটিই ফেরত (idempotent)।
  // স্টাফ REPLIED/CLOSED করে দিলে পরের মেসেজ স্বাভাবিকভাবে নতুন টিকেট হিসেবে ঢুকবে।
  const existing = await ContactMessage.findOne({ email: data.email, status: "NEW" }).lean();
  if (existing) {
    return { id: existing._id.toString(), createdAt: existing.createdAt, status: existing.status, duplicate: true };
  }
  const doc = await ContactMessage.create(data);
  return { id: doc._id.toString(), createdAt: doc.createdAt, status: doc.status, duplicate: false };
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
  return decorate(doc.toObject());
}

export async function deleteMessage(id) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid message id", "INVALID_ID");
  const doc = await ContactMessage.findByIdAndDelete(id);
  if (!doc) throw ApiError.notFound("Message not found", "MESSAGE_NOT_FOUND");
  return { id };
}

function decorate(doc) {
  const obj = { ...doc, id: doc._id.toString() };
  delete obj._id;
  delete obj.__v;
  return obj;
}

export default { createMessage, listMessages, getMessage, updateMessage, deleteMessage };
