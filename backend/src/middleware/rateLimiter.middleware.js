import rateLimit from "express-rate-limit";
import env from "../config/env.js";

const defaultKey = (req) => req.ip;

export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: defaultKey,
  message: { success: false, message: "Too many requests. Please try again later.", errorCode: "RATE_LIMITED" },
});

/** Stricter limiter for auth + public form endpoints. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${req.path}`,
  message: { success: false, message: "Too many attempts. Please try again later.", errorCode: "RATE_LIMITED" },
});

export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many messages. Please try again later.", errorCode: "RATE_LIMITED" },
});

export default apiLimiter;
