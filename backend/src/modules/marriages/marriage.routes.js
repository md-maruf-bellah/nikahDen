import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { ROLES } from "../../constants/index.js";
import * as marriageController from "./marriage.controller.js";

const router = Router();

// Member endpoints
router.get("/partners-candidates", authenticate, marriageController.getCandidates);
router.post("/declare", authenticate, marriageController.declare);
router.get("/me", authenticate, marriageController.getMine);
router.post("/unhide", authenticate, marriageController.unhideMine);

// Admin endpoints
router.get("/admin", authenticate, authorize(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.EDITOR), marriageController.adminList);
router.post("/admin", authenticate, authorize(ROLES.ADMIN, ROLES.SUPERADMIN), marriageController.adminCreate);
router.patch("/admin/:id", authenticate, authorize(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.EDITOR), marriageController.adminUpdate);
router.delete("/admin/:id", authenticate, authorize(ROLES.ADMIN, ROLES.SUPERADMIN), marriageController.adminDelete);

export default router;
