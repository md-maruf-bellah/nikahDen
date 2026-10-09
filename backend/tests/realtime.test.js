/**
 * Socket.IO রিয়েলটাইম টেস্ট — আসল Express অ্যাপ + JWT handshake + REST পথ থেকে emit।
 *
 * আচরণ যা প্রমাণিত হয়:
 *   - বৈধ access token → connected, নিজের user:<id> room-এ
 *   - টোকেন ছাড়া/ভুয়া টোকেন → connect_error UNAUTHORIZED
 *   - PENDING ইউজার → FORBIDDEN
 *   - REST মেসেজ পাঠালে প্রাপক message:new + notification:new লাইভ পায়
 *   - প্রেরক নিজের message:new পায় না
 *   - প্রাপক পড়লে প্রেরক message:read পায়; read-all-এ notification:read
 */
import { describe, it, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import jwt from "jsonwebtoken";
import { io as Client } from "socket.io-client";
import mongoose from "mongoose";
import { startServer, stopServer, clearDb, registerUser, auth } from "./helpers.js";
import { initRealtime, closeRealtime } from "../src/realtime/index.js";
import { notificationEvent } from "../src/modules/notifications/notification.service.js";
import env from "../src/config/env.js";

describe("REALTIME (socket.io)", () => {
  let request;
  let app;
  let httpServer;
  let port;

  before(async () => {
    ({ request, app } = await startServer());
    httpServer = createServer(app);
    await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
    port = httpServer.address().port;
    initRealtime(httpServer);
  });

  after(async () => {
    closeRealtime(); // io.close() attached http server-ও বন্ধ করে
    await stopServer();
  });

  beforeEach(async () => {
    await clearDb();
  });

  const clients = [];
  function connect(token) {
    const c = Client(`http://127.0.0.1:${port}`, {
      auth: { token },
      transports: ["websocket"],
      reconnection: false,
      timeout: 2000,
    });
    clients.push(c);
    return c;
  }
  function connectError(token) {
    return new Promise((resolve, reject) => {
      const c = connect(token);
      const t = setTimeout(() => reject(new Error("timeout waiting connect_error")), 3000);
      c.once("connect_error", (err) => {
        clearTimeout(t);
        resolve(err.message);
      });
    });
  }
  function waitEvent(c, event, timeoutMs = 3000) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        c.off(event);
        reject(new Error(`timeout waiting ${event}`));
      }, timeoutMs);
      c.once(event, (data) => {
        clearTimeout(t);
        resolve(data);
      });
    });
  }

  afterEach(() => {
    while (clients.length) clients.pop().disconnect();
  });

  it("বৈধ টোকেন → connected + userId", async () => {
    const alice = await registerUser(request);
    const c = connect(alice.accessToken);
    const hello = await waitEvent(c, "connected");
    assert.equal(hello.userId, alice.user.id);
  });

  it("টোকেন ছাড়া → UNAUTHORIZED", async () => {
    const msg = await connectError(null);
    assert.equal(msg, "UNAUTHORIZED");
  });

  it("ভুয়া টোকেন → UNAUTHORIZED", async () => {
    const msg = await connectError("not-a-real-jwt");
    assert.equal(msg, "UNAUTHORIZED");
  });

  it("PENDING ইউজার → FORBIDDEN", async () => {
    const User = mongoose.model("User");
    const pending = await User.create({
      firstName: "পেন্ডিং",
      lastName: "সদস্য",
      email: `pending-${Date.now()}@test.dev`,
      passwordHash: "Passw0rd!",
      status: "PENDING",
    });
    const token = jwt.sign({ sub: pending._id.toString() }, env.JWT_ACCESS_SECRET, { expiresIn: "5m" });
    const msg = await connectError(token);
    assert.equal(msg, "FORBIDDEN");
  });

  it("notificationEvent — পে-লোড সবসময় DB-ডক থেকে, id null নয় (pure)", () => {
    const createdAt = new Date("2026-01-02T03:04:05.000Z");
    const doc = {
      _id: { toString: () => "65f0c0ffee0000000000abcd" },
      type: "MESSAGE",
      title: "You have a new message",
      body: "হাই",
      data: { kind: "conversation", id: "c1" },
      createdAt,
    };
    const ev = notificationEvent(doc);
    assert.equal(ev.id, "65f0c0ffee0000000000abcd", "আসল DB-id — id:null নয়");
    assert.equal(ev.type, doc.type);
    assert.equal(ev.title, doc.title);
    assert.equal(ev.body, doc.body);
    assert.deepEqual(ev.data, doc.data);
    assert.equal(ev.createdAt, createdAt.toISOString());
    // createdAt না থাকলেও ক্র্যাশ নয় — সময়সহ আসে
    const noTs = notificationEvent({ ...doc, createdAt: null });
    assert.ok(!Number.isNaN(Date.parse(noTs.createdAt)));
  });

  it("REST মেসেজ → প্রাপক live message:new + notification:new; প্রেরক নিজেরটা পায় না", async () => {
    const alice = await registerUser(request);
    const bob = await registerUser(request);

    const aSock = connect(alice.accessToken);
    const bSock = connect(bob.accessToken);
    await waitEvent(aSock, "connected");
    await waitEvent(bSock, "connected");

    let aliceGotOwn = null;
    aSock.on("message:new", (m) => {
      aliceGotOwn = m;
    });

    const bobMsgPromise = waitEvent(bSock, "message:new");
    const bobNotifPromise = waitEvent(bSock, "notification:new");

    const send = await request
      .post("/api/v1/conversations")
      .set(auth(alice.accessToken))
      .send({ recipientId: bob.user.id, text: "লাইভ টেস্ট বার্তা" });
    assert.equal(send.status, 201);

    const liveMsg = await bobMsgPromise;
    assert.equal(liveMsg.text, "লাইভ টেস্ট বার্তা");
    assert.equal(liveMsg.sender, alice.user.id);
    assert.equal(liveMsg.recipient, bob.user.id);
    assert.ok(liveMsg.id, "সার্ভার-আইডি সহ আসে");

    const liveNotif = await bobNotifPromise;
    assert.equal(liveNotif.type, "MESSAGE");
    assert.ok(liveNotif.data?.id, "conversationId ডেটাতে");
    assert.ok(liveNotif.id, "নোটিফিকেশনের আসল DB-id থাকতে হবে (id:null নয়)");
    // payload-id-এ প্রাপকের নামে আসল DB-ডকই পাওয়া যায়, বার্তাও হুবহু
    const Notification = mongoose.model("Notification");
    const notifDoc = await Notification.findById(liveNotif.id);
    assert.ok(notifDoc, "payload-id-এ DB-ডক পাওয়া যায়");
    assert.equal(notifDoc.user.toString(), bob.user.id, "ডক প্রাপকের নামে");
    assert.equal(notifDoc.title, liveNotif.title);
    assert.equal(notifDoc.createdAt.toISOString(), liveNotif.createdAt);

    await new Promise((r) => setTimeout(r, 200));
    assert.equal(aliceGotOwn, null, "প্রেরক নিজের message:new পায় না — শুধু প্রাপকের room");
  });

  it("প্রাপক পড়লে (REST GET messages) প্রেরক live message:read পায়", async () => {
    const alice = await registerUser(request);
    const bob = await registerUser(request);

    const aSock = connect(alice.accessToken);
    const bSock = connect(bob.accessToken);
    await waitEvent(aSock, "connected");
    await waitEvent(bSock, "connected");

    const start = await request
      .post("/api/v1/conversations")
      .set(auth(alice.accessToken))
      .send({ recipientId: bob.user.id, text: "পড়ুন" });
    const convoId = start.body.data.conversation.id;

    const readPromise = waitEvent(aSock, "message:read");
    await request.get(`/api/v1/conversations/${convoId}/messages`).set(auth(bob.accessToken));
    const read = await readPromise;
    assert.equal(read.conversationId, convoId);
    assert.equal(read.reader, bob.user.id);
    assert.ok(read.readAt, "readAt সময়সহ আসে — UI টিকের সময় লাগে");
    assert.ok(!Number.isNaN(Date.parse(read.readAt)), "readAt বৈধ ISO সময়");
  });

  it("REST mark-all-read → নিজের room-এ notification:read", async () => {
    const bob = await registerUser(request);
    const c = connect(bob.accessToken);
    await waitEvent(c, "connected");

    const readPromise = waitEvent(c, "notification:read");
    await request.patch("/api/v1/notifications/read-all").set(auth(bob.accessToken));
    const read = await readPromise;
    assert.equal(read.all, true);
  });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /** presence:query পাঠিয়ে presence:snapshot-এর online তালিকা পাওয়া */
  function queryPresence(sock, userIds) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(
        () => reject(new Error("timeout waiting presence:snapshot")),
        3000,
      );
      sock.once("presence:snapshot", (data) => {
        clearTimeout(t);
        resolve(data.online);
      });
      sock.emit("presence:query", userIds);
    });
  }

  it("typing — সদস্যতা-যাচাইসহ রিলে; সদস্য নয়/জাল id → নিঃশেষ; start throttle, stop মুক্ত", async () => {
    const alice = await registerUser(request);
    const bob = await registerUser(request);
    const carol = await registerUser(request);

    const c1 = await request
      .post("/api/v1/conversations")
      .set(auth(alice.accessToken))
      .send({ recipientId: bob.user.id, text: "হ্যালো" });
    assert.equal(c1.status, 201);
    const convo1 = c1.body.data.conversation.id;
    const c2 = await request
      .post("/api/v1/conversations")
      .set(auth(bob.accessToken))
      .send({ recipientId: carol.user.id, text: "হ্যালো" });
    assert.equal(c2.status, 201);
    const convo2 = c2.body.data.conversation.id;

    const aSock = connect(alice.accessToken);
    const bSock = connect(bob.accessToken);
    const cSock = connect(carol.accessToken);
    await Promise.all([
      waitEvent(aSock, "connected"),
      waitEvent(bSock, "connected"),
      waitEvent(cSock, "connected"),
    ]);

    const bobSeen = [];
    const carolSeen = [];
    const aliceSeen = [];
    bSock.on("typing", (ev) => bobSeen.push(ev));
    cSock.on("typing", (ev) => carolSeen.push(ev));
    aSock.on("typing", (ev) => aliceSeen.push(ev));

    // (ক) সদস্য relay — পার্টনার ইভেন্ট পায়, from/typing সঠিক
    const gotStart = waitEvent(bSock, "typing");
    aSock.emit("typing", { conversationId: convo1, typing: true });
    const start = await gotStart;
    assert.equal(start.conversationId, convo1);
    assert.equal(start.from, alice.user.id);
    assert.equal(start.typing, true);

    // (খ) start throttle — সাথে সাথে পুনরাবৃত্তি (200ms ভেতরে) রিলে হয় না
    aSock.emit("typing", { conversationId: convo1, typing: true });
    await sleep(300);
    assert.equal(
      bobSeen.filter((e) => e.conversationId === convo1 && e.typing === true).length,
      1,
      "এক throttle-window-এ একবারই start relay",
    );

    // (গ) stop — throttle-মুক্ত, সাথে সাথেই পৌঁছায়
    const gotStop = waitEvent(bSock, "typing");
    aSock.emit("typing", { conversationId: convo1, typing: false });
    const stop = await gotStop;
    assert.equal(stop.typing, false);
    assert.equal(stop.from, alice.user.id);

    // (ঘ) সদস্য নয় — alice অন্যের conversation-এ পাঠালে কেউ পায় না
    aSock.emit("typing", { conversationId: convo2, typing: true });
    // (ঙ) জাল/অ-কথোপকথন id — নিঃশেষ
    aSock.emit("typing", {
      conversationId: new mongoose.Types.ObjectId().toString(),
      typing: true,
    });
    await sleep(300);
    assert.equal(carolSeen.length, 0, "অ-সদস্যের typing কারো কাছে যায় না");
    assert.equal(
      bobSeen.filter((e) => e.conversationId !== convo1).length,
      0,
      "জাল id relay হয় না",
    );
    assert.equal(aliceSeen.length, 0, "প্রেরক নিজের room-এ typing পায় না");
  });

  it("typing — প্রেরক ডিসকানেক্ট হলে অসমাপ্ত typing stop পার্টনারে পৌঁছায়", async () => {
    const alice = await registerUser(request);
    const bob = await registerUser(request);
    const c = await request
      .post("/api/v1/conversations")
      .set(auth(alice.accessToken))
      .send({ recipientId: bob.user.id, text: "হ্যালো" });
    const convoId = c.body.data.conversation.id;

    const aSock = connect(alice.accessToken);
    const bSock = connect(bob.accessToken);
    await waitEvent(aSock, "connected");
    await waitEvent(bSock, "connected");

    const gotStart = waitEvent(bSock, "typing");
    aSock.emit("typing", { conversationId: convoId, typing: true });
    assert.equal((await gotStart).typing, true);

    const gotStop = waitEvent(bSock, "typing");
    aSock.disconnect(); // stop না পাঠিয়েই বিচ্ছিন্ন
    const stop = await gotStop;
    assert.equal(stop.typing, false, "ডিসকানেক্ট-টিপে থাকা typing stop হয়");
    assert.equal(stop.conversationId, convoId);
    assert.equal(stop.from, alice.user.id);
  });

  it("presence — পার্টনার সংযুক্ত হলে online, বিচ্ছিন্ন হলে offline; query-তে snapshot", async () => {
    const alice = await registerUser(request);
    const bob = await registerUser(request);
    const c = await request
      .post("/api/v1/conversations")
      .set(auth(alice.accessToken))
      .send({ recipientId: bob.user.id, text: "হ্যালো" });
    assert.equal(c.status, 201);

    const aSock = connect(alice.accessToken);
    await waitEvent(aSock, "connected");

    // সংযোগের আগে — bob offline
    assert.deepEqual(await queryPresence(aSock, [bob.user.id]), [], "আগে offline");

    // bob সংযুক্ত → alice-কে পার্টনার-প্রসঙ্গে লাইভ online
    const gotOnline = waitEvent(aSock, "presence:update");
    const bSock = connect(bob.accessToken);
    await waitEvent(bSock, "connected");
    assert.deepEqual(await gotOnline, { userId: bob.user.id, online: true });
    assert.deepEqual(await queryPresence(aSock, [bob.user.id]), [bob.user.id], "এখন online");

    // bob বিচ্ছিন্ন → লাইভ offline (শেষ সংযোগ কাটলেই)
    const gotOffline = waitEvent(aSock, "presence:update");
    bSock.disconnect();
    assert.deepEqual(await gotOffline, { userId: bob.user.id, online: false });
    assert.deepEqual(await queryPresence(aSock, [bob.user.id]), [], "আবার offline");
  });

  it("presence:query — কার্যকর id ছাড়া অন্যটি বাদ, সীমা ছাড়ে না", async () => {
    const alice = await registerUser(request);
    const aSock = connect(alice.accessToken);
    await waitEvent(aSock, "connected");

    const stranger = new mongoose.Types.ObjectId().toString();
    assert.deepEqual(
      await queryPresence(aSock, [stranger, "not-an-id", 42, stranger]),
      [],
      "অনলাইন নয়/জাল বাদ — শুধু বৈধ অনলাইন id",
    );
  });
});
