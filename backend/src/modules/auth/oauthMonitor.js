/**
 * OAuth monitoring — start/callback/exchange-এর সাফল্য-ব্যর্যতার হালকা ইন-প্রসেস হিসাব।
 *
 * কী রেকর্ড হয়:
 *   start / start_failed            — প্রোভাইডারে রিডাইরেক্ট (503/404 ব্যর্যতাসহ)
 *   provider_denied                 — ইউজার consent ফিরিয়ে দিয়েছে
 *   state_failed                    — CSRF state ব্যর্য (tamper/expired/replay)
 *   exchange_failed                 — handoff কোড ভোগ ব্যর্য (ভুয়া/পুরনো/রিপ্লে)
 *   exchange_success / login_success— সফল লগইন
 *   rate_limited                    — limiter 429 দিয়েছে
 *   failure_blocked                 — fail2ban guard ব্লকড IP-এর চেষ্টা ফেরত দিয়েছে
 *
 * প্রতিটি ব্যর্যতা console.warn-এও যায় (`[oauth] ...`) — যাতে server log থেকে
 * abuse-এর প্যাটার্ন (IP + error code) দেখা যায়। কাউন্টার admin
 * GET /admin/stats-এর `oauth` ফিল্ডে দেখা যায়।
 *
 * ডেটা শুধু কাউন্টার + শেষ ৫০টি ইভেন্ট — কোনো PII (token/email) রাখা হয় না।
 */
import { ROLES } from "../../constants/index.js";

const MAX_RECENT_EVENTS = 50;

const counts = {
  start: 0,
  start_failed: 0,
  provider_denied: 0,
  state_failed: 0,
  exchange_failed: 0,
  exchange_success: 0,
  login_success: 0,
  rate_limited: 0,
  failure_blocked: 0,
};

const recent = [];

function push(event, detail) {
  const entry = { event, ...detail, at: new Date().toISOString() };
  recent.push(entry);
  if (recent.length > MAX_RECENT_EVENTS) recent.shift();
  return entry;
}

export function recordOAuthEvent(event, detail = {}) {
  if (!(event in counts)) return null;
  counts[event] += 1;
  const entry = push(event, detail);
  if (event !== "start" && event !== "exchange_success" && event !== "login_success") {
    // ব্যর্যতা/অগ্রাধিকার ইভেন্ট warning হিসেবে — success গুলো শুধু গোনা হয়
    console.warn(`[oauth] ${event} ip=${detail.ip || "?"} provider=${detail.provider || "-"}${detail.errorCode ? " code=" + detail.errorCode : ""}`);
  }
  return entry;
}

export function recordOAuthRateLimited(detail = {}) {
  return recordOAuthEvent("rate_limited", detail);
}

export function oauthMonitorStats() {
  return {
    counts: { ...counts },
    totalFailed:
    counts.start_failed +
    counts.provider_denied +
    counts.state_failed +
    counts.exchange_failed +
    counts.rate_limited +
    counts.failure_blocked,
    recentEvents: [...recent].reverse(), // নতুনগুলো আগে
  };
}

/** শুধু কাউন্টার (recent বাদে) — admin dashboard-এর stats-এ যুক্ত হয় */
export function oauthCountersForAdmin() {
  return { counts: { ...counts }, totalFailed: oauthMonitorStats().totalFailed };
}

export function resetOAuthMonitorForTests() {
  for (const k of Object.keys(counts)) counts[k] = 0;
  recent.length = 0;
}

/** SUPERADMIN/ADMIN-ই মনিটর ডেটা দেখবে (route-এ authorize দিয়েও আটকানো) */
export const OAUTH_MONITOR_ADMIN_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN];
