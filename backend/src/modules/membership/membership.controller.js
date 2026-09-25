import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import * as membershipService from "./membership.service.js";

export const listPlans = asyncHandler(async (req, res) => {
  const plans = await membershipService.listPlans(req.query);
  return sendSuccess(res, "Membership plans fetched", plans);
});

export const getPlan = asyncHandler(async (req, res) => {
  const plan = await membershipService.getPlan(req.params.id);
  return sendSuccess(res, "Plan fetched", plan);
});

export const createPlan = asyncHandler(async (req, res) => {
  const plan = await membershipService.createPlan(req.body);
  return sendSuccess(res, "Plan created", plan, undefined, 201);
});

export const updatePlan = asyncHandler(async (req, res) => {
  const plan = await membershipService.updatePlan(req.params.id, req.body);
  return sendSuccess(res, "Plan updated", plan);
});

export const deletePlan = asyncHandler(async (req, res) => {
  const result = await membershipService.deletePlan(req.params.id);
  return sendSuccess(res, "Plan deleted", result);
});

export const listPacks = asyncHandler(async (req, res) => {
  const packs = await membershipService.listPacks(req.query);
  return sendSuccess(res, "Connect packs fetched", packs);
});

export const createPack = asyncHandler(async (req, res) => {
  const pack = await membershipService.createPack(req.body);
  return sendSuccess(res, "Connect pack created", pack, undefined, 201);
});

export const updatePack = asyncHandler(async (req, res) => {
  const pack = await membershipService.updatePack(req.params.id, req.body);
  return sendSuccess(res, "Connect pack updated", pack);
});

export const deletePack = asyncHandler(async (req, res) => {
  const result = await membershipService.deletePack(req.params.id);
  return sendSuccess(res, "Connect pack deleted", result);
});

export const myMembership = asyncHandler(async (req, res) => {
  const summary = await membershipService.myMembership(req.user.id);
  return sendSuccess(res, "My membership", summary);
});
