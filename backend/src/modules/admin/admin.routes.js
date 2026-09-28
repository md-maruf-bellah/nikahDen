import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize, requirePermission } from "../../middleware/authorize.middleware.js";
import { ROLES, PERMISSIONS } from "../../constants/index.js";
import * as adminController from "./admin.controller.js";

const router = Router();

// Staff-only dashboard stats
router.get(
  "/stats",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  requirePermission(PERMISSIONS.STATS_READ),
  adminController.stats
);

// Staff-only OAuth event history (Mongo capped collection — restart-persistent)
router.get(
  "/oauth/events",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  requirePermission(PERMISSIONS.STATS_READ),
  adminController.oauthEvents
);

export default router;
