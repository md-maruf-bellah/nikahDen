/**
 * Failed-login lockout — অ্যাকাউন্ট-স্তরের লক (IP রেট-লিমিটের পরিপূরক):
 *   • LOGIN_FAIL_LOCK_COUNT (5) ভুল পাসওয়ার্ড → অ্যাকাউন্ট সাময়িক লক
 *   • লক মেয়াদে সঠিক পাসওয়ার্ডেও 429 ACCOUNT_LOCKED (bcrypt ঘুরবেই না)
 *   • মেয়াদ শেষে আবার চেষ্টা চলে; সফল লগইনে কাউন্ট/লক পরিষ্কার
 */
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import User from "../src/models/user.model.js";
import {
  startServer,
  stopServer,
  clearDb,
  registerUser,
  auth,
  createSuperAdmin,
  superAdmin,
  login,
} from "./helpers.js";

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
    // UI-র কাউন্টডাউনের জন্য স্ট্রাকচার্ড সেকেন্ড (১ থেকে লক-মেয়াদের মধ্যে)
    assert.ok(
      Number.isInteger(locked.body.details?.retryAfterSeconds)
        && locked.body.details.retryAfterSeconds >= 1
        && locked.body.details.retryAfterSeconds <= 15 * 60,
      "details.retryAfterSeconds বসেছে",
    );

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

  it("অ্যাডমিন: লক-ফিল্ড দেখে ম্যানুয়ালি আনলক করতে পারে; সাধারণ সদস্যের নিষিদ্ধ", async () => {
    const member = await registerUser(request); // password: Passw0rd!
    for (let i = 0; i < 5; i++) await attempt(member.user.email, "nope");

    await createSuperAdmin();
    const root = await login(request, superAdmin.email, superAdmin.password);

    // ১) admin list-এ lockedUntil/failedLoginCount ফেরত আসে
    const list = await request
      .get("/api/v1/users")
      .set(auth(root.accessToken))
      .query({ search: member.user.email });
    assert.equal(list.status, 200);
    const row = list.body.data.find((u) => u.email === member.user.email);
    assert.ok(row, "তালিকায় সদস্য পাওয়া গেছে");
    assert.ok(row.lockedUntil, "lockedUntil ফেরত আসছে");
    assert.equal(typeof row.failedLoginCount, "number", "failedLoginCount ফেরত আসছে");

    // ২) ম্যানুয়াল আনলক
    const unlocked = await request
      .post(`/api/v1/users/${row.id}/unlock`)
      .set(auth(root.accessToken));
    assert.equal(unlocked.status, 200);
    assert.equal(unlocked.body.data.wasLocked, true);
    assert.equal(unlocked.body.data.lockedUntil, null);
    const db = await User.findOne({ email: member.user.email });
    assert.equal(db.lockedUntil, null, "DB-তে লক মুছে গেছে");
    assert.equal(db.failedLoginCount, 0, "DB-তে কাউন্ট শূন্য");

    // ৩) আনলকের পর সঠিক পাসওয়ার্ডে লগইন চলে
    const ok = await attempt(member.user.email, "Passw0rd!");
    assert.equal(ok.status, 200, "আনলকের পর লগইন চলে");

    // ৪) সাধারণ সদস্য (USER) unlock করতে পারে না
    const denied = await request
      .post(`/api/v1/users/${row.id}/unlock`)
      .set(auth(ok.body.data.accessToken));
    assert.equal(denied.status, 403);
  });

  it("অডিট-ট্রেইল: unlock অ্যাকশনে কে/কবে/কী লেখা হয়; সদস্য অডিট পড়তে পারে না", async () => {
    const AuditEvent = (await import("../src/models/adminAuditEvent.model.js")).default;
    const { resetCappedCollection } = await import("../src/utils/cappedCollection.js");
    await resetCappedCollection("admin_audit_events");

    const member = await registerUser(request);
    for (let i = 0; i < 5; i++) await attempt(member.user.email, "nope");

    await createSuperAdmin();
    const root = await login(request, superAdmin.email, superAdmin.password);

    const list = await request
      .get("/api/v1/users")
      .set(auth(root.accessToken))
      .query({ search: member.user.email });
    const row = list.body.data.find((u) => u.email === member.user.email);

    const unlocked = await request
      .post(`/api/v1/users/${row.id}/unlock`)
      .set(auth(root.accessToken));
    assert.equal(unlocked.status, 200);

    // capped ring-এ একটি UNLOCK রেকর্ড — কে/কবে/কী সহ
    const events = await AuditEvent.find({ action: "UNLOCK" }).lean();
    assert.equal(events.length, 1, "ঠিক একটি UNLOCK অডিট রেকর্ড");
    const ev = events[0];
    assert.equal(ev.actorRole, "SUPERADMIN");
    assert.equal(ev.actorId, root.user.id, "কে — actor id");
    assert.ok(ev.actorEmail.startsWith("***@"), "ইমেইল মাস্কড (লোকাল-পার্ট লুকানো)");
    assert.equal(ev.targetId, row.id, "কী — target id");
    assert.ok(ev.targetEmail.startsWith("***@"), "টার্গেট ইমেইল মাস্কড");
    // থ্রেশহোল্ডে পৌঁছে লক-প্রয়োগের মুহূর্তে কাউন্ট রিসেট হয় (auth.service),
    // তাই রেকর্ডে failedAttempts: 0 — মানে অডিট লেখা হয়েছে শুধু লকের ভিত্তিতেই
    assert.equal(typeof ev.failedAttempts, "number", "ভুল-চেষ্টা রেকর্ড ফিল্ড আছে");
    assert.equal(ev.failedAttempts, 0, "লক-প্রয়োগে কাউন্ট রিসেট হওয়ায় ০");
    const ageSec = (Date.now() - new Date(ev.at).getTime()) / 1000;
    assert.ok(ageSec >= 0 && ageSec < 120, "কবে — সার্ভার টাইমস্ট্যাম্প");

    // রিড-এন্ডপয়েন্ট: staff পড়ে, সদস্য 403
    const staffRead = await request
      .get("/api/v1/admin/audit/events")
      .set(auth(root.accessToken))
      .query({ action: "UNLOCK" });
    assert.equal(staffRead.status, 200);
    const evs = staffRead.body.data;
    assert.ok(Array.isArray(evs) && evs.length >= 1, "অডিট এন্ডপয়েন্ট রেকর্ড ফেরত দেয়");
    assert.equal(evs[0].action, "UNLOCK");

    const memberRead = await request
      .get("/api/v1/admin/audit/events")
      .set(auth((await attempt(member.user.email, "Passw0rd!")).body.data.accessToken));
    assert.equal(memberRead.status, 403, "সদস্য অডিট পড়তে পারে না");
  });

  it("অজানা ইমেইল — একই নিরর্থক বার্তা (তথ্য-ফাঁস নেই), কোনো লক নেই", async () => {
    const res = await attempt("ghost@nobody.dev", "whatever@1");
    assert.equal(res.status, 401);
    assert.equal(res.body.errorCode, "INVALID_CREDENTIALS");
    assert.equal(res.body.message, "Incorrect email or password.");
    assert.equal(await User.countDocuments({ email: "ghost@nobody.dev" }), 0);
  });
});
