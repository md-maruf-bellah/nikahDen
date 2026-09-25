import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import * as notificationController from "./notification.controller.js";

const router = Router();
const idParam = z.object({ id: z.string().min(1) });
const listQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  unread: z.enum(["1", "true", "0", "false"]).optional(),
});

router.use(authenticate);

router.get("/", validate(listQuery, "query"), notificationController.list);
router.patch("/read-all", notificationController.readAll);
router.delete("/", notificationController.clear);
router.patch("/:id/read", validate(idParam, "params"), notificationController.read);
router.delete("/:id", validate(idParam, "params"), notificationController.remove);

export default router;
