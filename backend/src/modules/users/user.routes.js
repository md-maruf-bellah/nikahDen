import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize, requirePermission } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import { uploadAvatar } from "../../middleware/upload.middleware.js";
import {
  PERMISSIONS,
  ROLES,
} from "../../constants/index.js";
import {
  idParam,
  updateProfileSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,
  listUsersSchema,
} from "./user.validation.js";
import * as userController from "./user.controller.js";

const router = Router();

// -------------------- Self --------------------
router.get("/me", authenticate, userController.getMyProfile);
router.patch("/me", authenticate, validate(updateProfileSchema), userController.updateMyProfile);
router.post("/me/avatar", authenticate, uploadAvatar, userController.uploadMyAvatar);
router.get("/me/dashboard", authenticate, userController.myDashboard);

// -------------------- Admin (staff only) --------------------
router.get(
  "/",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.EDITOR),
  requirePermission(PERMISSIONS.USER_READ),
  validate(listUsersSchema, "query"),
  userController.listUsers
);

router.post(
  "/",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  requirePermission(PERMISSIONS.USER_CREATE),
  validate(adminCreateUserSchema),
  userController.createUser
);

router.get(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.EDITOR),
  requirePermission(PERMISSIONS.USER_READ),
  validate(idParam, "params"),
  userController.getUser
);

router.patch(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  requirePermission(PERMISSIONS.USER_UPDATE),
  validate(idParam, "params"),
  validate(adminUpdateUserSchema),
  userController.updateUser
);

router.delete(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  requirePermission(PERMISSIONS.USER_DELETE),
  validate(idParam, "params"),
  userController.deleteUser
);

export default router;
