import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import * as adminService from "./admin.service.js";

export const stats = asyncHandler(async (_req, res) => {
  const stats = await adminService.dashboardStats();
  return sendSuccess(res, "Admin dashboard stats", stats);
});

export const siteStats = asyncHandler(async (_req, res) => {
  const stats = await adminService.siteStats();
  return sendSuccess(res, "Site statistics", stats);
});
