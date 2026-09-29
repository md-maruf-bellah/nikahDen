import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { startServer, stopServer, clearDb, registerUser, login, createSuperAdmin, createStaff, auth } from "./helpers.js";

describe("CONTACTS / NOTIFICATIONS / MESSAGES / SECURITY", () => {
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

  describe("contacts", () => {
    it("public form → staff inbox → reply/close → delete", async () => {
      const send = await request.post("/api/v1/contacts").send({
        firstName: "Karim",
        lastName: "Uddin",
        phone: "01712345678",
        email: "karim@test.dev",
        message: "আমার বায়োডাটা নিয়ে সমস্যা হচ্ছে, সাহায্য চাই।",
      });
      assert.equal(send.status, 201);

      const list = await request.get("/api/v1/contacts").set(auth(adminToken));
      assert.equal(list.status, 200);
      assert.equal(list.body.pagination.total, 1);

      // সাইডবার লাইভ ব্যাজ — নতুন মেসেজে কাউন্ট ১
      const count1 = await request.get("/api/v1/contacts/new-count").set(auth(adminToken));
      assert.equal(count1.status, 200);
      assert.equal(count1.body.data.count, 1);

      const id = list.body.data[0].id;
      const update = await request.patch(`/api/v1/contacts/${id}`).set(auth(adminToken)).send({ status: "REPLIED", reply: "যোগাযোগ করুন" });
      assert.equal(update.status, 200);
      assert.equal(update.body.data.status, "REPLIED");

      // উত্তর দেওয়ার পরে কাউন্ট শূন্য
      const count2 = await request.get("/api/v1/contacts/new-count").set(auth(adminToken));
      assert.equal(count2.body.data.count, 0);

      // members cannot open the inbox
      const member = await registerUser(request);
      const denied = await request.get("/api/v1/contacts").set(auth(member.accessToken));
      assert.equal(denied.status, 403);
      const deniedCount = await request.get("/api/v1/contacts/new-count").set(auth(member.accessToken));
      assert.equal(deniedCount.status, 403);
    });

    it("spam defenses: honeypot and too-fast submits are silently dropped", async () => {
      // honeypot ফিল্ডে মান (বট অটো-ফিল) — সাইলেন্ট 201, ডাটাবেসে ঢোকে না
      const honey = await request.post("/api/v1/contacts").send({
        firstName: "Bot",
        lastName: "Spam",
        email: "bot-spam@test.dev",
        message: "Buy my wonderful product right now please!!!",
        website: "http://spam.example",
      });
      assert.equal(honey.status, 201);
      assert.equal(honey.body.data.spam, true);
      assert.equal(honey.body.data.id, null);

      // অসম্ভব দ্রুত সাবমিট (২.৫ সেকেন্ডের কম) — একইভাবে সাইলেন্ট ড্রপ
      const fast = await request.post("/api/v1/contacts").send({
        firstName: "Fast",
        lastName: "Bot",
        email: "fast-bot@test.dev",
        message: "Another automated spam message body.",
        formElapsedMs: 120,
      });
      assert.equal(fast.status, 201);
      assert.equal(fast.body.data.spam, true);

      // স্বাভাবিক মানুষের মতো সাবমিট — স্বাভাবিকভাবে ঢোকে
      const human = await request.post("/api/v1/contacts").send({
        firstName: "Human",
        lastName: "User",
        email: "human@test.dev",
        message: "এটি একটি স্বাভাবিক বার্তা, স্প্যাম নয়।",
        formElapsedMs: 15000,
      });
      assert.equal(human.status, 201);
      assert.ok(!human.body.data.spam, "human submit stored");
      assert.ok(human.body.data.id, "has real id");

      // inbox-এ শুধু মানুষের বার্তাটাই ঢুকেছে
      const list = await request.get("/api/v1/contacts").set(auth(adminToken));
      const emails = list.body.data.map((m) => m.email);
      assert.ok(!emails.includes("bot-spam@test.dev"), "honeypot dropped");
      assert.ok(!emails.includes("fast-bot@test.dev"), "fast submit dropped");
      assert.ok(emails.includes("human@test.dev"), "human stored");

      // দুটো ড্রপ-ইভেন্ট capped collection-এ persist হয়েছে (রিস্টার্ট-সহনশীল)
      await new Promise((r) => setTimeout(r, 120));
      const events = await request.get("/api/v1/admin/contact/events?limit=10").set(auth(adminToken));
      assert.equal(events.status, 200);
      assert.ok(events.body.data.count >= 2, `expected >=2 persisted spam events, got ${events.body.data.count}`);
      const reasons = events.body.data.items.map((e) => e.reason);
      assert.ok(reasons.includes("honeypot"), "honeypot reason recorded");
      assert.ok(reasons.includes("time_trap"), "time_trap reason recorded");
      assert.ok(events.body.data.items.every((e) => e.event === "spam_dropped"));

      // সব ঠিকঠাক — মেসেজ ডিলিট
      const del = await request.delete(`/api/v1/contacts/${human.body.data.id}`).set(auth(adminToken));
      assert.equal(del.status, 200);
    });

    it("contact spam events endpoint is staff-only", async () => {
      const member = await registerUser(request);
      const denied = await request.get("/api/v1/admin/contact/events").set(auth(member.accessToken));
      assert.equal(denied.status, 403);
    });
  });

  describe("notifications", () => {
    it("marks read / all-read / deletes, owner-scoped", async () => {
      const member = await registerUser(request);
      await mongoose.model("Notification").create({ user: member.user.id, type: "SYSTEM", title: "One", body: "a" });
      await mongoose.model("Notification").create({ user: member.user.id, type: "SYSTEM", title: "Two", body: "b" });

      const list = await request.get("/api/v1/notifications").set(auth(member.accessToken));
      assert.equal(list.body.data.unreadCount, 2);
      assert.equal(list.body.pagination.total, 2);

      const readOne = await request.patch(`/api/v1/notifications/${list.body.data.items[0].id}/read`).set(auth(member.accessToken));
      assert.equal(readOne.status, 200);
      const afterOne = await request.get("/api/v1/notifications").set(auth(member.accessToken));
      assert.equal(afterOne.body.data.unreadCount, 1);

      const other = await registerUser(request);
      const stolen = await request.patch(`/api/v1/notifications/${list.body.data.items[0].id}/read`).set(auth(other.accessToken));
      assert.equal(stolen.status, 404); // scoped to owner

      await request.patch("/api/v1/notifications/read-all").set(auth(member.accessToken));
      assert.equal((await request.get("/api/v1/notifications").set(auth(member.accessToken))).body.data.unreadCount, 0);

      await request.delete("/api/v1/notifications").set(auth(member.accessToken));
      assert.equal((await request.get("/api/v1/notifications").set(auth(member.accessToken))).body.pagination.total, 0);
    });
  });

  describe("messaging", () => {
    it("starts a conversation, exchanges messages, marks read, deletes", async () => {
      const alice = await registerUser(request);
      const bob = await registerUser(request);

      const start = await request
        .post("/api/v1/conversations")
        .set(auth(alice.accessToken))
        .send({ recipientId: bob.user.id, text: "আসসালামু আলাইকুম, আপনার বায়োডাটা দেখলাম।" });
      assert.equal(start.status, 201);
      const convoId = start.body.data.conversation.id;

      const bobConv = await request.get("/api/v1/conversations").set(auth(bob.accessToken));
      assert.equal(bobConv.body.pagination.total, 1);
      assert.equal(bobConv.body.data[0].partner.id, alice.user.id);
      assert.equal(bobConv.body.data[0].lastMessage.text.split(" ")[0], "আসসালামু");
      // unread counter: bob has 1 unread from alice, alice has 0
      assert.equal(bobConv.body.data[0].unreadCount, 1);
      const aliceConvBefore = await request.get("/api/v1/conversations").set(auth(alice.accessToken));
      assert.equal(aliceConvBefore.body.data[0].unreadCount, 0);

      // bob reads alice's message → status flips to READ for bob
      const bobMsgs = await request.get(`/api/v1/conversations/${convoId}/messages`).set(auth(bob.accessToken));
      assert.equal(bobMsgs.body.data.length, 1);
      assert.equal(bobMsgs.body.data[0].sender, alice.user.id);

      // after reading, bob's unread counter drops to 0
      const bobConvAfterRead = await request.get("/api/v1/conversations").set(auth(bob.accessToken));
      assert.equal(bobConvAfterRead.body.data[0].unreadCount, 0);

      const reply = await request
        .post(`/api/v1/conversations/${convoId}/messages`)
        .set(auth(bob.accessToken))
        .send({ text: "ওয়ালাইকুম আসসালাম, ধন্যবাদ!" });
      assert.equal(reply.status, 201);

      // alice got a push notification for the new message
      const aliceNotif = await request.get("/api/v1/notifications").set(auth(alice.accessToken));
      assert.ok(aliceNotif.body.data.items.some((n) => n.type === "MESSAGE"));

      // a stranger cannot read this conversation
      const eve = await registerUser(request);
      const stolen = await request.get(`/api/v1/conversations/${convoId}/messages`).set(auth(eve.accessToken));
      assert.equal(stolen.status, 404);

      await request.delete(`/api/v1/conversations/${convoId}`).set(auth(alice.accessToken));
      const aliceList = await request.get("/api/v1/conversations").set(auth(alice.accessToken));
      assert.equal(aliceList.body.pagination.total, 0); // hidden for alice
      const bobList = await request.get("/api/v1/conversations").set(auth(bob.accessToken));
      assert.equal(bobList.body.pagination.total, 1); // still visible for bob
    });

    it("block/unblock: blocks messaging both ways (old + new conversations), unblock restores", async () => {
      const alice = await registerUser(request);
      const bob = await registerUser(request);

      // আগে conversation + মেসেজ — পরে block করলেও এটায় নতুন মেসেজ বন্ধ হবে
      const start = await request
        .post("/api/v1/conversations")
        .set(auth(alice.accessToken))
        .send({ recipientId: bob.user.id, text: "আগের মেসেজ" });
      assert.equal(start.status, 201);
      const convoId = start.body.data.conversation.id;

      // self-block + unknown user
      const self = await request.post("/api/v1/blocks").set(auth(alice.accessToken)).send({ userId: alice.user.id });
      assert.equal(self.status, 400);
      const ghost = await request.post("/api/v1/blocks").set(auth(alice.accessToken)).send({ userId: "507f1f77bcf86cd799439011" });
      assert.equal(ghost.status, 404);

      // alice blocks bob
      const block = await request.post("/api/v1/blocks").set(auth(alice.accessToken)).send({ userId: bob.user.id });
      assert.equal(block.status, 201);
      // idempotent double-block — এরর নয়
      const again = await request.post("/api/v1/blocks").set(auth(alice.accessToken)).send({ userId: bob.user.id });
      assert.equal(again.status, 201);

      // তালিকায় bob আছে + status endpoint true
      const blocks = await request.get("/api/v1/blocks").set(auth(alice.accessToken));
      assert.equal(blocks.body.pagination.total, 1);
      assert.equal(blocks.body.data[0].user.id, bob.user.id);
      const status = await request.get(`/api/v1/blocks/${bob.user.id}/status`).set(auth(alice.accessToken));
      assert.equal(status.body.data.blockedByMe, true);

      // নতুন conversation — দুই দিক থেকেই ব্লকড 403
      const fresh = await request.post("/api/v1/conversations").set(auth(alice.accessToken)).send({ recipientId: bob.user.id, text: "x" });
      assert.equal(fresh.status, 403);
      assert.equal(fresh.body.errorCode, "BLOCKED");
      const freshBob = await request.post("/api/v1/conversations").set(auth(bob.accessToken)).send({ recipientId: alice.user.id, text: "x" });
      assert.equal(freshBob.status, 403);

      // পুরনো conversation-এও নতুন মেসেজ দুই দিকেই বন্ধ
      const oldAlice = await request.post(`/api/v1/conversations/${convoId}/messages`).set(auth(alice.accessToken)).send({ text: "hello?" });
      assert.equal(oldAlice.status, 403);
      const oldBob = await request.post(`/api/v1/conversations/${convoId}/messages`).set(auth(bob.accessToken)).send({ text: "hello?" });
      assert.equal(oldBob.status, 403);

      // নোটিফিকেশনও আর যায় না? (send ব্লকড হওয়ায় নতুন MESSAGE নোটিফিকেশন নেই)
      const bobNotifs = await request.get("/api/v1/notifications").set(auth(bob.accessToken));
      assert.equal(bobNotifs.body.data.items.filter((n) => n.type === "MESSAGE").length, 1, "only the pre-block message notified");

      // unblock → পুরনো conversation-ই কাজ করে (তথ্য হারায় না)
      const unblock = await request.delete(`/api/v1/blocks/${bob.user.id}`).set(auth(alice.accessToken));
      assert.equal(unblock.status, 200);
      const unblockAgain = await request.delete(`/api/v1/blocks/${bob.user.id}`).set(auth(alice.accessToken));
      assert.equal(unblockAgain.status, 404);

      const after = await request.post(`/api/v1/conversations/${convoId}/messages`).set(auth(bob.accessToken)).send({ text: "আবার চলছে" });
      assert.equal(after.status, 201);
      const aliceMsgs = await request.get(`/api/v1/conversations/${convoId}/messages`).set(auth(alice.accessToken));
      assert.ok(aliceMsgs.body.data.some((m) => m.text === "আবার চলছে"));

      // bob-এর status সবসময় false ছিল (নীরব দেয়াল)
      const bobStatus = await request.get(`/api/v1/blocks/${alice.user.id}/status`).set(auth(bob.accessToken));
      assert.equal(bobStatus.body.data.blockedByMe, false);
    });
  });

  describe("member search (messenger discovery)", () => {
    it("finds ACTIVE members by name, excludes self & inactive, leaks no email/phone", async () => {
      const ayesha = await registerUser(request, { firstName: "Ayesha", lastName: "Rahman" });
      await registerUser(request, { firstName: "Ayesha", lastName: "Inactive", email: `inactive-${Date.now()}@test.dev` });
      // inactive সদস্য — সার্চে আসবে না
      const User = mongoose.model("User");
      await User.updateOne({ email: { $regex: /inactive-/ } }, { $set: { status: "INACTIVE" } });

      const seeker = await registerUser(request, { firstName: "Karim", lastName: "Seeker" });

      const res = await request
        .get("/api/v1/users/search?q=Ayesha")
        .set(auth(seeker.accessToken));
      assert.equal(res.status, 200, JSON.stringify(res.body));
      const names = res.body.data.map((m) => m.name);
      assert.ok(names.includes("Ayesha Rahman"), `found by first name: ${names}`);
      assert.ok(!names.some((n) => n.includes("Inactive")), "INACTIVE member excluded");
      assert.ok(!res.body.data.some((m) => m.id === seeker.user.id), "self excluded");
      // ন্যূনতম পাবলিক শেপ — email/phone/role ফাঁস নয়
      assert.ok(res.body.data.every((m) => m.email === undefined && m.phone === undefined && m.role === undefined));
      assert.ok(res.body.data.every((m) => typeof m.name === "string" && typeof m.id === "string"));

      // পুরো নাম দিয়েও খোঁজা যায়
      const full = await request.get("/api/v1/users/search?q=" + encodeURIComponent("Ayesha Rahman")).set(auth(seeker.accessToken));
      assert.ok(full.body.data.some((m) => m.name === "Ayesha Rahman"));

      // লগইন ছাড়া নয়; খালি q ভ্যালিডেশন-ব্যর্থ
      const anon = await request.get("/api/v1/users/search?q=Ayesha");
      assert.equal(anon.status, 401);
      const empty = await request.get("/api/v1/users/search?q=").set(auth(seeker.accessToken));
      assert.equal(empty.status, 400);
    });

    it("found member can be messaged immediately via /conversations", async () => {
      const rahim = await registerUser(request, { firstName: "Rahim", lastName: "Uddin" });
      const seeker = await registerUser(request, { firstName: "Salma", lastName: "Khatun" });

      const found = await request.get("/api/v1/users/search?q=Rahim").set(auth(seeker.accessToken));
      assert.equal(found.body.data.length, 1);
      const targetId = found.body.data[0].id;

      const convo = await request
        .post("/api/v1/conversations")
        .set(auth(seeker.accessToken))
        .send({ recipientId: targetId, text: "আসসালামু আলাইকুম" });
      assert.equal(convo.status, 201, JSON.stringify(convo.body));
    });

    it("search-intent preview: canMessage true normally, blocked neutral, limit/plan reasons surfaced", async () => {
      const seeker = await registerUser(request, { firstName: "Salma", lastName: "Khatun" });
      const freeTarget = await registerUser(request, { firstName: "Free", lastName: "Target" });
      const blockedTarget = await registerUser(request, { firstName: "Blocky", lastName: "Target" });

      // seeker-এর জন্য limit:1 প্ল্যান — প্রথম টার্গেটে মেসেজ পাঠালেই দ্বিতীয়টি LIMIT_REACHED হবে
      const limitedPlan = await mongoose.model("MembershipPlan").create({
        name: "L1", nameBn: "L1", slug: `l1-${Date.now()}`,
        durationDays: 30, price: 0, connectCount: 0, messagingLimit: 1,
      });
      await mongoose.model("Subscription").create({
        user: seeker.user.id, plan: limitedPlan._id, status: "ACTIVE",
        startsAt: new Date(), expiresAt: new Date(Date.now() + 86400000),
      });

      // normal target — canMessage true
      let res = await request
        .get(`/api/v1/users/search-intent?ids=${freeTarget.user.id}`)
        .set(auth(seeker.accessToken));
      assert.equal(res.status, 200, JSON.stringify(res.body));
      assert.equal(res.body.data[0].canMessage, true);
      assert.equal(res.body.data[0].blocked, false);

      // limit:1 খরচ → পরের প্রিভিউতে LIMIT_REACHED
      await request
        .post("/api/v1/conversations")
        .set(auth(seeker.accessToken))
        .send({ recipientId: freeTarget.user.id, text: "একটি মেসেজ" });

      res = await request
        .get(`/api/v1/users/search-intent?ids=${freeTarget.user.id},${blockedTarget.user.id}`)
        .set(auth(seeker.accessToken));
      assert.equal(res.status, 200);
      const byId = Object.fromEntries(res.body.data.map((r) => [r.id, r]));
      assert.equal(byId[freeTarget.user.id].canMessage, false);
      assert.equal(byId[freeTarget.user.id].reason, "LIMIT_REACHED");

      // block (seeker→blockedTarget) — নীরব: blocked:true, reason:null (কারণ ফাঁস নয়)
      await request.post("/api/v1/blocks").set(auth(seeker.accessToken)).send({ userId: blockedTarget.user.id });
      res = await request
        .get(`/api/v1/users/search-intent?ids=${blockedTarget.user.id}`)
        .set(auth(seeker.accessToken));
      assert.equal(res.body.data[0].canMessage, false);
      assert.equal(res.body.data[0].blocked, true);
      assert.equal(res.body.data[0].reason, null);

      // ভ্যালিডেশন: বাঁকা ids → 400; লগইন ছাড়া → 401
      const bad = await request.get("/api/v1/users/search-intent?ids=not-an-id").set(auth(seeker.accessToken));
      assert.equal(bad.status, 400);
      const anon = await request.get(`/api/v1/users/search-intent?ids=${freeTarget.user.id}`);
      assert.equal(anon.status, 401);
    });
  });

  describe("uploads", () => {
    it("upload avatar, list & fetch users with it", async () => {
      const member = await registerUser(request);
      const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
      const res = await request
        .post("/api/v1/users/me/avatar")
        .set(auth(member.accessToken))
        .attach("avatar", png, { filename: "me.png", contentType: "image/png" });
      assert.equal(res.status, 200, JSON.stringify(res.body));
      assert.match(res.body.data.avatar, /^\/uploads\/avatar\//);

      const me = await request.get("/api/v1/auth/me").set(auth(member.accessToken));
      assert.equal(me.body.data.avatar, res.body.data.avatar);
    });

    it("rejects non-image uploads", async () => {
      const member = await registerUser(request);
      const res = await request
        .post("/api/v1/users/me/avatar")
        .set(auth(member.accessToken))
        .attach("avatar", Buffer.from("hello"), { filename: "evil.txt", contentType: "text/plain" });
      assert.equal(res.status, 400);
      assert.equal(res.body.errorCode, "UPLOAD_ERROR");
    });
  });

  describe("security hardening", () => {
    it("rejects tampered tokens", async () => {
      const member = await registerUser(request);
      const [header, , sig] = member.accessToken.split(".");
      const tampered = `${header}.${Buffer.from(JSON.stringify({ sub: member.user.id, role: "SUPERADMIN", type: "access" })).toString("base64url")}.${sig}`;
      const res = await request.get("/api/v1/auth/me").set(auth(tampered));
      assert.equal(res.status, 401);
    });

    it("never leaks stack traces or internal errors", async () => {
      const member = await registerUser(request);
      const res = await request.get("/api/v1/orders/not-an-id").set(auth(member.accessToken));
      assert.equal(res.status, 400); // invalid ObjectId -> clean 400, not a stack
      assert.equal(JSON.stringify(res.body).includes("at "), false);
      assert.equal(JSON.stringify(res.body).includes("passwordHash"), false);
    });

    it("caps page size and page numbers", async () => {
      const res = await request.get("/api/v1/biodatas?page=1&limit=999999");
      assert.equal(res.status, 200);
      assert.equal(res.body.pagination.limit, 100);
    });

    it("health endpoint is public", async () => {
      const res = await request.get("/health");
      assert.equal(res.status, 200);
      assert.equal(res.body.status, "ok");
    });
  });
});
