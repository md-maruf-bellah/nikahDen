import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import * as contactService from "./contact.service.js";

export const create = asyncHandler(async (req, res) => {
  const result = await contactService.createMessage(req.body);
  return sendSuccess(res, "Message sent. We will get back to you soon.", result, undefined, 201);
});

export const list = asyncHandler(async (req, res) => {
  const { items, pagination } = await contactService.listMessages(req.query);
  return sendSuccess(res, "Support messages fetched", items, pagination);
});

export const getOne = asyncHandler(async (req, res) => {
  const message = await contactService.getMessage(req.params.id);
  return sendSuccess(res, "Message fetched", message);
});

export const update = asyncHandler(async (req, res) => {
  const message = await contactService.updateMessage(req.params.id, req.body, req.user);
  return sendSuccess(res, "Message updated", message);
});

export const remove = asyncHandler(async (req, res) => {
  const result = await contactService.deleteMessage(req.params.id);
  return sendSuccess(res, "Message deleted", result);
});
