import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import env from "../src/config/env.js";
import { hashToken, randomToken } from "../src/utils/helpers.js";
import { takeOutbox } from "../src/utils/emailer.js";
import { startServer, stopServer, clearDb, registerUser, login, createSuperAdmin, auth, superAdmin } from "./helpers.js";
import { connectDB } from "../src/config/db.js";

describe("AUTH", () => {
  let request;
  const USER = { firstName: "Rahim", lastName: "Uddin", email: "rahim@test.dev", password: "Rahim@12345" };

  before(async () => {
    ({ request } = await startServer());
  });

  after(async () => {
    await stopServer();
  });

  beforeEach(async () => {
    await clearDb();
    await createSuperAdmin();
  });

  describe("register", () => {
    it("creates an account and returns tokens + public user", async () => {
      const res = await request.post("/api/v1/auth/register").send(USER);
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.accessToken);
      assert.ok(res.body.data.refreshToken);
      assert.equal(res.body.data.user.email, USER.email);
      assert.equal(res.body.data.user.role, "USER");
      assert.equal(res.body.data.user.password, undefined);
    });

    it("rejects duplicate email with 409", async () => {
      await request.post("/api/v1/auth/register").send(USER);
      const res = await request.post("/api/v1/auth/register").send(USER);
      assert.equal(res.status, 409);
      assert.equal(res.body.errorCode, "EMAIL_ALREADY_REGISTERED");
    });

    it("validates payloads (400 + details)", async () => {
      const res = await request.post("/api/v1/auth/register").send({ email: "nope", password: "short" });
      assert.equal(res.status, 400);
      assert.equal(res.body.errorCode, "VALIDATION_ERROR");
      assert.ok(res.body.details.length >= 2);
    });
  });

  describe("login", () => {
    it("logs in with correct credentials", async () => {
      await request.post("/api/v1/auth/register").send(USER);
      const res = await request.post("/api/v1/auth/login").send({ email: USER.email, password: USER.password });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.user.email, USER.email);
    });

    it("rejects wrong password and unknown email (no enumeration)", async () => {
      await request.post("/api/v1/auth/register").send(USER);
      const wrong = await request.post("/api/v1/auth/login").send({ email: USER.email, password: "WrongPass1" });
      assert.equal(wrong.status, 401);
      const ghost = await request.post("/api/v1/auth/login").send({ email: "ghost@test.dev", password: "WrongPass1" });
      assert.equal(ghost.status, 401);
      assert.equal(wrong.body.errorCode, ghost.body.errorCode);
    });

    it("locks out deactivated users", async () => {
      const session = await registerUser(request);
      await mongoose.model("User").updateOne({ email: session.user.email }, { $set: { status: "INACTIVE" } });
      const res = await request.post("/api/v1/auth/login").send({ email: session.user.email, password: "Passw0rd!" });
      assert.equal(res.status, 403);
      assert.equal(res.body.errorCode, "ACCOUNT_INACTIVE");
    });
  });

  describe("me", () => {
    it("returns the current user", async () => {
      const s = await registerUser(request);
      const res = await request.get("/api/v1/auth/me").set(auth(s.accessToken));
      assert.equal(res.status, 200);
      assert.equal(res.body.data.id, s.user.id);
    });

    it("401 without / with invalid token", async () => {
      assert.equal((await request.get("/api/v1/auth/me")).status, 401);
      const res = await request.get("/api/v1/auth/me").set(auth("not-a-token"));
      assert.equal(res.status, 401);
      assert.equal(res.body.errorCode, "INVALID_TOKEN");
    });

    it("401 with an expired token", async () => {
      const s = await registerUser(request);
      const expired = jwt.sign({ type: "access", role: "USER" }, env.JWT_ACCESS_SECRET, {
        subject: s.user.id,
        expiresIn: -1,
      });
      const res = await request.get("/api/v1/auth/me").set(auth(expired));
      assert.equal(res.status, 401);
      assert.equal(res.body.errorCode, "TOKEN_EXPIRED");
    });
  });

  describe("refresh rotation", () => {
    it("rotates refresh tokens and re-serves in-window replays benignly", async () => {
      const s = await registerUser(request);

      const first = await request.post("/api/v1/auth/refresh").send({ refreshToken: s.refreshToken });
      assert.equal(first.status, 200);
      assert.notEqual(first.body.data.refreshToken, s.refreshToken);

      // Reusing the old token within the grace window is a benign concurrent
      // race now (200 + re-issued access token, no new refresh token) — the
      // real reuse-attack path is covered in the grace-window test below.
      const replay = await request.post("/api/v1/auth/refresh").send({ refreshToken: s.refreshToken });
      assert.equal(replay.status, 200);
      assert.ok(replay.body.data.accessToken);
      assert.equal(replay.body.data.refreshToken, undefined);

      // ইন-উইন্ডো রিপ্লে benign — ফ্যামিলি-কিল হয়নি, তাই successor সচল।
      // (গ্রেস-শেষে আসল reuse-attack-এ ফ্যামিলি মরে — নিচের টেস্টে কভারড।)
      const second = await request.post("/api/v1/auth/refresh").send({ refreshToken: first.body.data.refreshToken });
      assert.equal(second.status, 200);
      assert.ok(second.body.data.refreshToken);
    });

    it("gracefully re-serves the successor within the reuse grace window (concurrent-refresh race)", async () => {
      const s = await registerUser(request);

      const first = await request.post("/api/v1/auth/refresh").send({ refreshToken: s.refreshToken });
      assert.equal(first.status, 200);
      const successor = first.body.data.refreshToken;

      // একই পুরনো টোকেন গ্রেস-উইন্ডোর ভেতরে আবার এলে (কনকারেন্ট ট্যাব /
      // স্ট্যাম্পিড রিফ্রেশ) — বেনাইন রেস: নতুন পেয়ার নষ্ট হয় না, অ্যাক্সেস
      // টোকেন রি-ইস্যু হয় এবং successor টিকে থাকে।
      const race = await request.post("/api/v1/auth/refresh").send({ refreshToken: s.refreshToken });
      assert.equal(race.status, 200);
      assert.ok(race.body.data.accessToken);
      assert.equal(race.body.data.refreshToken, undefined);

      // রেসের পরেও successor সচল থাকে।
      const after = await request.post("/api/v1/auth/refresh").send({ refreshToken: successor });
      assert.equal(after.status, 200);
      assert.ok(after.body.data.refreshToken);
    });

    it("kills the whole session family when the grace window has passed (real reuse attack)", async () => {
      const s = await registerUser(request);

      const first = await request.post("/api/v1/auth/refresh").send({ refreshToken: s.refreshToken });
      assert.equal(first.status, 200);

      // গ্রেস-উইন্ডো পার করে দাও (ভাল করে হাইজ্যাক-ডিটেকশন অক্ষত রাখতে)।
      const RefreshToken = mongoose.model("RefreshToken");
      const { hashToken } = await import("../src/utils/helpers.js");
      await RefreshToken.updateOne(
        { tokenHash: hashToken(s.refreshToken) },
        { $set: { revokedAt: new Date(Date.now() - 10 * 60 * 1000) } },
      );

      const replay = await request.post("/api/v1/auth/refresh").send({ refreshToken: s.refreshToken });
      assert.equal(replay.status, 401);

      // ফ্যামিলি-রিভোক: successor-ও মরে যায়।
      const second = await request.post("/api/v1/auth/refresh").send({ refreshToken: first.body.data.refreshToken });
      assert.equal(second.status, 401);
    });
  });

  describe("logout", () => {
    it("revokes the refresh token", async () => {
      const s = await registerUser(request);
      const out = await request.post("/api/v1/auth/logout").send({ refreshToken: s.refreshToken });
      assert.equal(out.status, 200);
      const res = await request.post("/api/v1/auth/refresh").send({ refreshToken: s.refreshToken });
      assert.equal(res.status, 401);
    });
  });

  describe("change password", () => {
    it("rejects a wrong current password", async () => {
      const s = await registerUser(request);
      const res = await request
        .patch("/api/v1/auth/change-password")
        .set(auth(s.accessToken))
        .send({ currentPassword: "WrongPass1", newPassword: "NewPassw0rd" });
      assert.equal(res.status, 400);
      assert.equal(res.body.errorCode, "INVALID_CURRENT_PASSWORD");
    });

    it("changes the password and invalidates old sessions", async () => {
      const s = await registerUser(request);
      const res = await request
        .patch("/api/v1/auth/change-password")
        .set(auth(s.accessToken))
        .send({ currentPassword: "Passw0rd!", newPassword: "FreshPass1" });
      assert.equal(res.status, 200);

      // Old refresh token revoked
      const oldRefresh = await request.post("/api/v1/auth/refresh").send({ refreshToken: s.refreshToken });
      assert.equal(oldRefresh.status, 401);

      const oldLogin = await request.post("/api/v1/auth/login").send({ email: s.user.email, password: "Passw0rd!" });
      assert.equal(oldLogin.status, 401);
      const newLogin = await request.post("/api/v1/auth/login").send({ email: s.user.email, password: "FreshPass1" });
      assert.equal(newLogin.status, 200);
    });
  });

  describe("password reset", () => {
    const noSuchEmail = "no-such@test.dev";

    // টেস্ট outbox — সার্ভার লিঙ্ক কোথাও লগে ছাড়ে না, তাই টেস্ট নিজেই
    // ইন-মেমরি outbox থেকে raw টোকেন তুলে লিঙ্ক ফলো করে।
    const withOutbox = async (fn) => {
      process.env.MAIL_OUTBOX = "1";
      try {
        return await fn();
      } finally {
        delete process.env.MAIL_OUTBOX;
        takeOutbox();
      }
    };

    const captureResetLink = async (email) => {
      takeOutbox();
      const res = await request.post("/api/v1/auth/forgot-password").send({ email });
      return { res, outbox: takeOutbox() };
    };

    it("unregistered email → 404 with the exact message, no token issued", async () => {
      const res = await request.post("/api/v1/auth/forgot-password").send({ email: noSuchEmail });
      assert.equal(res.status, 404);
      assert.equal(res.body.errorCode, "EMAIL_NOT_FOUND");
      assert.equal(res.body.message, "No account found with this email address.");
      assert.equal(await mongoose.model("ResetToken").countDocuments({}), 0);
    });

    it("invalid email format → 400 validation error", async () => {
      const res = await request.post("/api/v1/auth/forgot-password").send({ email: "not-an-email" });
      assert.equal(res.status, 400);
      assert.equal(res.body.errorCode, "VALIDATION_ERROR");
    });

    it("reports a missing email service instead of bypassing verification", async () => {
      const s = await registerUser(request);
      const res = await request.post("/api/v1/auth/forgot-password").send({ email: s.user.email });
      assert.equal(res.status, 503);
      assert.equal(res.body.errorCode, "EMAIL_NOT_CONFIGURED");
      // টোকেন তৈরিই হয়নি — undeliverable লিঙ্ক কখনো বাস্তব হয় না।
      assert.equal(await mongoose.model("ResetToken").countDocuments({}), 0);
    });

    it("full flow: link → one-time reset → login with the new password", async () =>
      withOutbox(async () => {
        const s = await registerUser(request);

        const forgot = await request.post("/api/v1/auth/forgot-password").send({ email: s.user.email });
        assert.equal(forgot.status, 200);
        // API response must never carry the raw token.
        assert.ok(!JSON.stringify(forgot.body).includes("token"));

        const { outbox } = await captureResetLink(s.user.email);
        assert.equal(outbox.length, 1);
        assert.match(outbox[0].text, /\/reset\?token=/);
        const raw = outbox[0].text.match(/token=([A-Za-z0-9_-]+)/)[1];

        // Weak password rejected by the shared zod rules.
        const weak = await request.post("/api/v1/auth/reset-password").send({ token: raw, newPassword: "short" });
        assert.equal(weak.status, 400);
        assert.equal(weak.body.errorCode, "VALIDATION_ERROR");

        // Wrong/expired-looking token first is fine; valid token now.
        const ok = await request.post("/api/v1/auth/reset-password").send({ token: raw, newPassword: "ResetMe123" });
        assert.equal(ok.status, 200);

        // Token is single-use — reuse is refused.
        const again = await request.post("/api/v1/auth/reset-password").send({ token: raw, newPassword: "ResetMe456" });
        assert.equal(again.status, 400);
        assert.equal(again.body.errorCode, "INVALID_RESET_TOKEN");

        // Login with the new password works; the old one does not.
        const login = await request.post("/api/v1/auth/login").send({ email: s.user.email, password: "ResetMe123" });
        assert.equal(login.status, 200);
        const stale = await request.post("/api/v1/auth/login").send({ email: s.user.email, password: "Rahim@12345" });
        assert.equal(stale.status, 401);

        // Existing sessions are revoked on reset (refresh token is dead).
        const refresh = await request.post("/api/v1/auth/refresh").send({ refreshToken: s.refreshToken });
        assert.equal(refresh.status, 401);
      }));

    it("expired token → 400 RESET_TOKEN_EXPIRED", async () => {
      const s = await registerUser(request);
      const raw = randomToken(32);
      await mongoose.model("ResetToken").create({
        user: s.user.id,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() - 60 * 1000),
        purpose: "PASSWORD_RESET",
      });
      const res = await request.post("/api/v1/auth/reset-password").send({ token: raw, newPassword: "FreshPass1" });
      assert.equal(res.status, 400);
      assert.equal(res.body.errorCode, "RESET_TOKEN_EXPIRED");
    });

    it("unknown/tampered token → 400 INVALID_RESET_TOKEN", async () => {
      const res = await request.post("/api/v1/auth/reset-password").send({
        token: randomToken(32),
        newPassword: "FreshPass1",
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.errorCode, "INVALID_RESET_TOKEN");
    });

    it("resets the password with a valid one-time token", async () => {
      const s = await registerUser(request);
      const raw = randomToken(32);
      await mongoose.model("ResetToken").create({
        user: s.user.id,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      const res = await request.post("/api/v1/auth/reset-password").send({ token: raw, newPassword: "ResetMe123" });
      assert.equal(res.status, 200);

      // Token is single-use.
      const again = await request.post("/api/v1/auth/reset-password").send({ token: raw, newPassword: "ResetMe456" });
      assert.equal(again.status, 400);

      const loginRes = await request.post("/api/v1/auth/login").send({ email: s.user.email, password: "ResetMe123" });
      assert.equal(loginRes.status, 200);
    });
  });

  describe("authz middleware", () => {
    it("admins exist in seed fixture", async () => {
      const ok = await login(request, superAdmin.email, superAdmin.password);
      assert.equal(ok.user.role, "SUPERADMIN");
    });
  });

  describe("backend restart persistence", () => {
    it("refresh tokens survive a process restart: silent refresh works after reconnecting", async () => {
      const s = await registerUser(request);

      // "প্রসেস মৃত্যু" সিমুলেট: Mongo না ঘুরিয়ে কানেকশন ছিঁড়ে নতুন Express
      // অ্যাপ বসানো — টোকেন-স্টোর Mongo-তে থাকায় রিস্টার্টে কিছুই হারায় না।
      // একই in-memory mongod-এ ফিরে যেতে host/port/name আগেই ক্যাপচার করি।
      const { host, port, name } = mongoose.connection;
      await mongoose.disconnect();
      await connectDB(`mongodb://${host}:${port}/${name}`, { serverSelectionTimeoutMS: 30000 });

      const res = await request.post("/api/v1/auth/refresh").send({ refreshToken: s.refreshToken });
      assert.equal(res.status, 200);
      assert.ok(res.body.data.accessToken);
      assert.ok(res.body.data.refreshToken);

      // রিফ্রেশ হওয়া পেয়ারও সচল — সেশন সত্যিই টিকে আছে।
      const me = await request.get("/api/v1/auth/me").set(auth(res.body.data.accessToken));
      assert.equal(me.status, 200);
      assert.equal(me.body.data.email, s.user.email);
    });
  });
});
