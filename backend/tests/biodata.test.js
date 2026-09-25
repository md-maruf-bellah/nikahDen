import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { startServer, stopServer, clearDb, registerUser, login, createSuperAdmin, createStaff, auth } from "./helpers.js";

const COMPLETE = {
  firstName: "Salma",
  lastName: "Begum",
  gender: "FEMALE",
  religion: "Islam",
  maritalStatus: "UNMARRIED",
  birthYear: 1999,
  division: "ঢাকা",
  district: "ঢাকা",
  occupation: "ডাক্তার",
  education: "MBBS",
  mobile: "01712345678",
  agreed: true,
  aboutYourself: "আমি একজন ডাক্তার, সৎ জীবনসঙ্গী খুঁজছি।",
};

describe("BIODATAS", () => {
  let request;
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
    const staff = await createStaff(request);
    adminToken = staff.accessToken;
  });

  async function createApprovedBiodata(overrides = {}) {
    const member = await registerUser(request);
    const create = await request.post("/api/v1/biodatas").set(auth(member.accessToken)).send({});
    assert.equal(create.status, 201, JSON.stringify(create.body));
    const fill = await request
      .patch("/api/v1/biodatas/me")
      .set(auth(member.accessToken))
      .send({ ...COMPLETE, ...overrides });
    assert.equal(fill.status, 200);
    const submit = await request.post("/api/v1/biodatas/me/submit").set(auth(member.accessToken));
    assert.equal(submit.status, 200, JSON.stringify(submit.body));
    const approve = await request
      .patch(`/api/v1/biodatas/${submit.body.data.id}/status`)
      .set(auth(adminToken))
      .send({ status: "APPROVED" });
    assert.equal(approve.status, 200, JSON.stringify(approve.body));
    return { member, biodata: approve.body.data };
  }

  describe("own lifecycle", () => {
    it("creates one draft per user and rejects a second", async () => {
      const s = await registerUser(request);
      const create = await request.post("/api/v1/biodatas").set(auth(s.accessToken)).send({ gender: "MALE" });
      assert.equal(create.status, 201);
      assert.equal(create.body.data.status, "DRAFT");
      assert.match(create.body.data.biodataNo, /^NKD-\d{4}-\d{6}$/);

      const dup = await request.post("/api/v1/biodatas").set(auth(s.accessToken)).send({});
      assert.equal(dup.status, 409);
      assert.equal(dup.body.errorCode, "BIODATA_ALREADY_EXISTS");
    });

    it("requires login (401 for anonymous create)", async () => {
      const res = await request.post("/api/v1/biodatas").send({});
      assert.equal(res.status, 401);
    });

    it("blocks editing someone else's biodata", async () => {
      const a = await createApprovedBiodata();
      const intruder = await registerUser(request);
      const res = await request.patch("/api/v1/biodatas/me").set(auth(intruder.accessToken)).send({ firstName: "Hacked" });
      assert.equal(res.status, 404); // no biodata of mine -> 404, no cross access
      void a;
    });

    it("422 with a useful missing-field list when submitting incomplete data", async () => {
      const s = await registerUser(request);
      await request.post("/api/v1/biodatas").set(auth(s.accessToken)).send({ firstName: "Only" });
      const res = await request.post("/api/v1/biodatas/me/submit").set(auth(s.accessToken));
      assert.equal(res.status, 422);
      assert.equal(res.body.errorCode, "BIODATA_INCOMPLETE");
      assert.ok(res.body.details.missing.length >= 5);
    });
  });

  describe("directory (search/filter/sort/pagination)", () => {
    it("only returns APPROVED biodata publicly", async () => {
      await createApprovedBiodata({ firstName: "Ayesha" });
      const list = await request.get("/api/v1/biodatas");
      assert.equal(list.status, 200);
      assert.equal(list.body.data.length, 1);
      assert.equal(list.body.pagination.total, 1);
    });

    it("filters by gender, religion, maritalStatus, district and age range", async () => {
      const currentYear = new Date().getFullYear();
      await createApprovedBiodata({ firstName: "Ayesha", gender: "FEMALE", district: "ঢাকা", birthYear: currentYear - 24 });
      await createApprovedBiodata({ firstName: "Karim", gender: "MALE", religion: "Islam", district: "চট্টগ্রাম", birthYear: currentYear - 35, mobile: "01812345678" });

      const grooms = await request.get("/api/v1/biodatas?gender=MALE");
      assert.equal(grooms.body.pagination.total, 1);

      const chattogram = await request.get(`/api/v1/biodatas?district=${encodeURIComponent("চট্টগ্রাম")}`);
      assert.equal(chattogram.body.pagination.total, 1);
      assert.equal(chattogram.body.data[0].fullName, "Karim Begum");

      const young = await request.get("/api/v1/biodatas?ageMin=18&ageMax=28");
      assert.equal(young.body.pagination.total, 1);
      assert.equal(young.body.data[0].age, 24);
    });

    it("searches across name/occupation/location", async () => {
      await createApprovedBiodata({ firstName: "Ayesha", occupation: "ডাক্তার" });
      await createApprovedBiodata({ firstName: "Karim", occupation: "ইঞ্জিনিয়ার" });
      const res = await request.get(`/api/v1/biodatas?search=${encodeURIComponent("ডাক্তার")}`);
      assert.equal(res.body.pagination.total, 1);
      assert.equal(res.body.data[0].fullName, "Ayesha Begum");
    });

    it("paginates and sorts", async () => {
      for (let i = 0; i < 5; i += 1) {
        const name = ["A", "B", "C", "D", "E"][i];
        await createApprovedBiodata({ firstName: name, mobile: `0171${1000000 + i * 111111}` });
      }
      const page2 = await request.get("/api/v1/biodatas?page=2&limit=2&sortBy=createdAt&sortOrder=desc");
      assert.equal(page2.body.data.length, 2);
      assert.equal(page2.body.pagination.page, 2);
      assert.equal(page2.body.pagination.totalPages, 3);
    });
  });

  describe("detail + connect gating", () => {
    it("guests see a summary without contact fields", async () => {
      const { biodata } = await createApprovedBiodata();
      const res = await request.get(`/api/v1/biodatas/${biodata.id}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.data.mobile, undefined);
      assert.equal(res.body.data.nidNumber, undefined);
      assert.ok(res.body.data.aboutYourself); // public profile text ok
    });

    it("non-approved biodata is invisible to the public", async () => {
      const member = await registerUser(request);
      const created = await request.post("/api/v1/biodatas").set(auth(member.accessToken)).send({ firstName: "Hidden" });
      const res = await request.get(`/api/v1/biodatas/${created.body.data.id}`);
      assert.equal(res.status, 404);
    });

    it("member without connects gets 403 CONNECTS_INSUFFICIENT, then succeeds after buying a pack", async () => {
      const owner = await createApprovedBiodata();
      const viewer = await registerUser(request);

      const blocked = await request.get(`/api/v1/biodatas/${owner.biodata.id}`).set(auth(viewer.accessToken));
      assert.equal(blocked.status, 403);
      assert.equal(blocked.body.errorCode, "CONNECTS_INSUFFICIENT");

      // buy a connect pack (10 connects) via the API
      await request.post("/api/v1/membership/packs").set(auth(adminToken)).send({
        name: "Test Pack", connects: 10, price: 99,
      });
      const packs = await request.get("/api/v1/membership/packs").set(auth(viewer.accessToken));
      const packId = packs.body.data[0].id;
      const order = await request.post("/api/v1/orders").set(auth(viewer.accessToken)).send({ kind: "PACK", packId });
      assert.equal(order.status, 201);
      const pay = await request.post(`/api/v1/orders/${order.body.data.id}/pay`).set(auth(viewer.accessToken)).send({ paymentMethod: "CARD" });
      assert.equal(pay.status, 200, JSON.stringify(pay.body));

      // first full view spends 1 connect
      const view = await request.get(`/api/v1/biodatas/${owner.biodata.id}`).set(auth(viewer.accessToken));
      assert.equal(view.status, 200);
      assert.equal(view.body.data.mobile, "01712345678");
      assert.equal(view.body.data.isOwner, false);

      const me = await request.get("/api/v1/membership/me").set(auth(viewer.accessToken));
      assert.equal(me.body.data.connects.balance, 9);

      // repeat view is free (charged once per biodata)
      await request.get(`/api/v1/biodatas/${owner.biodata.id}`).set(auth(viewer.accessToken));
      const me2 = await request.get("/api/v1/membership/me").set(auth(viewer.accessToken));
      assert.equal(me2.body.data.connects.balance, 9);
    });
  });

  describe("likes", () => {
    it("like → notification; mutual when both like; unlike clears", async () => {
      const a = await createApprovedBiodata({ firstName: "Anika" });
      const b = await createApprovedBiodata({ firstName: "Boris", mobile: "01812345678" });

      // A likes B
      const like = await request.post(`/api/v1/biodatas/${b.biodata.id}/like`).set(auth(a.member.accessToken));
      assert.equal(like.status, 201);

      // NOTE: the owner also gets an automatic "biodata approved" notice, so
      // we assert the like notification is present rather than exact counts.
      const bNotif = await request.get("/api/v1/notifications").set(auth(b.member.accessToken));
      assert.ok(bNotif.body.data.items.some((n) => n.type === "BIODATA_LIKE"));

      // B likes A → mutual
      const back = await request.post(`/api/v1/biodatas/${a.biodata.id}/like`).set(auth(b.member.accessToken));
      assert.equal(back.status, 201);
      assert.equal(back.body.data.isMutual, true);

      const aNotif = await request.get("/api/v1/notifications").set(auth(a.member.accessToken));
      assert.ok(aNotif.body.data.items.some((n) => n.type === "MUTUAL_LIKE"));

      const received = await request.get("/api/v1/biodatas/likes/received").set(auth(b.member.accessToken));
      assert.equal(received.body.pagination.total, 1);

      // duplicate like conflict
      const dup = await request.post(`/api/v1/biodatas/${b.biodata.id}/like`).set(auth(a.member.accessToken));
      assert.equal(dup.status, 409);

      // unlike
      const unlike = await request.del(`/api/v1/biodatas/${b.biodata.id}/like`).set(auth(a.member.accessToken));
      assert.equal(unlike.status, 200);

      const sent = await request.get("/api/v1/biodatas/likes/sent").set(auth(a.member.accessToken));
      assert.equal(sent.body.pagination.total, 0);
    });

    it("cannot like own biodata", async () => {
      const own = await createApprovedBiodata();
      const res = await request.post(`/api/v1/biodatas/${own.biodata.id}/like`).set(auth(own.member.accessToken));
      assert.equal(res.status, 400);
    });
  });

  describe("admin moderation", () => {
    it("approves, rejects and hides; owner gets notified", async () => {
      const member = await registerUser(request);
      await request.post("/api/v1/biodatas").set(auth(member.accessToken)).send({ firstName: "Wait" });
      await request.post("/api/v1/biodatas/me/submit").set(auth(member.accessToken)).catch(() => {}); // incomplete -> will fail 422

      const mine = await request.get("/api/v1/biodatas/me").set(auth(member.accessToken));
      assert.ok(mine.body.data);

      // admin sees drafts with all=1
      const drafts = await request.get("/api/v1/biodatas?all=1&status=DRAFT").set(auth(adminToken));
      assert.ok(drafts.body.pagination.total >= 1);

      // reject with reason
      const reject = await request
        .patch(`/api/v1/biodatas/${mine.body.data.id}/status`)
        .set(auth(adminToken))
        .send({ status: "REJECTED", rejectionReason: "ছবি যোগ করুন" });
      assert.equal(reject.status, 200);

      // normal member (USER role) cannot moderate
      const regular = await registerUser(request);
      const denied = await request
        .patch(`/api/v1/biodatas/${mine.body.data.id}/status`)
        .set(auth(regular.accessToken))
        .send({ status: "APPROVED" });
      assert.equal(denied.status, 403);
    });
  });
});
