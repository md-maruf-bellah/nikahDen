import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import * as preferenceService from "./preference.service.js";

export const getMine = asyncHandler(async (req, res) => {
  const prefs = await preferenceService.getMyPreferences(req.user.id);
  return sendSuccess(res, "My preferences", prefs);
});

export const upsertMine = asyncHandler(async (req, res) => {
  const prefs = await preferenceService.upsertMyPreferences(req.user.id, req.body);
  return sendSuccess(res, "Preferences saved", prefs);
});

export const matches = asyncHandler(async (req, res) => {
  const { items, pagination, preferenceApplied } = await preferenceService.myMatches(req.user.id, req.query);
  return sendSuccess(res, "Preference matches", items, pagination ? { ...pagination, preferenceApplied } : { preferenceApplied });
});
