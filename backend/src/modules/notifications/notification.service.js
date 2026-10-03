import Notification from "../../models/notification.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { parsePagination, buildPagination } from "../../utils/pagination.js";
import { isValidObjectId } from "../../utils/helpers.js";
import { emitToUser } from "../../realtime/index.js";

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

export default { myNotifications, markRead, markAllRead, removeNotification, clearAll };
