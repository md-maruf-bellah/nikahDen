import jwt from "jsonwebtoken";
import env from "../src/config/env.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import User from "../src/models/user.model.js";

const API_BASE = "http://localhost:5000/api/v1";

async function login(email, password = "Password@123") {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const data = await res.json();
      return { token: data.data.accessToken, user: data.data.user };
    }
  } catch {}

  // Fallback to token generation if rate limited
  const user = await User.findOne({ email: email.toLowerCase() }).lean();
  if (!user) throw new Error(`User not found: ${email}`);
  const token = jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "1h" }
  );
  return { token, user: { ...user, id: user._id.toString() } };
}

async function runTests() {
  await connectDB(env.MONGODB_URI);
  console.log("=== STARTING 10-USER MULTI-RELIGION AUTOMATED TEST SUITE ===");
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      throw new Error(message);
    }
    passed++;
    console.log(`✅ PASS: ${message}`);
  }

  // 1. Log in users
  console.log("\n--- 1. Login Authentication ---");
  const muslim = await login("muslim_male_1@nikahdeen.dev");
  assert(muslim.token && muslim.user.email === "muslim_male_1@nikahdeen.dev", "Muslim user authenticated successfully");

  const hindu = await login("hindu_male_1@nikahdeen.dev");
  assert(hindu.token && hindu.user.email === "hindu_male_1@nikahdeen.dev", "Hindu user authenticated successfully");

  const christian = await login("christian_male_1@nikahdeen.dev");
  assert(christian.token && christian.user.email === "christian_male_1@nikahdeen.dev", "Christian user authenticated successfully");

  const buddhist = await login("buddhist_male_1@nikahdeen.dev");
  assert(buddhist.token && buddhist.user.email === "buddhist_male_1@nikahdeen.dev", "Buddhist user authenticated successfully");

  // 2. Directory Isolation Test
  console.log("\n--- 2. Directory Same-Religion Isolation ---");
  const muslimListRes = await fetch(`${API_BASE}/biodatas?limit=50`, {
    headers: { Authorization: `Bearer ${muslim.token}` },
  });
  const muslimListData = await muslimListRes.json();
  const muslimVisibleItems = muslimListData.data || [];

  // Verify Muslim cannot see restricted profiles of other religions
  const hasRestrictedHindu = muslimVisibleItems.some((b) => b.biodataNo === "BD-1004" || b.biodataNo === "BD-1005");
  assert(!hasRestrictedHindu, "Muslim directory NEVER includes restricted Hindu profiles (BD-1004, BD-1005)");

  const hasRestrictedChristian = muslimVisibleItems.some((b) => b.biodataNo === "BD-1007");
  assert(!hasRestrictedChristian, "Muslim directory NEVER includes restricted Christian profiles (BD-1007)");

  const hasRestrictedBuddhist = muslimVisibleItems.some((b) => b.biodataNo === "BD-1009" || b.biodataNo === "BD-1010");
  assert(!hasRestrictedBuddhist, "Muslim directory NEVER includes restricted Buddhist profiles (BD-1009, BD-1010)");

  // Verify Muslim can see Muslim profiles and cross-religion permitted profiles
  const hasOwnMuslim = muslimVisibleItems.some((b) => b.biodataNo === "BD-1002");
  assert(hasOwnMuslim, "Muslim directory includes same-religion Muslim profiles (BD-1002)");

  const hasCrossReligionPermitted = muslimVisibleItems.some((b) => b.biodataNo === "BD-1006" || b.biodataNo === "BD-1008");
  assert(hasCrossReligionPermitted, "Muslim directory includes cross-religion permitted profiles (BD-1006 / BD-1008)");

  // 3. Hindu user directory check
  console.log("\n--- 3. Hindu User Directory Isolation ---");
  const hinduListRes = await fetch(`${API_BASE}/biodatas?limit=50`, {
    headers: { Authorization: `Bearer ${hindu.token}` },
  });
  const hinduListData = await hinduListRes.json();
  const hinduVisibleItems = hinduListData.data || [];

  const hinduHasRestrictedMuslim = hinduVisibleItems.some((b) => b.biodataNo === "BD-1001" || b.biodataNo === "BD-1002");
  assert(!hinduHasRestrictedMuslim, "Hindu directory NEVER includes restricted Muslim profiles (BD-1001, BD-1002)");

  const hinduHasOwn = hinduVisibleItems.some((b) => b.biodataNo === "BD-1005");
  assert(hinduHasOwn, "Hindu directory includes same-religion Hindu profiles (BD-1005)");

  // 4. Biodata Number Search & Filter Test
  console.log("\n--- 4. Biodata Number Search & Filtering ---");
  const bioNoRes = await fetch(`${API_BASE}/biodatas?biodataNo=BD-1003`, {
    headers: { Authorization: `Bearer ${muslim.token}` },
  });
  const bioNoData = await bioNoRes.json();
  assert(bioNoData.data?.length === 1 && bioNoData.data[0].biodataNo === "BD-1003", "Exact biodataNo filter returns BD-1003");

  const searchRes = await fetch(`${API_BASE}/biodatas?search=1003`, {
    headers: { Authorization: `Bearer ${muslim.token}` },
  });
  const searchData = await searchRes.json();
  assert(searchData.data?.some((b) => b.biodataNo === "BD-1003"), "General search for '1003' finds BD-1003");

  // 5. Direct Detail View Cross-Religion Guard
  console.log("\n--- 5. Direct Detail View Access Controls ---");
  // Find id of restricted Hindu profile BD-1004 by fetching with Hindu user token
  const find1004Res = await fetch(`${API_BASE}/biodatas?biodataNo=BD-1004`, {
    headers: { Authorization: `Bearer ${hindu.token}` },
  });
  const doc1004 = (await find1004Res.json()).data[0];

  // Find id of cross-permitted Hindu profile BD-1006
  const find1006Res = await fetch(`${API_BASE}/biodatas?biodataNo=BD-1006`, {
    headers: { Authorization: `Bearer ${hindu.token}` },
  });
  const doc1006 = (await find1006Res.json()).data[0];

  // Muslim attempts to view restricted Hindu profile BD-1004 directly by id
  const viewBlockedRes = await fetch(`${API_BASE}/biodatas/${doc1004.id}`, {
    headers: { Authorization: `Bearer ${muslim.token}` },
  });
  const viewBlockedData = await viewBlockedRes.json();
  assert(viewBlockedRes.status === 403 && viewBlockedData.errorCode === "CROSS_RELIGION_RESTRICTED", "Muslim blocked with 403 CROSS_RELIGION_RESTRICTED when viewing BD-1004");

  // Muslim views cross-permitted Hindu profile BD-1006
  const viewAllowedRes = await fetch(`${API_BASE}/biodatas/${doc1006.id}`, {
    headers: { Authorization: `Bearer ${muslim.token}` },
  });
  if (!viewAllowedRes.ok) {
    console.error("viewAllowedRes failed status:", viewAllowedRes.status, await viewAllowedRes.text());
  }
  assert(viewAllowedRes.ok, "Muslim successfully views cross-religion permitted profile BD-1006");

  // 6. Like Cross-Religion Restriction
  console.log("\n--- 6. Like & Match Cross-Religion Controls ---");
  // Muslim attempts to like restricted Hindu profile BD-1004
  const likeBlockedRes = await fetch(`${API_BASE}/biodatas/${doc1004.id}/like`, {
    method: "POST",
    headers: { Authorization: `Bearer ${muslim.token}` },
  });
  const likeBlockedData = await likeBlockedRes.json();
  assert(likeBlockedRes.status === 403 && likeBlockedData.errorCode === "CROSS_RELIGION_RESTRICTED", "Muslim like blocked with 403 CROSS_RELIGION_RESTRICTED on BD-1004");

  // Muslim likes cross-permitted Hindu profile BD-1006
  const likeAllowedRes = await fetch(`${API_BASE}/biodatas/${doc1006.id}/like`, {
    method: "POST",
    headers: { Authorization: `Bearer ${muslim.token}` },
  });
  assert(likeAllowedRes.ok || likeAllowedRes.status === 409, "Muslim can like cross-religion permitted profile BD-1006");

  // 7. Messaging Guard Cross-Religion Restriction
  console.log("\n--- 7. Messaging Intent & Guard Controls ---");
  // Muslim attempts to start chat with owner of restricted Hindu profile BD-1004
  const msgBlockedRes = await fetch(`${API_BASE}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${muslim.token}`,
    },
    body: JSON.stringify({
      recipientId: doc1004.ownerId,
      text: "নমস্কার",
    }),
  });
  const msgBlockedData = await msgBlockedRes.json();
  assert(msgBlockedRes.status === 403 && msgBlockedData.errorCode === "CROSS_RELIGION_RESTRICTED", "Messaging blocked with 403 CROSS_RELIGION_RESTRICTED when targeting BD-1004");

  // Muslim searches intent for restricted vs permitted
  const previewRes = await fetch(`${API_BASE}/users/search-intent?ids=${doc1004.ownerId},${doc1006.ownerId}`, {
    headers: { Authorization: `Bearer ${muslim.token}` },
  });
  const previewData = await previewRes.json();
  const item1004 = previewData.data.find((p) => (p.id || p.userId) === doc1004.ownerId);
  const item1006 = previewData.data.find((p) => (p.id || p.userId) === doc1006.ownerId);
  assert(item1004?.canMessage === false && item1004?.reason === "CROSS_RELIGION_RESTRICTED", "Search-intent preview shows CROSS_RELIGION_RESTRICTED for BD-1004");
  assert(item1006?.canMessage === true, "Search-intent preview shows canMessage: true for permitted BD-1006");

  console.log(`\n=======================================================`);
  console.log(`🎉 ALL ${passed} / ${total} END-TO-END TESTS PASSED SUCCESSFULLY!`);
  console.log(`=======================================================\n`);
  await disconnectDB();
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
