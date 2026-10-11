/**
 * লগইন ACCOUNT_LOCKED লকআউন্ট UI-র pure লজিক (src/lib/login-lockout.core.mjs):
 *   • 429 এরর থেকে লক-সেকেন্ড বের করা (স্ট্রাকচার্ড details, মেসেজ-ফলব্যাক)
 *   • কাউন্টডাউন ফরম্যাট MM:SS / H:MM:SS
 *   • বাংলা মেসেজ + লক শনাক্তকরণ শুধু 429/ACCOUNT_LOCKED-এ
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LOCK_BANGLA_PREFIX,
  formatCountdown,
  isAccountLocked,
  lockBanglaMessage,
  lockSecondsFromError,
  lockedRemainingSeconds,
} from "../src/lib/login-lockout.core.mjs";

const locked429 = (details, message = "Try again in 900 seconds.") => ({
  status: 429,
  errorCode: "ACCOUNT_LOCKED",
  message,
  details,
});

describe("লগইন লক কাউন্টডাউন (ACCOUNT_LOCKED)", () => {
  it("স্ট্রাকচার্ড details.retryAfterSeconds থেকে সেকেন্ড নেয় (float হলে ceil)", () => {
    assert.equal(lockSecondsFromError(locked429({ retryAfterSeconds: 900 })), 900);
    assert.equal(lockSecondsFromError(locked429({ retryAfterSeconds: 0.4 })), 1);
  });

  it("details না থাকলে ব্যাকএন্ড মেসেজ parse — singular/plural দুটোই", () => {
    assert.equal(lockSecondsFromError(locked429(undefined, "Try again in 900 seconds.")), 900);
    assert.equal(lockSecondsFromError(locked429(undefined, "Try again in 1 second.")), 1);
  });

  it("লক-বাইরের এরর বা খালি এরর → ০", () => {
    assert.equal(lockSecondsFromError({ status: 401, errorCode: "INVALID_CREDENTIALS" }), 0);
    assert.equal(lockSecondsFromError(null), 0);
    assert.equal(lockSecondsFromError({ status: 429, errorCode: "ACCOUNT_LOCKED", details: {} }), 0);
  });

  it("isAccountLocked শুধু 429 + ACCOUNT_LOCKED + অ-শূন্য সেকেন্ডে সত্য", () => {
    assert.equal(isAccountLocked(locked429({ retryAfterSeconds: 60 })), true);
    assert.equal(isAccountLocked({ status: 401, errorCode: "INVALID_CREDENTIALS" }), false);
    assert.equal(isAccountLocked({ status: 429, errorCode: "RATE_LIMITED", details: { retryAfterSeconds: 10 } }), false);
    assert.equal(isAccountLocked(locked429({ retryAfterSeconds: 0 })), false);
  });

  it("formatCountdown: MM:SS, ঘণ্টা থাকলে H:MM:SS, ঋণাত্মক নয়", () => {
    assert.equal(formatCountdown(0), "00:00");
    assert.equal(formatCountdown(5), "00:05");
    assert.equal(formatCountdown(65), "01:05");
    assert.equal(formatCountdown(599), "09:59");
    assert.equal(formatCountdown(3661), "1:01:01");
    assert.equal(formatCountdown(-3), "00:00");
  });

  it("lockedRemainingSeconds (admin): ভবিষ্যতের লক → বাকি সেকেন্ড, মেয়াদ/খালি/অচল → ০", () => {
    const now = Date.parse("2026-01-01T00:00:00Z");
    assert.equal(lockedRemainingSeconds("2026-01-01T00:15:00Z", now), 900);
    assert.equal(lockedRemainingSeconds(new Date(now + 5000), now), 5);
    assert.equal(lockedRemainingSeconds("2025-12-31T23:59:00Z", now), 0, "মেয়াদোত্তীর্ণ");
    assert.equal(lockedRemainingSeconds(null, now), 0);
    assert.equal(lockedRemainingSeconds("not-a-date", now), 0);
  });

  it("বাংলা মেসেজ — LOCK_BANGLA_PREFIX দিয়ে শুরু (ক্লিয়ার-ইফেক্ট এটাই ধরে)", () => {
    const msg = lockBanglaMessage();
    assert.ok(msg.startsWith(LOCK_BANGLA_PREFIX), "প্রিফিক্স মিলছে");
    assert.ok(msg.includes("লক করা হয়েছে"), "লকের কথা আছে");
  });
});
