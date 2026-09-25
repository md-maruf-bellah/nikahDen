import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import { toPublicUrl } from "../../middleware/upload.middleware.js";
import * as biodataService from "./biodata.service.js";

export const list = asyncHandler(async (req, res) => {
  const { items, pagination } = await biodataService.listBiodatas(req.query, req.user);
  return sendSuccess(res, "Biodatas fetched", items, pagination);
});

export const getOne = asyncHandler(async (req, res) => {
  const biodata = await biodataService.getBiodataById(req.params.id, req.user);
  return sendSuccess(res, "Biodata fetched", biodata);
});

export const similar = asyncHandler(async (req, res) => {
  const items = await biodataService.similarBiodatas(req.params.id, req.user, req.query.limit || 8);
  return sendSuccess(res, "Similar biodatas fetched", items);
});

// ---- own biodata ----
export const getMine = asyncHandler(async (req, res) => {
  const biodata = await biodataService.getMyBiodata(req.user.id);
  return sendSuccess(res, "My biodata", biodata);
});

export const createMine = asyncHandler(async (req, res) => {
  const biodata = await biodataService.createMyBiodata(req.user.id, req.body);
  return sendSuccess(res, "Biodata created (draft)", biodata, undefined, 201);
});

export const updateMine = asyncHandler(async (req, res) => {
  const biodata = await biodataService.updateMyBiodata(req.user.id, req.body);
  return sendSuccess(res, "Biodata updated", biodata);
});

export const submitMine = asyncHandler(async (req, res) => {
  const biodata = await biodataService.submitMyBiodata(req.user.id);
  return sendSuccess(res, "Biodata submitted for review", biodata);
});

export const archiveMine = asyncHandler(async (req, res) => {
  const result = await biodataService.archiveMyBiodata(req.user.id);
  return sendSuccess(res, "Biodata archived", result);
});

export const restoreMine = asyncHandler(async (req, res) => {
  const biodata = await biodataService.restoreMyBiodata(req.user.id);
  return sendSuccess(res, "Biodata restored to draft", biodata);
});

export const uploadMinePhoto = asyncHandler(async (req, res) => {
  const url = toPublicUrl(req.file);
  if (!url) {
    return res.status(400).json({ success: false, message: "No image uploaded", errorCode: "UPLOAD_ERROR" });
  }
  const biodata = await biodataService.addMyBiodataPhoto(req.user.id, url);
  return sendSuccess(res, "Photo uploaded", { biodata, photo: url });
});

// ---- likes ----
export const like = asyncHandler(async (req, res) => {
  const result = await biodataService.likeBiodata(req.user.id, req.params.id);
  return sendSuccess(res, "Liked", result, undefined, 201);
});

export const unlike = asyncHandler(async (req, res) => {
  await biodataService.unlikeBiodata(req.user.id, req.params.id);
  return sendSuccess(res, "Unliked");
});

export const likesSent = asyncHandler(async (req, res) => {
  const { items, pagination } = await biodataService.sentLikes(req.user.id, req.query);
  return sendSuccess(res, "Biodata you liked", items, pagination);
});

export const likesReceived = asyncHandler(async (req, res) => {
  const { items, pagination } = await biodataService.receivedLikes(req.user.id, req.query);
  return sendSuccess(res, "People who liked your biodata", items, pagination);
});

// ---- photos / moderation ----
export const removePhoto = asyncHandler(async (req, res) => {
  const result = await biodataService.removeBiodataPhoto(req.params.id, req.params.index, req.user);
  return sendSuccess(res, "Photo removed", result);
});

export const setPhotoAsProfile = asyncHandler(async (req, res) => {
  const result = await biodataService.setProfileImage(req.params.id, req.body.url, req.user);
  return sendSuccess(res, "Profile photo updated", result);
});

export const moderate = asyncHandler(async (req, res) => {
  const result = await biodataService.moderateBiodata(req.params.id, req.body, req.user);
  return sendSuccess(res, `Biodata marked ${req.body.status}`, result);
});

export const adminDelete = asyncHandler(async (req, res) => {
  const result = await biodataService.adminDeleteBiodata(req.params.id);
  return sendSuccess(res, "Biodata archived", result);
});
