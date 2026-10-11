/**
 * ACCOUNT_LOCKED লকআউন্ট — লগইন ফর্মের UI সিদ্ধান্তের pure লজিক।
 *
 * ব্যাকএন্ড 429 { errorCode: "ACCOUNT_LOCKED", details: { retryAfterSeconds } }
 * পাঠায় (auth.service.js); এখানে সেটা বাংলা মেসেজ ও কাউন্টডাউন ফরম্যাটে রূপান্তর হয়।
 * UI-র রেন্ডার নয় — শুধু সিদ্ধান্ত ও ফরম্যাট, যাতে node:test-এ যাচাই করা যায়।
 */

/** ক্লিয়ার-ইফেক্ট শুধু এই মেসেজটুকু ধরে মুছবে (অন্য এরর অক্ষত)। */
export const LOCK_BANGLA_PREFIX = "অতিরিক্ত ভুল পাসওয়ার্ডচেষ্টার কারণে";

/**
 * লকের বাকি সেকেন্ড। আগে স্ট্রাকচার্ড details.retryAfterSeconds,
 * না থাকলে ব্যাকএন্ড মেসেজ ("…Try again in 900 seconds.") parse — ফলব্যাক।
 */
export function lockSecondsFromError(err) {
  // structured ফিল্ড present থাকলে সেটাই চূড়ান্ত (0 = আর লক নেই, মেসেজ ঘুরবে না);
  // অনুপস্থিত হলে (NaN) মেসেজ-ফলব্যাক।
  const structured = Number(err?.details?.retryAfterSeconds);
  if (Number.isFinite(structured)) return structured > 0 ? Math.ceil(structured) : 0;
  const match = /in (\d+) second/.exec(err?.message || "");
  if (match) return Number(match[1]);
  return 0;
}

/** শুধু 429 + ACCOUNT_LOCKED + অ-শূন্য সেকেন্ড হলেই লক UI। */
export function isAccountLocked(err) {
  return (
    err?.status === 429 &&
    err?.errorCode === "ACCOUNT_LOCKED" &&
    lockSecondsFromError(err) > 0
  );
}

/** 5 → "00:05", 65 → "01:05", 3661 → "1:01:01" (ঘণ্টা থাকলে H:MM:SS)। */
export function formatCountdown(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return hh > 0 ? `${hh}:${pad(mm)}:${pad(ss)}` : `${pad(mm)}:${pad(ss)}`;
}

/**
 * admin UI-র জন্য: ইউজার এখন লক আছে কিনা ও বাকি সেকেন্ড।
 * lockedUntil যেকোনো Date-parseable মান (ISO string/Date) — অচল বা মেয়াদোত্তীর্ণ → ০।
 */
export function lockedRemainingSeconds(lockedUntil, now = Date.now()) {
  if (!lockedUntil) return 0;
  const until = new Date(lockedUntil).getTime();
  if (!Number.isFinite(until)) return 0;
  return Math.max(0, Math.ceil((until - now) / 1000));
}

/** লক-বার্তা (কাউন্টডাউন UI-র পাশে আলাদা ব্যাজে টিক করে)। */
export function lockBanglaMessage() {
  return `${LOCK_BANGLA_PREFIX} আপনার অ্যাকাউন্টটি সুরক্ষার জন্য সাময়িকভাবে লক করা হয়েছে। কাউন্টডাউন শেষ না হওয়া পর্যন্ত অপেক্ষা করুন।`;
}
