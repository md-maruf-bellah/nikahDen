/**
 * Failed-login lockout — অ্যাকাউন্ট-স্তরের লক (IP রেট-লিমিটের পরিপূরক):
 *   • LOGIN_FAIL_LOCK_COUNT (5) ভুল পাসওয়ার্ড → অ্যাকাউন্ট সাময়িক লক
 *   • লক মেয়াদে সঠিক পাসওয়ার্ডেও 429 ACCOUNT_LOCKED (bcrypt ঘুরবেই না)
 *   • মেয়াদ শেষে আবার চেষ্টা চলে; সফল লগইনে কাউন্ট/লক পরিষ্কার
 */
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import User from "../src/models/user.model.js";
import { startServer, stopServer, clearDb, registerUser, auth } from "./helpers.js";

describe("LOGIN LOCKOUT", () => {
  let request;

  before(async () => {
    ({ request } = await startServer());
  });

  after(async () => {
    await stopServer();
  });

  beforeEach(async () => {
    await clearDb();
  });

  const attempt = (email, password) =>
    request.post("/api/v1/auth/login").send({ email, password });

  it("৫ ভুল → অ্যাকাউন্ট লক; সঠিক পাসওয়ার্ডেও 429 ACCOUNT_LOCKED", async () => {
    const member = await registerUser(request);
    for (let i = 1; i <= 5; i++) {
      const res = await attempt(member.user.email, "WrongPass@123");
      assert.equal(res.status, 401, `ভুল চেষ্টা #${i}`);
      assert.equal(res.body.errorCode, "INVALID_CREDENTIALS");
    }

    // লক চলাকালে সঠিক পাসওয়ার্ডেও নিষেধ (যাচাইয়ের আগেই)
    const locked = await attempt(member.user.email, "Passw0rd!");
    assert.equal(locked.status, 429);
    assert.equal(locked.body.errorCode, "ACCOUNT_LOCKED");

    const db = await User.findOne({ email: member.user.email });
    assert.ok(db.lockedUntil && db.lockedUntil.getTime() > Date.now(), "DB-তে lockedUntil বসেছে");
    assert.equal(db.failedLoginCount, 0, "লক প্রয়োগে কাউন্ট শূন্য (মেয়াদ শেষে নতুন রান)");
  });

  it("মেয়াদ শেষ → আবার চলে; সফল লগইনে কাউন্ট/লক পরিষ্কার", async () => {
    const creds = {
      firstName: "Lock",
      lastName: "Test",
      email: "lock-expiry@test.dev",
      password: "Lock@12345",
    };
    const reg = await request.post("/api/v1/auth/register").send(creds);
    assert.equal(reg.status, 201);
    for (let i = 0; i < 5; i++) await attempt(creds.email, "nope");

    const pre = await request.post("/api/v1/auth/login").send({ email: creds.email, password: creds.password });
    assert.equal(pre.status, 429, "আগে লক");

    // মেয়াদ শেষ (ঘড়ি না ঘুরিয়ে DB-তে সময় পেছিয়ে)
    await User.updateOne({ email: creds.email }, { $set: { lockedUntil: new Date(Date.now() - 1000) } });

    const ok = await request.post("/api/v1/auth/login").send({ email: creds.email, password: creds.password });
    assert.equal(ok.status, 200, "মেয়াদ শেষে সঠিক পাসওয়ার্ড চলে");
    assert.ok(ok.body.data.accessToken);

    const db = await User.findOne({ email: creds.email });
    assert.equal(db.lockedUntil, null, "সফল লগইনে লক মুছে যায়");
    assert.equal(db.failedLoginCount, 0, "সফল লগইনে কাউন্ট রিসেট");
  });

  it("থ্রেশহোল্ডের আগে সফল লগইন → কাউন্ট রিসেট (ভুল ধারা ভাঙে)", async () => {
    const member = await registerUser(request); // password: Passw0rd!
    await attempt(member.user.email, "nope1");
    await attempt(member.user.email, "nope2");
    let db = await User.findOne({ email: member.user.email });
    assert.equal(db.failedLoginCount, 2, "থ্রেশহোল্ডের আগে কাউন্ট বাড়ে");

    const ok = await attempt(member.user.email, "Passw0rd!");
    assert.equal(ok.status, 200);
    db = await User.findOne({ email: member.user.email });
    assert.equal(db.failedLoginCount, 0, "সফল লগইনে ধারা শূন্য থেকে শুরু");
    assert.equal(db.lockedUntil, null);
  });

  it("অজানা ইমেইল — একই নিরর্থক বার্তা (তথ্য-ফাঁস নেই), কোনো লক নেই", async () => {
    const res = await attempt("ghost@nobody.dev", "whatever@1");
    assert.equal(res.status, 401);
    assert.equal(res.body.errorCode, "INVALID_CREDENTIALS");
    assert.equal(res.body.message, "Incorrect email or password.");
    assert.equal(await User.countDocuments({ email: "ghost@nobody.dev" }), 0);
  });
});
