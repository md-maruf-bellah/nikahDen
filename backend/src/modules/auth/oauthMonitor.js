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
import OauthEvent, { OAUTH_EVENT_CAP, ensureOauthEventCapped } from "../../models/oauthEvent.model.js";

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
  persistOAuthEvent(event, detail);
  return entry;
}

/**
 * প্রতিটি ইভেন্ট Mongo capped collection-এও লেখা হয় (fire-and-forget) —
 * রিস্টার্টের পরেও abuse-হিস্ট্রি থাকে। ব্যর্যতা মূল রিকোয়েস্টে বাধা দেয় না:
 * মনিটরিং লেখা ফেল করলে শুধু লগে যায়।
 */
function persistOAuthEvent(event, { ip, provider, errorCode, path } = {}) {
  OauthEvent.create({ event, ip: ip ?? "", provider: provider ?? "", errorCode: errorCode ?? "", path: path ?? "" })
    .catch((err) => console.error("[oauth] event persist failed:", err.message));
}

/** পারসিস্টেড হিস্ট্রি — admin GET /admin/oauth/events (নতুনগুলো আগে)। */
export async function recentOAuthEventsFromDb({ limit = 100, event, ip } = {}) {
  await ensureOauthEventCapped();
  const filter = {};
  if (event) filter.event = event;
  if (ip) filter.ip = ip;
  return OauthEvent.find(filter).sort({ $natural: -1 }).limit(Math.min(limit, 500)).lean();
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

/**
 * টেস্টে capped collection পরিষ্কার — capped-এ deleteMany নিষিদ্ধ, তাই drop → recreate।
 * await করে ব্যবহার করতে হয় (fire-and-forget করলে লেখার সাথে রেস করে)।
 */
export async function clearOAuthEventsForTests() {
  const conn = (await import("mongoose")).default.connection;
  if (conn.readyState !== 1 || !conn.db) return;
  const names = await conn.db.listCollections({ name: "oauth_events" }).toArray();
  if (names.length > 0) await conn.dropCollection("oauth_events");
  // ড্রপের পর প্রথম insert কালেকশন non-capped হিসেবে বানাতে পারে —
  // তাই সাথে সাথেই সঠিক ক্যাপ অপশনে recreate
  await conn.createCollection("oauth_events", { capped: true, ...OAUTH_EVENT_CAP });
}

