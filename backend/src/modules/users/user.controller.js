import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import { toPublicUrl } from "../../middleware/upload.middleware.js";
import * as userService from "./user.service.js";

export const listUsers = asyncHandler(async (req, res) => {
  const { items, pagination } = await userService.listUsers(req.query, req.user);
  return sendSuccess(res, "Users fetched", items, pagination);
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return sendSuccess(res, "User fetched", user);
});

export const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body, req.user);
  return sendSuccess(res, "User created successfully", user, undefined, 201);
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body, req.user);
  return sendSuccess(res, "User updated successfully", user);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const result = await userService.deleteUser(req.params.id, req.user);
  return sendSuccess(res, "User deactivated and archived", result);
});

// ---------------------------------------------------------------
// Self profile
// ---------------------------------------------------------------
export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user.id);
  return sendSuccess(res, "Profile fetched", user);
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateMyProfile(req.user.id, req.body);
  return sendSuccess(res, "Profile updated successfully", user);
});

export const uploadMyAvatar = asyncHandler(async (req, res) => {
  const url = toPublicUrl(req.file);
  if (!url) {
    return res.status(400).json({ success: false, message: "No image uploaded", errorCode: "UPLOAD_ERROR" });
  }
  const user = await userService.updateMyProfile(req.user.id, { avatar: url });
  return sendSuccess(res, "Avatar uploaded", user);
});

export const myDashboard = asyncHandler(async (req, res) => {
  const summary = await userService.memberDashboardSummary(req.user.id);
  return sendSuccess(res, "Dashboard summary", summary);
});
