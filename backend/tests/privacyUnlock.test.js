/**
 * Membership-based profile privacy + point unlock + guardian connection charge —
 * combined workflow tests (real HTTP against the full app).
 *
 * This file sets non-default costs BEFORE the app module loads, proving the
 * actions are separately configurable:
 *   PHOTO_UNLOCK_COST     = 2 (legacy view stays 1)
 *   GUARDIAN_REQUEST_COST = 2 (legacy default 0 = free)
 *
 * Covered combined workflows:
 *   - privacy settings API (CRUD + validation)
 *   - photo policy PUBLIC / MEMBERS / MATCHED / UNLOCK across list, detail,
 *     similar, likes and matches entry points
 *   - point unlock charge: one-time, configurable, never double-charged
 *     (a paid full view already includes photos)
 *   - contact policy PAID (legacy) / MATCHED (free for matches) / PUBLIC
 *   - block recheck revokes photo+contact access and stops charging
 *   - guardian-to-guardian connection charge (separate billable action)
 */
process.env.PHOTO_UNLOCK_COST = "2";
process.env.GUARDIAN_REQUEST_COST = "2";
// VIEW_CONNECT_COST intentionally left at its default (1) to prove the legacy
// view charge is independent of the two new charges.

const { describe, it, before, after, beforeEach } = await import("node:test");
const assert = (await import("node:assert/strict")).default;
const {
  startServer,
  stopServer,
  clearDb,
  registerUser,
  createSuperAdmin,
  createStaff,
  auth,
} = await import("./helpers.js");

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

const PHOTO_URL = "https://cdn.test/profiles/salma.jpg";

describe("PROFILE PRIVACY + POINT UNLOCK", () => {
  let request;
  let adminToken;
  let packCounter = 0;

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

  /** Approved biodata with a photo; returns { member, biodata }.
   *  Pass an existing member to create it for them. */
  async function createOwner(overrides = {}, existingMember = null) {
    const member = existingMember || (await registerUser(request));
    const create = await request.post("/api/v1/biodatas").set(auth(member.accessToken)).send({});
    assert.equal(create.status, 201, JSON.stringify(create.body));
    const fill = await request
      .patch("/api/v1/biodatas/me")
      .set(auth(member.accessToken))
      .send({ ...COMPLETE, profileImage: PHOTO_URL, ...overrides });
    assert.equal(fill.status, 200, JSON.stringify(fill.body));
    const submit = await request.post("/api/v1/biodatas/me/submit").set(auth(member.accessToken));
    assert.equal(submit.status, 200, JSON.stringify(submit.body));
    const approve = await request
      .patch(`/api/v1/biodatas/${submit.body.data.id}/status`)
      .set(auth(adminToken))
      .send({ status: "APPROVED" });
    assert.equal(approve.status, 200, JSON.stringify(approve.body));
    return { member, biodata: approve.body.data };
  }

  const setPrivacy = (token, body) => request.put("/api/v1/privacy/me").set(auth(token)).send(body);
  const getPrivacy = (token) => request.get("/api/v1/privacy/me").set(auth(token));
  const getDetail = (id, token) => {
    const req = request.get(`/api/v1/biodatas/${id}`);
    return token ? req.set(auth(token)) : req;
  };
  const getBalance = async (token) => {
    const res = await request.get("/api/v1/membership/me").set(auth(token));
    assert.equal(res.status, 200, JSON.stringify(res.body));
    return res.body.data.connects.balance;
  };

  /** Buys a 10-connect pack through the real order flow. */
  async function grantConnects(user) {
    packCounter += 1;
    await request
      .post("/api/v1/membership/packs")
      .set(auth(adminToken))
      .send({ name: `Pack ${packCounter}`, connects: 10, price: 99 });
    const packs = await request.get("/api/v1/membership/packs").set(auth(user.accessToken));
    const packId = packs.body.data[0].id;
    const order = await request.post("/api/v1/orders").set(auth(user.accessToken)).send({ kind: "PACK", packId });
    assert.equal(order.status, 201, JSON.stringify(order.body));
    const pay = await request
      .post(`/api/v1/orders/${order.body.data.id}/pay`)
      .set(auth(user.accessToken))
      .send({ paymentMethod: "CARD" });
    assert.equal(pay.status, 200, JSON.stringify(pay.body));
  }

  // -------------------------------------------------------------------------
  describe("privacy settings API", () => {
    it("requires auth, returns legacy defaults, validates and persists updates", async () => {
      const anon = await request.get("/api/v1/privacy/me");
      assert.equal(anon.status, 401);

      const member = await registerUser(request);
      const def = await getPrivacy(member.accessToken);
      assert.equal(def.status, 200);
      assert.equal(def.body.data.isNew, true);
      assert.equal(def.body.data.photoVisibility, "PUBLIC");
      assert.equal(def.body.data.contactVisibility, "PAID");

      const bad = await setPrivacy(member.accessToken, { photoVisibility: "BOGUS" });
      assert.equal(bad.status, 400);
      assert.equal(bad.body.errorCode, "VALIDATION_ERROR");

      const empty = await setPrivacy(member.accessToken, {});
      assert.equal(empty.status, 400);

      const ok = await setPrivacy(member.accessToken, { photoVisibility: "MATCHED", contactVisibility: "PUBLIC" });
      assert.equal(ok.status, 200, JSON.stringify(ok.body));
      assert.equal(ok.body.data.photoVisibility, "MATCHED");

      const again = await getPrivacy(member.accessToken);
      assert.equal(again.body.data.photoVisibility, "MATCHED");
      assert.equal(again.body.data.contactVisibility, "PUBLIC");

      // another member is unaffected
      const other = await registerUser(request);
      const otherView = await getPrivacy(other.accessToken);
      assert.equal(otherView.body.data.photoVisibility, "PUBLIC");
    });
  });

  // -------------------------------------------------------------------------
  describe("legacy defaults are unchanged (photo PUBLIC, contact PAID)", () => {
    it("guest sees photo but no contact; member without connects still gets 403", async () => {
      const { biodata } = await createOwner();

      const guest = await getDetail(biodata.id);
      assert.equal(guest.status, 200);
      assert.equal(guest.body.data.profileImage, PHOTO_URL);
      assert.equal(guest.body.data.photoLocked, false);
      assert.equal(guest.body.data.mobile, undefined);

      const viewer = await registerUser(request);
      const blocked = await getDetail(biodata.id, viewer.accessToken);
      assert.equal(blocked.status, 403);
      assert.equal(blocked.body.errorCode, "CONNECTS_INSUFFICIENT");
    });
  });

  // -------------------------------------------------------------------------
  describe("photo policy UNLOCK — configurable point charge, never twice", () => {
    it("summary/list hide photos until unlock; charge is 2 (configured), one-time, per viewer", async () => {
      const o1 = await createOwner();
      const o2 = await createOwner({ firstName: "Other" });
      for (const o of [o1, o2]) {
        const set = await setPrivacy(o.member.accessToken, { photoVisibility: "UNLOCK", contactVisibility: "PUBLIC" });
        assert.equal(set.status, 200, JSON.stringify(set.body));
      }

      // guest: summary shows contact (owner opted PUBLIC) but photos stay locked
      const guestDetail = await getDetail(o1.biodata.id);
      assert.equal(guestDetail.status, 200);
      assert.equal(guestDetail.body.data.mobile, "01712345678");
      assert.equal(guestDetail.body.data.profileImage, null);
      assert.equal(guestDetail.body.data.photoLocked, true);
      assert.equal(guestDetail.body.data.photoUnlockCost, 2); // PHOTO_UNLOCK_COST honored
      assert.deepEqual(guestDetail.body.data.photos, []);

      // guest: list + similar are masked too
      const list = await request.get("/api/v1/biodatas");
      assert.equal(list.status, 200);
      for (const item of list.body.data) {
        assert.equal(item.profileImage, null);
        assert.equal(item.photoLocked, true);
      }
      const similar = await request.get(`/api/v1/biodatas/${o1.biodata.id}/similar`);
      assert.equal(similar.status, 200);
      for (const item of similar.body.data) {
        assert.equal(item.profileImage, null);
        assert.equal(item.photoLocked, true);
      }

      // broke viewer cannot unlock (separate charge has its own balance gate)
      const viewer = await registerUser(request);
      const broke = await request.post(`/api/v1/biodatas/${o1.biodata.id}/unlock-photo`).set(auth(viewer.accessToken));
      assert.equal(broke.status, 403);
      assert.equal(broke.body.errorCode, "CONNECTS_INSUFFICIENT");

      await grantConnects(viewer);
      assert.equal(await getBalance(viewer.accessToken), 10);

      const unlock = await request.post(`/api/v1/biodatas/${o1.biodata.id}/unlock-photo`).set(auth(viewer.accessToken));
      assert.equal(unlock.status, 200, JSON.stringify(unlock.body));
      assert.equal(unlock.body.data.alreadyUnlocked, false);
      assert.equal(unlock.body.data.cost, 2);
      assert.equal(unlock.body.data.balance, 8);

      // point-deduction notification reaches the spender's notification feed
      const notif = await request.get("/api/v1/notifications").set(auth(viewer.accessToken));
      assert.equal(notif.status, 200);
      const spendNotif = notif.body.data.items.find((n) => n.title === "Connects spent");
      assert.ok(spendNotif, "spender received a 'Connects spent' notification");
      assert.match(spendNotif.body, /unlock photos/);

      // idempotent — no second charge
      const again = await request.post(`/api/v1/biodatas/${o1.biodata.id}/unlock-photo`).set(auth(viewer.accessToken));
      assert.equal(again.status, 200);
      assert.equal(again.body.data.alreadyUnlocked, true);
      assert.equal(again.body.data.cost, 0);
      assert.equal(await getBalance(viewer.accessToken), 8);

      // unlocked for THIS viewer only — detail (contact PUBLIC → free) and list
      const detail = await getDetail(o1.biodata.id, viewer.accessToken);
      assert.equal(detail.status, 200);
      assert.equal(detail.body.data.profileImage, PHOTO_URL);
      assert.equal(detail.body.data.photoLocked, false);
      assert.equal(await getBalance(viewer.accessToken), 8); // no view charge when contact is PUBLIC

      const viewerList = await request.get("/api/v1/biodatas").set(auth(viewer.accessToken));
      const mine = viewerList.body.data.find((i) => i.id === o1.biodata.id);
      assert.equal(mine.profileImage, PHOTO_URL);
      const otherItem = viewerList.body.data.find((i) => i.id === o2.biodata.id);
      assert.equal(otherItem.profileImage, null); // per-viewer unlock

      const guestListAfter = await request.get("/api/v1/biodatas");
      const stillLocked = guestListAfter.body.data.find((i) => i.id === o1.biodata.id);
      assert.equal(stillLocked.profileImage, null);
    });

    it("a paid full view includes photos — unlock afterwards is free (never charge twice)", async () => {
      const owner = await createOwner();
      const pu = await setPrivacy(owner.member.accessToken, { photoVisibility: "UNLOCK" }); // contact stays PAID
      assert.equal(pu.status, 200, JSON.stringify(pu.body));

      const viewer = await registerUser(request);
      await grantConnects(viewer);
      assert.equal(await getBalance(viewer.accessToken), 10);

      // full view charge (legacy cost 1) — photos come with it
      const view = await getDetail(owner.biodata.id, viewer.accessToken);
      assert.equal(view.status, 200);
      assert.equal(view.body.data.mobile, "01712345678");
      assert.equal(view.body.data.profileImage, PHOTO_URL);
      assert.equal(view.body.data.photoLocked, false);
      assert.equal(await getBalance(viewer.accessToken), 9); // VIEW_CONNECT_COST = 1

      // photo unlock would now be a double charge → free
      const unlock = await request.post(`/api/v1/biodatas/${owner.biodata.id}/unlock-photo`).set(auth(viewer.accessToken));
      assert.equal(unlock.status, 200);
      assert.equal(unlock.body.data.alreadyUnlocked, true);
      assert.equal(unlock.body.data.cost, 0);
      assert.equal(await getBalance(viewer.accessToken), 9);

      // list keeps showing the photo for this viewer (paid view recorded)
      const list = await request.get("/api/v1/biodatas").set(auth(viewer.accessToken));
      const item = list.body.data.find((i) => i.id === owner.biodata.id);
      assert.equal(item.profileImage, PHOTO_URL);
    });
  });

  // -------------------------------------------------------------------------
  describe("photo policy MEMBERS and MATCHED", () => {
    it("MEMBERS: guests locked, any logged-in member sees the photo", async () => {
      const owner = await createOwner();
      const mem = await setPrivacy(owner.member.accessToken, { photoVisibility: "MEMBERS" });
      assert.equal(mem.status, 200, JSON.stringify(mem.body));

      const guestList = await request.get("/api/v1/biodatas");
      const guestItem = guestList.body.data.find((i) => i.id === owner.biodata.id);
      assert.equal(guestItem.profileImage, null);
      assert.equal(guestItem.photoLocked, true);

      const guestDetail = await getDetail(owner.biodata.id);
      assert.equal(guestDetail.body.data.profileImage, null);
      assert.equal(guestDetail.body.data.photoLocked, true);
      assert.equal(guestDetail.body.data.mobile, undefined); // contact policy untouched (PAID)

      const member = await registerUser(request);
      const memberList = await request.get("/api/v1/biodatas").set(auth(member.accessToken));
      const memberItem = memberList.body.data.find((i) => i.id === owner.biodata.id);
      assert.equal(memberItem.profileImage, PHOTO_URL);
      assert.equal(memberItem.photoLocked, false);
    });

    it("MATCHED: locked for everyone until mutual like, then visible in list, likes and matches", async () => {
      const owner = await createOwner();
      const mt = await setPrivacy(owner.member.accessToken, { photoVisibility: "MATCHED" });
      assert.equal(mt.status, 200, JSON.stringify(mt.body));
      const seeker = await registerUser(request);

      // before any like: locked everywhere
      const listBefore = await request.get("/api/v1/biodatas").set(auth(seeker.accessToken));
      const itemBefore = listBefore.body.data.find((i) => i.id === owner.biodata.id);
      assert.equal(itemBefore.profileImage, null);
      assert.equal(itemBefore.photoLocked, true);

      // one-way like is not a match → still locked
      const like = await request.post(`/api/v1/biodatas/${owner.biodata.id}/like`).set(auth(seeker.accessToken));
      assert.equal(like.status, 201);

      const sentBefore = await request.get("/api/v1/biodatas/likes/sent").set(auth(seeker.accessToken));
      assert.equal(sentBefore.status, 200);
      const sentItem = sentBefore.body.data.find((x) => x.biodata?.id === owner.biodata.id);
      assert.ok(sentItem, "sent likes contain the target");
      assert.equal(sentItem.biodata.profileImage, null);
      assert.equal(sentItem.biodata.photoLocked, true);

      const matchesBefore = await request.get("/api/v1/preferences/matches").set(auth(seeker.accessToken));
      const matchItemBefore = matchesBefore.body.data.find((i) => i.id === owner.biodata.id);
      assert.ok(matchItemBefore, "matches endpoint returns the owner");
      assert.equal(matchItemBefore.profileImage, null);

      // owner likes back → mutual match → photo visible (no charge)
      await request.post("/api/v1/biodatas").set(auth(seeker.accessToken)).send({});
      await request.patch("/api/v1/biodatas/me").set(auth(seeker.accessToken)).send({
        ...COMPLETE,
        firstName: "Seeker",
        gender: "MALE",
        mobile: "01987654321",
      });
      await request.post("/api/v1/biodatas/me/submit").set(auth(seeker.accessToken));
      const seekerBiodataId = (await request.get("/api/v1/biodatas/me").set(auth(seeker.accessToken))).body.data.id;
      const approveSeeker = await request
        .patch(`/api/v1/biodatas/${seekerBiodataId}/status`)
        .set(auth(adminToken))
        .send({ status: "APPROVED" });
      assert.equal(approveSeeker.status, 200, JSON.stringify(approveSeeker.body));
      const back = await request.post(`/api/v1/biodatas/${seekerBiodataId}/like`).set(auth(owner.member.accessToken));
      assert.equal(back.status, 201);
      assert.equal(back.body.data.isMutual, true);

      const listAfter = await request.get("/api/v1/biodatas").set(auth(seeker.accessToken));
      const itemAfter = listAfter.body.data.find((i) => i.id === owner.biodata.id);
      assert.equal(itemAfter.profileImage, PHOTO_URL);
      assert.equal(itemAfter.photoLocked, false);

      const sentAfter = await request.get("/api/v1/biodatas/likes/sent").set(auth(seeker.accessToken));
      const sentItemAfter = sentAfter.body.data.find((x) => x.biodata?.id === owner.biodata.id);
      assert.equal(sentItemAfter.biodata.profileImage, PHOTO_URL);

      const matchesAfter = await request.get("/api/v1/preferences/matches").set(auth(seeker.accessToken));
      const matchItemAfter = matchesAfter.body.data.find((i) => i.id === owner.biodata.id);
      assert.equal(matchItemAfter.profileImage, PHOTO_URL);

      // a different member is still locked
      const stranger = await registerUser(request);
      const strangerList = await request.get("/api/v1/biodatas").set(auth(stranger.accessToken));
      const strangerItem = strangerList.body.data.find((i) => i.id === owner.biodata.id);
      assert.equal(strangerItem.profileImage, null);

      // matched viewer still pays the legacy contact gate (policy PAID, no connects)
      const brokeMatched = await getDetail(owner.biodata.id, stranger.accessToken);
      assert.equal(brokeMatched.status, 403);
    });
  });

  // -------------------------------------------------------------------------
  describe("contact policy — PAID (legacy) / MATCHED / PUBLIC", () => {
    it("MATCHED: mutual match grants full view free (no 403, no charge); others still pay", async () => {
      const owner = await createOwner();
      const cm = await setPrivacy(owner.member.accessToken, { contactVisibility: "MATCHED" });
      assert.equal(cm.status, 200, JSON.stringify(cm.body));

      // not matched + no connects → legacy gate
      const seeker = await registerUser(request);
      const pre = await getDetail(owner.biodata.id, seeker.accessToken);
      assert.equal(pre.status, 403);
      assert.equal(pre.body.errorCode, "CONNECTS_INSUFFICIENT");

      // make a real match (seeker needs a biodata for the back-like)
      const seekerCreate = await request.post("/api/v1/biodatas").set(auth(seeker.accessToken)).send({});
      assert.equal(seekerCreate.status, 201);
      await request.patch("/api/v1/biodatas/me").set(auth(seeker.accessToken)).send({
        ...COMPLETE,
        firstName: "Seeker",
        gender: "MALE",
        mobile: "01987654321",
      });
      await request.post("/api/v1/biodatas/me/submit").set(auth(seeker.accessToken));
      const seekerBioId = (await request.get("/api/v1/biodatas/me").set(auth(seeker.accessToken))).body.data.id;
      const approveSeeker = await request
        .patch(`/api/v1/biodatas/${seekerBioId}/status`)
        .set(auth(adminToken))
        .send({ status: "APPROVED" });
      assert.equal(approveSeeker.status, 200, JSON.stringify(approveSeeker.body));

      await request.post(`/api/v1/biodatas/${owner.biodata.id}/like`).set(auth(seeker.accessToken));
      const back = await request.post(`/api/v1/biodatas/${seekerBioId}/like`).set(auth(owner.member.accessToken));
      assert.equal(back.body.data.isMutual, true);

      // matched → full view free, zero balance consumed
      const post = await getDetail(owner.biodata.id, seeker.accessToken);
      assert.equal(post.status, 200, JSON.stringify(post.body));
      assert.equal(post.body.data.mobile, "01712345678");
      assert.equal(post.body.data.isOwner, false);
      assert.equal(await getBalance(seeker.accessToken), 0); // no charge
    });

    it("PUBLIC: contact visible to guests too (owner opt-in), members not charged", async () => {
      const owner = await createOwner();
      const cp = await setPrivacy(owner.member.accessToken, { contactVisibility: "PUBLIC" });
      assert.equal(cp.status, 200, JSON.stringify(cp.body));

      const guest = await getDetail(owner.biodata.id);
      assert.equal(guest.status, 200);
      assert.equal(guest.body.data.mobile, "01712345678");

      const member = await registerUser(request);
      const view = await getDetail(owner.biodata.id, member.accessToken);
      assert.equal(view.status, 200);
      assert.equal(view.body.data.mobile, "01712345678");
      assert.equal(await getBalance(member.accessToken), 0); // free — no connects consumed
    });
  });

  // -------------------------------------------------------------------------
  describe("block revokes access and stops charges (recheck on read)", () => {
    it("after block: summary only, photos/contact hidden, no new charge; unblock restores without re-charge", async () => {
      const owner = await createOwner(); // defaults: photo PUBLIC, contact PAID
      const viewer = await registerUser(request);
      await grantConnects(viewer);
      assert.equal(await getBalance(viewer.accessToken), 10);

      // paid full view first
      const before = await getDetail(owner.biodata.id, viewer.accessToken);
      assert.equal(before.status, 200);
      assert.equal(before.body.data.mobile, "01712345678");
      assert.equal(before.body.data.profileImage, PHOTO_URL);
      assert.equal(await getBalance(viewer.accessToken), 9);

      // owner blocks the viewer
      const block = await request.post("/api/v1/blocks").set(auth(owner.member.accessToken)).send({ userId: viewer.user.id });
      assert.equal(block.status, 201);

      // recheck: paid access is revoked — summary only, no extra charge
      const after = await getDetail(owner.biodata.id, viewer.accessToken);
      assert.equal(after.status, 200, JSON.stringify(after.body));
      assert.equal(after.body.data.mobile, undefined);
      assert.equal(after.body.data.profileImage, null);
      assert.equal(after.body.data.photoLocked, true);
      assert.equal(await getBalance(viewer.accessToken), 9);

      const listAfter = await request.get("/api/v1/biodatas").set(auth(viewer.accessToken));
      const item = listAfter.body.data.find((i) => i.id === owner.biodata.id);
      assert.equal(item.profileImage, null);

      // unlock attempt while blocked → refused, not charged
      const unlock = await request.post(`/api/v1/biodatas/${owner.biodata.id}/unlock-photo`).set(auth(viewer.accessToken));
      assert.equal(unlock.status, 403);
      assert.equal(unlock.body.errorCode, "BLOCKED");
      assert.equal(await getBalance(viewer.accessToken), 9);

      // unblock → previously paid access restored without paying again
      const un = await request.del(`/api/v1/blocks/${viewer.user.id}`).set(auth(owner.member.accessToken));
      assert.equal(un.status, 200);
      const restored = await getDetail(owner.biodata.id, viewer.accessToken);
      assert.equal(restored.status, 200);
      assert.equal(restored.body.data.mobile, "01712345678");
      assert.equal(restored.body.data.profileImage, PHOTO_URL);
      assert.equal(await getBalance(viewer.accessToken), 9); // hasViewedBiodata respected
    });
  });

  // -------------------------------------------------------------------------
  describe("guardian connection charge (separate configurable action)", () => {
    const makeVerifiedGuardian = async (member, name = "আবদুল করিম") => {
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
    };

    it("charges 2 connects (configured) once per request; broke requester gets 403", async () => {
      const a = await registerUser(request);
      const b = await registerUser(request);

      // full gate setup: mutual match + both guardians VERIFIED
      const bioA = await createOwner({ firstName: "GA", gender: "FEMALE" }, a);
      const bioB = await createOwner({ firstName: "GB", gender: "MALE", mobile: "01811111111" }, b);
      const like1 = await request.post(`/api/v1/biodatas/${bioB.biodata.id}/like`).set(auth(a.accessToken));
      assert.equal(like1.status, 201, JSON.stringify(like1.body));
      const like2 = await request.post(`/api/v1/biodatas/${bioA.biodata.id}/like`).set(auth(b.accessToken));
      assert.equal(like2.status, 201, JSON.stringify(like2.body));
      assert.equal(like2.body.data.isMutual, true);
      await makeVerifiedGuardian(a);
      await makeVerifiedGuardian(b, "রহিম উদ্দিন");

      // zero connects → cannot open the request (own balance gate)
      const broke = await request
        .post("/api/v1/guardian/contact-requests")
        .set(auth(a.accessToken))
        .send({ targetMemberId: b.user.id });
      assert.equal(broke.status, 403, JSON.stringify(broke.body));
      assert.equal(broke.body.errorCode, "CONNECTS_INSUFFICIENT");

      await grantConnects(a);
      assert.equal(await getBalance(a.accessToken), 10);

      const ok = await request
        .post("/api/v1/guardian/contact-requests")
        .set(auth(a.accessToken))
        .send({ targetMemberId: b.user.id });
      assert.equal(ok.status, 201, JSON.stringify(ok.body));
      assert.equal(ok.body.data.status, "PENDING");
      assert.equal(await getBalance(a.accessToken), 8); // GUARDIAN_REQUEST_COST = 2

      // duplicate open request → 409 BEFORE any charge (never twice)
      const dup = await request
        .post("/api/v1/guardian/contact-requests")
        .set(auth(a.accessToken))
        .send({ targetMemberId: b.user.id });
      assert.equal(dup.status, 409);
      assert.equal(await getBalance(a.accessToken), 8);
    });
  });
});
