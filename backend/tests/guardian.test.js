/**
 * Guardian/Family system — সদস্যↅঅভিভাবক লিংকের behavioral টেস্ট (রিয়েল HTTP)।
 *
 * স্টেট-মেশিন: declare (সাইনড one-time link) → অভিভাবক link রিডিম →
 * guardian-session → consent → verify → revoke।
 *
 * মূল বাউন্ডারি: consent/verify শুধু অভিভাবকের *নিজের* guardian-session থেকে —
 * সদস্যের access-token দিয়ে নয়। লিংক একবার-ব্যবহার, revoke হলে লিংক ও সেশন
 * দুটোই মরে। প্রতিটি স্টেপে SYSTEM নোটিফিকেশন ও GUARDIAN_* অডিট।
 */
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import env from "../src/config/env.js";
import Guardian from "../src/models/guardian.model.js";
import Notification from "../src/models/notification.model.js";
import {
  startServer,
  stopServer,
  clearDb,
  registerUser,
  createSuperAdmin,
  superAdmin,
  login,
  auth,
} from "./helpers.js";

describe("GUARDIAN", () => {
  let request;

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

  const declare = (token, body) =>
    request.post("/api/v1/guardian/declare").set(auth(token)).send(body);

  /** অভিভাবক: consent link রিডিম → guardian-session (public endpoint)। */
  const openSession = (linkToken) =>
    request.post("/api/v1/guardian/session").send({ token: linkToken });

  /** অভিভাবকের guardian-session দিয়ে consent/verify। */
  const gAuth = (guardianSession) => ({ Authorization: `Bearer ${guardianSession}` });
  const consentByGuardian = (guardianSession, body = {}) =>
    request.post("/api/v1/guardian/consent").set(gAuth(guardianSession)).send(body);
  const verifyByGuardian = (guardianSession) =>
    request.post("/api/v1/guardian/verify").set(gAuth(guardianSession)).send({});

  const revoke = (token, body) =>
    request.post("/api/v1/guardian/revoke").set(auth(token)).send(body);

  const mine = (token) => request.get("/api/v1/guardian/mine").set(auth(token));

  const declareBody = (over = {}) => ({
    name: "আব্দুল করিম",
    relation: "FATHER",
    contactPhone: "+8801700000001",
    contactEmail: "karim@example.com",
    consentChannel: "SMS",
    ...over,
  });

  /** পূর্ণ চক্র: declare → link exchange → consent → verify। গার্ডিয়ান-সেশন ফেরত। */
  async function verifiedGuardianFlow(member) {
    const d = await declare(member.accessToken, declareBody());
    assert.equal(d.status, 201, JSON.stringify(d.body));
    const opened = await openSession(d.body.data.consentToken);
    assert.equal(opened.status, 201, JSON.stringify(opened.body));
    const gs = opened.body.data.guardianSession;
    const c = await consentByGuardian(gs);
    assert.equal(c.status, 200, JSON.stringify(c.body));
    const v = await verifyByGuardian(gs);
    assert.equal(v.status, 200, JSON.stringify(v.body));
    return { guardianSession: gs, declared: d.body.data };
  }

  it("declare → DECLARED, one-time consentLink ফেরত; GET /mine কোনো টোকেন ফাঁস করে না", async () => {
    const member = await registerUser(request);
    const res = await declare(member.accessToken, declareBody());
    assert.equal(res.status, 201);
    assert.equal(res.body.data.status, "DECLARED");
    assert.ok(res.body.data.consentToken, "one-time consent টোকেন ফেরত আসে");
    assert.ok(res.body.data.consentLink.includes("token="), "সম্পূর্ণ link ফেরত আসে");
    assert.equal(res.body.data.name, "আব্দুল করিম");
    assert.equal(res.body.data.relation, "FATHER");

    const link = await mine(member.accessToken);
    assert.equal(link.status, 200);
    assert.equal(link.body.data.status, "DECLARED");
    assert.ok(!("consentToken" in link.body.data), "GET /mine টোকেন ফাঁস করে না");
    assert.ok(!("consentLink" in link.body.data), "GET /mine লিংক ফাঁস করে না");
    assert.ok(!("consentLinkHash" in link.body.data), "GET /mine hash ফাঁস করে না");
  });

  it("boundary: সদস্যের access-token দিয়ে consent/verify → 401; guardian-session ছাড়া কিছুই চলে না", async () => {
    const member = await registerUser(request);
    const d = await declare(member.accessToken, declareBody());
    assert.equal(d.status, 201);

    // সদস্য access-token হলো ভিন্ন সিক্রেটের টোকেন — guardian route-এ গ্রহণযোগ্য নয়
    const memberConsent = await request
      .post("/api/v1/guardian/consent")
      .set(auth(member.accessToken))
      .send({ consentChannel: "SMS" });
    assert.equal(memberConsent.status, 401, JSON.stringify(memberConsent.body));
    assert.equal(memberConsent.body.errorCode, "GUARDIAN_SESSION_REQUIRED");

    const memberVerify = await request
      .post("/api/v1/guardian/verify")
      .set(auth(member.accessToken))
      .send({});
    assert.equal(memberVerify.status, 401);
    assert.equal(memberVerify.body.errorCode, "GUARDIAN_SESSION_REQUIRED");

    // টোকেন ছাড়াও নয়
    const anonConsent = await request.post("/api/v1/guardian/consent").send({});
    assert.equal(anonConsent.status, 401);

    // সদস্যের access-token দিয়ে link exchange → ভুল টোকেন, 401
    const bogusExchange = await request.post("/api/v1/guardian/session").send({ token: member.accessToken });
    assert.equal(bogusExchange.status, 401);
    assert.equal(bogusExchange.body.errorCode, "GUARDIAN_LINK_INVALID");

    // কিন্তু guardian-session দিয়ে consent/verify চলে (পূর্ণ চক্র নিচের টেস্টে)
    assert.equal(d.body.data.status, "DECLARED");
  });

  it("one-time link: সঠিক লিংক → session; দ্বিতীয়বার → 410 USED; ক্ষত-গ্রস্ত → 401; ভুল সিক্রেট → 401", async () => {
    const member = await registerUser(request);
    const d = await declare(member.accessToken, declareBody());
    const token = d.body.data.consentToken;

    const opened = await openSession(token);
    assert.equal(opened.status, 201, JSON.stringify(opened.body));
    assert.ok(opened.body.data.guardianSession, "guardian-session ইস্যু হয়");
    assert.equal(opened.body.data.guardian.status, "DECLARED");
    assert.equal(opened.body.data.guardian.name, "আব্দুল করিম");

    // একবার-ব্যবহার — দ্বিতীয় রিডিম নিষিদ্ধ
    const replay = await openSession(token);
    assert.equal(replay.status, 410, JSON.stringify(replay.body));
    assert.equal(replay.body.errorCode, "GUARDIAN_LINK_USED");

    // ক্ষত-গ্রস্ত টোকেন
    const tampered = await openSession(token.slice(0, token.length - 4) + "AAAA");
    assert.equal(tampered.status, 401);
    assert.equal(tampered.body.errorCode, "GUARDIAN_LINK_INVALID");

    // ভুল সিক্রেটে সাইন করা টোকেন
    const forged = jwt.sign({ type: "guardian-consent" }, "wrong-secret", {
      subject: d.body.data.id,
      expiresIn: "1h",
    });
    const badSecret = await openSession(forged);
    assert.equal(badSecret.status, 401);

    // অন্য ধরনের টোকেন (guardian-session টোকেন দিয়ে link exchange)
    const wrongType = jwt.sign({ type: "guardian-session" }, env.GUARDIAN_SESSION_SECRET, {
      subject: d.body.data.id,
      expiresIn: "1h",
    });
    const typeReject = await openSession(wrongType);
    assert.equal(typeReject.status, 401);

    // খালি body → 400 validation
    const empty = await request.post("/api/v1/guardian/session").send({});
    assert.equal(empty.status, 400);
  });

  it("সঠিক ক্রমে স্টেট-উন্নতি: session → consent → consent আবার (আপডেট) → verify → VERIFIED; ভুল ক্রম 404", async () => {
    const member = await registerUser(request);
    const d = await declare(member.accessToken, declareBody());
    const opened = await openSession(d.body.data.consentToken);
    const gs = opened.body.data.guardianSession;

    // consent-এর আগে verify → 404 (CONSENTED নেই)
    const early = await verifyByGuardian(gs);
    assert.equal(early.status, 404);

    const ok = await consentByGuardian(gs, { consentChannel: "SMS" });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    assert.equal(ok.body.data.status, "CONSENTED");
    assert.ok(ok.body.data.consentAt, "consent-টাইমস্ট্যাম্প বসে");

    // CONSENTED থেকে consent আবার — আপডেট হিসেবে চলে
    const again = await consentByGuardian(gs, { consentChannel: "EMAIL" });
    assert.equal(again.status, 200);
    assert.equal(again.body.data.consentChannel, "EMAIL");

    const ver = await verifyByGuardian(gs);
    assert.equal(ver.status, 200, JSON.stringify(ver.body));
    assert.equal(ver.body.data.status, "VERIFIED");
    assert.ok(ver.body.data.verifiedAt);

    // VERIFIED হলে আর consent/verify নেই
    const afterVerify = await consentByGuardian(gs);
    assert.equal(afterVerify.status, 404);
    const reVerify = await verifyByGuardian(gs);
    assert.equal(reVerify.status, 404);

    // VERIFIED অবস্থায় পুনরায় link exchange → conflict
    const reusedLink = await openSession(d.body.data.consentToken);
    assert.equal(reusedLink.status, 410, "লিংক আগেই রিডিম হয়েছে");
  });

  it("revoke → REVOKED; লিংক ও guardian-session দুটোই মরে; পুনরায় ঘোষণা চলে", async () => {
    const member = await registerUser(request);
    const d = await declare(member.accessToken, declareBody());
    const opened = await openSession(d.body.data.consentToken);
    const gs = opened.body.data.guardianSession;

    const rv = await revoke(member.accessToken, { reason: "ভুল নাম ছিল" });
    assert.equal(rv.status, 200, JSON.stringify(rv.body));
    assert.equal(rv.body.data.status, "REVOKED");
    assert.ok(rv.body.data.revokedAt);

    // রিভোকের পরে সেশন বাতিল — consent চলে না
    const afterRevoke = await consentByGuardian(gs);
    assert.equal(afterRevoke.status, 401, JSON.stringify(afterRevoke.body));
    assert.equal(afterRevoke.body.errorCode, "GUARDIAN_SESSION_REVOKED");

    // রিভোকের পরে পুরনো লিংকও মৃত
    const reopen = await openSession(d.body.data.consentToken);
    assert.equal(reopen.status, 410);
    assert.equal(reopen.body.errorCode, "GUARDIAN_LINK_REVOKED");

    // পুনরায় ঘোষণা — REVOKED রেকর্ড থেকে স্বাধীন নতুন লিংক + নতুন টোকেন
    const d2 = await declare(member.accessToken, declareBody({ name: "মোহাম্মদ করিম" }));
    assert.equal(d2.status, 201);
    assert.ok(d2.body.data.consentToken !== d.body.data.consentToken, "নতুন টোকেন ভিন্ন");

    const opened2 = await openSession(d2.body.data.consentToken);
    assert.equal(opened2.status, 201);
    const c2 = await consentByGuardian(opened2.body.data.guardianSession);
    assert.equal(c2.status, 200);
    assert.equal(c2.body.data.name, "মোহাম্মদ করিম");

    // পুরনো টোকেন আর কাজ করে না (একবার-ব্যবহার + রিভোকড)
    const stale = await openSession(d.body.data.consentToken);
    assert.equal(stale.status, 410);
  });

  it("revoke আগে (DECLARED) — session থাকলেও revoke পরে সব বাতিল; failed declare validationে লিংক তৈরি হয় না", async () => {
    const member = await registerUser(request);
    const d = await declare(member.accessToken, declareBody());
    const opened = await openSession(d.body.data.consentToken);

    // সদস্য revoke করল অভিভাবক consent না দেওয়া অবস্থায়
    await revoke(member.accessToken, { reason: "test" });
    const verifyAfter = await verifyByGuardian(opened.body.data.guardianSession);
    assert.equal(verifyAfter.status, 401);

    // failed validation — কোনো লিংক তৈরি হয় না
    const before = await Guardian.countDocuments({});
    const bad = await declare(member.accessToken, { name: "ক", relation: "NOPE" });
    assert.equal(bad.status, 400);
    assert.equal(await Guardian.countDocuments({}), before, "ভুল declare-এ নতুন লিংক নয়");

    // এখন সদস্যের কোনো active লিংক নেই — mine খালি
    const empty = await mine(member.accessToken);
    assert.equal(empty.body.data, null);
  });

  it("routing: authenticate ছাড়া member-route 401; guardian-session দিয়ে member-route চলে না", async () => {
    const anon = await mine("not-a-real-token");
    assert.equal(anon.status, 401);

    const member = await registerUser(request);
    const { guardianSession } = await verifiedGuardianFlow(member);

    // guardian-session দিয়ে member-route (ভিন্ন সিক্রেট — অস্বীকৃত)
    const stolen = await mine(guardianSession);
    assert.equal(stolen.status, 401);

    // guardian consent-এ সদস্য access-token আবারও নয়
    const again = await request
      .post("/api/v1/guardian/consent")
      .set(auth(member.accessToken))
      .send({});
    assert.equal(again.status, 401);
  });

  it("নোটিফিকেশন: declare/session/consent/verify/revoke প্রতিটিতে SYSTEM নোটিফিকেশন জমা", async () => {
    const member = await registerUser(request);
    const d = await declare(member.accessToken, declareBody());
    const opened = await openSession(d.body.data.consentToken);
    const gs = opened.body.data.guardianSession;
    await consentByGuardian(gs);
    await verifyByGuardian(gs);
    await revoke(member.accessToken, { reason: "test" });

    const notes = await Notification.find({ user: member.user.id, type: "SYSTEM" }).lean();
    const actions = notes.map((n) => n.data?.action);
    for (const expected of ["declare", "session", "consent", "verify", "revoke"]) {
      assert.ok(actions.includes(expected), `${expected} নোটিফিকেশন জমা`);
    }
  });

  it("অডিট: GUARDIAN_DECLARE/SESSION_OPENED/CONSENT/VERIFY/REVOKE রিং-এ লেখা; guardian actor হিসেবে", async () => {
    const AuditEvent = (await import("../src/models/adminAuditEvent.model.js")).default;
    const member = await registerUser(request);
    await verifiedGuardianFlow(member);
    await revoke(member.accessToken, {});

    const events = await AuditEvent.find({}).lean();
    const actions = events.map((e) => e.action);
    for (const expected of [
      "GUARDIAN_DECLARE",
      "GUARDIAN_SESSION_OPENED",
      "GUARDIAN_CONSENT",
      "GUARDIAN_VERIFY",
      "GUARDIAN_REVOKE",
    ]) {
      assert.ok(actions.includes(expected), `${expected} রিং-এ লেখা`);
    }

    // consent/verify-এ actor হলো অভিভাবক (গার্ডিয়ান-সেশন), সদস্য নয়
    const consentEvent = events.find((e) => e.action === "GUARDIAN_CONSENT");
    assert.equal(consentEvent.actorRole, "GUARDIAN", "consent actor অভিভাবক");
    assert.ok(consentEvent.targetId === member.user.id, "target সদস্য");
    const declareEvent = events.find((e) => e.action === "GUARDIAN_DECLARE");
    assert.equal(declareEvent.actorRole, "USER", "declare actor সদস্য (তার নিজের ক্ষমতা)");
  });
});
