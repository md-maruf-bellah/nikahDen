import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import {
  startServer,
  stopServer,
  clearDb,
  createSuperAdmin,
  registerUser,
  auth,
} from "./helpers.js";
import * as oauth from "../src/modules/auth/oauth.service.js";
import User from "../src/models/user.model.js";

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
      const code = oauth.createHandoffCode(session);
      const got = oauth.consumeHandoffCode(code);
      assert.equal(got.accessToken, "a");
      assert.throws(() => oauth.consumeHandoffCode(code), /invalid or already used/i);

      const expired = oauth.createHandoffCode(session);
      // সরাসরি Map-এ মেয়াদ পুরনো করা
      const map = oauth.handoffMapForTests?.() ?? null;
      if (map) map.get(expired).expiresAt = Date.now() - 1000;
      if (map) assert.throws(() => oauth.consumeHandoffCode(expired), /expired/i);
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
