import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import { blockUserSchema, idParam, listBlocksSchema } from "./block.validation.js";
import * as blockController from "./block.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(listBlocksSchema, "query"), blockController.list);
router.post("/", validate(blockUserSchema), blockController.block);
router.delete("/:id", validate(idParam, "params"), blockController.unblock);
router.get("/:id/status", validate(idParam, "params"), blockController.statusFor);

export default router;
