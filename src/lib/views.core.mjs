/**
 * Core helper functions for Profile Views & Notification Deep Linking
 */

export function resolveNotificationTarget(notification) {
  if (!notification) return "/profile?tab=notification";

  const data = notification.data || {};
  const bioId = data.viewerBiodataId || data.likerBiodataId || (data.kind === "biodata" ? data.id : null);
  if (bioId) {
    return `/details?id=${bioId}`;
  }

  if (data.targetTab) {
    return `/profile?tab=${data.targetTab}`;
  }

  return "/profile?tab=notification";
}

export function resolveProfileTabKey(tabQuery) {
  if (!tabQuery) return "dashboard";
  const normalized = String(tabQuery).trim().toLowerCase();

  const ALIASES = {
    profileviews: "profileViews",
    views: "profileViews",
    "কারা দেখেছেন": "profileViews",
    wholikedyou: "whoLikedYou",
    "আপনাকে যারা পছন্দ করেছেন": "whoLikedYou",
    notification: "notification",
    notifications: "notification",
    "নোটিফিকেশন": "notification",
    biodata: "biodata",
    "বায়োডাটা": "biodata",
    favorites: "favorites",
    "পছন্দের তালিকা": "favorites",
    preferences: "preferences",
    membership: "membership",
    message: "message",
    messages: "message",
    blocked: "blocked",
    privacy: "privacy",
    dashboard: "dashboard",
  };

  return ALIASES[normalized] || ALIASES[tabQuery] || "dashboard";
}

export function formatViewCount(count, lang = "bn") {
  const num = Number(count) || 0;
  if (lang === "en") {
    return `${num} ${num === 1 ? "time" : "times"}`;
  }
  return `${num.toLocaleString("bn-BD")} বার`;
}
