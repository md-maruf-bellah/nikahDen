import Notification from "../../models/notification.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { parsePagination, buildPagination } from "../../utils/pagination.js";
import { isValidObjectId } from "../../utils/helpers.js";
import { emitToUser } from "../../realtime/index.js";

/**
 * notification:new লাইভ-পে-লোড — **সবসময় সত্তিকার DB-ডক থেকে** (একটাই উৎস),
 * তাই `id` কখনো null হয় না। দুটি NotificationBell একই id পায় — সেটাই
 * চাইম-থ্রটল (src/lib/notifSound.js) কে দু'বার বাজতে দেয় না।
 */
export function notificationEvent(doc) {
  return {
    id: doc._id.toString(),
    type: doc.type,
    title: doc.title,
    body: doc.body,
    data: doc.data ?? {},
    createdAt: (doc.createdAt ? new Date(doc.createdAt) : new Date()).toISOString(),
  };
}

/** ডক-মালিকের room-এ notification:new — কলার শুধু create করে এখানে পাঠায় */
export function emitNewNotification(doc) {
  emitToUser(doc.user, "notification:new", notificationEvent(doc));
}

export async function myNotifications(userId, query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { user: userId };
  if (query.unread === "1" || query.unread === "true") filter.isRead = false;

  const [total, docs] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);
  const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

  const items = docs.map((d) => ({ ...d, id: d._id.toString(), _id: undefined }));
  return { items, unreadCount, pagination: buildPagination(total, page, limit) };
}

export async function markRead(userId, id) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid notification id", "INVALID_ID");
  const doc = await Notification.findOneAndUpdate(
    { _id: id, user: userId },
    { $set: { isRead: true } },
    { new: true }
  ).lean();
  if (!doc) throw ApiError.notFound("Notification not found", "NOTIFICATION_NOT_FOUND");
  return { id: doc._id.toString(), isRead: true };
}

export async function markAllRead(userId) {
  await Notification.updateMany({ user: userId, isRead: false }, { $set: { isRead: true } });
  emitToUser(userId, "notification:read", { all: true });
  return { success: true };
}

export async function removeNotification(userId, id) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid notification id", "INVALID_ID");
  const doc = await Notification.findOneAndDelete({ _id: id, user: userId });
  if (!doc) throw ApiError.notFound("Notification not found", "NOTIFICATION_NOT_FOUND");
  return { id };
}

export async function clearAll(userId) {
  const result = await Notification.deleteMany({ user: userId });
  return { deleted: result.deletedCount };
}

export default { myNotifications, markRead, markAllRead, removeNotification, clearAll, notificationEvent, emitNewNotification };
