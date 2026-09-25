import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import * as messageService from "./message.service.js";

export const conversations = asyncHandler(async (req, res) => {
  const { items, pagination } = await messageService.myConversations(req.user.id, req.query);
  return sendSuccess(res, "Conversations fetched", items, pagination);
});

export const start = asyncHandler(async (req, res) => {
  const result = await messageService.startConversation(req.user.id, req.body);
  return sendSuccess(res, "Conversation started", result, undefined, 201);
});

export const messages = asyncHandler(async (req, res) => {
  const { items, pagination } = await messageService.getConversationMessages(req.user.id, req.params.id, req.query);
  return sendSuccess(res, "Messages fetched", items, pagination);
});

export const send = asyncHandler(async (req, res) => {
  const message = await messageService.sendMessage(req.user.id, req.params.id, req.body.text);
  return sendSuccess(res, "Message sent", message, undefined, 201);
});

export const read = asyncHandler(async (req, res) => {
  const result = await messageService.markRead(req.user.id, req.params.id);
  return sendSuccess(res, "Conversation marked as read", result);
});

export const remove = asyncHandler(async (req, res) => {
  const result = await messageService.deleteConversation(req.user.id, req.params.id);
  return sendSuccess(res, "Conversation deleted", result);
});
