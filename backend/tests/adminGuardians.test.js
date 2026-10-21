/**
 * Admin guardian review — অ্যাডমিন গার্ডিয়ান-লিংক তালিকা ও GUARDIAN_* অডিট-ট্রেইল
 * (রিয়েল HTTP)।
 *
 * কভার: role-gate (anonymous 401 / সদস্য 403 / staff 200), list shape (member
 * populated, কোনো লিংক-টোকেন/hash ফাঁস নয়), status ফিল্টার, q সার্চ, pagination,
 * audit prefix=GUARDIAN_ ফিল্টার (শুধু গার্ডিয়ান-পরিবার), exact action ফিল্টার
 * অক্ষত।
 */
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  startServer,
  stopServer,
  clearDb,
  registerUser,
  createSuperAdmin,
  createStaff,
  auth,
} from "./helpers.js";

describe("ADMIN GUARDIANS REVIEW", () => {
  let request;
  let staffToken;

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
    staffToken = staff.accessToken;
  });

  const declareBody = (over = {}) => ({
    name: "আব্দুল করিম",
    relation: "FATHER",
    contactPhone: "+8801700000001",
    consentChannel: "SMS",
    ...over,
  });

  /** member declare → DECLARED লিংক (গার্ডিয়ান-লিংক তৈরির সবচেয়ে সহজ পথ)। */
  async function declareLink(member, over = {}) {
    const res = await request
      .post("/api/v1/guardian/declare")
      .set(auth(member.accessToken))
      .send(declareBody(over));
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return res.body.data;
  }

  /** declare → session → consent → verify — VERIFIED লিংক। */
  async function verifiedLink(member, over = {}) {
    const d = await declareLink(member, over);
    const opened = await request.post("/api/v1/guardian/session").send({ token: d.consentToken });
    assert.equal(opened.status, 201, JSON.stringify(opened.body));
    const gs = opened.body.data.guardianSession;
    const c = await request.post("/api/v1/guardian/consent").set("Authorization", `Bearer ${gs}`).send({});
    assert.equal(c.status, 200, JSON.stringify(c.body));
    const v = await request.post("/api/v1/guardian/verify").set("Authorization", `Bearer ${gs}`).send({});
    assert.equal(v.status, 200, JSON.stringify(v.body));
    return d;
  }

  const list = (token, params = {}) => request.get("/api/v1/admin/guardians").set(auth(token)).query(params);

  it("role gate: anonymous 401; সাধারণ সদস্য 403; staff 200", async () => {
    const anon = await request.get("/api/v1/admin/guardians");
    assert.equal(anon.status, 401);

    const member = await registerUser(request);
    const asMember = await list(member.accessToken);
    assert.equal(asMember.status, 403, JSON.stringify(asMember.body));

    const asStaff = await list(staffToken);
    assert.equal(asStaff.status, 200, JSON.stringify(asStaff.body));
    assert.deepEqual(asStaff.body.data, [], "খালি DB-তে খালি তালিকা");
    assert.equal(asStaff.body.pagination.total, 0);
  });

  it("list shape: member populated, লিংক-টোকেন/hash ফাঁস নয়, pagination বসে", async () => {
    const member = await registerUser(request);
    await declareLink(member, { name: "রহিম উদ্দিন", contactPhone: "+8801700000002" });
    await verifiedLink(await registerUser(request), { name: "করিম মিয়া" });

    const res = await list(staffToken);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 2);
    assert.equal(res.body.pagination.total, 2);

    const row = res.body.data.find((g) => g.name === "রহিম উদ্দিন");
    assert.ok(row, "সার্চ-নামে রো পাওয়া যায়");
    assert.equal(row.status, "DECLARED");
    assert.equal(row.relation, "FATHER");
    assert.ok(row.member, "সদস্য populate হয়");
    assert.equal(row.member.email, member.user.email, "সদস্যের ইমেইল populate হয়");
    assert.ok(row.member.name, "সদস্যের নাম আছে");

    // কোনো টোকেন/hash/secret ফাঁস নয়
    const raw = JSON.stringify(res.body.data);
    assert.ok(!raw.includes("consentToken"), "consentToken ফাঁস নয়");
    assert.ok(!raw.includes("consentLink"), "consentLink ফাঁস নয়");
    assert.ok(!raw.includes("consentLinkHash"), "hash ফাঁস নয়");
    assert.ok(!("consentLinkHash" in row), "hash ফিল্ডই নেই");
  });

  it("status filter, q search, pagination", async () => {
    const a = await registerUser(request);
    const b = await registerUser(request);
    const c = await registerUser(request);
    await declareLink(a, { name: "হাসান আলী", contactPhone: "+8801711111111" });
    await verifiedLink(b, { name: "জসিম উদ্দিন", contactPhone: "+8801722222222" });
    await declareLink(c, { name: "ফরিদ আহমেদ", contactPhone: "+8801733333333" });

    // status ফিল্টার
    const verified = await list(staffToken, { status: "VERIFIED" });
    assert.equal(verified.status, 200);
    assert.equal(verified.body.data.length, 1);
    assert.equal(verified.body.data[0].status, "VERIFIED");
    assert.ok(verified.body.data[0].verifiedAt, "verifiedAt বসে");

    const declared = await list(staffToken, { status: "DECLARED" });
    assert.equal(declared.body.data.length, 2);

    // q — গার্ডিয়ানের নাম
    const byName = await list(staffToken, { q: "হাসান" });
    assert.equal(byName.body.data.length, 1);
    assert.equal(byName.body.data[0].name, "হাসান আলী");

    // q — মোবাইল
    const byPhone = await list(staffToken, { q: "01722222222" });
    assert.equal(byPhone.body.data.length, 1);
    assert.equal(byPhone.body.data[0].name, "জসিম উদ্দিন");

    // q — সদস্যের ইমেইল (register ফেরতে ইমেইল data.user.email-এ)
    const byEmail = await list(staffToken, { q: c.user.email });
    assert.equal(byEmail.body.data.length, 1, JSON.stringify(byEmail.body));
    assert.equal(byEmail.body.data[0].name, "ফরিদ আহমেদ");

    // pagination — limit:2 → পৃষ্ঠা ২-তে ১টি
    const page1 = await list(staffToken, { limit: 2, page: 1 });
    assert.equal(page1.body.data.length, 2);
    assert.equal(page1.body.pagination.totalPages, 2);
    const page2 = await list(staffToken, { limit: 2, page: 2 });
    assert.equal(page2.body.data.length, 1);
    assert.equal(page2.body.pagination.page, 2);
  });

  it("audit: prefix=GUARDIAN_ শুধু গার্ডিয়ান-অ্যাকশন; exact action ফিল্টার অক্ষত; সদস্য 403", async () => {
    const member = await registerUser(request);
    await verifiedLink(member);
    await request.post("/api/v1/guardian/revoke").set(auth(member.accessToken)).send({ reason: "test" });

    // GUARDIAN_* prefix
    const prefixed = await request
      .get("/api/v1/admin/audit/events")
      .set(auth(staffToken))
      .query({ prefix: "GUARDIAN_", limit: 100 });
    assert.equal(prefixed.status, 200, JSON.stringify(prefixed.body));
    assert.ok(prefixed.body.data.length >= 5, "declare/session/consent/verify/revoke সব আছে");
    for (const e of prefixed.body.data) {
      assert.ok(e.action.startsWith("GUARDIAN_"), `prefix ফিল্টারে বাইরের অ্যাকশন: ${e.action}`);
    }

    // exact action — prefix-এর আগের আচরণ অক্ষত
    const exact = await request
      .get("/api/v1/admin/audit/events")
      .set(auth(staffToken))
      .query({ action: "GUARDIAN_REVOKE" });
    assert.equal(exact.status, 200);
    assert.equal(exact.body.data.length, 1);
    assert.equal(exact.body.data[0].action, "GUARDIAN_REVOKE");

    // prefix ছাড়া — সব অ্যাকশন মিশে আছে (গার্ডিয়ান ছাড়াও)
    const all = await request.get("/api/v1/admin/audit/events").set(auth(staffToken));
    assert.ok(all.body.data.length >= prefixed.body.data.length);

    // সাধারণ সদস্য অডিট পড়তে পারে না
    const asMember = await request
      .get("/api/v1/admin/audit/events")
      .set(auth(member.accessToken))
      .query({ prefix: "GUARDIAN_" });
    assert.equal(asMember.status, 403);
  });
});
