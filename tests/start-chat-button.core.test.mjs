import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveGuardReason,
  isOwnOrMissing,
  buildChatTargets,
  REASON_LABELS,
  DISABLED_FALLBACK_TITLE,
} from "../src/components/StartChatButton.core.mjs";

/**
 * StartChatButton-এর কারণ-লেবেল ম্যাপিং — React ছাড়াই টেস্টেড।
 * কম্পোনেন্টের আচরণ: canMessage:false হলে নিষ্ক্রিয় + কারণ-টেক্সট;
 * কারণ অজানা হলে fallback title; আইকন কম্পোনেন্টে — এখানে iconKey।
 */
describe("start-chat-button core — resolveGuardReason", () => {
  it("blocked → নিষ্ক্রিয়, 'মেসেজিং সম্ভব নয়' (ban আইকন)", () => {
    const r = resolveGuardReason({ canMessage: false, blocked: true, reason: "WHATEVER" });
    assert.equal(r.disabled, true);
    assert.deepEqual(r.reason, { iconKey: "ban", text: "মেসেজিং সম্ভব নয়" });
    assert.equal(r.title, "মেসেজিং সম্ভব নয়");
  });

  it("blocked, reason-এর চেয়ে প্রাধান্য পায়", () => {
    const r = resolveGuardReason({ canMessage: false, blocked: true, reason: "LIMIT_REACHED" });
    assert.equal(r.reason.text, "মেসেজিং সম্ভব নয়", "blocked থাকলে LIMIT_REACHED লেবেল দেখানো হয় না");
  });

  it("LIMIT_REACHED → 'সীমা শেষ — ম্যাচ বা আপগ্রেড' (shield-check)", () => {
    const r = resolveGuardReason({ canMessage: false, blocked: false, reason: "LIMIT_REACHED" });
    assert.deepEqual(r.reason, { iconKey: "shield-check", text: "সীমা শেষ — ম্যাচ বা আপগ্রেড" });
    assert.equal(r.title, "সীমা শেষ — ম্যাচ বা আপগ্রেড");
  });

  it("UPGRADE_REQUIRED → 'প্যাকেজ আপগ্রেড দরকার' (credit-card)", () => {
    const r = resolveGuardReason({ canMessage: false, reason: "UPGRADE_REQUIRED" });
    assert.deepEqual(r.reason, { iconKey: "credit-card", text: "প্যাকেজ আপগ্রেড দরকার" });
  });

  it("NO_PACKAGE → একই 'প্যাকেজ আপগ্রেড দরকার' লেবেল", () => {
    const r = resolveGuardReason({ canMessage: false, reason: "NO_PACKAGE" });
    assert.deepEqual(r.reason, { iconKey: "credit-card", text: "প্যাকেজ আপগ্রেড দরকার" });
  });

  it("canMessage:true → সক্রিয়, কোনো কারণ/title নেই", () => {
    const r = resolveGuardReason({ canMessage: true, blocked: false, reason: null });
    assert.deepEqual(r, { disabled: false, reason: null, title: null });
  });

  it("preview null (লোড হয়নি/গেস্ট) → সক্রিয় বোতাম", () => {
    assert.deepEqual(resolveGuardReason(null), { disabled: false, reason: null, title: null });
  });

  it("canMessage অনুপস্থিত → সক্রিয় (undefined !== false)", () => {
    const r = resolveGuardReason({ blocked: false });
    assert.equal(r.disabled, false);
  });

  it("canMessage:false + অজানা reason (যেমন PENDING) → fallback title, reason null", () => {
    const r = resolveGuardReason({ canMessage: false, blocked: false, reason: "PENDING" });
    assert.equal(r.disabled, true);
    assert.equal(r.reason, null, "অজানা কারণে আইকন/টেক্সট নেই — শুধু fallback title");
    assert.equal(r.title, DISABLED_FALLBACK_TITLE);
    assert.equal(DISABLED_FALLBACK_TITLE, "মেসেজিং সম্ভব নয়");
  });

  it("canMessage:false + reason null → fallback title", () => {
    const r = resolveGuardReason({ canMessage: false, reason: null });
    assert.equal(r.reason, null);
    assert.equal(r.title, "মেসেজিং সম্ভব নয়");
  });

  it("REASON_LABELS-এর সব আইকন-কী কম্পোনেন্টের ICONS ম্যাপে থাকতে হবে", () => {
    // কম্পোনেন্টের চুক্তি: প্রতিটা iconKey-এর lucide আইকন আছে — কী-সেট এক রাখা জরুরি
    assert.deepEqual(
      Object.keys(REASON_LABELS).sort(),
      ["LIMIT_REACHED", "NO_PACKAGE", "UPGRADE_REQUIRED", "blocked"],
    );
    for (const { iconKey, text } of Object.values(REASON_LABELS)) {
      assert.equal(typeof iconKey, "string");
      assert.ok(text.length > 0);
    }
  });
});

describe("start-chat-button core — isOwnOrMissing", () => {
  it("নিজের আইডি → true (বোতাম লুকানো)", () => {
    assert.equal(isOwnOrMissing("u1", "u1"), true);
  });

  it("অন্যের আইডি → false", () => {
    assert.equal(isOwnOrMissing("u2", "u1"), false);
  });

  it("userId নেই → true (রেন্ডার-ই হবে না)", () => {
    assert.equal(isOwnOrMissing(null, "u1"), true);
    assert.equal(isOwnOrMissing(undefined, "u1"), true);
  });

  it("গেস্ট (user null) + বৈধ userId → false (বোতাম দেখায়, ক্লিকে লগইনে)", () => {
    assert.equal(isOwnOrMissing("u2", undefined), false);
    assert.equal(isOwnOrMissing("u2", null), false);
  });
});

describe("start-chat-button core — buildChatTargets", () => {
  it("chatPath: মেসেজিং ট্যাব এনকোডেড, chat=<userId>", () => {
    const { chatPath } = buildChatTargets("u9");
    assert.ok(chatPath.startsWith("/profile?tab="), "ট্যাব-প্যারাম আগে");
    assert.ok(chatPath.endsWith("&chat=u9"));
    const tab = new URLSearchParams(chatPath.split("?")[1]).get("tab");
    assert.equal(tab, "মেসেজিং", "ডিকোড করলে বাংলা ট্যাব-নাম ফিরে আসে");
  });

  it("loginPath: next= পুরো chatPath আবার এনকোড করে (কুয়েরি-ভেতরে-কুয়েরি)", () => {
    const { chatPath, loginPath } = buildChatTargets("u9");
    assert.ok(loginPath.startsWith("/login?next="));
    assert.ok(!loginPath.includes("chat=u9"), "ভেতরের পথ কাঁচা থাকে না — ডাবল-এনকোডড");
    assert.equal(decodeURIComponent(loginPath.slice("/login?next=".length)), chatPath);
  });
});
