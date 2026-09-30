import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { startServer, stopServer, clearDb, createSuperAdmin } from "./helpers.js";

/**
 * রাউট-ভিত্তিক রেট-লিমিট: পড়া-শুধু (GET/OPTIONS) ট্রাফিক উদার আলাদা বাকেটে,
 * লেখা/লগইন কঠোর বাকেটে। টেস্টে helpers সব লিমিট 100000 করে দেয়, তাই এখানে
 * আসল কাউন্টিং যাচাই করা হয় RateLimit হেডার থেকে — বাকেট ভাগ হলে
 * readLimiter-এর Limit/X-RateLimit-Limit ব্যবহার করা কাউন্টারের সাথে
 * apiLimiter-এর Limit সমান হতো না।
 */
/** draft-7 standard headers: `RateLimit: limit=…, remaining=…, reset=…` */
function rateHeader(headers, field) {
  const raw = headers["ratelimit"];
  if (!raw) return NaN;
  const m = new RegExp(`${field}=(\\d+)`).exec(raw);
  return m ? Number(m[1]) : NaN;
}

describe("RATE LIMITING", () => {
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

  it("counts public GETs in the generous read bucket, separate from the write bucket", async () => {
    const res = await request.get("/api/v1/biodatas");
    assert.equal(res.status, 200);

    const readLimit = rateHeader(res.headers, "limit");
    assert.ok(readLimit >= 600, `read bucket should be the generous one, got ${readLimit}`);

    const remaining = rateHeader(res.headers, "remaining");
    assert.ok(remaining < readLimit, "GET should consume the read bucket");
  });

  it("OPTIONS preflights are always free", async () => {
    for (let i = 0; i < 3; i += 1) {
      const res = await request
        .options("/api/v1/biodatas")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "GET");
      assert.equal(res.status, 204);
      // CORS preflight কাউন্টার খায় না
      assert.equal(res.headers["ratelimit"], undefined);
    }
  });

  it("write requests are NOT counted in the read bucket", async () => {
    // লেখা-বাকেটের হিসাব আলাদা: একটা POST করে দেখি read-বাকেট অটুট থাকে
    const beforeGet = await request.get("/api/v1/biodatas");
    const remainingBefore = rateHeader(beforeGet.headers, "remaining");

    const post = await request
      .post("/api/v1/auth/login")
      .send({ email: "nobody@test.dev", password: "WrongPass1" });
    assert.equal(post.status, 401); // login fail — কিন্তু রাউট পর্যন্ত পৌঁছেছে

    const afterGet = await request.get("/api/v1/biodatas");
    const remainingAfter = rateHeader(afterGet.headers, "remaining");

    assert.equal(remainingAfter, remainingBefore - 1, "GET counter should move by exactly 1 (the GET), proving POST went to the other bucket");
  });
});
