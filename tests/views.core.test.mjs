import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveNotificationTarget, resolveProfileTabKey, formatViewCount } from "../src/lib/views.core.mjs";

describe("profile views & notification deep link helpers", () => {
  it("resolves direct link to viewer biodata if viewerBiodataId exists", () => {
    const notif = {
      title: "বায়োডাটা দর্শন",
      data: { viewerBiodataId: "bio-123", type: "BIODATA_VIEW" },
    };
    assert.equal(resolveNotificationTarget(notif), "/details?id=bio-123");
  });

  it("resolves direct link to liker biodata if likerBiodataId exists", () => {
    const notif = {
      title: "নতুন লাইক",
      data: { likerBiodataId: "bio-456", id: "bio-456" },
    };
    assert.equal(resolveNotificationTarget(notif), "/details?id=bio-456");
  });

  it("resolves targetTab if provided in notification data", () => {
    const notif = {
      title: "নতুন বার্তা",
      data: { targetTab: "message" },
    };
    assert.equal(resolveNotificationTarget(notif), "/profile?tab=message");
  });

  it("falls back to /profile?tab=notification if no id or targetTab exists", () => {
    assert.equal(resolveNotificationTarget(null), "/profile?tab=notification");
    assert.equal(resolveNotificationTarget({}), "/profile?tab=notification");
    assert.equal(resolveNotificationTarget({ data: {} }), "/profile?tab=notification");
  });

  it("resolves tab aliases accurately", () => {
    assert.equal(resolveProfileTabKey("profileViews"), "profileViews");
    assert.equal(resolveProfileTabKey("views"), "profileViews");
    assert.equal(resolveProfileTabKey("কারা দেখেছেন"), "profileViews");
    assert.equal(resolveProfileTabKey("whoLikedYou"), "whoLikedYou");
    assert.equal(resolveProfileTabKey("আপনাকে যারা পছন্দ করেছেন"), "whoLikedYou");
    assert.equal(resolveProfileTabKey("notification"), "notification");
    assert.equal(resolveProfileTabKey("নোটিফিকেশন"), "notification");
  });

  it("formats view counts in Bengali and English properly", () => {
    assert.equal(formatViewCount(1, "en"), "1 time");
    assert.equal(formatViewCount(5, "en"), "5 times");
    assert.equal(formatViewCount(3, "bn"), "৩ বার");
  });
});
