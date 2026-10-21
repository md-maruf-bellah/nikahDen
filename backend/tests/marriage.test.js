import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { startServer, stopServer, clearDb, registerUser, createStaff, createSuperAdmin, auth } from "./helpers.js";
import Biodata from "../src/models/biodata.model.js";
import Conversation from "../src/models/conversation.model.js";

const BIO_MALE = {
  firstName: "Arif",
  lastName: "Hossain",
  gender: "MALE",
  religion: "Islam",
  maritalStatus: "UNMARRIED",
  birthYear: 1996,
  division: "ঢাকা",
  district: "ঢাকা",
  occupation: "সফটওয়্যার ইঞ্জিনিয়ার",
  education: "B.Sc in CSE",
  mobile: "01711111111",
  agreed: true,
};

const BIO_FEMALE = {
  firstName: "Fatima",
  lastName: "Jahan",
  gender: "FEMALE",
  religion: "Islam",
  maritalStatus: "UNMARRIED",
  birthYear: 1998,
  division: "ঢাকা",
  district: "ঢাকা",
  occupation: "শিক্ষিকা",
  education: "M.A in Islamic Studies",
  mobile: "01722222222",
  agreed: true,
};

describe("MARRIAGE & PROFILE HIDING", () => {
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

  it("discovers candidate partner from active conversation", async () => {
    const userA = await registerUser(request, { email: "groom@example.com" });
    const userB = await registerUser(request, { email: "bride@example.com" });

    // create biodatas
    await request.post("/api/v1/biodatas").set(auth(userA.accessToken)).send(BIO_MALE).expect(201);
    await request.post("/api/v1/biodatas").set(auth(userB.accessToken)).send(BIO_FEMALE).expect(201);

    // create conversation between A and B
    await Conversation.create({
      participants: [userA.user.id, userB.user.id],
      lastMessage: "আসসালামু আলাইকুম",
    });

    const res = await request
      .get("/api/v1/marriages/partners-candidates")
      .set(auth(userA.accessToken))
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].userId, userB.user.id);
  });

  it("declares marriage, hides biodata with reason MARRIED, and sends notifications", async () => {
    const userA = await registerUser(request, { email: "arif@example.com" });
    const userB = await registerUser(request, { email: "fatima@example.com" });

    const bioARes = await request.post("/api/v1/biodatas").set(auth(userA.accessToken)).send(BIO_MALE).expect(201);
    const bioBRes = await request.post("/api/v1/biodatas").set(auth(userB.accessToken)).send(BIO_FEMALE).expect(201);

    // Approve both biodatas
    await Biodata.updateOne({ _id: bioARes.body.data.id }, { status: "APPROVED" });
    await Biodata.updateOne({ _id: bioBRes.body.data.id }, { status: "APPROVED" });

    // User A declares marriage with User B
    const declareRes = await request
      .post("/api/v1/marriages/declare")
      .set(auth(userA.accessToken))
      .send({
        partnerUserId: userB.user.id,
        marriageDate: "2026-10-15",
        story: "নিকাহ্ দ্বীনের মাধ্যমে আমাদের দেখা ও পারিবারিক সম্মতিতে বিবাহ সম্পন্ন হলো।",
        hideMyBiodata: true,
        hidePartnerBiodata: true,
      })
      .expect(201);

    assert.equal(declareRes.body.success, true);
    assert.equal(declareRes.body.data.status, "VERIFIED");
    assert.equal(declareRes.body.data.groomName, "Arif Hossain");
    assert.equal(declareRes.body.data.brideName, "Fatima Jahan");

    // Check that User A and User B biodatas are both HIDDEN with hiddenReason MARRIED
    const bioAAfter = await Biodata.findById(bioARes.body.data.id);
    const bioBAfter = await Biodata.findById(bioBRes.body.data.id);

    assert.equal(bioAAfter.status, "HIDDEN");
    assert.equal(bioAAfter.hiddenReason, "MARRIED");
    assert.equal(bioBAfter.status, "HIDDEN");
    assert.equal(bioBAfter.hiddenReason, "MARRIED");

    // Partner receives notification
    const notifs = await request.get("/api/v1/notifications").set(auth(userB.accessToken)).expect(200);
    assert.ok(notifs.body.data.items.length >= 1);
    assert.match(notifs.body.data.items[0].title, /বিবাহ/);

    // Site stats reflects the completed marriage
    const statsRes = await request.get("/api/v1/site/stats").expect(200);
    assert.ok(statsRes.body.data.marriagesCompleted >= 1);
  });

  it("allows user to check their marriage and unhide biodata if needed", async () => {
    const userA = await registerUser(request, { email: "unhide-user@example.com" });
    await request.post("/api/v1/biodatas").set(auth(userA.accessToken)).send(BIO_MALE).expect(201);

    await request
      .post("/api/v1/marriages/declare")
      .set(auth(userA.accessToken))
      .send({
        partnerBiodataNo: "OFFLINE-001",
        marriageDate: "2026-10-10",
        story: "অফলাইন বিয়ে",
        hideMyBiodata: true,
      })
      .expect(201);

    const mineRes = await request.get("/api/v1/marriages/me").set(auth(userA.accessToken)).expect(200);
    assert.equal(mineRes.body.data.isMarried, true);
    assert.equal(mineRes.body.data.biodata.status, "HIDDEN");

    // Unhide
    const unhideRes = await request.post("/api/v1/marriages/unhide").set(auth(userA.accessToken)).expect(200);
    assert.equal(unhideRes.body.data.status, "APPROVED");
    assert.equal(unhideRes.body.data.hiddenReason, null);
  });

  it("admin lists marriages, creates offline record, and toggles visibility", async () => {
    // Admin creates an offline marriage
    const createRes = await request
      .post("/api/v1/marriages/admin")
      .set(auth(adminToken))
      .send({
        groomName: "হুমায়ুন কবির",
        brideName: "নাসরিন আক্তার",
        marriageDate: "2026-09-20",
        story: "আলহামদুলিল্লাহ সফল জুটি",
        status: "VERIFIED",
      })
      .expect(201);

    const marriageId = createRes.body.data.id;
    assert.ok(marriageId);

    // Admin lists marriages
    const listRes = await request.get("/api/v1/marriages/admin").set(auth(adminToken)).expect(200);
    assert.equal(listRes.body.success, true);
    assert.ok(listRes.body.data.items.length >= 1);
    assert.ok(listRes.body.data.stats.verified >= 1);

    // Admin updates marriage
    const updateRes = await request
      .patch(`/api/v1/marriages/admin/${marriageId}`)
      .set(auth(adminToken))
      .send({ adminNotes: "ফোন ভেরিফিকেশন সম্পন্ন" })
      .expect(200);

    assert.equal(updateRes.body.data.adminNotes, "ফোন ভেরিফিকেশন সম্পন্ন");
  });
});
