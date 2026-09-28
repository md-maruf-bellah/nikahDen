import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import * as contactService from "./contact.service.js";

export const create = asyncHandler(async (req, res) => {
  // honeypot / টাইম-ট্র্যাপে ধরা পড়লে বট-কে সফল রেসপন্সেরই অনুকরণ করে সাইলেন্টি ফেলে দিই —
  // বট পার্থক্য বুঝতে পারে না, তাই টিউনিং করতে পারে না। লগ থাকে server-এ।
  if (contactService.looksLikeSpam(req.body)) {
    console.warn(
      `[contact] spam dropped ip=${req.ip} honeypot=${req.body.website ? "yes" : "no"} elapsed=${req.body.formElapsedMs ?? 0}ms`
    );
    return sendSuccess(res, "Message sent. We will get back to you soon.", { id: null, spam: true }, undefined, 201);
  }
  const result = await contactService.createMessage(req.body);
  return sendSuccess(res, "Message sent. We will get back to you soon.", result, undefined, 201);
});

// GET /contacts/new-count — সাইডবার লাইভ ব্যাজের হালকা কাউন্টার (staff-only)
export const newCount = asyncHandler(async (_req, res) => {
  const count = await contactService.countNewMessages();
  return sendSuccess(res, "New messages count", { count });
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
