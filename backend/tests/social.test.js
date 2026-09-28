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

      // সব ঠিকঠাক — মেসেজ ডিলিট
      const del = await request.delete(`/api/v1/contacts/${human.body.data.id}`).set(auth(adminToken));
      assert.equal(del.status, 200);
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
