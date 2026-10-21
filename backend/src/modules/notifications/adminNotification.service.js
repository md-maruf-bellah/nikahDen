import Notification from "../../models/notification.model.js";
import User from "../../models/user.model.js";
import { ROLES, NOTIFICATION_TYPES } from "../../constants/index.js";
import { parsePagination, buildPagination } from "../../utils/pagination.js";
import { isValidObjectId } from "../../utils/helpers.js";
import { emitToUser } from "../../realtime/index.js";
import { notificationEvent } from "./notification.service.js";

/**
 * Dispatches a business notification to all active staff/admin accounts.
 * Safe & resilient — failures log without throwing so parent transactions are not interrupted.
 */
export async function notifyAdmins({ type, title, body, data = {}, adminCategory = "SYSTEM" }) {
  try {
    const admins = await User.find({
      role: { $in: [ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.EDITOR] },
      status: "ACTIVE",
    })
      .select("_id email")
      .lean();

    if (!admins.length) return [];

    const docs = await Notification.insertMany(
      admins.map((a) => ({
        user: a._id,
        type: type || NOTIFICATION_TYPES.SYSTEM,
        title,
        body,
        isRead: false,
        forAdmin: true,
        adminCategory,
        data,
      }))
    );

    // Emit live socket event to all active admins
    for (const doc of docs) {
      try {
        const payload = {
          ...notificationEvent(doc),
          forAdmin: true,
          adminCategory,
        };
        emitToUser(doc.user, "admin:notification:new", payload);
        emitToUser(doc.user, "notification:new", payload);
      } catch (err) {
        // Socket emit failure ignored safely
      }
    }

    return docs;
  } catch (err) {
    console.error("[notifyAdmins] Error creating admin notifications:", err.message);
    return [];
  }
}

/**
 * Fetches admin notifications with tab categories, unread filters, and summary stats.
 */
export async function listAdminNotifications(adminUserId, query = {}) {
  const { page, limit, skip } = parsePagination(query);

  const filter = { user: adminUserId, forAdmin: true };

  if (query.category && query.category !== "ALL") {
    filter.adminCategory = query.category.toUpperCase();
  }

  if (query.unread === "1" || query.unread === "true") {
    filter.isRead = false;
  }

  if (query.search) {
    const rx = new RegExp(query.search.trim(), "i");
    filter.$or = [{ title: rx }, { body: rx }];
  }

  const [total, docs, unreadCount, categoryAgg] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments({ user: adminUserId, forAdmin: true, isRead: false }),
    Notification.aggregate([
      { $match: { user: adminUserId, forAdmin: true } },
      { $group: { _id: "$adminCategory", count: { $sum: 1 } } },
    ]),
  ]);

  const countsMap = {
    USER: 0,
    PAYMENT: 0,
    BIODATA: 0,
    MARRIAGE: 0,
    SUPPORT: 0,
    SYSTEM: 0,
  };
  for (const c of categoryAgg) {
    if (c._id && countsMap[c._id] !== undefined) {
      countsMap[c._id] = c.count;
    }
  }

  const totalAll = await Notification.countDocuments({ user: adminUserId, forAdmin: true });

  const items = docs.map((d) => ({
    id: d._id.toString(),
    type: d.type,
    title: d.title,
    body: d.body,
    isRead: d.isRead,
    adminCategory: d.adminCategory || "SYSTEM",
    data: d.data || {},
    createdAt: d.createdAt,
  }));

  return {
    items,
    unreadCount,
    categoryCounts: {
      ALL: totalAll,
      ...countsMap,
    },
    pagination: buildPagination(total, page, limit),
  };
}

/**
 * Marks a single admin notification as read.
 */
export async function markAdminNotificationRead(adminUserId, id) {
  if (!isValidObjectId(id)) throw new Error("Invalid notification id");
  const doc = await Notification.findOneAndUpdate(
    { _id: id, user: adminUserId, forAdmin: true },
    { $set: { isRead: true } },
    { new: true }
  ).lean();
  return { id, isRead: true };
}

/**
 * Marks all admin notifications as read for current admin user.
 */
export async function markAllAdminNotificationsRead(adminUserId) {
  await Notification.updateMany(
    { user: adminUserId, forAdmin: true, isRead: false },
    { $set: { isRead: true } }
  );
  emitToUser(adminUserId, "notification:read", { all: true });
  return { success: true };
}

/**
 * Deletes a single admin notification.
 */
export async function deleteAdminNotification(adminUserId, id) {
  if (!isValidObjectId(id)) throw new Error("Invalid notification id");
  await Notification.findOneAndDelete({ _id: id, user: adminUserId, forAdmin: true });
  return { id, deleted: true };
}

/**
 * Deletes all admin notifications (with admin permission).
 */
export async function clearAllAdminNotifications(adminUserId, { category } = {}) {
  const filter = { user: adminUserId, forAdmin: true };
  if (category && category !== "ALL") {
    filter.adminCategory = category.toUpperCase();
  }
  const result = await Notification.deleteMany(filter);
  return { deletedCount: result.deletedCount };
}

export default {
  notifyAdmins,
  listAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  deleteAdminNotification,
  clearAllAdminNotifications,
};
