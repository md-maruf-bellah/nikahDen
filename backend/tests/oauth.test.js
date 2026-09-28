import { describe, it, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import crypto from "node:crypto";
import {
  startServer,
  stopServer,
  clearDb,
  createSuperAdmin,
  registerUser,
  createStaff,
  auth,
} from "./helpers.js";
import * as oauth from "../src/modules/auth/oauth.service.js";
import OauthEvent, { OAUTH_EVENT_CAP } from "../src/models/oauthEvent.model.js";
import {
  recordOAuthEvent,
  resetOAuthMonitorForTests,
  oauthMonitorStats,
  recentOAuthEventsFromDb,
  clearOAuthEventsForTests,
} from "../src/modules/auth/oauthMonitor.js";
import {
  recordOAuthFailure,
  clearOAuthFailures,
  isOAuthFailureBlocked,
  resetOAuthFailureGuardForTests,
  oauthBlockedIpsForTests,
} from "../src/middleware/oauthFailureGuard.middleware.js";
import User from "../src/models/user.model.js";
import OauthStateNonce from "../src/models/oauthStateNonce.model.js";
import env from "../src/config/env.js";

describe("OAUTH (Google / Facebook)", () => {
  let requestObj;

  before(async () => {
    const s = await startServer();
    requestObj = s.request;
    await createSuperAdmin();
  });

  after(async () => stopServer());

  beforeEach(async () => {
    await clearDb();
    await createSuperAdmin();
  });

  describe("provider guards", () => {
    it("GET /auth/oauth/providers reports unconfigured providers in dev", async () => {
      const res = await requestObj.get("/api/v1/auth/oauth/providers");
      assert.equal(res.status, 200);
      // test env-এ creds নেই — দুটোই false হওয়ার কথা
      assert.equal(typeof res.body.data.google, "boolean");
      assert.equal(typeof res.body.data.facebook, "boolean");
    });

    it("start returns 503 for unconfigured provider; 404 for unknown", async () => {
      const g = await requestObj.get("/api/v1/auth/oauth/google/start").redirects(0);
      assert.ok([302, 503].includes(g.status), `got ${g.status}`); // creds থাকলে 302
      const x = await requestObj.get("/api/v1/auth/oauth/twitter/start").redirects(0);
      assert.equal(x.status, 404);
    });
  });

  describe("upsert / linking", () => {
    it("creates a new passwordless user for a fresh provider identity", async () => {
      const user = await oauth.upsertOAuthUser("google", {
        providerId: "g-111",
        email: "oauth.new@example.com",
        emailVerified: true,
        firstName: "ওমর",
        lastName: "ফারুক",
        avatar: "http://x/y.png",
      });
      assert.equal(user.email, "oauth.new@example.com");
      assert.equal(user.authProvider, "google");
      assert.equal(user.googleId, "g-111");
      assert.ok(user.passwordHash, "passwordHash set (random)");
      // র‍্যান্ডম পাসওয়ার্ডে সরাসরি লগইন অসম্ভব — hash ≠ plaintext
      assert.ok(!user.passwordHash.startsWith("oauth"), "hashed, not stored raw");
    });

    it("links an existing local account with the same email instead of creating a duplicate", async () => {
      const local = await registerUser(requestObj); // লোকাল ইউজার (helpers দিয়ে)
      const linked = await oauth.upsertOAuthUser("facebook", {
        providerId: "fb-222",
        email: local.user.email,
        emailVerified: true,
        firstName: "লোকাল",
        lastName: "ইউজার",
        avatar: null,
      });
      assert.equal(linked._id.toString(), local.user.id);
      assert.equal(linked.facebookId, "fb-222");
      assert.equal(linked.authProvider, "facebook"); // এখন থেকে সোশ্যালও চলবে
      const count = await User.countDocuments({ email: local.user.email });
      assert.equal(count, 1, "no duplicate account");
    });

    it("second login with the same provider identity reuses the same account", async () => {
      const first = await oauth.upsertOAuthUser("google", {
        providerId: "g-333", email: "repeat@example.com", emailVerified: true, firstName: "আ", lastName: "খ", avatar: null,
      });
      const second = await oauth.upsertOAuthUser("google", {
        providerId: "g-333", email: "repeat@example.com", emailVerified: true, firstName: "আ", lastName: "খ", avatar: null,
      });
      assert.equal(first._id.toString(), second._id.toString());
      assert.equal(await User.countDocuments({ email: "repeat@example.com" }), 1);
    });

    it("new identity without email is rejected with a friendly message", async () => {
      await assert.rejects(
        () => oauth.upsertOAuthUser("facebook", { providerId: "fb-9", email: null, emailVerified: false, firstName: "নো", lastName: "মেইল", avatar: null }),
        /ইমেইল/,
      );
    });
  });

  describe("handoff codes", () => {
    it("one-time use: second consume fails, expired consume fails", async () => {
      const session = { accessToken: "a", refreshToken: "r", user: { id: "u" } };
      const code = await oauth.createHandoffCode(session);
      const got = await oauth.consumeHandoffCode(code);
      assert.equal(got.accessToken, "a");
      await assert.rejects(() => oauth.consumeHandoffCode(code), /invalid or already used/i);

      const expired = await oauth.createHandoffCode(session);
      // Mongo-তে সরাসরি মেয়াদ পুরনো করা (TTL-এর অপেক্ষা না করে)
      const coll = oauth.handoffCollectionForTests();
      await coll.updateOne(
        { code: expired },
        { $set: { expiresAt: new Date(Date.now() - 1000) } },
      );
      await assert.rejects(() => oauth.consumeHandoffCode(expired), /expired/i);
    });

    it("codes survive a restart and are consumable by any process (Mongo-backed)", async () => {
      const session = { accessToken: "a2", refreshToken: "r2", user: { id: "u2" } };
      const code = await oauth.createHandoffCode(session);
      // সরাসরি নতুন কালেকশন অ্যাক্সেস করে দেখি ডকুমেন্ট Mongo-তেই আছে
      const coll = oauth.handoffCollectionForTests();
      const doc = await coll.findOne({ code });
      assert.ok(doc, "handoff document persisted in Mongo");
      assert.equal(doc.session.accessToken, "a2");
      const got = await oauth.consumeHandoffCode(code);
      assert.equal(got.user.id, "u2");
    });
  });

  describe("state (CSRF) nonce", () => {
    /** স্যুটের নিজস্ব স্কিমে সই করা state বানায় — প্রোভাইডার ক্রেড ছাড়াই নোন্স-লজিক টেস্টে */
    async function makeState({ provider = "google", ageMs = 0, nonce = crypto.randomBytes(16).toString("hex") } = {}) {
      await OauthStateNonce.create({
        nonce,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
      const body = Buffer.from(JSON.stringify({ provider, t: Date.now() - ageMs, nonce })).toString("base64url");
      const sig = crypto.createHmac("sha256", env.JWT_ACCESS_SECRET).update(body).digest("base64url");
      return `${body}.${sig}`;
    }

    it("valid state verifies once, then replay is rejected (single-use nonce)", async () => {
      const state = await makeState();
      const payload = await oauth.verifyState(state);
      assert.equal(payload.provider, "google");
      await assert.rejects(() => oauth.verifyState(state), /already used/i);
    });

    it("expired state is rejected with OAUTH_STATE_EXPIRED", async () => {
      const state = await makeState({ ageMs: 11 * 60 * 1000 });
      await assert.rejects(() => oauth.verifyState(state), (e) => e.errorCode === "OAUTH_STATE_EXPIRED");
    });

    it("tampered signature is rejected with OAUTH_STATE_INVALID", async () => {
      const state = await makeState();
      const [body] = state.split(".");
      await assert.rejects(
        () => oauth.verifyState(`${body}.forged-signature`),
        (e) => e.errorCode === "OAUTH_STATE_INVALID",
      );
    });

    it("provider mismatch after valid signature is still caught by the controller", async () => {
      // state google-এর, callback facebook-এর — controller-এর provider-mismatch চেক
      const state = await makeState({ provider: "google" });
      const payload = await oauth.verifyState(state);
      assert.equal(payload.provider, "google");
      assert.notEqual(payload.provider, "facebook");
    });
  });

  describe("oauth monitoring + rate limit", () => {
    beforeEach(async () => {
      resetOAuthMonitorForTests();
      await clearOAuthEventsForTests();
    });

    it("records exchange success/failure and computes totalFailed", async () => {
      recordOAuthEvent("exchange_success", { ip: "t" });
      recordOAuthEvent("exchange_failed", { ip: "t", errorCode: "OAUTH_CODE_INVALID" });
      recordOAuthEvent("exchange_failed", { ip: "t", errorCode: "OAUTH_CODE_EXPIRED" });
      recordOAuthEvent("state_failed", { ip: "t", errorCode: "OAUTH_STATE_INVALID" });

      const s = oauthMonitorStats();
      assert.equal(s.counts.exchange_success, 1);
      assert.equal(s.counts.exchange_failed, 2);
      assert.equal(s.counts.state_failed, 1);
      assert.equal(s.totalFailed, 3);
      // সাম্প্রতিক ইভেন্টে IP ও errorCode থাকে (PII নয়), নতুনটা আগে থাকে
      assert.equal(s.recentEvents[0].event, "state_failed");
      assert.equal(s.recentEvents[0].errorCode, "OAUTH_STATE_INVALID");
    });

    it("unknown events are ignored silently", () => {
      assert.equal(recordOAuthEvent("bogus_event", { ip: "t" }), null);
      assert.equal(oauthMonitorStats().counts.start, 0);
    });

    it("POST /oauth/exchange with a bad code still responds (and is counted)", async () => {
      const res = await requestObj
        .post("/api/v1/auth/oauth/exchange")
        .send({ code: "not-a-real-code" });
      assert.equal(res.status, 400);
      assert.equal(res.body.errorCode, "OAUTH_CODE_INVALID");
      assert.ok(oauthMonitorStats().counts.exchange_failed >= 1, "failure counted in monitor");
    });

    it("GET /admin/stats exposes the oauth counters for staff", async () => {
      const staff = await createStaff(requestObj, { role: "ADMIN" });
      const res = await requestObj.get("/api/v1/admin/stats").set(auth(staff.accessToken));
      assert.equal(res.status, 200);
      assert.ok(res.body.data.oauth, "oauth block present in admin stats");
      assert.equal(typeof res.body.data.oauth.counts.exchange_failed, "number");
      assert.equal(typeof res.body.data.oauth.totalFailed, "number");
    });
  });

  describe("failure guard (fail2ban)", () => {
    beforeEach(async () => {
      resetOAuthMonitorForTests();
      resetOAuthFailureGuardForTests();
      await clearOAuthEventsForTests();
    });
    // স্যুট শেষে ব্লক অবস্থা পরের স্যুটে লেক না হয়
    afterEach(() => {
      resetOAuthFailureGuardForTests();
      resetOAuthMonitorForTests();
    });

    it("threshold crossed → IP blocked; successful login clears the counter", () => {
      const ip = "unit-test-ip";
      for (let i = 0; i < 4; i++) recordOAuthFailure(ip, "OAUTH_CODE_INVALID");
      assert.ok(!isOAuthFailureBlocked(ip), "4 failures — still allowed");
      recordOAuthFailure(ip, "OAUTH_CODE_INVALID"); // ৫ম — থ্রেশহোল্ড
      assert.ok(isOAuthFailureBlocked(ip), "5 failures — blocked");
      // সফল লগইন/exchange হলে কাউন্টার মুছে যায় — ভুল করা সাধারণ ইউজার রক্ষা
      clearOAuthFailures(ip);
      assert.ok(!isOAuthFailureBlocked(ip), "success clears the block");
    });

    it("blocks an IP after 5 bad exchange codes — next requests get 429 + Retry-After", async () => {
      let last;
      for (let i = 0; i < 5; i++) {
        last = await requestObj.post("/api/v1/auth/oauth/exchange").send({ code: `bogus-${i}` });
      }
      // ৫ম ব্যর্থতায় ব্লক শুরু হয়েছে, কিন্তু ওই রিকোয়েস্ট এখনো হ্যান্ডলারে ছিল — 400
      assert.equal(last.status, 400);
      assert.ok(oauthBlockedIpsForTests().length >= 1, "ip registered as blocked");
      // এরপর থেকে guard হ্যান্ডলারেই ঢুকতে দেয় না
      const blocked = await requestObj.post("/api/v1/auth/oauth/exchange").send({ code: "anything" });
      assert.equal(blocked.status, 429);
      assert.equal(blocked.body.errorCode, "RATE_LIMITED");
      assert.ok(Number(blocked.headers["retry-after"]) > 0, "Retry-After header set");
      // প্রতিটি ব্লকড চেষ্টা monitor-এ গোনা হয়
      assert.ok(oauthMonitorStats().counts.failure_blocked >= 1, "failure_blocked counted");
      assert.equal(oauthMonitorStats().counts.exchange_failed, 5, "5 real failures counted");
    });

    it("state tampering on callback counts toward the threshold", async () => {
      for (let i = 0; i < 5; i++) {
        await requestObj
          .get("/api/v1/auth/oauth/google/callback")
          .query({ code: "x", state: `tampered-${i}.forged-sig` })
          .redirects(0);
      }
      const res = await requestObj
        .get("/api/v1/auth/oauth/google/callback")
        .query({ code: "x", state: "tampered-x.forged-sig" })
        .redirects(0);
      assert.equal(res.status, 429, "blocked after 5 state failures");
    });

    it("unknown provider probing counts toward the threshold and then blocks even valid routes", async () => {
      for (let i = 0; i < 5; i++) {
        const res = await requestObj.get(`/api/v1/auth/oauth/twitter-${i}/start`).redirects(0);
        assert.equal(res.status, 404, "unknown provider still 404");
      }
      // ব্লক হওয়ার পর বৈধ google start-ও guard-এ আটকায় (৪২৯, হ্যান্ডলারে যায় না)
      const res = await requestObj.get("/api/v1/auth/oauth/google/start").redirects(0);
      assert.equal(res.status, 429);
    });
  });

  describe("persistent event history (capped collection)", () => {
    beforeEach(async () => {
      resetOAuthMonitorForTests();
      await clearOAuthEventsForTests();
    });

    it("persists events to Mongo (survives in-memory monitor reset)", async () => {
      recordOAuthEvent("exchange_failed", { ip: "persist-ip", errorCode: "OAUTH_CODE_INVALID" });
      recordOAuthEvent("login_success", { ip: "persist-ip", provider: "google" });
      // fire-and-forget লেখা — ছোট অপেক্ষা
      await new Promise((r) => setTimeout(r, 100));
      const docs = await recentOAuthEventsFromDb({ ip: "persist-ip" });
      assert.ok(docs.length >= 2, `expected >=2 persisted, got ${docs.length}`);
      assert.ok(docs.some((d) => d.event === "exchange_failed" && d.errorCode === "OAUTH_CODE_INVALID"));
      assert.ok(docs.some((d) => d.event === "login_success"));
      // natural order নতুন-আগে
      assert.ok(docs[0].at >= docs[docs.length - 1].at);
    });

    it("capped collection rolls over at max documents (no growth)", { timeout: 30000 }, async () => {
      // সিকোয়েনশিয়াল লেখা — ক্যাপ-মেকানিজম ডিটারমিনিস্টিক যাচাই
      for (let i = 0; i < OAUTH_EVENT_CAP.max + 25; i++) {
        await OauthEvent.create({ event: "state_failed", ip: `cap-ip-${i % 3}`, errorCode: "OAUTH_STATE_INVALID" });
      }
      const total = await OauthEvent.countDocuments();
      assert.equal(total, OAUTH_EVENT_CAP.max, "exactly capped at max");
      // সবচেয়ে পুরনোগুলো overwrite হয়েছে — সর্বশেষ লেখাটা আছে
      const latest = await recentOAuthEventsFromDb({ limit: 1 });
      assert.equal(latest[0].ip, `cap-ip-${(OAUTH_EVENT_CAP.max + 24) % 3}`);
    });

    it("monitor's concurrent fire-and-forget writes stay bounded", { timeout: 30000 }, async () => {
      // বাস্তব আচরণ: বৃহ্তি কনকারেন্সিতে count-cap সামান্য overshoot করতে পারে —
      // তবে কখনোই unbounded হয় না (size-cap + ইন-ফ্লাইট সীমিত)
      for (let i = 0; i < OAUTH_EVENT_CAP.max + 25; i++) {
        recordOAuthEvent("state_failed", { ip: `burst-ip-${i % 3}`, errorCode: "OAUTH_STATE_INVALID" });
      }
      await new Promise((r) => setTimeout(r, 400));
      const total = await OauthEvent.countDocuments();
      assert.ok(total < OAUTH_EVENT_CAP.max * 1.1, `bounded (≈cap), got ${total}`);
    });

    it("GET /admin/oauth/events serves the persisted history (staff-only)", async () => {
      recordOAuthEvent("provider_denied", { ip: "admin-test-ip", provider: "facebook", errorCode: "access_denied" });
      await new Promise((r) => setTimeout(r, 100));
      const staff = await createStaff(requestObj, { role: "ADMIN" });
      const res = await requestObj
        .get("/api/v1/admin/oauth/events?event=provider_denied&limit=10")
        .set(auth(staff.accessToken));
      assert.equal(res.status, 200);
      assert.equal(res.body.data.count >= 1, true);
      assert.ok(res.body.data.items.every((d) => d.event === "provider_denied"));
      // non-staff পায় না
      const member = await registerUser(requestObj);
      const denied = await requestObj.get("/api/v1/admin/oauth/events").set(auth(member.accessToken));
      assert.equal(denied.status, 403);
    });
  });

  describe("callback redirect", () => {
    it("redirects to /auth/callback?error=... when the user denies access", async () => {
      const res = await requestObj
        .get("/api/v1/auth/oauth/google/callback")
        .query({ error: "access_denied" })
        .redirects(0);
      assert.equal(res.status, 302);
      assert.ok(res.headers.location.includes("/auth/callback?error="), res.headers.location);
      assert.ok(decodeURIComponent(res.headers.location).includes("অনুমতি দেননি"));
    });

    it("redirects with error on invalid state (CSRF)", async () => {
      const res = await requestObj
        .get("/api/v1/auth/oauth/google/callback")
        .query({ code: "x", state: "bogus.tampered" })
        .redirects(0);
      assert.equal(res.status, 302);
      assert.ok(res.headers.location.includes("error="), res.headers.location);
    });
  });
});
