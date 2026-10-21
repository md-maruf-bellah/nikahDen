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

// Staff-only admin-action audit trail (Mongo capped collection — restart-persistent)
// prefix=GUARDIAN_ দিলে শুধু গার্ডিয়ান-পরিবারের অ্যাকশন (রিভিউ পেজের ট্যাব)
router.get(
  "/audit/events",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  requirePermission(PERMISSIONS.STATS_READ),
  adminController.auditEvents
);

// Staff-only guardianship link review (Guardian/Family রিভিউ পেজ)
router.get(
  "/guardians",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  requirePermission(PERMISSIONS.STATS_READ),
  adminController.guardians
);

// Staff-only contact spam-drop history (Mongo capped collection — restart-persistent)
router.get(
  "/contact/events",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  requirePermission(PERMISSIONS.STATS_READ),
  adminController.contactEvents
);

export default router;
