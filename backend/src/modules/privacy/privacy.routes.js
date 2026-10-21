import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import { privacySchema } from "./privacy.validation.js";
import * as privacyController from "./privacy.controller.js";

const router = Router();

router.use(authenticate);

// Own profile privacy (photo visibility + contact visibility policy).
router.get("/me", privacyController.getMine);
router.put("/me", validate(privacySchema), privacyController.updateMine);

export default router;
