import * as marriageService from "./marriage.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";

export const getCandidates = asyncHandler(async (req, res) => {
  const list = await marriageService.candidatePartners(req.user.id);
  return sendSuccess(res, "Candidate partners", list);
});

export const declare = asyncHandler(async (req, res) => {
  const result = await marriageService.declareMarriage(req.user.id, req.body);
  return sendSuccess(res, "Marriage successfully declared and biodata hidden", result, undefined, 201);
});

export const getMine = asyncHandler(async (req, res) => {
  const data = await marriageService.myMarriage(req.user.id);
  return sendSuccess(res, "My marriage status", data);
});

export const unhideMine = asyncHandler(async (req, res) => {
  const data = await marriageService.unhideMyBiodata(req.user.id);
  return sendSuccess(res, "Biodata reactivated successfully", data);
});

export const adminList = asyncHandler(async (req, res) => {
  const { items, pagination, stats } = await marriageService.adminListMarriages(req.query);
  return sendSuccess(res, "Marriages list", { items, stats }, pagination);
});

export const adminCreate = asyncHandler(async (req, res) => {
  const item = await marriageService.adminCreateMarriage(req.body, req.user);
  return sendSuccess(res, "Marriage record created", item, undefined, 201);
});

export const adminUpdate = asyncHandler(async (req, res) => {
  const item = await marriageService.adminUpdateMarriage(req.params.id, req.body, req.user);
  return sendSuccess(res, "Marriage record updated", item);
});

export const adminDelete = asyncHandler(async (req, res) => {
  const result = await marriageService.adminDeleteMarriage(req.params.id);
  return sendSuccess(res, "Marriage record deleted", result);
});
