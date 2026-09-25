import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize, requirePermission } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import { ROLES, PERMISSIONS } from "../../constants/index.js";
import {
  idParam,
  createOrderSchema,
  payOrderSchema,
  couponSchema,
  listOrdersSchema,
} from "./order.validation.js";
import * as orderController from "./order.controller.js";

const router = Router();

// Admin: all orders / invoices
router.get(
  "/",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  requirePermission(PERMISSIONS.ORDER_READ),
  validate(listOrdersSchema, "query"),
  orderController.adminList
);

// My orders
router.get("/me", authenticate, validate(listOrdersSchema, "query"), orderController.mine);

// Create order (checkout)
router.post(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.ORDER_CREATE),
  validate(createOrderSchema),
  orderController.create
);

router.post("/validate-coupon", authenticate, validate(couponSchema), orderController.validateCoupon);

// Single order actions
router.get("/:id", authenticate, validate(idParam, "params"), orderController.getOne);
router.post("/:id/pay", authenticate, validate(idParam, "params"), validate(payOrderSchema), orderController.pay);
router.post("/:id/cancel", authenticate, validate(idParam, "params"), orderController.cancel);

export default router;
