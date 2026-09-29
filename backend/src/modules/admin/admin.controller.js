import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import * as adminService from "./admin.service.js";

export const stats = asyncHandler(async (_req, res) => {
  const stats = await adminService.dashboardStats();
  return sendSuccess(res, "Admin dashboard stats", stats);
});

// GET /admin/oauth/events?event=&ip=&limit= — পারসিস্টেড OAuth ইভেন্ট হিস্ট্রি
export const oauthEvents = asyncHandler(async (req, res) => {
  const data = await adminService.oauthEventHistory({
    event: req.query.event,
    ip: req.query.ip,
    limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
  });
  return sendSuccess(res, "OAuth event history", data);
});

// GET /admin/contact/events?ip=&limit= — পারসিস্টেড contact spam-drop হিস্ট্রি
export const contactEvents = asyncHandler(async (req, res) => {
  const data = await adminService.contactSpamHistory({
    ip: req.query.ip,
    limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
  });
  return sendSuccess(res, "Contact spam event history", data);
});

export const siteStats = asyncHandler(async (_req, res) => {
  const stats = await adminService.siteStats();
  return sendSuccess(res, "Site statistics", stats);
});
