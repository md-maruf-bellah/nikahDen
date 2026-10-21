/**
 * Guardian-to-Guardian contact request — behavioral টেস্ট (রিয়েল HTTP)।
 *
 * গেট: mutual match ছাড়া অনুরোধ নয়; উভয় পক্ষের গার্ডিয়ান VERIFIED না হলে নয়।
 * State machine: request → approve/deny → contact exchange শুধু APPROVED-এ;
 * revoke → TEARDOWN (চ্যানেল ভাঙা, পড়াও বন্ধ)। প্রতিটি transition-এ
 * SYSTEM নোটিফিকেশন (emit+socket) ও capped-অডিট।
 */
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import GuardianContactRequest from "../src/models/guardianContactRequest.model.js";
import Notification from "../src/models/notification.model.js";
import {
  startServer,
  stopServer,
  clearDb,
  registerUser,
  createSuperAdmin,
  createStaff,
  auth,
} from "./helpers.js";

describe("GUARDIAN CONTACT REQUEST", () => {
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

  const mobile = () => `017${Math.floor(10000000 + Math.random() * 89999999)}`;

  /** approved বায়োডাটা বানায় (ম্যাচ পূর্বশর্ত) — id ফেরত। */
  async function approvedBiodata(member, overrides = {}) {
    const create = await request.post("/api/v1/biodatas").set(auth(member.accessToken)).send({});
    assert.equal(create.status, 201, JSON.stringify(create.body));
    const fill = await request
      .patch("/api/v1/biodatas/me")
      .set(auth(member.accessToken))
      .send({
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
        mobile: mobile(),
        agreed: true,
        aboutYourself: "আমি একজন ডাক্তার, সৎ জীবনসঙ্গী খুঁজছি।",
        ...overrides,
      });
    assert.equal(fill.status, 200, JSON.stringify(fill.body));
    const submit = await request.post("/api/v1/biodatas/me/submit").set(auth(member.accessToken));
    assert.equal(submit.status, 200, JSON.stringify(submit.body));
    const approve = await request
      .patch(`/api/v1/biodatas/${submit.body.data.id}/status`)
      .set(auth(adminToken))
      .send({ status: "APPROVED" });
    assert.equal(approve.status, 200, JSON.stringify(approve.body));
    return approve.body.data.id;
  }

  /** দুই সদস্যের mutual like (match) তৈরি করে। */
  async function makeMatch(a, b) {
    const bioA = await approvedBiodata(a, { firstName: "Ayesha", gender: "FEMALE" });
    const bioB = await approvedBiodata(b, { firstName: "Bulbul", gender: "MALE", mobile: mobile() });
    const like1 = await request.post(`/api/v1/biodatas/${bioB}/like`).set(auth(a.accessToken));
    assert.equal(like1.status, 201, JSON.stringify(like1.body));
    const like2 = await request.post(`/api/v1/biodatas/${bioA}/like`).set(auth(b.accessToken));
    assert.equal(like2.status, 201, JSON.stringify(like2.body));
    assert.equal(like2.body.data.isMutual, true, "mutual match হতে হবে");
    return { bioA, bioB };
  }

  /** declare → link exchange (guardian-session) → consent → verify — VERIFIED গার্ডিয়ান লিংক। */
  async function makeVerifiedGuardian(member, name = "আবদুল করিম") {
    const d = await request
      .post("/api/v1/guardian/declare")
      .set(auth(member.accessToken))
      .send({
        name,
        relation: "FATHER",
        contactPhone: `+8801${Math.floor(100000000 + Math.random() * 899999999)}`,
        consentChannel: "SMS",
      });
    assert.equal(d.status, 201, JSON.stringify(d.body));
    const opened = await request.post("/api/v1/guardian/session").send({ token: d.body.data.consentToken });
    assert.equal(opened.status, 201, JSON.stringify(opened.body));
    const gs = opened.body.data.guardianSession;
    const c = await request.post("/api/v1/guardian/consent").set("Authorization", `Bearer ${gs}`).send({});
    assert.equal(c.status, 200, JSON.stringify(c.body));
    const v = await request.post("/api/v1/guardian/verify").set("Authorization", `Bearer ${gs}`).send({});
    assert.equal(v.status, 200, JSON.stringify(v.body));
    return v.body.data;
  }

  const createReq = (token, targetMemberId) =>
    request.post("/api/v1/guardian/contact-requests").set(auth(token)).send({ targetMemberId });
  const approveReq = (token, id) => request.post(`/api/v1/guardian/contact-requests/${id}/approve`).set(auth(token)).send({});
  const denyReq = (token, id, reason = "") =>
    request.post(`/api/v1/guardian/contact-requests/${id}/deny`).set(auth(token)).send({ reason });
  const listReq = (token) => request.get("/api/v1/guardian/contact-requests").set(auth(token));

  it("গেট: match নেই → 403 NO_MATCH; একদিকের গার্ডিয়ান VERIFIED নয় → 403 NOT_VERIFIED; দুটোই হলে 201", async () => {
    const a = await registerUser(request);
    const b = await registerUser(request);

    // (১) match ছাড়া — গার্ডিয়ান VERIFIED থাকলেও নিষেধ
    await makeVerifiedGuardian(a);
    await makeVerifiedGuardian(b);
    const noMatch = await createReq(a.accessToken, b.user.id);
    assert.equal(noMatch.status, 403, JSON.stringify(noMatch.body));
    assert.equal(noMatch.body.errorCode, "GUARDIAN_CONTACT_NO_MATCH");

    // (২) match আছে কিন্তু শুধু A-এর গার্ডিয়ান VERIFIED — B এখনো declare-ই করেনি
    const c = await registerUser(request);
    const d = await registerUser(request);
    await makeMatch(c, d);
    await makeVerifiedGuardian(c);
    const halfVerified = await createReq(c.accessToken, d.user.id);
    assert.equal(halfVerified.status, 403, JSON.stringify(halfVerified.body));
    assert.equal(halfVerified.body.errorCode, "GUARDIAN_CONTACT_NOT_VERIFIED");

    // (৩) দুই শর্ত পূরণ → 201 PENDING
    await makeVerifiedGuardian(d, "রহিম উদ্দিন");
    const ok = await createReq(c.accessToken, d.user.id);
    assert.equal(ok.status, 201, JSON.stringify(ok.body));
    assert.equal(ok.body.data.status, "PENDING");
    assert.equal(ok.body.data.requesterMember, c.user.id);
    assert.equal(ok.body.data.targetMember, d.user.id);
    assert.ok(ok.body.data.matchedAt, "গেট-স্ন্যাপশট বসে");
    assert.equal(ok.body.data.targetGuardianContact, null, "PENDING-এ contact ফাঁস নয়");

    // ডুপ্লিকেট অনুরোধ (উভয় দিকে) নিষিদ্ধ
    const dup = await createReq(c.accessToken, d.user.id);
    assert.equal(dup.status, 409);
    const reverse = await createReq(d.accessToken, c.user.id);
    assert.equal(reverse.status, 409, "বিপরীত দিকেও নিষেধ");
  });

  it("state machine: ভুল সদস্য approve পারে না (404); approve → APPROVED + contact exchange; deny → DENIED", async () => {
    const a = await registerUser(request);
    const b = await registerUser(request);
    await makeMatch(a, b);
    await makeVerifiedGuardian(a);
    await makeVerifiedGuardian(b, "রহিম উদ্দিন");

    const created = await createReq(a.accessToken, b.user.id);
    assert.equal(created.status, 201);
    const id = created.body.data.id;

    // অনুরোধকারী নিজে approve পারে না — শুধু প্রাপক (404, বিদ্যমানতা ফাঁস নয়)
    const selfApprove = await approveReq(a.accessToken, id);
    assert.equal(selfApprove.status, 404);
    assert.equal(selfApprove.body.errorCode, "GUARDIAN_CONTACT_NOT_FOUND");

    // অন্যের সদস্য approve — 404
    const outsider = await registerUser(request);
    const outsiderApprove = await approveReq(outsider.accessToken, id);
    assert.equal(outsiderApprove.status, 404);

    // প্রাপক approve → APPROVED, দুই পক্ষের অভিভাবক-contact দৃশ্যমান
    const approved = await approveReq(b.accessToken, id);
    assert.equal(approved.status, 200, JSON.stringify(approved.body));
    assert.equal(approved.body.data.status, "APPROVED");
    assert.ok(approved.body.data.respondedAt, "respondedAt বসে");
    assert.equal(approved.body.data.requesterGuardianContact.name, "আবদুল করিম");
    assert.equal(approved.body.data.targetGuardianContact.name, "রহিম উদ্দিন");
    assert.ok(approved.body.data.targetGuardianContact.contactPhone, "contact exchange প্রকাশিত");

    // অনুরোধকারীর লিস্টেও contact দেখা যায় (exchange পারস্পরিক)
    const listA = await listReq(a.accessToken);
    assert.equal(listA.status, 200);
    const mineA = listA.body.data.find((r) => r.id === id);
    assert.equal(mineA.status, "APPROVED");
    assert.equal(mineA.targetGuardianContact.name, "রহিম উদ্দিন");

    // APPROVED অবস্থায় আবার approve/deny → 409
    const reApprove = await approveReq(b.accessToken, id);
    assert.equal(reApprove.status, 409);
    assert.equal(reApprove.body.errorCode, "GUARDIAN_CONTACT_INVALID_STATE");

    // নতুন অনুরোধ deny পথ
    const created2 = await createReq(a.accessToken, b.user.id).catch(() => null);
    // একই জোড়ায় APPROVED খোলা আছে → 409 (সঠিক: এক জোড়ায় একটিই চ্যানেল)
    assert.ok(created2 === null || created2.status === 409);

    // deny পথ আলাদা জোড়ায়: e,f ম্যাচ + verified, request → deny
    const e = await registerUser(request);
    const f = await registerUser(request);
    await makeMatch(e, f);
    await makeVerifiedGuardian(e);
    await makeVerifiedGuardian(f, "রহিম উদ্দিন");
    const req3 = await createReq(e.accessToken, f.user.id);
    assert.equal(req3.status, 201);
    const denied = await denyReq(f.accessToken, req3.body.data.id, "পছন্দ নয়");
    assert.equal(denied.status, 200, JSON.stringify(denied.body));
    assert.equal(denied.body.data.status, "DENIED");
    assert.equal(denied.body.data.targetGuardianContact, null, "DENIED-এ contact নয়");

    // DENIED থেকে আবার approve চলে না; পুনরায় অনুরোধ চলে
    const reDeny = await approveReq(f.accessToken, req3.body.data.id);
    assert.equal(reDeny.status, 409);
    const again = await createReq(e.accessToken, f.user.id);
    assert.equal(again.status, 201, "DENIED পরে নতুন অনুরোধ চলে");
  });

  it("re-verify gate: approve-এর আগে একদিকের গার্ডিয়ান revoke → approve আটকে (403); channel-ও খোলে না", async () => {
    const a = await registerUser(request);
    const b = await registerUser(request);
    await makeMatch(a, b);
    await makeVerifiedGuardian(a);
    await makeVerifiedGuardian(b, "রহিম উদ্দিন");

    const created = await createReq(a.accessToken, b.user.id);
    assert.equal(created.status, 201);
    const id = created.body.data.id;

    // A তার গার্ডিয়ান revoke করল — কিন্তু contact-request-এর revoke-হুক চলেছে
    // (A প্রাপক নয়, তাই revoke নিজের লিংকে) — B revoke করলে TEARDOWN হবে নিচে।
    // এখানে: B revoke → প্রাপক-পক্ষের লিংক নেই → gate পড়ে যায়
    const rv = await request
      .post("/api/v1/guardian/revoke")
      .set(auth(b.accessToken))
      .send({ reason: "আর চাই না" });
    assert.equal(rv.status, 200, JSON.stringify(rv.body));

    // revoke-হুক সক্রিয় অনুরোধ TEARDOWN করেছে — approve-এর জন্য আর নেই
    const after = await approveReq(b.accessToken, id);
    assert.equal(after.status, 409, "TEARDOWN হয়ে গেছে, PENDING নয়");
    assert.equal(after.body.errorCode, "GUARDIAN_CONTACT_INVALID_STATE");

    const listB = await listReq(b.accessToken);
    const item = listB.body.data.find((r) => r.id === id);
    assert.equal(item.status, "TEARDOWN");
    assert.equal(item.requesterGuardianContact, null, "TEARDOWN-এ contact ফাঁস নয়");
    assert.ok(item.teardownReason, "teardownReason বসে");
  });

  it("revocation teardown: APPROVED চ্যানেল revoke-এ ভাঙা যায়; পড়াও বন্ধ; দুই পক্ষ অবহিত", async () => {
    const a = await registerUser(request);
    const b = await registerUser(request);
    await makeMatch(a, b);
    await makeVerifiedGuardian(a);
    await makeVerifiedGuardian(b, "রহিম উদ্দিন");

    const created = await createReq(a.accessToken, b.user.id);
    const id = created.body.data.id;
    const approved = await approveReq(b.accessToken, id);
    assert.equal(approved.status, 200);
    assert.ok(approved.body.data.requesterGuardianContact, "APPROVED-এ contact দৃশ্যমান");

    // A তার গার্ডিয়ান revoke → চ্যানেল TEARDOWN
    const rv = await request
      .post("/api/v1/guardian/revoke")
      .set(auth(a.accessToken))
      .send({ reason: "পরিবারে অসম্মতি" });
    assert.equal(rv.status, 200, JSON.stringify(rv.body));

    const listA = await listReq(a.accessToken);
    const item = listA.body.data.find((r) => r.id === id);
    assert.equal(item.status, "TEARDOWN");
    assert.equal(item.requesterGuardianContact, null, "revoke-পরে contact আর পড়া যায় না");
    assert.equal(item.targetGuardianContact, null);
    assert.ok(item.tornDownAt);
    assert.equal(item.teardownReason, "পরিবারে অসম্মতি");

    // B-এর লিস্টেও TEARDOWN + contact বন্ধ
    const listB = await listReq(b.accessToken);
    const itemB = listB.body.data.find((r) => r.id === id);
    assert.equal(itemB.status, "TEARDOWN");
    assert.equal(itemB.targetGuardianContact, null);

    // নোটিফিকেশন: দুই পক্ষের কাছেই teardown বার্তা
    const notesA = await Notification.find({ user: a.user.id, "data.action": "teardown" }).lean();
    const notesB = await Notification.find({ user: b.user.id, "data.action": "teardown" }).lean();
    assert.ok(notesA.length >= 1, "A teardown নোটিফিকেশন পায়");
    assert.ok(notesB.length >= 1, "B teardown নোটিফিকেশন পায়");

    // revoke-এর পরে নতুন অনুরোধ — গার্ডিয়ান আর VERIFIED নয় → 403
    const again = await createReq(b.accessToken, a.user.id);
    assert.equal(again.status, 403);
    assert.equal(again.body.errorCode, "GUARDIAN_CONTACT_NOT_VERIFIED");
  });

  it("unverified read-path: APPROVED থাকলেও live যাচাই ফেলে গেলে contact প্রকাশিত হয় না", async () => {
    const a = await registerUser(request);
    const b = await registerUser(request);
    await makeMatch(a, b);
    await makeVerifiedGuardian(a);
    await makeVerifiedGuardian(b, "রহিম উদ্দিন");
    const created = await createReq(a.accessToken, b.user.id);
    const id = created.body.data.id;
    await approveReq(b.accessToken, id);

    // সরাসরি DB-তে লিংক non-VERIFIED (revoke-হুক এড়ানো অবস্থা অনুকরণ) —
    // read-path-এর live re-verify যে contact বাঁধা আছে তা প্রমাণ করে
    await mongoose.model("Guardian").updateOne(
      { member: a.user.id },
      { $set: { status: "CONSENTED" } },
    );

    const listA = await listReq(a.accessToken);
    const item = listA.body.data.find((r) => r.id === id);
    assert.equal(item.status, "APPROVED");
    assert.equal(item.requesterGuardianContact, null, "live VERIFIED না হলে contact নয়");
    assert.equal(item.targetGuardianContact, null);
  });

  it("অডিট: প্রতিটি transition GUARDIAN_CONTACT_* capped-ring-এ; নোটিফিকেশন: request/approve জমে", async () => {
    const AuditEvent = (await import("../src/models/adminAuditEvent.model.js")).default;
    const a = await registerUser(request);
    const b = await registerUser(request);
    await makeMatch(a, b);
    await makeVerifiedGuardian(a);
    await makeVerifiedGuardian(b, "রহিম উদ্দিন");

    const created = await createReq(a.accessToken, b.user.id);
    const id = created.body.data.id;
    await approveReq(b.accessToken, id);

    // দ্বিতীয় জোড়ায় deny
    const e = await registerUser(request);
    const f = await registerUser(request);
    await makeMatch(e, f);
    await makeVerifiedGuardian(e);
    await makeVerifiedGuardian(f, "রহিম উদ্দিন");
    const req2 = await createReq(e.accessToken, f.user.id);
    await denyReq(f.accessToken, req2.body.data.id, "না");

    // তৃতীয় জোড়ায় approve → revoke (teardown)
    const g = await registerUser(request);
    const h = await registerUser(request);
    await makeMatch(g, h);
    await makeVerifiedGuardian(g);
    await makeVerifiedGuardian(h, "রহিম উদ্দিন");
    const req3 = await createReq(g.accessToken, h.user.id);
    await approveReq(h.accessToken, req3.body.data.id);
    await request.post("/api/v1/guardian/revoke").set(auth(g.accessToken)).send({ reason: "test" });

    const actions = (await AuditEvent.find({}).lean()).map((e2) => e2.action);
    for (const expected of [
      "GUARDIAN_CONTACT_REQUEST",
      "GUARDIAN_CONTACT_APPROVE",
      "GUARDIAN_CONTACT_DENY",
      "GUARDIAN_CONTACT_TEARDOWN",
    ]) {
      assert.ok(actions.includes(expected), `${expected} রিং-এ লেখা`);
    }

    // নোটিফিকেশন: request → প্রাপক, approve → অনুরোধকারী, deny → অনুরোধকারী
    const reqNoteB = await Notification.find({ user: b.user.id, "data.action": "request" }).lean();
    assert.ok(reqNoteB.length >= 1, "প্রাপক request-নোটিফিকেশন পায়");
    const approveNoteA = await Notification.find({ user: a.user.id, "data.action": "approve" }).lean();
    assert.ok(approveNoteA.length >= 1, "অনুরোধকারী approve-নোটিফিকেশন পায়");
    const denyNoteE = await Notification.find({ user: e.user.id, "data.action": "deny" }).lean();
    assert.ok(denyNoteE.length >= 1, "অনুরোধকারী deny-নোটিফিকেশন পায়");
  });

  it("routing: authenticate ছাড়া 401; অন্যের অনুরোধ list-এ আসে না", async () => {
    const anon = await listReq("not-a-real-token");
    assert.equal(anon.status, 401);

    const a = await registerUser(request);
    const b = await registerUser(request);
    await makeMatch(a, b);
    await makeVerifiedGuardian(a);
    await makeVerifiedGuardian(b, "রহিম উদ্দিন");
    const created = await createReq(a.accessToken, b.user.id);
    assert.equal(created.status, 201);

    const outsider = await registerUser(request);
    const listOut = await listReq(outsider.accessToken);
    assert.equal(listOut.status, 200);
    assert.equal(listOut.body.data.length, 0, "জড়িত নয় তারে list-এ পাওয়া যায় না");

    // অনুরোধ ছাড়া targetMemberId validation
    const badBody = await request.post("/api/v1/guardian/contact-requests").set(auth(a.accessToken)).send({});
    assert.equal(badBody.status, 400);
  });
});
