import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import {
  startServer,
  stopServer,
  clearDb,
  createSuperAdmin,
  registerUser,
  auth,
  approveAllBiodatas,
} from "./helpers.js";

describe("PREFERENCES / MATCHING", () => {
  let requestObj;

  before(async () => {
    const s = await startServer();
    requestObj = s.request;
    await createSuperAdmin();
  });

  after(async () => {
    await stopServer();
  });

  beforeEach(async () => {
    await clearDb();
    await createSuperAdmin();
  });

  const biodataPayload = (overrides = {}) => ({
    gender: "FEMALE",
    maritalStatus: "UNMARRIED",
    religion: "Islam",
    division: "ঢাকা",
    birthYear: 2000,
    education: "স্নাতক",
    occupation: "শিক্ষক",
    mobile: "01712345678",
    agreed: true,
    firstName: "পরীক্ষা",
    lastName: "মেম্বার",
    ...overrides,
  });

  // প্রতিটি ক্যান্ডিট বায়োডাটা আলাদা ইউজারের নামে হবে (এক ইউজারের একটাই বায়োডাটা)।
  async function createApprovedBiodata(overrides = {}) {
    const owner = await registerUser(requestObj);
    const res = await requestObj.post("/api/v1/biodatas").set(auth(owner.accessToken)).send(biodataPayload(overrides));
    assert.equal(res.status, 201, JSON.stringify(res.body));
    await requestObj.post("/api/v1/biodatas/me/submit").set(auth(owner.accessToken));
    await approveAllBiodatas();
    return res.body.data;
  }

  describe("own preferences", () => {
    it("GET /preferences/me returns empty implicit preference without creating a document", async () => {
      const member = await registerUser(requestObj);
      const res = await requestObj.get("/api/v1/preferences/me").set(auth(member.accessToken));
      assert.equal(res.status, 200);
      assert.equal(res.body.data.isNew, true);
      assert.equal(res.body.data.id, null);
      assert.equal(res.body.data.gender, null);
    });

    it("PUT /preferences/me saves and re-reads preferences; requires auth", async () => {
      const anon = await requestObj.get("/api/v1/preferences/me");
      assert.equal(anon.status, 401);

      const member = await registerUser(requestObj);
      const res = await requestObj
        .put("/api/v1/preferences/me")
        .set(auth(member.accessToken))
        .send({
          gender: "MALE",
          ageMin: 24,
          ageMax: 32,
          divisions: ["ঢাকা", "সিলেট"],
          religion: "Islam",
          maritalStatuses: ["UNMARRIED"],
          education: "স্নাতক",
          occupation: "ইঞ্জিনিয়ার",
          minMatchScore: 60,
        });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.gender, "MALE");
      assert.deepEqual(res.body.data.divisions, ["ঢাকা", "সিলেট"]);
      assert.equal(res.body.data.minMatchScore, 60);

      const again = await requestObj.get("/api/v1/preferences/me").set(auth(member.accessToken));
      assert.equal(again.body.data.isNew, false);
      assert.equal(again.body.data.ageMax, 32);

      // invalid payloads rejected
      const bad = await requestObj.put("/api/v1/preferences/me").set(auth(member.accessToken)).send({ gender: "X" });
      assert.equal(bad.status, 400);

      const badAge = await requestObj
        .put("/api/v1/preferences/me")
        .set(auth(member.accessToken))
        .send({ ageMin: 40, ageMax: 25 });
      assert.equal(badAge.status, 400);
    });
  });

  describe("matching engine", () => {
    it("ranks by preference overlap: full match > partial; excludes self, wrong gender, out-of-band age", async () => {
      const seeker = await registerUser(requestObj); // খোঁজা ইউজার — নিজের কোনো বায়োডাটা নেই

      // পুরো মিলবে (FEMALE, Islam, UNMARRIED, ঢাকা, বয়স ২৪, শিক্ষক)
      const perfect = await createApprovedBiodata({
        gender: "FEMALE",
        religion: "Islam",
        maritalStatus: "UNMARRIED",
        division: "ঢাকা",
        birthYear: 2002,
        occupation: "শিক্ষক",
        education: "স্নাতক",
      });

      // আংশিক (শুধু লিঙ্গ+ধর্ম; বয়স ৩৬ ব্যান্ডের বাইরে, বিভাগ ভিন্ন, পেশা ভিন্ন)
      const partial = await createApprovedBiodata({
        gender: "FEMALE",
        religion: "Islam",
        division: "সিলেট",
        birthYear: 1990,
        occupation: "ডাক্তার",
        education: "এমবিবিএস",
      });

      // লিঙ্গ ভুল — hard filter এ বাদ
      await createApprovedBiodata({ gender: "MALE", religion: "Islam" });

      const res = await requestObj
        .put("/api/v1/preferences/me")
        .set(auth(seeker.accessToken))
        .send({ gender: "FEMALE", religion: "Islam", maritalStatuses: ["UNMARRIED"], divisions: ["ঢাকা"], ageMin: 22, ageMax: 28, occupation: "শিক্ষক" });
      assert.equal(res.status, 200);

      const m = await requestObj.get("/api/v1/preferences/matches").set(auth(seeker.accessToken));
      assert.equal(m.status, 200);
      const items = m.body.data;
      assert.equal(m.body.pagination.preferenceApplied, true);

      // MALE বাদ; আংশিকটি বয়স ব্যান্ডের (২২-২৮) বাইরে (৩৬) → হার্ড এক্সক্লুশন
      assert.equal(items.length, 1);
      assert.equal(items[0].id, perfect.id);
      assert.equal(items[0].matchScore, 100, `score: ${JSON.stringify(items[0])}`);
      assert.ok(items[0].matchReasons.length >= 3);
      assert.equal(items[0].likedByMe, false);
      void partial;
    });

    it("partial candidates rank lower, not excluded, when age band includes them", async () => {
      const seeker = await registerUser(requestObj);
      const perfect = await createApprovedBiodata({ division: "ঢাকা", birthYear: 2002, occupation: "শিক্ষক" });
      const partial = await createApprovedBiodata({ division: "সিলেট", birthYear: 1996, occupation: "ডাক্তার" });

      await requestObj
        .put("/api/v1/preferences/me")
        .set(auth(seeker.accessToken))
        .send({ gender: "FEMALE", religion: "Islam", maritalStatuses: ["UNMARRIED"], divisions: ["ঢাকা"], ageMin: 20, ageMax: 35, occupation: "শিক্ষক" });

      const m = await requestObj.get("/api/v1/preferences/matches").set(auth(seeker.accessToken));
      const items = m.body.data;
      assert.equal(items.length, 2);
      assert.equal(items[0].id, perfect.id);
      assert.equal(items[0].matchScore, 100);
      assert.ok(items[1].id === partial.id && items[1].matchScore < 100 && items[1].matchScore > 0, JSON.stringify(items[1]));
    });

    it("minMatchScore filters out weak candidates; likedByMe is reported", async () => {
      const seeker = await registerUser(requestObj);
      const candidate = await createApprovedBiodata({ gender: "FEMALE", religion: "Islam", division: "খুলনা", birthYear: 1995 });

      await requestObj.put("/api/v1/preferences/me").set(auth(seeker.accessToken)).send({ gender: "FEMALE", minMatchScore: 50 });
      let m = await requestObj.get("/api/v1/preferences/matches").set(auth(seeker.accessToken));
      assert.equal(m.body.data.length, 1);
      assert.equal(m.body.data[0].matchScore, 100);

      // age 40-50 শর্ত যোগ → candidate (৩১) ব্যর্থ → স্কোর ০ → minMatchScore ৫০-এ বাদ
      await requestObj.put("/api/v1/preferences/me").set(auth(seeker.accessToken)).send({ gender: "FEMALE", ageMin: 40, ageMax: 50, minMatchScore: 50 });
      m = await requestObj.get("/api/v1/preferences/matches").set(auth(seeker.accessToken));
      assert.equal(m.body.data.length, 0);

      // likedByMe — এখানে minMatchScore নেই (0), তাই ক্যান্ডিডেট ফিরে আসবে
      await requestObj.put("/api/v1/preferences/me").set(auth(seeker.accessToken)).send({ gender: "FEMALE", ageMin: 28, ageMax: 34 });
      await requestObj.post(`/api/v1/biodatas/${candidate.id}/like`).set(auth(seeker.accessToken));
      m = await requestObj.get("/api/v1/preferences/matches").set(auth(seeker.accessToken));
      assert.equal(m.body.data.length, 1, JSON.stringify(m.body));
      assert.equal(m.body.data[0].likedByMe, true);
    });

    it("without preferences returns everything with preferenceApplied=false", async () => {
      const seeker = await registerUser(requestObj);
      await createApprovedBiodata({ gender: "FEMALE", religion: "Hinduism" });
      await createApprovedBiodata({ gender: "MALE", religion: "Islam" });

      const m = await requestObj.get("/api/v1/preferences/matches").set(auth(seeker.accessToken));
      assert.equal(m.body.pagination.preferenceApplied, false);
      assert.equal(m.body.data.length, 2);
      assert.ok(m.body.data.every((x) => x.matchScore === 100));
    });
  });
});
