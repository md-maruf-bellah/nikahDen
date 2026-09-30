import rateLimit from "express-rate-limit";
import env from "../config/env.js";

const defaultKey = (req) => req.ip;

/**
 * পড়া-শুধু ট্রাফিক মেপা হয় না লেখার বাকেটে — GET/OPTIONS মোটেই apiLimiter-এ
 * গোনা হয় না (নিচের readLimiter তাদের নিজস্ব উদার বাকেটে গোনে)। এতে
 * লগইন/লেখা-নির্ভর অ্যাটাক-সারফেস আগের মতোই কঠোর, অথচ স্বাভাবিক ব্রাউজিংয়ে
 * (এক পেজ = অনেক GET) 429 আসে না।
 */
const isReadOnly = (req) =>
  req.method === "OPTIONS" ||
  (req.method === "GET" && (req.path === "/" || req.path.startsWith("/")));

export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: defaultKey,
  skip: isReadOnly,
  message: { success: false, message: "Too many requests. Please try again later.", errorCode: "RATE_LIMITED" },
});

/** উদার বাকেট — শুধু GET/OPTIONS (read-only) ট্রাফিক, আলাদা কাউন্টারে। */
export const readLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_READ_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: defaultKey,
  skip: (req) => req.method !== "OPTIONS" && req.method !== "GET",
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

export default { apiLimiter, readLimiter, authLimiter, contactLimiter };
