/**
 * OAuth এন্ডপয়েন্টের নিজস্ব, কড়া রেট-লিমিটার।
 *
 * authLimiter (২০/১৫ মিনিট) এর চেয়ে কড়া — exchange-এর মতো token-minting
 * এন্ডপয়েন্ট brute-force করা কঠিন করতে:
 *   /start ও /callback — ১০ / ১৫ মিনিট / IP
 *   /exchange          — ১০ / ১৫ মিনিট / IP
 *
 * 429 দিলে সেটাও monitor-এ `rate_limited` ইভেন্ট হিসেবে গোনা হয়।
 */
import rateLimit from "express-rate-limit";
import env from "../config/env.js";
import { recordOAuthRateLimited } from "../modules/auth/oauthMonitor.js";

const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.OAUTH_RATE_LIMIT_MAX || 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${req.path}`,
  handler: (req, res) => {
    recordOAuthRateLimited({ ip: req.ip, path: req.path });
    res.status(429).json({
      success: false,
      message: "Too many attempts. Please try again later.",
      errorCode: "RATE_LIMITED",
    });
  },
});

export default oauthLimiter;
