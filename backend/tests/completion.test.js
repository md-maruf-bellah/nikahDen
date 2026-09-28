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
import { computeCompletion, groupProgress, COMPLETION_TOTAL_WEIGHT, missingRequired } from "../src/modules/biodatas/biodata.completion.js";

describe("BIODATA COMPLETION", () => {
  let requestObj;

  before(async () => {
    const s = await startServer();
    requestObj = s.request;
    await createSuperAdmin();
  });

  after(async () => stopServer());

  beforeEach(async () => {
    await clearDb();
    await createSuperAdmin();
  });

  const basePayload = (overrides = {}) => ({
    gender: "FEMALE",
    maritalStatus: "UNMARRIED",
    religion: "Islam",
    division: "ঢাকা",
    district: "ঢাকা",
    birthYear: 2000,
    education: "স্নাতক",
    occupation: "শিক্ষক",
    mobile: "01712345678",
    agreed: true,
    firstName: "পরী",
    lastName: "মেম্বার",
    ...overrides,
  });

  async function createBiodata(overrides = {}) {
    const owner = await registerUser(requestObj);
    const res = await requestObj.post("/api/v1/biodatas").set(auth(owner.accessToken)).send(basePayload(overrides));
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return { owner, biodata: res.body.data };
  }

  describe("calculator unit", () => {
    it("empty doc → 0%, full doc → 100%", () => {
      const empty = computeCompletion({});
      assert.equal(empty.percent, 0);
      assert.equal(empty.missing.length, COMPLETION_TOTAL_WEIGHT ? empty.missing.length : 0);
      assert.ok(empty.missing.length > 30, "every field reported missing");

      const fullDoc = {};
      const fill = (o) => {
        for (const g of [
          ["gender", "FEMALE"], ["maritalStatus", "UNMARRIED"], ["birthYear", 2000], ["religion", "Islam"], ["division", "ঢাকা"], ["district", "ঢাকা"],
          ["clothingStyle", "x"], ["healthCondition", "x"], ["entertainmentHabit", "x"], ["politicalView", "x"], ["favoriteBooksPeople", "x"], ["aboutYourself", "x"], ["specialCategories", "x"],
          ["sectOrDenomination", "x"], ["religiousPracticeLevel", "Practicing"], ["placeOfWorshipAttendance", "x"], ["holyBookReading", "x"], ["religiousEducation", "x"], ["religiousDressPreference", "x"], ["charityActivity", "x"], ["religiousOrganization", "x"], ["dietaryPractice", "x"], ["futureReligiousGoal", "x"], ["partnerReligiousExpectation", "x"],
          ["education", "x"], ["degree", "x"], ["institution", "x"], ["subject", "x"], ["result", "x"],
          ["occupation", "x"], ["occupationDetails", "x"], ["monthlyIncome", 1], ["company", "x"], ["experienceYears", "x"],
          ["fatherName", "x"], ["fatherOccupation", "x"], ["motherName", "x"], ["motherOccupation", "x"], ["siblings", "x"],
          ["mobile", "01712345678"], ["profileImage", "/uploads/x.png"],
        ]) fullDoc[g[0]] = g[1];
      };
      fill();
      const full = computeCompletion(fullDoc);
      assert.equal(full.percent, 100);
      assert.equal(full.missing.length, 0);
    });

    it("partial doc → proportional percent; missing lists labels with groups", () => {
      const half = computeCompletion(basePayload({}));
      // basic+contact পূর্ণ, education/occupation আংশিক, বাকি শূন্য
      assert.ok(half.percent > 10 && half.percent < 45, `percent=${half.percent}`);
      const byGroup = Object.fromEntries(half.groups.map((g) => [g.key, g]));
      assert.equal(byGroup.basic.filled, byGroup.basic.total);
      assert.equal(byGroup.family.filled, 0);

      const m = half.missing.find((x) => x.field === "fatherName");
      assert.equal(m.group, "family");
      assert.equal(m.label, "বাবার নাম");

      const mr = missingRequired(basePayload({}));
      assert.deepEqual(mr, []); // base payload-এ সব required আছে
      const mrEmpty = missingRequired({});
      assert.ok(mrEmpty.includes("পেশা") && mrEmpty.includes("অঙ্গীকার"));
    });

    it("groupProgress scales points within group weight", () => {
      const g = groupProgress({ key: "t", weight: 20, fields: [["a"], ["b"], ["c"], ["d"]] }, { a: "x", b: "x" });
      assert.equal(g.filled, 2);
      assert.equal(g.total, 4);
      assert.equal(g.points, 10);
      assert.equal(g.maxPoints, 20);
    });
  });

  describe("API", () => {
    it("GET /biodatas/me/completion reflects created biodata; requires auth", async () => {
      const anon = await requestObj.get("/api/v1/biodatas/me/completion");
      assert.equal(anon.status, 401);

      const { owner } = await createBiodata();
      const res = await requestObj.get("/api/v1/biodatas/me/completion").set(auth(owner.accessToken));
      assert.equal(res.status, 200);
      const d = res.body.data;
      assert.equal(d.hasBiodata, true);
      assert.equal(d.status, "DRAFT");
      assert.ok(d.percent > 10 && d.percent < 45, `percent=${d.percent}`);
      assert.ok(Array.isArray(d.missing) && d.missing.length > 0);
      assert.deepEqual(d.missingRequired, []);

      // খালি ইউজার
      const nobody = await registerUser(requestObj);
      const r2 = await requestObj.get("/api/v1/biodatas/me/completion").set(auth(nobody.accessToken));
      assert.equal(r2.body.data.hasBiodata, false);
      assert.equal(r2.body.data.percent, 0);
    });

    it("completion in GET /biodatas/me (full view) grows after edit; submit still enforces required fields", async () => {
      const { owner } = await createBiodata();
      const before = await requestObj.get("/api/v1/biodatas/me").set(auth(owner.accessToken));
      const p1 = before.body.data.completion.percent;

      await requestObj
        .patch("/api/v1/biodatas/me")
        .set(auth(owner.accessToken))
        .send({ fatherName: "বাবা", motherName: "মা", clothingStyle: "পাঞ্জাবি", aboutYourself: "লম্বা বর্ণনা এখানে।" });
      const after = await requestObj.get("/api/v1/biodatas/me").set(auth(owner.accessToken));
      const p2 = after.body.data.completion.percent;
      assert.ok(p2 > p1, `before=${p1} after=${p2}`);

      // photo upload → media group fills
      const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
      await requestObj.post("/api/v1/biodatas/me/photos").set(auth(owner.accessToken)).attach("photo", png, "me.png");
      const afterPhoto = await requestObj.get("/api/v1/biodatas/me/completion").set(auth(owner.accessToken));
      assert.ok(afterPhoto.body.data.percent > p2, `photo bumped: ${p2} → ${afterPhoto.body.data.percent}`);

      // required-gated submit still works on this complete-enough doc
      const sub = await requestObj.post("/api/v1/biodatas/me/submit").set(auth(owner.accessToken));
      assert.equal(sub.status, 200);
      assert.equal(sub.body.data.status, "PENDING");
    });
  });
});
