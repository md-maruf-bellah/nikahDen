import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import * as privacyService from "./privacy.service.js";

export const getMine = asyncHandler(async (req, res) => {
  const privacy = await privacyService.getMyPrivacy(req.user.id);
  return sendSuccess(res, "Privacy settings fetched", privacy);
});

export const updateMine = asyncHandler(async (req, res) => {
  const privacy = await privacyService.updateMyPrivacy(req.user.id, req.body);
  return sendSuccess(res, "Privacy settings updated", privacy);
});
