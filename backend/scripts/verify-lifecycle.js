/* eslint-disable no-console */
/**
 * Headless end-to-end verification: drives the REAL HTTP API (supertest over
 * the actual Express app) against an in-memory MongoDB and asserts every
 * state transition of the core product lifecycle:
 *
 *   guest signup → biodata draft → submit → admin moderation → public
 *   directory → connect-gated full view (ledger math) → likes + mutual match
 *   → notifications → messaging/read receipts → membership order + coupon
 *   discount + transactional payment + invoice → admin revenue → session
 *   security (tampered/expired tokens, logout revocation, password change).
 *
 * Run:  npm run verify:lifecycle
 * Exits non-zero on the first failed assertion.
 */
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import jwt from "jsonwebtoken";
import env from "../src/config/env.js";
import { connectDB } from "../src/config/db.js";

let passed = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (ok) {
    passed += 1;
    console.log(`  PASS ${label}`);
  } else {
    console.error(`  FAIL ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    throw new Error(`assertion failed: ${label}`);
  }
}
function ok(label, cond, extra = "") {
  if (cond) {
    passed += 1;
    console.log(`  PASS ${label}`);
  } else {
    console.error(`  FAIL ${label}${extra ? ` — ${extra}` : ""}`);
    throw new Error(`assertion failed: ${label}`);
  }
}

const auth = (t) => ({ Authorization: `Bearer ${t}` });
const api = { get: (p, t) => request(app).get(p).set(auth(t)), post: (p, b, t) => request(app).post(p).set(auth(t)).send(b), patch: (p, b, t) => request(app).patch(p).set(auth(t)).send(b) };

let app;
let mongod;

const SUPER = { email: "root@verify.dev", password: "Admin@12345" };

const CORE = (over) => ({
  firstName: "Salma",
  lastName: "Begum",
  gender: "FEMALE",
  religion: "Islam",
  maritalStatus: "UNMARRIED",
  birthYear: 1998,
  division: "ঢাকা",
  district: "ঢাকা",
  occupation: "ডাক্তার",
  education: "MBBS",
  mobile: "01712345678",
  agreed: true,
  aboutYourself: "আমি একজন ডাক্তার, সৎ জীবনসঙ্গী খুঁজছি।",
  ...over,
});

async function fullBiodata(member, core, adminToken) {
  await api.post("/api/v1/biodatas", {}, member.accessToken);
  await api.patch("/api/v1/biodatas/me", core, member.accessToken);
  const sub = await api.post("/api/v1/biodatas/me/submit", {}, member.accessToken);
  const appr = await api.patch(`/api/v1/biodatas/${sub.body.data.id}/status`, { status: "APPROVED" }, adminToken);
  return appr.body.data;
}

async function main() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri("nikahdeen_lifecycle");
  process.env.RATE_LIMIT_MAX = "100000";
  process.env.AUTH_RATE_LIMIT_MAX = "100000";
  const { createApp } = await import("../src/app.js");
  await connectDB(uri, { serverSelectionTimeoutMS: 30000 });
  app = createApp();

  console.log("== signup ==");
  const a = (await api.post("/api/v1/auth/register", { firstName: "Rahim", lastName: "Uddin", email: "rahim@verify.dev", password: "Rahim@12345" }, null)).body.data;
  const b = (await api.post("/api/v1/auth/register", { firstName: "Karim", lastName: "Miah", email: "karim@verify.dev", password: "Karim@12345" }, null)).body.data;
  check("register A role", a.user.role, "USER");
  check("register B role", b.user.role, "USER");
  ok("no password hash leaked", !JSON.stringify(a).includes("passwordHash") && a.user.password === undefined);
  check("duplicate email rejected", (await api.post("/api/v1/auth/register", { firstName: "X", lastName: "Y", email: "rahim@verify.dev", password: "Rahim@12345" }, null)).status, 409);

  // superadmin + staff
  await mongoose.model("User").create({ firstName: "Root", lastName: "Admin", email: SUPER.email, passwordHash: SUPER.password, role: "SUPERADMIN", status: "ACTIVE" });
  const root = (await api.post("/api/v1/auth/login", { email: SUPER.email, password: SUPER.password }, null)).body.data;
  const staff = (await api.post("/api/v1/users", { firstName: "Staff", lastName: "A", email: "staff@verify.dev", password: "Admin@12345", role: "ADMIN" }, root.accessToken)).body.data;
  const admin = (await api.post("/api/v1/auth/login", { email: staff.email, password: "Admin@12345" }, null)).body.data;
  check("member cannot list users", (await api.get("/api/v1/users", a.accessToken)).status, 403);

  console.log("== biodata lifecycle ==");
  const draft = (await api.post("/api/v1/biodatas", { gender: "FEMALE" }, a.accessToken)).body.data;
  check("draft created", draft.status, "DRAFT");
  ok("biodataNo assigned", /^NKD-\d{4}-\d{6}$/.test(draft.biodataNo), draft.biodataNo);
  check("incomplete submit → 422", (await api.post("/api/v1/biodatas/me/submit", {}, a.accessToken)).status, 422);

  await api.patch("/api/v1/biodatas/me", CORE(), a.accessToken);
  const pending = (await api.post("/api/v1/biodatas/me/submit", {}, a.accessToken)).body.data;
  check("submitted → PENDING", pending.status, "PENDING");
  check("draft invisible to public", (await request(app).get(`/api/v1/biodatas/${pending.id}`)).status, 404);

  const approved = (await api.patch(`/api/v1/biodatas/${pending.id}/status`, { status: "APPROVED" }, admin.accessToken)).body.data;
  check("moderated → APPROVED", approved.status, "APPROVED");
  const aNotifs = (await api.get("/api/v1/notifications", a.accessToken)).body.data;
  ok("owner notified about approval", aNotifs.items.some((n) => n.type === "BIODATA_STATUS"));

  const directory = (await api.get("/api/v1/biodatas?gender=FEMALE&search=ডাক্তার", null)).body;
  check("directory search finds A", directory.pagination.total, 1);
  ok("directory cards carry id + fullName", Boolean(directory.data[0].id && directory.data[0].fullName), JSON.stringify(directory.data[0]));

  console.log("== connect-gated viewing (ledger) ==");
  const guestView = await request(app).get(`/api/v1/biodatas/${approved.id}`);
  check("guest sees summary only", guestView.body.data.mobile, undefined);
  check("member without connects → 403", (await api.get(`/api/v1/biodatas/${approved.id}`, b.accessToken)).status, 403);

  // B buys a connect pack (10 connects)
  await api.post("/api/v1/membership/packs", { name: "Pack-10", connects: 10, price: 99 }, admin.accessToken);
  const packs = (await api.get("/api/v1/membership/packs", b.accessToken)).body.data;
  const packOrder = (await api.post("/api/v1/orders", { kind: "PACK", packId: packs[0].id }, b.accessToken)).body.data;
  check("pack order PENDING", packOrder.status, "PENDING");
  check("pack order total", packOrder.total, 99);
  const paidPack = (await api.post(`/api/v1/orders/${packOrder.id}/pay`, { paymentMethod: "CARD" }, b.accessToken)).body.data;
  check("pack order PAID", paidPack.status, "PAID");
  ok("invoice issued", /^INV-\d{4}-\d{6}$/.test(paidPack.invoiceNo), paidPack.invoiceNo);
  check("connect balance after pack", (await api.get("/api/v1/membership/me", b.accessToken)).body.data.connects.balance, 10);

  const fullView = (await api.get(`/api/v1/biodatas/${approved.id}`, b.accessToken)).body.data;
  check("full view unlocks contact", fullView.mobile, "01712345678");
  check("full view not flagged owner", fullView.isOwner, false);
  check("balance after 1 view (10-1)", (await api.get("/api/v1/membership/me", b.accessToken)).body.data.connects.balance, 9);
  await api.get(`/api/v1/biodatas/${approved.id}`, b.accessToken); // repeat view
  check("repeat view is free (still 9)", (await api.get("/api/v1/membership/me", b.accessToken)).body.data.connects.balance, 9);
  const viewCountAfter = (await request(app).get(`/api/v1/biodatas/${approved.id}`)).body.data.viewCount;
  ok("viewCount incremented", viewCountAfter >= 2, String(viewCountAfter));
  const ledger = await mongoose.model("ConnectTransaction").find({ user: b.user.id });
  check("ledger rows: +10 (pack), -1 (view)", ledger.length, 2);
  check("ledger sum == balance", ledger.reduce((s, t) => s + t.amount, 0), 9);

  console.log("== likes + mutual match ==");
  await fullBiodata(b, CORE({ firstName: "Karim", gender: "MALE", mobile: "01812345678" }), admin.accessToken);
  const bBio = (await api.get("/api/v1/biodatas/me", b.accessToken)).body.data;
  const like1 = (await api.post(`/api/v1/biodatas/${approved.id}/like`, {}, b.accessToken)).body.data;
  check("B likes A (not mutual yet)", like1.isMutual, false);
  const aLikeNotif = (await api.get("/api/v1/notifications", a.accessToken)).body.data;
  ok("A got BIODATA_LIKE", aLikeNotif.items.some((n) => n.type === "BIODATA_LIKE"));
  const like2 = (await api.post(`/api/v1/biodatas/${bBio.id}/like`, {}, a.accessToken)).body.data;
  check("A likes B → mutual", like2.isMutual, true);
  const aMatch = (await api.get("/api/v1/notifications", a.accessToken)).body.data;
  const bMatch = (await api.get("/api/v1/notifications", b.accessToken)).body.data;
  ok("mutual match notified on both sides", aMatch.items.some((n) => n.type === "MUTUAL_LIKE") && bMatch.items.some((n) => n.type === "MUTUAL_LIKE"));
  check("B received likes == 1", (await api.get("/api/v1/biodatas/likes/received", b.accessToken)).body.pagination.total, 1);
  check("cannot like own biodata", (await api.post(`/api/v1/biodatas/${bBio.id}/like`, {}, b.accessToken)).status, 400);
  check("duplicate like → 409", (await api.post(`/api/v1/biodatas/${approved.id}/like`, {}, b.accessToken)).status, 409);

  console.log("== messaging ==");
  const convo = (await api.post("/api/v1/conversations", { recipientId: a.user.id, text: "আসসালামু আলাইকুম, আপনার বায়োডাটা দেখে আগ্রহী।" }, b.accessToken)).body.data;
  const aConv = (await api.get("/api/v1/conversations", a.accessToken)).body;
  check("A sees conversation", aConv.pagination.total, 1);
  check("conversation partner is B", aConv.data[0].partner.id, b.user.id);
  const reply = (await api.post(`/api/v1/conversations/${convo.conversation.id}/messages`, { text: "ওয়ালাইকুম আসসালাম!" }, a.accessToken)).body.data;
  check("reply sent", Boolean(reply.id), true);
  const bMsgs = (await api.get(`/api/v1/conversations/${convo.conversation.id}/messages`, b.accessToken)).body.data;
  check("B sees 2 messages", bMsgs.length, 2);
  check("A's reply marked READ for B", bMsgs[1].status, "READ");
  const stranger = (await api.post("/api/v1/auth/register", { firstName: "Eve", lastName: "X", email: "eve@verify.dev", password: "Eve@12345" }, null)).body.data;
  check("stranger blocked from conversation", (await api.get(`/api/v1/conversations/${convo.conversation.id}/messages`, stranger.accessToken)).status, 404);

  console.log("== membership + coupon math + transactional pay ==");
  await mongoose.model("Coupon").create({ code: "WELCOME20", discountPercent: 20, isActive: true });
  await api.post("/api/v1/membership/plans", { name: "Monthly", nameBn: "মান্থলি", slug: "monthly", durationDays: 30, price: 699, connectCount: 10, acceptProposalLimit: 0 }, admin.accessToken);
  const plan = (await api.get("/api/v1/membership/plans", b.accessToken)).body.data[0];
  const planOrder = (await api.post("/api/v1/orders", { kind: "PLAN", planId: plan.id, couponCode: "welcome20" }, b.accessToken)).body.data;
  check("subtotal 699", planOrder.subtotal, 699);
  check("discount floor(699*20/100)=139", planOrder.discount, 139);
  check("total 560", planOrder.total, 560);
  check("coupon normalized", planOrder.couponCode, "WELCOME20");

  const planPay = (await api.post(`/api/v1/orders/${planOrder.id}/pay`, { paymentMethod: "BKASH" }, b.accessToken)).body.data;
  check("plan order PAID", planPay.status, "PAID");
  const me = (await api.get("/api/v1/membership/me", b.accessToken)).body.data;
  check("subscription ACTIVE", me.subscription.isActive, true);
  check("plan snapshot kept", me.subscription.planSnapshot.name, "Monthly");
  check("balance 9 + 10 = 19", me.connects.balance, 19);
  check("double-pay refused", (await api.post(`/api/v1/orders/${planOrder.id}/pay`, {}, b.accessToken)).status, 409);
  check("cancel paid order refused", (await api.post(`/api/v1/orders/${planOrder.id}/cancel`, {}, b.accessToken)).status, 409);
  check("B's order list has 2 paid", (await api.get("/api/v1/orders/me", b.accessToken)).body.pagination.total, 2);
  check("B cannot read A's order (403)", (await api.get(`/api/v1/orders/${packOrder.id}`, a.accessToken)).status, 403);

  console.log("== admin revenue ==");
  const stats = (await api.get("/api/v1/admin/stats", admin.accessToken)).body.data;
  check("paid orders == 2", stats.revenue.totalPaidOrders, 2);
  check("revenue == 99 + 560", stats.revenue.revenueBdt, 659);
  check("users == 5 (root, staff, A, B, Eve)", stats.users.total, 5);
  const adminOrders = (await api.get("/api/v1/orders", admin.accessToken)).body;
  check("admin sees both orders", adminOrders.pagination.total, 2);
  ok("admin order carries customer", Boolean(adminOrders.data[0].customer?.email), JSON.stringify(adminOrders.data[0]));

  console.log("== session security ==");
  check("wrong password → 401", (await api.post("/api/v1/auth/login", { email: a.user.email, password: "Wrong1234" }, null)).status, 401);
  const tampered = `${a.accessToken.split(".")[0]}.${Buffer.from(JSON.stringify({ sub: a.user.id, role: "SUPERADMIN", type: "access" })).toString("base64url")}.${a.accessToken.split(".")[2]}`;
  check("tampered token → 401", (await api.get("/api/v1/auth/me", tampered)).status, 401);
  const expired = jwt.sign({ type: "access", role: "USER" }, env.JWT_ACCESS_SECRET, { subject: a.user.id, expiresIn: -1 });
  check("expired token → 401 TOKEN_EXPIRED", (await api.get("/api/v1/auth/me", expired)).status, 401);
  check("change password wrong current → 400", (await api.patch("/api/v1/auth/change-password", { currentPassword: "Nope1234", newPassword: "NewPass123" }, a.accessToken)).status, 400);
  check("change password ok", (await api.patch("/api/v1/auth/change-password", { currentPassword: "Rahim@12345", newPassword: "NewPass123" }, a.accessToken)).status, 200);
  check("old refresh token revoked after change", (await api.post("/api/v1/auth/refresh", { refreshToken: a.refreshToken }, null)).status, 401);
  const freshLogin = (await api.post("/api/v1/auth/login", { email: a.user.email, password: "NewPass123" }, null)).body.data;
  check("new password works", Boolean(freshLogin.accessToken), true);
  check("logout ok", (await api.post("/api/v1/auth/logout", { refreshToken: freshLogin.refreshToken }, null)).status, 200);
  check("refresh after logout → 401", (await api.post("/api/v1/auth/refresh", { refreshToken: freshLogin.refreshToken }, null)).status, 401);

  console.log(`\nLIFECYCLE VERIFICATION: ${passed} assertions passed`);
  await mongoose.disconnect();
  await mongod.stop();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("\nLIFECYCLE VERIFICATION FAILED:", err.message);
  await mongoose.disconnect().catch(() => {});
  if (mongod) await mongod.stop().catch(() => {});
  process.exit(1);
});