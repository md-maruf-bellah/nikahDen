import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import {
  setupDom,
  ensureRtl,
  bundleModule,
  installFetchMock,
  jsonResponse,
  deferred,
  cleanBundles,
} from "./helpers/jsx-env.mjs";
import { buildChatTargets } from "../src/components/StartChatButton.core.mjs";
import { buildCleanMessagingUrl, ICE_BREAKER_TEXT } from "../src/components/Messenger.core.mjs";

/**
 * ?chat= ডিপ-লিংক ফ্লোর Tier-২ হুক-টেস্ট — আসল AuthProvider + MessagingPage ট্রি-তে।
 *
 * তিনটি প্রমাণ (কম্পোনেন্টের আসল ওয়্যারিং, কোরের পিওর-টেস্ট ছাড়াও):
 *   (ক) URL-পরিষ্কার — খাওয়ামাত্রই history.replaceState দিয়ে ?chat= মুছে যায়,
 *       শুধু tab থাকে (retrigger হয় না); তালিকা-লোড না শেষ হলেও URL পরিষ্কার হয়।
 *   (খ) pending-অপেক্ষা — conversation তালিকা লোড শেষ না হওয়া পর্যন্ত
 *       conversation start বা চ্যাট-খোলা হয় না; লোড শেষ হলেই ছাড়ে।
 *   (গ) একবার-খোলা — pending একবারই ছাড়ে, তাই re-render/সেটলেও দ্বিতীয় start
 *       বা দ্বিতীয় মেসেজ-লোড হয় না; replaceState-ও একবারই।
 *
 * সেটআপ: setupDom (jsdom) + bundleModule (next/navigation-স্টাব — useSearchParams
 * globalThis.__nkTestSearchParams থেকে, next/link-স্টাব) + installFetchMock।
 * সার্চ-প্যারাম আসল StartChatButton.core chatPath (/profile?tab=...&chat=<id>) থেকেই
 * তৈরি — বায়োডাটা-কার্ডের Message বোতামের পাঠানো প্যারামের সাথে হুবহু একই আকৃতি।
 *
 * (এই ফাইল .mjs — JSX নেই; createElement দিয়েই গাছ, কম্পোনেন্টগুলো বান্ডলে)
 */

const ENTRY = `
export { default as MessagingPage } from "@/app/profile/message/MessagingPage";
export { AuthProvider } from "@/lib/auth-context";
`;

// module-scope lazy bundle — প্রথম টেস্টেই বানে, পরেরগুলো ক্যাশ থেকে
let M = null;
async function loadMod() {
  if (!M) M = await bundleModule(ENTRY, "messaging-deeplink");
  return M;
}

const h = React.createElement;
const tree = () => h(M.AuthProvider, null, h(M.MessagingPage));

const dom = setupDom();
const origReplaceState = dom.window.history.replaceState;

const PARTNER = { id: "u2", name: "রহিম উদ্দিন", avatar: null };
/** তালিকায় আগে থেকেই থাকা কথোপকথন — planOpenChatWithUser-এর "open" শাখা */
const EXISTING = { id: "c7", partner: PARTNER, lastMessage: null, unreadCount: 0 };
/** নতুন start-এর সার্ভার-রেশেপড conversation (id c9) */
const STARTED = { id: "c9", partner: PARTNER, lastMessage: null, unreadCount: 0 };

let rtl;
let fetchMock;
let replaces = [];

const startCalls = () => fetchMock.callsTo("/conversations").filter((c) => c.method === "POST");
const listCalls = () => fetchMock.callsTo("/conversations").filter((c) => c.method === "GET");
const msgCalls = () => fetchMock.callsTo("/messages");
const statusCalls = () => fetchMock.callsTo("/status");

/** সব টেস্টে যৌথ রুট — /messages ও /status আগে রাখতে হয় ("/conversations" ফ্র্যাগমেন্ট সব পাথ ধরে) */
function routeCommon(listResponder = () => jsonResponse(200, { data: [] })) {
  fetchMock.on("/auth/me", () => jsonResponse(200, { data: { id: "u1" } }), "GET");
  fetchMock.on("/messages", () => jsonResponse(200, { data: [] }), "GET");
  fetchMock.on("/status", () => jsonResponse(200, { data: { blockedByMe: false } }), "GET");
  fetchMock.on("/conversations", listResponder, "GET");
}

const seatTokens = () => {
  globalThis.localStorage.setItem("nk_access", "acc");
  globalThis.localStorage.setItem("nk_refresh", "ref");
};

/** আসল chatPath (/profile?tab=...&chat=<id>) থেকে useSearchParams-এর ইনপুট বানাই */
function seatDeepLink(partnerId = "u2") {
  const { chatPath } = buildChatTargets(partnerId);
  globalThis.__nkTestSearchParams = new URLSearchParams(chatPath.slice(chatPath.indexOf("?") + 1));
}

beforeEach(() => {
  rtl = ensureRtl();
  fetchMock = installFetchMock();
  globalThis.__nkTestRouter = { push() {} };
  // replaceState স্পাই — কে, কখন, কোন URL দিয়ে পরিষ্কার করল ধরার জন্য
  replaces = [];
  dom.window.history.replaceState = function (state, title, url) {
    if (url != null) replaces.push(String(url));
    return origReplaceState.call(this, state, title, url);
  };
});

afterEach(() => {
  rtl?.cleanup();
  fetchMock?.restore();
  dom.window.history.replaceState = origReplaceState;
  globalThis.localStorage?.clear(); // টোকেন ফাঁকা — টেস্টগুলোর মাঝে jsdom-স্টোরেজ লিক আটকায়
  delete globalThis.__nkTestRouter;
  delete globalThis.__nkTestSearchParams;
});

describe("?chat= ডিপ-লিংক — আসল AuthProvider+MessagingPage ট্রি (Tier-২)", () => {
  it("URL সাথে সাথেই পরিষ্কার; তালিকা-লোড শেষ না হওয়া পর্যন্ত pending অপেক্ষা; লোডের পর ঠিক একবার start ও খোলা", async () => {
    await loadMod();
    const listGate = deferred();
    let listCount = 0;
    routeCommon(() => {
      listCount += 1;
      if (listCount === 1) return listGate.promise; // প্রথম তালিকা-লোড ধরে রাখি
      return jsonResponse(200, { data: [STARTED] });
    });
    fetchMock.on(
      "/conversations",
      () => jsonResponse(200, { data: { conversation: { id: STARTED.id } } }),
      "POST",
    );
    seatTokens();
    seatDeepLink("u2");

    const view = rtl.render(tree());

    // (ক) URL-পরিষ্কার — তালিকা এখনো ধরে রাখা অবস্থায়ই (লোড শেষ হওয়ার আগেই)
    await rtl.waitFor(() => assert.equal(replaces.length, 1, "replaceState একবারই"));
    assert.equal(replaces[0], buildCleanMessagingUrl(), "শুধু tab রেখে ?chat= মুছেছে");
    const url = new URLSearchParams(globalThis.location.search);
    assert.equal(url.get("chat"), null, "URL-এ ?chat= আর নেই");
    assert.equal(url.get("tab"), "মেসেজিং", "tab অক্ষত আছে");

    // (খ) pending-অপেক্ষা — তালিকা লোড না শেষ হওয়া পর্যন্ত কোনো start নেই
    assert.ok(rtl.screen.getByText("লোড হচ্ছে..."), "তালিকা-লোডিং দৃশ্যমান");
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(startCalls().length, 0, "লোডের আগে কোনো start নয় — pending ধরে রেখেছে");
    assert.equal(listCalls().length, 1, "ঠিক একটাই তালিকা-অনুরোধ চলছে (ধরে রাখা)");

    // তালিকা এলেই pending ছাড়ে → ঠিক একটাই start, সঠিক partner-সহ
    listGate.resolve(jsonResponse(200, { data: [] }));
    await rtl.waitFor(() => assert.equal(startCalls().length, 1, "তালিকা-লোডের পর একটাই start"));
    const body = JSON.parse(startCalls()[0].body);
    assert.equal(body.recipientId, "u2", "ডিপ-লিংকের partner-ই রেসিপিয়েন্ট");
    assert.equal(body.text, ICE_BREAKER_TEXT, "আইস-ব্রেকার টেক্সট");

    // (গ) চ্যাট খুলেছে — পার্টনার-নাম ও মেসেজ-ইনপুট দৃশ্যমান
    await rtl.waitFor(() => assert.ok(rtl.screen.getByPlaceholderText("Type a Message...")));
    assert.ok(rtl.screen.getAllByText("রহিম উদ্দিন").length >= 1, "পার্টনার-নাম দৃশ্যমান");

    // একবার-খোলা — re-render + সেটলেও আবার start/মেসেজ-লোড/replaceState হয় না
    view.rerender(tree());
    await new Promise((r) => setTimeout(r, 40));
    assert.equal(startCalls().length, 1, "re-render-এ দ্বিতীয় start নয়");
    assert.equal(msgCalls().length, 1, "মেসেজ-লোডও একবারই");
    assert.equal(replaces.length, 1, "replaceState-ও একবারই");
  });

  it("গেস্টে (টোকেন নেই) ?chat= → URL পরিষ্কার, কিন্তু pending/start/খোলা কিছুই নয়", async () => {
    await loadMod();
    routeCommon(); // তালিকা সাথে সাথেই আসে — গেট নেই
    seatDeepLink("u2");

    rtl.render(tree());

    await rtl.waitFor(() => assert.equal(replaces.length, 1, "গেস্টেও URL-পরিষ্কার একবারই"));
    assert.equal(replaces[0], buildCleanMessagingUrl());
    assert.equal(new URLSearchParams(globalThis.location.search).get("chat"), null, "?chat= মুছে গেছে");
    assert.equal(
      fetchMock.callsTo("/auth/me").length,
      0,
      "টোকেন নেই → AuthProvider সেশন-রিস্টোর কলই করে না",
    );

    await rtl.waitFor(() => assert.ok(rtl.screen.getByText("কোনো কথোপকথন নেই"), "তালিকা লোড শেষ"));
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(startCalls().length, 0, "লগইন ছাড়া কোনো start নয় (chatParamAction pending=null)");
    assert.equal(msgCalls().length, 0, "কোনো মেসেজ-লোড নয়");
    assert.equal(rtl.screen.queryByPlaceholderText("Type a Message..."), null, "চ্যাট-উইন্ডো খোলে নি");
  });

  it("পরিচিত কথোপকথনে ?chat= → start ছাড়াই সেই row খোলে, মেসেজ-লোড একবারই", async () => {
    await loadMod();
    const listGate = deferred();
    let listCount = 0;
    routeCommon(() => {
      listCount += 1;
      if (listCount === 1) return listGate.promise;
      return jsonResponse(200, { data: [EXISTING] });
    });
    seatTokens();
    seatDeepLink("u2");

    const view = rtl.render(tree());

    await rtl.waitFor(() => assert.equal(replaces.length, 1, "replaceState একবারই"));
    assert.equal(replaces[0], buildCleanMessagingUrl());

    // তালিকা-লোড অপেক্ষায় — open-শাখাও এখনো চালু হয়নি
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(startCalls().length, 0, "লোডের আগে কিছুই হয়নি");
    assert.equal(msgCalls().length, 0, "লোডের আগে মেসেজ-লোড নেই");

    listGate.resolve(jsonResponse(200, { data: [EXISTING] }));
    await rtl.waitFor(() => assert.ok(rtl.screen.getByPlaceholderText("Type a Message...")));
    assert.equal(startCalls().length, 0, "পরিচিত partner → নতুন start নয়, সেই row-টিই খোলে");
    await rtl.waitFor(() => assert.equal(msgCalls().length, 1, "মেসেজ-লোড একবারই"));
    assert.equal(statusCalls().length, 1, "openChat একবারই চলেছে (block-status একটাই)");

    // একবার-খোলা — re-render-এ আবার খোলে না
    view.rerender(tree());
    await new Promise((r) => setTimeout(r, 40));
    assert.equal(msgCalls().length, 1, "re-render-এ দ্বিতীয় মেসেজ-লোড নয়");
    assert.equal(startCalls().length, 0, "start তো একবারও হয়নি");
    assert.equal(replaces.length, 1, "replaceState-ও একবারই");
  });
});

if (process.env.NKD_CLEAN_BUNDLES) cleanBundles();
