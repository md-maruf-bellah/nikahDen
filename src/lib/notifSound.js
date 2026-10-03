"use client";

/**
 * নোটিফিকেশন-সাউন্ড — WebAudio দিয়ে ছোট দুই-নোট বেল, কোনো অডিও-ফাইল নেই।
 *
 * ব্রাউজার-নীতি: ব্যবহারকারীর প্রথম ইন্টার‍্যাকশনের আগে অডিও ব্লকড থাকে —
 * তাই প্রথম pointerdown/keydown-এ AudioContext unlock করা হয়।
 * ব্যবহারকারী চুপ করাতে পারে (localStorage: nk_notif_sound = "0")।
 */

let ctx = null;
let unlocked = false;

/** মডিউল-লেভেল থ্রটল-অবস্থা — সব NotificationBell ইনস্ট্যান্স একই স্টেট শেয়ার করে */
let lastChime = { key: null, at: 0 };

/** টানা চাইমের ন্যূনতম গ্যাপ (ms) — দু বেল বা ঘণ্টার বন্দুক এড়াতে */
export const CHIME_GAP_MS = 1000;

/**
 * চাইম হবে কি না — pure সিদ্ধান্ত (unit-টেস্টেড, notif-sound.core.test.mjs)।
 * নিয়ম:
 *   ১. একই নোটিফিকেশন-আইডি (দু NotificationBell একই payload পায়) → সবসময় বাদ
 *   ২. আগের চাইমের CHIME_GAP_MS-এর মধ্যে → বাদ (id-less ডুপ + ঘণ্টার বন্দুক)
 * শুধু আসল চাইমেই অবস্থা আপডেট হয় — বাদ পড়লে উইন্ডো এগোয় না (starvation নয়)।
 * @param {number} nowMs
 * @param {string | null | undefined} key notification id (না থাকলে null)
 * @param {{key: string | null, at: number}} last শেষ চাইমের অবস্থা
 */
export function shouldPlayChime(nowMs, key, last) {
  if (key != null && last.key === key) return false;
  if (last.at && nowMs - last.at < CHIME_GAP_MS) return false;
  return true;
}

/** সাউন্ড চালু/বন্ধ (localStorage-স্থায়ী) */
export function isSoundEnabled() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("nk_notif_sound") !== "0";
}

export function setSoundEnabled(on) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("nk_notif_sound", on ? "1" : "0");
}

/** ব্যবহারকারী-ইন্টার‍্যাকশনে একবার unlock — পরের নোটিফিকেশনে সাউন্ড বাজবে */
export function ensureAudioUnlocked() {
  if (typeof window === "undefined" || unlocked) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    if (ctx.state === "suspended") ctx.resume();
    unlocked = ctx.state === "running";
  } catch {
    /* অডিও নেই — নীরব */
  }
}

if (typeof window !== "undefined") {
  const onFirstGesture = () => {
    ensureAudioUnlocked();
    if (unlocked) {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    }
  };
  window.addEventListener("pointerdown", onFirstGesture);
  window.addEventListener("keydown", onFirstGesture);
}

/**
 * ছোট দুই-নোট বেল — নতুন মেসেজ/গুরুত্বপূর্ণ নোটিফিকেশনে।
 * @param {string} [key] notification id — দু বেল একই id-তে একবাই বাজায় (মডিউল-থ্রটল)
 * সাউন্ড বন্ধ থাকলে বা অডিও unlock না হলে নীরব no-op (কোনো এরর নয়)।
 */
export function playNotificationSound(key) {
  if (!isSoundEnabled() || typeof window === "undefined") return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    if (ctx.state === "suspended") ctx.resume();
    if (ctx.state !== "running") return; // ব্যবহারকারী-ইন্টার‍্যাকশন হয়নি — নীরব

    const k = key ?? null;
    if (!shouldPlayChime(Date.now(), k, lastChime)) return; // দু বেলের ডুপ — একবাই বাজায়

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    gain.connect(ctx.destination);

    for (const [freq, at] of [[880, 0], [1174.7, 0.12]]) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(now + at);
      osc.stop(now + at + 0.5);
    }
    lastChime = { key: k, at: Date.now() };
  } catch {
    /* কখনো ক্র্যাশ নয় */
  }
}
