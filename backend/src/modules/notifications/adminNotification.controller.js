import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import * as adminNotifService from "./adminNotification.service.js";

export const listAdminNotifications = asyncHandler(async (req, res) => {
  const result = await adminNotifService.listAdminNotifications(req.user.id, req.query);
  return sendSuccess(res, "Admin notifications fetched", result.items, result.pagination, 200, {
    unreadCount: result.unreadCount,
    categoryCounts: result.categoryCounts,
  });
});

export const markRead = asyncHandler(async (req, res) => {
  const result = await adminNotifService.markAdminNotificationRead(req.user.id, req.params.id);
  return sendSuccess(res, "Notification marked as read", result);
});

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await adminNotifService.markAllAdminNotificationsRead(req.user.id);
  return sendSuccess(res, "All notifications marked as read", result);
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const result = await adminNotifService.deleteAdminNotification(req.user.id, req.params.id);
  return sendSuccess(res, "Notification deleted", result);
});

export const clearAllNotifications = asyncHandler(async (req, res) => {
  const result = await adminNotifService.clearAllAdminNotifications(req.user.id, req.query);
  return sendSuccess(res, "All notifications cleared", result);
});
