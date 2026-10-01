import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import {
  ensureRtl,
  bundleModule,
  installFetchMock,
  jsonResponse,
  deferred,
  cleanBundles,
} from "./helpers/jsx-env.mjs";
import { buildChatTargets } from "../src/components/StartChatButton.core.mjs";

/**
 * useGuardPreview-এর auth-hydrate রেস — কম্পোনেন্ট-লেভেলে (RTL)।
 *
 * সেটআপ: আসল AuthProvider + GuardPreviewProvider + প্রোব কম্পোনেন্ট;
 * fetch মক (tokenStore-এর localStorage jsdom-এ), next/navigation স্টাব।
 *
 * মূল দাবি (বাগ-ফিক্সের জন্য অপরিহার্য): /auth/me শেষ না হওয়া পর্যন্ত
 * প্রিভিউ-কল পেন্ডিং থাকে, ইউজার এলে আবার চেষ্টা হয় — নইলে প্রথম
 * পেজ-লোডেই প্রিভিউ চিরতরে হারিয়ে যেত।
 *
 * (এই ফাইল .mjs — JSX নেই; createElement দিয়েই গাছ, প্রোবগুলো বান্ডলে)
 */

const ENTRY = `
export { AuthProvider, useAuth } from "@/lib/auth-context";
export { GuardPreviewProvider, useGuardPreview } from "@/components/GuardPreviewProvider";
export { tokenStore } from "@/lib/api";
import { useEffect, useState } from "react";
import { useGuardPreview } from "@/components/GuardPreviewProvider";
import { useAuth } from "@/lib/auth-context";

/** হুকের ফলাফল DOM-এ ঢালাই প্রোব — data-অ্যাট্রিবিউট দিয়ে পড়া যায় */
export function GuardProbe({ userId }) {
  const [preview, ready] = useGuardPreview(userId);
  const { user, loading } = useAuth();
  return (
    <div
      data-testid="probe"
      data-ready={String(ready)}
      data-disabled={preview ? String(preview.canMessage === false) : "none"}
      data-reason={preview?.reason ?? ""}
      data-user={user?.id ?? ""}
      data-loading={loading ? "1" : "0"}
    />
  );
}

/** ইউজার-আইডি রানটাইমে বদলানোর প্রোব — A→B আইডি-পরিবর্তন টেস্টে */
export function SwitcherProbe() {
  const [id, setId] = useState("ua");
  useEffect(() => {
    const t = setTimeout(() => setId("ub"), 0);
    return () => clearTimeout(t);
  }, []);
  const [preview, ready] = useGuardPreview(id);
  return (
    <div
      data-testid="switcher"
      data-id={id}
      data-ready={String(ready)}
      data-disabled={preview ? String(preview.canMessage === false) : "none"}
      data-reason={preview?.reason ?? ""}
    />
  );
}
`;

// module-scope lazy bundle — প্রথম টেস্টেই বানে, পরেরগুলো ক্যাশ থেকে
let M = null;
async function loadMod() {
  if (!M) M = await bundleModule(ENTRY, "guard-hook");
  return M;
}

const h = React.createElement;
/** লেজি-গেটার: M পরে বানলেও (loadMod-এর আগে কল হলে) সঠিক ইনস্ট্যান্স ধরে */
const withProviders = (children) =>
  h(M.AuthProvider, null, h(M.GuardPreviewProvider, null, children));

let rtl;
let fetchMock;

beforeEach(() => {
  rtl = ensureRtl();
  fetchMock = installFetchMock();
  globalThis.__nkTestRouter = { push() {} };
});

afterEach(() => {
  rtl?.cleanup();
  fetchMock?.restore();
  globalThis.localStorage?.clear(); // টোকেন ফাঁকা — টেস্টগুলোর মাঝে jsdom-স্টোরেজ লিক আটকায়
  delete globalThis.__nkTestRouter;
});

/** data-ready=true হওয়া পর্যন্ত অপেক্ষা */
function waitForReady(testId) {
  return rtl.waitFor(() => {
    assert.equal(rtl.screen.getByTestId(testId).getAttribute("data-ready"), "true");
  });
}

function probeProps(testId) {
  const el = rtl.screen.getByTestId(testId);
  return {
    user: el.getAttribute("data-user"),
    loading: el.getAttribute("data-loading"),
    disabled: el.getAttribute("data-disabled"),
    reason: el.getAttribute("data-reason"),
  };
}

const seatTokens = (access = "acc", refresh = "ref") => {
  if (access) globalThis.localStorage.setItem("nk_access", access);
  if (refresh) globalThis.localStorage.setItem("nk_refresh", refresh);
};

describe("useGuardPreview — auth-hydrate race (কম্পোনেন্ট-লেভেল)", () => {
  it("/auth/me পেন্ডিং থাকলে কোনো প্রিভিউ-কল হয় না; ইউজার এলেই একটা কল যায়", async () => {
    await loadMod();
    const meGate = deferred();

    fetchMock.on("/auth/me", () => meGate.promise, "GET");
    fetchMock.on(
      "/users/search-intent",
      () => jsonResponse(200, { data: [{ id: "u2", canMessage: false, blocked: false, reason: "LIMIT_REACHED" }] }),
      "GET",
    );
    seatTokens();

    rtl.render(withProviders(h(M.GuardProbe, { userId: "u2" })));

    // হাইড্রেশন চলছে: loading=1, ইউজার নেই, প্রিভিউ-কল এখনো যায়নি
    await rtl.waitFor(() => assert.equal(probeProps("probe").loading, "1"));
    await new Promise((r) => setTimeout(r, 5));
    assert.deepEqual(fetchMock.callsTo("/users/search-intent"), [], "me শেষ না হওয়া পর্যন্ত নীরব");

    // /auth/me শেষ → ইউজার এলেই ঠিক একটা প্রিভিউ-কল
    meGate.resolve(jsonResponse(200, { data: { id: "u1" } }));
    await waitForReady("probe");
    assert.equal(probeProps("probe").user, "u1");

    await rtl.waitFor(() => assert.equal(fetchMock.callsTo("/users/search-intent").length, 1));
    await rtl.waitFor(() => assert.equal(probeProps("probe").disabled, "true"));
    assert.equal(probeProps("probe").reason, "LIMIT_REACHED");
  });

  it("গেস্ট (কোনো টোকেন নেই) → হাইড্রেশন শেষেও কোনো প্রিভিউ-কল নেই", async () => {
    await loadMod();

    rtl.render(withProviders(h(M.GuardProbe, { userId: "u2" })));

    await rtl.waitFor(() => assert.equal(probeProps("probe").loading, "0"));
    await new Promise((r) => setTimeout(r, 5));
    assert.deepEqual(fetchMock.callsTo("/users/search-intent"), [], "গেস্টে প্রিভিউ-কল নেই");
    assert.equal(probeProps("probe").disabled, "none");
    assert.equal(probeProps("probe").user, "");
  });

  it("/auth/me 401 → লগআউট-পথ, প্রিভিউ-কল নেই (নিঃশব্দ ব্যর্থতা)", async () => {
    await loadMod();
    fetchMock.on("/auth/me", () => jsonResponse(401, { message: "expired" }), "GET");
    seatTokens();

    rtl.render(withProviders(h(M.GuardProbe, { userId: "u2" })));

    await rtl.waitFor(() => assert.equal(probeProps("probe").loading, "0"));
    await new Promise((r) => setTimeout(r, 5));
    assert.deepEqual(fetchMock.callsTo("/users/search-intent"), []);
    assert.equal(probeProps("probe").user, "");
    assert.equal(globalThis.localStorage.getItem("nk_access"), null, "401-এ টোকেন পরিষ্কার");
  });

  it("এক userId-তে একবারই প্রিভিউ-কল — re-render/প্রোভাইডার-আপডেটে dedup", async () => {
    await loadMod();
    fetchMock.on("/auth/me", () => jsonResponse(200, { data: { id: "u1" } }), "GET");
    fetchMock.on(
      "/users/search-intent",
      () => jsonResponse(200, { data: [{ id: "u2", canMessage: true, blocked: false, reason: null }] }),
      "GET",
    );
    seatTokens("acc", ""); // refresh ছাড়া — refresh-পথ এড়াতে

    rtl.render(withProviders(h(M.GuardProbe, { userId: "u2" })));

    await waitForReady("probe");
    await rtl.waitFor(() => assert.equal(fetchMock.callsTo("/users/search-intent").length, 1));
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(fetchMock.callsTo("/users/search-intent").length, 1, "একই আইডিতে দ্বিতীয় কল নেই");
    assert.equal(probeProps("probe").disabled, "false");
  });

  it("ইউজার-আইডি বদলালে (ua→ub) নতুন করে প্রিভিউ চাওয়া হয়", async () => {
    await loadMod();
    fetchMock.on("/auth/me", () => jsonResponse(200, { data: { id: "u1" } }), "GET");
    fetchMock.on(
      "/users/search-intent",
      (entry) =>
        jsonResponse(200, {
          data: new URL(entry.url).searchParams.get("ids").split(",").map((id) => ({
            id,
            canMessage: false,
            blocked: true,
            reason: null,
          })),
        }),
      "GET",
    );
    seatTokens("acc", "");

    rtl.render(withProviders(h(M.SwitcherProbe)));

    await rtl.waitFor(() => assert.equal(rtl.screen.getByTestId("switcher").getAttribute("data-id"), "ub"));
    // ইকো-রেসপন্ডার blocked:true — প্রিভিউ এলেই disabled (blocked-এর নিজস্ব ফল এলেই যথেষ্ট)
    await rtl.waitFor(() =>
      assert.equal(rtl.screen.getByTestId("switcher").getAttribute("data-disabled"), "true"),
    );

    const calledIds = fetchMock
      .callsTo("/users/search-intent")
      .flatMap((c) => new URL(c.url).searchParams.get("ids").split(","));
    assert.ok(calledIds.includes("ua"), "প্রথম আইডি চাওয়া হয়েছিল");
    assert.ok(calledIds.includes("ub"), "বদলানো আইডিও চাওয়া হয়েছিল");
  });

  it("নিজের আইডি চাওয়াও নিরাপদ — শেয়ার্ড ব্যাচ, উত্তর এলে স্টেট", async () => {
    // StartChatButton নিজের বায়োডাটায় null রেন্ডার করে, কিন্তু হুক-লেভেলে
    // নিজের আইডি ব্যাচে ঢোকাও অ-বিপজ্জনক: ব্যাচ শেয়ার্ড, ফল এলেই স্টেট।
    await loadMod();
    fetchMock.on("/auth/me", () => jsonResponse(200, { data: { id: "u1" } }), "GET");
    fetchMock.on(
      "/users/search-intent",
      () => jsonResponse(200, { data: [{ id: "u1", canMessage: true, blocked: false, reason: null }] }),
      "GET",
    );
    seatTokens("acc", "");

    rtl.render(withProviders(h(M.GuardProbe, { userId: "u1" })));

    await waitForReady("probe");
    await rtl.waitFor(() => assert.equal(fetchMock.callsTo("/users/search-intent").length, 1));
    assert.equal(probeProps("probe").disabled, "false");
    assert.equal(probeProps("probe").user, "u1");
  });
});

describe("StartChatButton — গেস্ট-ক্লিকে লগইন-রিডাইরেক্ট (কম্পোনেন্ট-লেভেল)", () => {
  it("গেস্ট ক্লিক → /login?next=... ডাবল-এনকোডেড পুশ; লগইন থাকলে সরাসরি চ্যাট-পথ", async () => {
    const M2 = await bundleModule(
      `import React from "react";
export default React;
export { default as StartChatButton } from "@/components/StartChatButton";
export { AuthProvider } from "@/lib/auth-context";
export { GuardPreviewProvider } from "@/components/GuardPreviewProvider";
export { tokenStore } from "@/lib/api";`,
      "start-chat",
    );
    const pushes = [];
    globalThis.__nkTestRouter = { push: (p) => pushes.push(p) };

    fetchMock.on("/auth/me", () => jsonResponse(200, { data: { id: "u1" } }), "GET");
    fetchMock.on(
      "/users/search-intent",
      () => jsonResponse(200, { data: [{ id: "u2", canMessage: true, blocked: false, reason: null }] }),
      "GET",
    );

    // গেস্ট: কোনো টোকেন নেই — ক্লিকে লগইনে
    const seat = (children) => h(M2.AuthProvider, null, h(M2.GuardPreviewProvider, null, children));
    rtl.render(seat(h(M2.StartChatButton, { userId: "u2" }, "মেসেজ")));

    fireEventClick();
    function fireEventClick() {
      const btn = rtl.screen.getByRole("button");
      btn.dispatchEvent(new globalThis.Event("click", { bubbles: true, cancelable: true }));
    }

    const [loginPath] = pushes;
    assert.ok(loginPath.startsWith("/login?next="), `গেস্ট লগইনে যায়: ${loginPath}`);
    // ভেতরের পথে "&" এনকোডেড নেই — next= ভেতরের পুরো কোয়েরি এক টুকরায় বাঁধে
    assert.ok(!loginPath.includes("&chat="), "& ভেতরের পথের অংশ — বাইরের কোয়েরি নয়");
    // এক ডিকোডে inner chatPath (ট্যাব এখনো এনকোডেড), দুই ডিকোডে বাংলা ট্যাব
    const inner = decodeURIComponent(loginPath.slice("/login?next=".length));
    assert.equal(inner, buildChatTargets("u2").chatPath, "এক ডিকোডে কোরের chatPath-ই ফেরে");
    assert.equal(decodeURIComponent(new URLSearchParams(inner.split("?")[1]).get("tab")), "মেসেজিং");
    assert.deepEqual(fetchMock.callsTo("/users/search-intent"), [], "গেস্টে প্রিভিউ-কল নেই");

    // লগইন: একই ক্লিক সরাসরি চ্যাটে (কোরের chatPath — ট্যাব এনকোডেড)
    pushes.length = 0;
    M2.tokenStore.set("acc", "ref");
    fireEventClick();
    assert.deepEqual(pushes, [buildChatTargets("u2").chatPath]);
    M2.tokenStore.clear();
  });
});

if (process.env.NKD_CLEAN_BUNDLES) cleanBundles();
