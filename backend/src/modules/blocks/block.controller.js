import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import * as blockService from "./block.service.js";

export const list = asyncHandler(async (req, res) => {
  const { items, pagination } = await blockService.listMyBlocks(req.user.id, req.query);
  return sendSuccess(res, "Blocked users fetched", items, pagination);
});

export const block = asyncHandler(async (req, res) => {
  const result = await blockService.blockUser(req.user.id, req.body);
  return sendSuccess(res, "User blocked", result, undefined, 201);
});

export const unblock = asyncHandler(async (req, res) => {
  const result = await blockService.unblockUser(req.user.id, req.params.id);
  return sendSuccess(res, "User unblocked", result);
});

// messenger UI-র জন্য: এই পার্টনার-প্রতি আমার block-স্টেট
export const statusFor = asyncHandler(async (req, res) => {
  const blockedByMe = await blockService.didIBlock(req.user.id, req.params.id);
  return sendSuccess(res, "Block status", { blockedByMe, userId: req.params.id });
});

export default { list, block, unblock, statusFor };
