import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { startServer, stopServer, clearDb, registerUser, login, createSuperAdmin, createStaff, auth } from "./helpers.js";

describe("MEMBERSHIP / ORDERS / ADMIN", () => {
  let request;
  let superAdminSession;
  let adminToken;

  before(async () => {
    ({ request } = await startServer());
  });

  after(async () => {
    await stopServer();
  });

  beforeEach(async () => {
    await clearDb();
    await createSuperAdmin();
    superAdminSession = await login(request, "root@nikahdeen.dev", "Admin@12345");
    const staff = await createStaff(request);
    adminToken = staff.accessToken;
  });

  async function makePlan(overrides = {}) {
    const payload = {
      name: "Monthly",
      nameBn: "মান্থলি",
      slug: `monthly-${Date.now()}`,
      durationDays: 30,
      price: 699,
      connectCount: 10,
      acceptProposalLimit: 0,
      isActive: true,
      ...overrides,
    };
    const res = await request.post("/api/v1/membership/plans").set(auth(superAdminSession.accessToken)).send(payload);
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return res.body.data;
  }

  async function makePack(overrides = {}) {
    const res = await request
      .post("/api/v1/membership/packs")
      .set(auth(superAdminSession.accessToken))
      .send({ name: `Pack-${Date.now()}`, connects: 10, price: 99, ...overrides });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return res.body.data;
  }

  describe("plans & packs catalog", () => {
    it("only staff can create plans/packs", async () => {
      const member = await registerUser(request);
      const denied = await request
        .post("/api/v1/membership/plans")
        .set(auth(member.accessToken))
        .send({ name: "Hack", nameBn: "h", slug: "hack", durationDays: 1, price: 1, connectCount: 0 });
      assert.equal(denied.status, 403);
      assert.equal(
        (await request.post("/api/v1/membership/packs").set(auth(adminToken)).send({ name: "x", connects: 1, price: 1 })).status,
        201
      );
    });

    it("lists active plans publicly", async () => {
      await makePlan();
      const res = await request.get("/api/v1/membership/plans");
      assert.equal(res.status, 200);
      assert.ok(res.body.data.length >= 1);
      assert.equal(res.body.data[0].price, 699);
    });
  });

  describe("orders & coupon math (integer BDT)", () => {
    it("applies a coupon percent exactly", async () => {
      const plan = await makePlan({ slug: `monthly-${Date.now()}`, price: 699 });
      await mongoose.model("Coupon").create({ code: "WELCOME20", discountPercent: 20, isActive: true });

      const member = await registerUser(request);
      const order = await request
        .post("/api/v1/orders")
        .set(auth(member.accessToken))
        .send({ kind: "PLAN", planId: plan.id, couponCode: "welcome20" });

      assert.equal(order.status, 201);
      assert.equal(order.body.data.subtotal, 699);
      assert.equal(order.body.data.discount, 139); // floor(699*20/100)
      assert.equal(order.body.data.total, 560);
      assert.equal(order.body.data.couponCode, "WELCOME20");
      assert.match(order.body.data.orderNo, /^ORD-\d{4}-\d{6}$/);
    });

    it("rejects unknown / exhausted coupons", async () => {
      const plan = await makePlan({ slug: `monthly-${Date.now()}` });
      const member = await registerUser(request);
      const bad = await request
        .post("/api/v1/orders")
        .set(auth(member.accessToken))
        .send({ kind: "PLAN", planId: plan.id, couponCode: "NOPE" });
      assert.equal(bad.status, 400);
      assert.equal(bad.body.errorCode, "INVALID_COUPON");
    });

    it("rejects malformed orders (missing ref)", async () => {
      const member = await registerUser(request);
      const res = await request.post("/api/v1/orders").set(auth(member.accessToken)).send({ kind: "PLAN" });
      assert.equal(res.status, 400);
    });
  });

  describe("payment (transactional grant)", () => {
    it("pays a plan order → active subscription + connect credits + invoice", async () => {
      const plan = await makePlan({ slug: `monthly-${Date.now()}`, durationDays: 30, connectCount: 10 });
      const member = await registerUser(request);

      const order = await request.post("/api/v1/orders").set(auth(member.accessToken)).send({ kind: "PLAN", planId: plan.id });
      assert.equal(order.status, 201);

      const pay = await request.post(`/api/v1/orders/${order.body.data.id}/pay`).set(auth(member.accessToken)).send({ paymentMethod: "BKASH" });
      assert.equal(pay.status, 200, JSON.stringify(pay.body));
      assert.equal(pay.body.data.status, "PAID");
      assert.match(pay.body.data.invoiceNo, /^INV-\d{4}-\d{6}$/);
      assert.match(pay.body.data.transactionId, /^SIM-/);

      const summary = await request.get("/api/v1/membership/me").set(auth(member.accessToken));
      assert.equal(summary.status, 200);
      assert.equal(summary.body.data.subscription.isActive, true);
      assert.equal(summary.body.data.connects.balance, 10);

      // Double payment is refused.
      const again = await request.post(`/api/v1/orders/${order.body.data.id}/pay`).set(auth(member.accessToken)).send({});
      assert.equal(again.status, 409);
      assert.equal(again.body.errorCode, "ALREADY_PAID");
    });

    it("extending an active subscription stacks from its expiry", async () => {
      const plan = await makePlan({ slug: `monthly-${Date.now()}`, durationDays: 30 });
      const member = await registerUser(request);

      const o1 = (await request.post("/api/v1/orders").set(auth(member.accessToken)).send({ kind: "PLAN", planId: plan.id })).body.data;
      await request.post(`/api/v1/orders/${o1.id}/pay`).set(auth(member.accessToken)).send({});
      const first = await request.get("/api/v1/membership/me").set(auth(member.accessToken));
      const expires1 = new Date(first.body.data.subscription.expiresAt);

      const o2 = (await request.post("/api/v1/orders").set(auth(member.accessToken)).send({ kind: "PLAN", planId: plan.id })).body.data;
      await request.post(`/api/v1/orders/${o2.id}/pay`).set(auth(member.accessToken)).send({});
      const second = await request.get("/api/v1/membership/me").set(auth(member.accessToken));
      const expires2 = new Date(second.body.data.subscription.expiresAt);

      assert.ok(expires2 > expires1);
      assert.equal(second.body.data.connects.balance, 20);
    });

    it("pack orders credit connects only", async () => {
      const pack = await makePack();
      const member = await registerUser(request);
      const order = (await request.post("/api/v1/orders").set(auth(member.accessToken)).send({ kind: "PACK", packId: pack.id })).body.data;
      const pay = await request.post(`/api/v1/orders/${order.id}/pay`).set(auth(member.accessToken)).send({});
      assert.equal(pay.status, 200);
      assert.match(pay.body.data.invoiceNo, /^INV-\d{4}-\d{6}$/);
    });
  });

  describe("order isolation", () => {
    it("users cannot see or pay each other's orders", async () => {
      const plan = await makePlan({ slug: `monthly-${Date.now()}` });
      const alice = await registerUser(request);
      const bob = await registerUser(request);

      const order = (await request.post("/api/v1/orders").set(auth(alice.accessToken)).send({ kind: "PLAN", planId: plan.id })).body.data;

      const peek = await request.get(`/api/v1/orders/${order.id}`).set(auth(bob.accessToken));
      assert.equal(peek.status, 403);

      const pay = await request.post(`/api/v1/orders/${order.id}/pay`).set(auth(bob.accessToken)).send({});
      assert.equal(pay.status, 404); // scoped to user -> not found
    });

    it("admin sees every order with customer info", async () => {
      const plan = await makePlan({ slug: `monthly-${Date.now()}` });
      const member = await registerUser(request);
      const order = (await request.post("/api/v1/orders").set(auth(member.accessToken)).send({ kind: "PLAN", planId: plan.id })).body.data;
      await request.post(`/api/v1/orders/${order.id}/pay`).set(auth(member.accessToken)).send({});

      const list = await request.get("/api/v1/orders").set(auth(adminToken));
      assert.equal(list.status, 200);
      assert.equal(list.body.pagination.total, 1);
      assert.equal(list.body.data[0].customer.email, member.user.email);
    });
  });

  describe("membership dashboard", () => {
    it("tracks biodata view visits and like counts", async () => {
      const plan = await makePlan({ slug: `monthly-${Date.now()}`, connectCount: 50 });
      const member = await registerUser(request);
      const order = (await request.post("/api/v1/orders").set(auth(member.accessToken)).send({ kind: "PLAN", planId: plan.id })).body.data;
      await request.post(`/api/v1/orders/${order.id}/pay`).set(auth(member.accessToken)).send({});

      const summary = await request.get("/api/v1/membership/me").set(auth(member.accessToken));
      assert.equal(summary.body.data.connects.balance, 50);
      assert.equal(summary.body.data.stats.biodataVisits, 0);
      assert.equal(summary.body.data.stats.likesReceived, 0);
      assert.ok(Array.isArray(summary.body.data.biodata));
    });
  });

  describe("admin user management", () => {
    it("lists, searches, updates and deactivates users", async () => {
      const member = await registerUser(request);
      const list = await request.get("/api/v1/users?search=member").set(auth(adminToken));
      assert.equal(list.status, 200);
      assert.equal(list.body.pagination.total, 1);

      // promote member to a plain staff-visible update (role USER->USER is trivial; flip status)
      const patch = await request
        .patch(`/api/v1/users/${member.user.id}`)
        .set(auth(adminToken))
        .send({ status: "PENDING" });
      assert.equal(patch.status, 200);

      // deactivated/pending user cannot login anymore
      const blocked = await request.post("/api/v1/auth/login").send({ email: member.user.email, password: "Passw0rd!" });
      assert.equal(blocked.status, 403);
    });

    it("a member cannot list other users (403)", async () => {
      const member = await registerUser(request);
      const res = await request.get("/api/v1/users").set(auth(member.accessToken));
      assert.equal(res.status, 403);
    });

    it("admin cannot create another admin; superadmin can", async () => {
      const res = await request
        .post("/api/v1/users")
        .set(auth(adminToken))
        .send({ firstName: "X", lastName: "Y", email: "x@test.dev", password: "Admin@12345", role: "ADMIN" });
      assert.equal(res.status, 403);

      const ok = await request
        .post("/api/v1/users")
        .set(auth(superAdminSession.accessToken))
        .send({ firstName: "X", lastName: "Y", email: "x@test.dev", password: "Admin@12345", role: "ADMIN" });
      assert.equal(ok.status, 201);
    });
  });

  describe("admin stats", () => {
    it("requires staff and returns aggregates", async () => {
      const member = await registerUser(request);
      const plan = await makePlan({ slug: `monthly-${Date.now()}` });
      const order = (await request.post("/api/v1/orders").set(auth(member.accessToken)).send({ kind: "PLAN", planId: plan.id })).body.data;
      await request.post(`/api/v1/orders/${order.id}/pay`).set(auth(member.accessToken)).send({});

      const denied = await request.get("/api/v1/admin/stats").set(auth(member.accessToken));
      assert.equal(denied.status, 403);

      const res = await request.get("/api/v1/admin/stats").set(auth(adminToken));
      assert.equal(res.status, 200);
      assert.equal(res.body.data.users.total, 3); // root + staff fixture + this member
      assert.ok(res.body.data.revenue.revenueBdt >= 699);
    });

    it("aggregates mission fields: today users, views, interests, messaging, payment statuses", async () => {
      // Two members with approved biodata so they can interact.
      const a = await registerUser(request);
      const b = await registerUser(request);
      const bios = [];
      for (const m of [a, b]) {
        await request.post("/api/v1/biodatas").set(auth(m.accessToken)).send({});
        await request.patch("/api/v1/biodatas/me").set(auth(m.accessToken)).send({
          firstName: "Tanvir", lastName: "Ahmed", gender: "MALE", religion: "Islam", maritalStatus: "UNMARRIED",
          birthYear: 1996, division: "ঢাকা", district: "ঢাকা", occupation: "ডাক্তার",
          education: "MBBS", mobile: "01712345678", agreed: true,
        });
        const sub = await request.post("/api/v1/biodatas/me/submit").set(auth(m.accessToken));
        assert.equal(sub.status, 200, JSON.stringify(sub.body));
        await request.patch(`/api/v1/biodatas/${sub.body.data.id}/status`).set(auth(adminToken)).send({ status: "APPROVED" });
        bios.push(sub.body.data.id);
      }

      // A likes B's biodata (1 interest, not mutual).
      const likeRes = await request.post(`/api/v1/biodatas/${bios[1]}/like`).set(auth(a.accessToken));
      assert.equal(likeRes.status, 201, JSON.stringify(likeRes.body));

      // A pays a plan (PAID), leaves a pending order too.
      const plan = await makePlan({ slug: `monthly-${Date.now()}` });
      const paid = (await request.post("/api/v1/orders").set(auth(a.accessToken)).send({ kind: "PLAN", planId: plan.id })).body.data;
      await request.post(`/api/v1/orders/${paid.id}/pay`).set(auth(a.accessToken)).send({});
      await request.post("/api/v1/orders").set(auth(a.accessToken)).send({ kind: "PLAN", planId: plan.id }); // stays PENDING

      // B buys the same plan too, then views A's biodata → viewCount bumps.
      const bOrder = (await request.post("/api/v1/orders").set(auth(b.accessToken)).send({ kind: "PLAN", planId: plan.id })).body.data;
      await request.post(`/api/v1/orders/${bOrder.id}/pay`).set(auth(b.accessToken)).send({});
      const view = await request.get(`/api/v1/biodatas/${bios[0]}`).set(auth(b.accessToken));
      assert.equal(view.status, 200, JSON.stringify(view.body));

      // A starts a conversation with B and sends an unread message.
      const convRes = await request.post("/api/v1/conversations").set(auth(a.accessToken)).send({ recipientId: b.user.id, text: "Assalamu alaikum" });
      assert.equal(convRes.status, 201, JSON.stringify(convRes.body));
      const conv = convRes.body.data.conversation;
      assert.ok(conv?.id);

      const res = await request.get("/api/v1/admin/stats").set(auth(adminToken));
      assert.equal(res.status, 200);
      const d = res.body.data;

      assert.equal(d.users.newToday, 4); // a, b + 2 fixtures created this run
      assert.ok(d.biodatas.totalViews >= 1);
      assert.equal(d.biodatas.hidden, 0);
      assert.equal(d.interests.sent, 1);
      assert.equal(d.interests.accepted, 0); // not mutual
      assert.ok(d.messaging.conversations >= 1);
      assert.equal(d.messaging.unreadMessages, 1);
      assert.equal(d.payments.pendingOrders, 1);
      assert.equal(d.payments.failedOrders, 0);
      assert.ok(d.membership.activeSubscriptions >= 1);
    });

    it("marks mutual interests as accepted", async () => {
      const a = await registerUser(request);
      const b = await registerUser(request);
      const bios = [];
      for (const m of [a, b]) {
        await request.post("/api/v1/biodatas").set(auth(m.accessToken)).send({});
        await request.patch("/api/v1/biodatas/me").set(auth(m.accessToken)).send({
          firstName: "Mehedi", lastName: "Hasan", gender: "MALE", religion: "Islam", maritalStatus: "UNMARRIED",
          birthYear: 1995, division: "ঢাকা", district: "ঢাকা", occupation: "ইঞ্জিনিয়ার",
          education: "BSc", mobile: "01812345678", agreed: true,
        });
        const sub = await request.post("/api/v1/biodatas/me/submit").set(auth(m.accessToken));
        assert.equal(sub.status, 200, JSON.stringify(sub.body));
        await request.patch(`/api/v1/biodatas/${sub.body.data.id}/status`).set(auth(adminToken)).send({ status: "APPROVED" });
        bios.push(sub.body.data.id);
      }
      await request.post(`/api/v1/biodatas/${bios[1]}/like`).set(auth(a.accessToken));
      await request.post(`/api/v1/biodatas/${bios[0]}/like`).set(auth(b.accessToken));

      const res = await request.get("/api/v1/admin/stats").set(auth(adminToken));
      assert.equal(res.body.data.interests.sent, 2);
      assert.equal(res.body.data.interests.accepted, 1);
    });
  });
});
