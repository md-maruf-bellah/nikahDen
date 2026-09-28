import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import { preferenceSchema } from "./preference.validation.js";
import * as preferenceController from "./preference.controller.js";

const router = Router();

router.use(authenticate);

router.get("/me", preferenceController.getMine);
router.put("/me", validate(preferenceSchema), preferenceController.upsertMine);
router.get("/matches", preferenceController.matches);

export default router;
