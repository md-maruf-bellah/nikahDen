import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import * as guardianService from "./guardian.service.js";
import * as contactService from "./guardianContactRequest.service.js";

export const getMine = asyncHandler(async (req, res) => {
  const link = await guardianService.getMyGuardian(req.user.id);
  return sendSuccess(res, "Guardianship link", link);
});

export const declare = asyncHandler(async (req, res) => {
  const result = await guardianService.declareGuardian(req.user.id, req.body);
  return sendSuccess(res, "Guardian declared", result, undefined, 201);
});

// অভিভাবক: consent link রিডিম → নিজের guardian-session (public, rate-limited)
export const exchangeLink = asyncHandler(async (req, res) => {
  const result = await guardianService.exchangeConsentSession(req.body.token);
  return sendSuccess(res, "Guardian session opened", result, undefined, 201);
});

// অভিভাবকের guardian-session থেকে (authenticateGuardian দিয়ে req.guardian বসে)
export const consent = asyncHandler(async (req, res) => {
  const result = await guardianService.recordConsent(req.guardian, req.body);
  return sendSuccess(res, "Guardian consent recorded", result);
});

export const verify = asyncHandler(async (req, res) => {
  const result = await guardianService.verifyGuardian(req.guardian);
  return sendSuccess(res, "Guardian verified", result);
});

export const revoke = asyncHandler(async (req, res) => {
  const result = await guardianService.revokeGuardian(req.user.id, req.user, req.body?.reason || "");
  return sendSuccess(res, "Guardianship revoked", result);
});

// ---------------------------------------------------------------------------
// Guardian-to-Guardian contact request
// ---------------------------------------------------------------------------

export const listContactRequests = asyncHandler(async (req, res) => {
  const result = await contactService.listContactRequests(req.user.id);
  return sendSuccess(res, "Guardian contact requests", result);
});

export const createContactRequest = asyncHandler(async (req, res) => {
  const result = await contactService.createContactRequest(req.user.id, req.body.targetMemberId);
  return sendSuccess(res, "Guardian contact request created", result, undefined, 201);
});

export const approveContactRequest = asyncHandler(async (req, res) => {
  const result = await contactService.approveContactRequest(req.user.id, req.params.id);
  return sendSuccess(res, "Guardian contact request approved", result);
});

export const denyContactRequest = asyncHandler(async (req, res) => {
  const result = await contactService.denyContactRequest(req.user.id, req.params.id, req.body?.reason || "");
  return sendSuccess(res, "Guardian contact request denied", result);
});

export default { getMine, declare, exchangeLink, consent, verify, revoke, listContactRequests, createContactRequest, approveContactRequest, denyContactRequest };
