/**
 * OAuth ব্যর্থ-চেষ্টা ব্লকার (fail2ban-স্টাইল)।
 *
 * oauthLimiter প্রতিটি request গোনে — সফল/ব্যর্থ দেখে না। এটি শুধু *ব্যর্থ* চেষ্টা
 * গোনে: state tamper/replay, ভুয়া বা রিপ্লে করা exchange কোড, অজানা প্রোভাইডার
 * প্রোবিং। নির্দিষ্ট window-এ OAUTH_FAILURE_LIMIT-এর বেশি ব্যর্থতা হলে সেই IP
 * সব OAuth এন্ডপয়েন্টে (start/callback/exchange) OAUTH_FAILURE_BLOCK_MS সময়ের
 * জন্য 429 পায় — হ্যান্ডলারে ঢুকতেই পারে না।
 *
 * সফল লগইন/exchange হলে ওই IP-এর কাউন্টার মুছে যায় — মাঝে মাঝে ভুল করা সাধারণ
 * ইউজার আটকায় না; অন্যদিকে ধারাবাহিক attacker দ্রুত ব্লক হয়।
 *
 * ইন-প্রসেস Map (oauthMonitor-এর মতোই) — সিঙ্গেল-ইনস্ট্যান্স ডিপ্লয়মেন্টে যথেষ্ট;
 * multi-instance হলে Redis-এ সরাতে হবে। কোনো PII রাখা হয় না (শুধু IP + কাউন্ট)।
 */
import env from "../config/env.js";
import { recordOAuthEvent } from "../modules/auth/oauthMonitor.js";

// mutable — টেস্টে সরাসরি ওভাররাইড করা যায় (env import-time স্ন্যাপশট)
export const failureGuardConfig = {
  limit: env.OAUTH_FAILURE_LIMIT || 5,
  windowMs: env.OAUTH_FAILURE_WINDOW_MS || 15 * 60 * 1000,
  blockMs: env.OAUTH_FAILURE_BLOCK_MS || 15 * 60 * 1000,
};

// ip → { count, firstAt, blockedUntil, lastError }
const failures = new Map();
const MAX_TRACKED_IPS = 5000; // মেমোরি-সেফটি: এর বেশি হলে পুরনো/মেয়াদোত্তীর্ণ এন্ট্রি ঝাড়াই

function prune(now) {
  if (failures.size < MAX_TRACKED_IPS) return;
  for (const [ip, e] of failures) {
    if (e.blockedUntil <= now && now - e.firstAt > failureGuardConfig.windowMs) failures.delete(ip);
  }
}

/** একটি ব্যর্থ চেষ্টা রেকর্ড করে; থ্রেশহোল্ড ছুঁলে ব্লক শুরু + warning লগ। */
export function recordOAuthFailure(ip, errorCode = "UNKNOWN") {
  const now = Date.now();
  prune(now);
  let entry = failures.get(ip);
  if (!entry || now - entry.firstAt > failureGuardConfig.windowMs) {
    entry = { count: 0, firstAt: now, blockedUntil: 0, lastError: "" };
  }
  entry.count += 1;
  entry.lastError = errorCode;
  let blocked = false;
  if (entry.count >= failureGuardConfig.limit) {
    entry.blockedUntil = now + failureGuardConfig.blockMs;
    blocked = true;
    console.warn(
      `[oauth] failure threshold crossed — ip=${ip} blocked for ${Math.round(failureGuardConfig.blockMs / 60000)}min ` +
        `after ${entry.count} failures in ${Math.round(failureGuardConfig.windowMs / 60000)}min window (last=${errorCode})`,
    );
  }
  failures.set(ip, entry);
  return { blocked, count: entry.count };
}

/** এই IP এখন ব্লকড কি না (guard middleware প্রতিটি OAuth রিকোয়েস্টে জিজ্ঞেস করে)। */
export function isOAuthFailureBlocked(ip) {
  const entry = failures.get(ip);
  return Boolean(entry && entry.blockedUntil > Date.now());
}

/** ব্লক চলাকালীন বাকি সময় (ms) — Retry-After হেডারের জন্য। */
export function oauthBlockRemainingMs(ip) {
  const entry = failures.get(ip);
  return entry ? Math.max(0, entry.blockedUntil - Date.now()) : 0;
}

/** সফল লগইন/exchange — এই IP-এর ব্যর্থতা-কাউন্টার মুছে দেয়। */
export function clearOAuthFailures(ip) {
  failures.delete(ip);
}

export function resetOAuthFailureGuardForTests() {
  failures.clear();
}

/** test helper — এই মুহূর্তে ব্লকড IP-গুলোর তালিকা */
export function oauthBlockedIpsForTests() {
  const now = Date.now();
  return [...failures.entries()].filter(([, e]) => e.blockedUntil > now).map(([ip]) => ip);
}

/**
 * Express middleware — প্রতিটি OAuth রুটে limiter-এর আগে বসে।
 * ব্লকড IP-কে হ্যান্ডলারে ঢুকতে দেয় না; প্রতিটি ব্লকড চেষ্টা monitor-এ যায়।
 */
export function oauthFailureGuard(req, res, next) {
  if (!isOAuthFailureBlocked(req.ip)) return next();
  const remainingSec = Math.ceil(oauthBlockRemainingMs(req.ip) / 1000);
  recordOAuthEvent("failure_blocked", { ip: req.ip, path: req.path, errorCode: "OAUTH_FAILURE_BLOCKED" });
  return res
    .status(429)
    .set("Retry-After", String(remainingSec))
    .json({
      success: false,
      message: "Too many failed attempts. Please try again later.",
      errorCode: "RATE_LIMITED",
    });
}
