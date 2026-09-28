import { Router } from "express";
import { validate } from "../../middleware/validation.middleware.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authLimiter } from "../../middleware/rateLimiter.middleware.js";
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
// start + callback ব্রাউজার-রিডাইরেক্ট; rate-limit রাখা হয়েছে abuse-এর বিরুদ্ধে
router.get("/oauth/:provider/start", authLimiter, authController.oauthStart);
router.get("/oauth/:provider/callback", authLimiter, authController.oauthCallback);
// frontend one-time code → tokens
router.post("/oauth/exchange", authLimiter, authController.oauthExchange);

export default router;
