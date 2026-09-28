import { Router } from "express";
import { validate } from "../../middleware/validation.middleware.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authLimiter } from "../../middleware/rateLimiter.middleware.js";
import oauthLimiter from "../../middleware/oauthLimiter.middleware.js";
import { oauthFailureGuard } from "../../middleware/oauthFailureGuard.middleware.js";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validation.js";
import * as authController from "./auth.controller.js";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh", authLimiter, validate(refreshSchema), authController.refresh);
router.post("/logout", authLimiter, authController.logout);

router.get("/me", authenticate, authController.me);
router.patch("/change-password", authenticate, validate(changePasswordSchema), authController.changePassword);

router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), authController.resetPassword);

// ---- OAuth (Google / Facebook) ----
// GET /auth/oauth/providers → { google: true/false, facebook: true/false } (public)
router.get("/oauth/providers", authController.oauthProviders);
// oauthFailureGuard — fail2ban: window-এ OAUTH_FAILURE_LIMIT ব্যর্থ চেষ্টা হলে IP ব্লক;
// ব্লকড IP হ্যান্ডলারে ঢুকতেই পারে না। start + callback ব্রাউজার-রিডাইরেক্ট —
// কড়া লিমিট (১০/১৫ মিনিট)।
router.get("/oauth/:provider/start", oauthFailureGuard, oauthLimiter, authController.oauthStart);
router.get("/oauth/:provider/callback", oauthFailureGuard, oauthLimiter, authController.oauthCallback);
// frontend one-time code → tokens — token-minting, তাই সবচেয়ে কড়া লিমিট
router.post("/oauth/exchange", oauthFailureGuard, oauthLimiter, authController.oauthExchange);

export default router;
