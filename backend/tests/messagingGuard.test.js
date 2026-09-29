import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { startServer, stopServer, clearDb, registerUser, createSuperAdmin, createStaff, auth } from "./helpers.js";

/**
 * Messaging permission guard (messagingGuard.service.js) — এক চৌকাঠে
 * block + match + package limit। প্রতিটি টেস্ট নিজস্ব প্ল্যান/সাবস্ক্রিপশন
 * বানায়, তাই স্যুটের অন্য টেস্টের সাথে কোনো শেয়ার্ড স্টেট নেই।
 */
describe("MESSAGING GUARD (block + match + package)", () => {
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

  const mobile = () => `017${Math.floor(10000000 + Math.random() * 89999999)}`; // 11 ডিজিট (01 + [3-9] + 8)

  /** সদস্যের জন্য approved বায়োডাটা বানায় (ম্যাচ টেস্টের পূর্বশর্ত) — id ফেরত দেয়। */
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

  /** সরাসরি mongoose দিয়ে সদস্যকে active subscription দেয় — প্ল্যান ফেরত দেয়। */
  async function subscribe(userId, planOverrides = {}) {
    const plan = await mongoose.model("MembershipPlan").create({
      name: "Test Plan",
      nameBn: "টেস্ট প্ল্যান",
      slug: `test-plan-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      durationDays: 30,
      price: 699,
      connectCount: 10,
      ...planOverrides,
    });
    await mongoose.model("Subscription").create({
      user: userId,
      plan: plan._id,
      status: "ACTIVE",
      startsAt: new Date(Date.now() - 86400000),
      expiresAt: new Date(Date.now() + 30 * 86400000),
    });
    return plan;
  }

  it("package limit: no plan = no limit; limit:0 → 402; limit:n caps the pair until a match unlocks", async () => {
    const alice = await registerUser(request);
    const bob = await registerUser(request);

    // (১) প্ল্যানবিহীন সদস্য — প্যাকেজ-সীমা নেই, ম্যাচ ছাড়াই মেসেজ চলে
    const free = await request
      .post("/api/v1/conversations")
      .set(auth(alice.accessToken))
      .send({ recipientId: bob.user.id, text: "আসসালামু আলাইকুম" });
    assert.equal(free.status, 201, JSON.stringify(free.body));

    // (২) limit:0 প্ল্যান → ম্যাচ ছাড়া প্রথম মেসেজেই 402 আপগ্রেড-সংকেত
    await subscribe(bob.user.id, { messagingLimit: 0 });
    const zero = await request
      .post("/api/v1/conversations")
      .set(auth(bob.accessToken))
      .send({ recipientId: alice.user.id, text: "hi" });
    assert.equal(zero.status, 402, JSON.stringify(zero.body));
    assert.equal(zero.body.errorCode, "MESSAGING_UPGRADE_REQUIRED");

    // (৩) limit:2 → জোড়াপ্রতি ঠিক ২টি; তৃতীয়টি 403 MESSAGING_LIMIT_REACHED
    const limitPlan = await mongoose.model("MembershipPlan").create({
      name: "Limited",
      nameBn: "লিমিটেড",
      slug: `limited-${Date.now()}`,
      durationDays: 30,
      price: 899,
      connectCount: 15,
      messagingLimit: 2,
    });
    await mongoose.model("Subscription").updateOne({ user: bob.user.id }, { $set: { plan: limitPlan._id } });

    const first = await request
      .post("/api/v1/conversations")
      .set(auth(bob.accessToken))
      .send({ recipientId: alice.user.id, text: "প্রথম মেসেজ" });
    assert.equal(first.status, 201, JSON.stringify(first.body));
    const convoId = first.body.data.conversation.id;

    const second = await request.post(`/api/v1/conversations/${convoId}/messages`).set(auth(bob.accessToken)).send({ text: "দ্বিতীয় মেসেজ" });
    assert.equal(second.status, 201, JSON.stringify(second.body));

    const third = await request.post(`/api/v1/conversations/${convoId}/messages`).set(auth(bob.accessToken)).send({ text: "তৃতীয় মেসেজ" });
    assert.equal(third.status, 403, JSON.stringify(third.body));
    assert.equal(third.body.errorCode, "MESSAGING_LIMIT_REACHED");

    // (৪) ম্যাচ হলে একই সীমিত প্ল্যানেও সীমা আর নেই
    const aliceBio = await approvedBiodata(alice, { firstName: "Ayesha" });
    const bobBio = await approvedBiodata(bob, { firstName: "Bulbul", gender: "MALE", mobile: mobile() });
    await request.post(`/api/v1/biodatas/${aliceBio}/like`).set(auth(bob.accessToken));
    const back = await request.post(`/api/v1/biodatas/${bobBio}/like`).set(auth(alice.accessToken));
    assert.equal(back.status, 201);
    assert.equal(back.body.data.isMutual, true);

    const afterMatch = await request
      .post(`/api/v1/conversations/${convoId}/messages`)
      .set(auth(bob.accessToken))
      .send({ text: "ম্যাচের পরে সীমাহীন" });
    assert.equal(afterMatch.status, 201, JSON.stringify(afterMatch.body));

    // প্রাপকের পাঠানো মেসেজ গোনার জোড়া আলাদা — অ্যালিস এখনও প্ল্যানবিহীন, তাই উত্তর স্বাধীন
    const reply = await request.post(`/api/v1/conversations/${convoId}/messages`).set(auth(alice.accessToken)).send({ text: "উত্তর" });
    assert.equal(reply.status, 201, JSON.stringify(reply.body));
  });

  it("messagingEnabled:false plan → NO_MESSAGING_PACKAGE for unmatched; a match still allows", async () => {
    const daisy = await registerUser(request);
    const carol = await registerUser(request);
    const carolBio = await approvedBiodata(carol, { firstName: "Charu" });
    await subscribe(daisy.user.id, { messagingEnabled: false, messagingLimit: 5 });

    const denied = await request
      .post("/api/v1/conversations")
      .set(auth(daisy.accessToken))
      .send({ recipientId: carol.user.id, text: "hi" });
    assert.equal(denied.status, 403, JSON.stringify(denied.body));
    assert.equal(denied.body.errorCode, "NO_MESSAGING_PACKAGE");

    // ম্যাচ হলে প্ল্যান-ফ্ল্যাগ থাকলেও কথা বলা যায় (match সর্বোচ্চ অগ্রাধিকার)
    const daisyBio = await approvedBiodata(daisy, { firstName: "Daisy" });
    await request.post(`/api/v1/biodatas/${carolBio}/like`).set(auth(daisy.accessToken));
    const back = await request.post(`/api/v1/biodatas/${daisyBio}/like`).set(auth(carol.accessToken));
    assert.equal(back.body.data.isMutual, true);

    const ok = await request
      .post("/api/v1/conversations")
      .set(auth(daisy.accessToken))
      .send({ recipientId: carol.user.id, text: "ম্যাচ হয়েছে!" });
    assert.equal(ok.status, 201, JSON.stringify(ok.body));
  });

  it("block wall: BLOCKED for both directions regardless of entitlement; unblock restores", async () => {
    const alice = await registerUser(request);
    const bob = await registerUser(request);
    await subscribe(alice.user.id, { messagingLimit: 2 }); // entitlement থাকলেও block-ই শেষ কথা

    const block = await request.post("/api/v1/blocks").set(auth(alice.accessToken)).send({ userId: bob.user.id });
    assert.equal(block.status, 201);

    const a2b = await request
      .post("/api/v1/conversations")
      .set(auth(alice.accessToken))
      .send({ recipientId: bob.user.id, text: "x" });
    assert.equal(a2b.status, 403, JSON.stringify(a2b.body));
    assert.equal(a2b.body.errorCode, "BLOCKED");

    const b2a = await request
      .post("/api/v1/conversations")
      .set(auth(bob.accessToken))
      .send({ recipientId: alice.user.id, text: "x" });
    assert.equal(b2a.status, 403);
    assert.equal(b2a.body.errorCode, "BLOCKED");

    // unblock → একই পরিবেশেই মেসেজিং ফিরে আসে (entitlement অপরিবর্তিত)
    await mongoose.model("UserBlock").deleteMany({});
    const restored = await request
      .post("/api/v1/conversations")
      .set(auth(bob.accessToken))
      .send({ recipientId: alice.user.id, text: "আবার চলছে" });
    assert.equal(restored.status, 201, JSON.stringify(restored.body));
  });
});
