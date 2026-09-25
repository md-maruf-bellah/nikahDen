import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import biodataRoutes from "../modules/biodatas/biodata.routes.js";
import membershipRoutes from "../modules/membership/membership.routes.js";
import orderRoutes from "../modules/orders/order.routes.js";
import notificationRoutes from "../modules/notifications/notification.routes.js";
import messageRoutes from "../modules/messages/message.routes.js";
import contactRoutes from "../modules/contacts/contact.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { siteStats } from "../modules/admin/admin.service.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok", uptime: process.uptime() });
});

const API_V1 = Router();
API_V1.use("/auth", authRoutes);
API_V1.use("/users", userRoutes);
API_V1.use("/biodatas", biodataRoutes);
API_V1.use("/membership", membershipRoutes);
API_V1.use("/orders", orderRoutes);
API_V1.use("/notifications", notificationRoutes);
API_V1.use("/conversations", messageRoutes);
API_V1.use("/contacts", contactRoutes);
API_V1.use("/admin", adminRoutes);
// Public landing-page counters live under the API namespace too.
API_V1.get(
  "/site/stats",
  asyncHandler(async (_req, res) => {
    const stats = await siteStats();
    return sendSuccess(res, "Site statistics", stats);
  })
);

router.use("/api/v1", API_V1);

export default router;
