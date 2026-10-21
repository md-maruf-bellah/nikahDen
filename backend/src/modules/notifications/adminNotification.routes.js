import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { ROLES } from "../../constants/index.js";
import * as controller from "./adminNotification.controller.js";

const router = Router();

const staffGuard = [authenticate, authorize(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.EDITOR)];
const adminOnlyGuard = [authenticate, authorize(ROLES.ADMIN, ROLES.SUPERADMIN)];

router.get("/", staffGuard, controller.listAdminNotifications);
router.patch("/read-all", staffGuard, controller.markAllRead);
router.patch("/:id/read", staffGuard, controller.markRead);
router.delete("/:id", staffGuard, controller.deleteNotification);
router.delete("/", adminOnlyGuard, controller.clearAllNotifications);

export default router;
