import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize, requirePermission } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import { ROLES, PERMISSIONS } from "../../constants/index.js";
import {
  idParam,
  listQuery,
  planSchema,
  planUpdateSchema,
  packSchema,
  packUpdateSchema,
} from "./membership.validation.js";
import * as membershipController from "./membership.controller.js";

const router = Router();

// Public catalog (pricing pages, checkout)
router.get("/plans", validate(listQuery, "query"), membershipController.listPlans);
router.get("/packs", validate(listQuery, "query"), membershipController.listPacks);

// My membership dashboard
router.get("/me", authenticate, membershipController.myMembership);

// Admin management
router.use("/plans/:id", authenticate, authorize(ROLES.ADMIN, ROLES.SUPERADMIN), requirePermission(PERMISSIONS.MEMBERSHIP_MANAGE));
router.get("/plans/:id", membershipController.getPlan);
router.post(
  "/plans",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  requirePermission(PERMISSIONS.MEMBERSHIP_MANAGE),
  validate(planSchema),
  membershipController.createPlan
);
router.patch("/plans/:id", validate(idParam, "params"), validate(planUpdateSchema), membershipController.updatePlan);
router.delete("/plans/:id", validate(idParam, "params"), membershipController.deletePlan);

router.post(
  "/packs",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  requirePermission(PERMISSIONS.MEMBERSHIP_MANAGE),
  validate(packSchema),
  membershipController.createPack
);
router.patch(
  "/packs/:id",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  requirePermission(PERMISSIONS.MEMBERSHIP_MANAGE),
  validate(idParam, "params"),
  validate(packUpdateSchema),
  membershipController.updatePack
);
router.delete(
  "/packs/:id",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  requirePermission(PERMISSIONS.MEMBERSHIP_MANAGE),
  validate(idParam, "params"),
  membershipController.deletePack
);

export default router;
