import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize, requirePermission } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import { contactLimiter } from "../../middleware/rateLimiter.middleware.js";
import { ROLES, PERMISSIONS } from "../../constants/index.js";
import {
  createContactSchema,
  updateContactSchema,
  listContactsSchema,
  idParam,
} from "./contact.validation.js";
import * as contactController from "./contact.controller.js";

const router = Router();

// Public contact form
router.post("/", contactLimiter, validate(createContactSchema), contactController.create);

// Staff inbox
router.use(authenticate, authorize(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.EDITOR));

router.get(
  "/",
  requirePermission(PERMISSIONS.CONTACT_READ),
  validate(listContactsSchema, "query"),
  contactController.list
);
router.get(
  "/:id",
  requirePermission(PERMISSIONS.CONTACT_READ),
  validate(idParam, "params"),
  contactController.getOne
);
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.CONTACT_MANAGE),
  validate(idParam, "params"),
  validate(updateContactSchema),
  contactController.update
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.CONTACT_MANAGE),
  validate(idParam, "params"),
  contactController.remove
);

export default router;
