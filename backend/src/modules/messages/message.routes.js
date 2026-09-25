import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import { idParam, startConversationSchema, sendMessageSchema, listQuery } from "./message.validation.js";
import * as messageController from "./message.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(listQuery, "query"), messageController.conversations);
router.post("/", validate(startConversationSchema), messageController.start);

router.get("/:id/messages", validate(idParam, "params"), validate(listQuery, "query"), messageController.messages);
router.post("/:id/messages", validate(idParam, "params"), validate(sendMessageSchema), messageController.send);
router.patch("/:id/read", validate(idParam, "params"), messageController.read);
router.delete("/:id", validate(idParam, "params"), messageController.remove);

export default router;
