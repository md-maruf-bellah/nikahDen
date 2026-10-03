/**
 * নোটিফিকেশন-চাইম থ্রটল — মডিউল-স্টেটের pure সিদ্ধান্ত (src/lib/notifSound.js)।
 *
 * সমস্যা: Navabar-এ NotificationBell দুইবার রেন্ডার হয় (ডেস্কটপ + মোবাইল ভার্সন) —
 * দুটিই socket "notification:new" পায়, তাই একই ইভেন্টে চাইম দু'বার বাজত। একই
 * notification-id বা CHIME_GAP_MS-এর মধ্যে কোনো চাইমই হয় না — একটাই ঘণ্টা।
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CHIME_GAP_MS,
  shouldPlayChime,
  playNotificationSound,
} from "../src/lib/notifSound.js";

const IDLE = { key: null, at: 0 };

describe("notif sound — মডিউল-লেভেল চাইম-থ্রটল", () => {
  it("প্রথম চাইম → বাজে (অবস্থা শূন্য)", () => {
    assert.equal(shouldPlayChime(1_000_000, "n1", IDLE), true);
  });

  it("একই notification-id আবার → বাজে না (দু NotificationBell একই payload পায়)", () => {
    const first = shouldPlayChime(1_000_000, "n1", IDLE);
    assert.equal(first, true);
    const after = { key: "n1", at: 1_000_000 };
    assert.equal(shouldPlayChime(1_000_100, "n1", after), false, "১০০ms পরেও দ্বিতীয় বেল চুপ");
    assert.equal(shouldPlayChime(1_999_999, "n1", after), false, "গ্যাপ-পরেও একই আইডি নতুন ইভেন্ট নয়");
  });

  it("ভিন্ন id কিন্তু গ্যাপের মধ্যে → বাজে না (ঘণ্টার বন্দুক)", () => {
    const last = { key: "n1", at: 1_000_000 };
    assert.equal(shouldPlayChime(1_000_000 + CHIME_GAP_MS - 1, "n2", last), false);
  });

  it("ভিন্ন id, ঠিক গ্যাপ-পার বা তার পরে → বাজে", () => {
    const last = { key: "n1", at: 1_000_000 };
    assert.equal(shouldPlayChime(1_000_000 + CHIME_GAP_MS, "n2", last), true);
    assert.equal(shouldPlayChime(1_000_000 + CHIME_GAP_MS + 5_000, "n2", last), true);
  });

  it("id-less (null) ডুপ → গ্যাপের মধ্যে বাজে না, গ্যাপের পরে বাজে", () => {
    const last = { key: null, at: 1_000_000 };
    assert.equal(shouldPlayChime(1_000_500, null, last), false);
    assert.equal(shouldPlayChime(1_000_000 + CHIME_GAP_MS, null, last), true);
    assert.equal(shouldPlayChime(1_000_500, undefined, IDLE), true, "প্রথমবার id ছাড়াও বাজে");
  });

  it("বাদ পড়লে উইন্ডো এগোয় না — শুধু আসল চাইমই সময় লেখে (starvation নয়)", () => {
    // n1 বাজলো t=0; n2 দুবার চেষ্টা (দুবারই বাদ) — তারপর n3 গ্যাপ পার হলেই বাজবে
    const t0 = 5_000_000;
    assert.equal(shouldPlayChime(t0, "n1", IDLE), true);
    const afterN1 = { key: "n1", at: t0 };
    assert.equal(shouldPlayChime(t0 + 100, "n2", afterN1), false);
    assert.equal(shouldPlayChime(t0 + 200, "n2", afterN1), false, "বাদ পড়লেও at এগোয় না");
    assert.equal(shouldPlayChime(t0 + CHIME_GAP_MS, "n3", afterN1), true);
  });

  it("window ছাড়া (node) playNotificationSound নীরব no-op — ক্র্যাশ নয়", () => {
    assert.doesNotThrow(() => playNotificationSound("n1"));
    assert.doesNotThrow(() => playNotificationSound());
  });
});
