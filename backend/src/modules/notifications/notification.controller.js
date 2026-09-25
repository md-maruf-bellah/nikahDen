import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import * as notificationService from "./notification.service.js";

export const list = asyncHandler(async (req, res) => {
  const { items, unreadCount, pagination } = await notificationService.myNotifications(req.user.id, req.query);
  return sendSuccess(res, "Notifications fetched", { items, unreadCount }, pagination);
});

export const read = asyncHandler(async (req, res) => {
  const result = await notificationService.markRead(req.user.id, req.params.id);
  return sendSuccess(res, "Notification marked as read", result);
});

export const readAll = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllRead(req.user.id);
  return sendSuccess(res, "All notifications marked as read", result);
});

export const remove = asyncHandler(async (req, res) => {
  const result = await notificationService.removeNotification(req.user.id, req.params.id);
  return sendSuccess(res, "Notification removed", result);
});

export const clear = asyncHandler(async (req, res) => {
  const result = await notificationService.clearAll(req.user.id);
  return sendSuccess(res, "All notifications cleared", result);
});
