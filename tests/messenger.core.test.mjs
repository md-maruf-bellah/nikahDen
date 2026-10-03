import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ICE_BREAKER_TEXT,
  SEARCH_DEBOUNCE_MS,
  SEARCH_MIN_CHARS,
  MEMBER_SEARCH_LIMIT,
  MESSAGING_TAB,
  guardNoticeFor,
  asArray,
  filterConversations,
  timeLabel,
  memberRowState,
  MEMBER_ROW_LABELS,
  canSendMessage,
  canStartChatWith,
  makeOptimisticMessage,
  resolveOptimisticId,
  revertOptimistic,
  findExistingConversation,
  buildFallbackConversation,
  pickFreshConversation,
  shouldAutoOpenFirst,
  chatParamAction,
  createMemberSearchEngine,
} from "../src/components/Messenger.core.mjs";

/**
 * Messenger কোর — MessagingPage-র স্টেট-লজিক, React ছাড়াই টেস্টেড।
 * (src/components/Messenger.core.mjs — পেজ শুধু ওয়্যারিং)
 */

describe("messenger core — guardNoticeFor", () => {
  it("MESSAGING_UPGRADE_REQUIRED → আপগ্রেড-লিংকসহ নোটিস", () => {
    const n = guardNoticeFor("MESSAGING_UPGRADE_REQUIRED");
    assert.equal(n.upgrade, true);
    assert.ok(n.text.includes("আপগ্রেড"));
  });

  it("MESSAGING_LIMIT_REACHED → সীমা-নোটিস, ম্যাচ/আপগ্রেড উল্লেখ", () => {
    const n = guardNoticeFor("MESSAGING_LIMIT_REACHED");
    assert.equal(n.upgrade, true);
    assert.ok(n.text.includes("সীমা"));
    assert.ok(n.text.includes("ম্যাচ"));
  });

  it("NO_MESSAGING_PACKAGE → প্যাকেজ-নোটিস", () => {
    const n = guardNoticeFor("NO_MESSAGING_PACKAGE");
    assert.equal(n.upgrade, true);
    assert.ok(n.text.includes("প্যাকেজ"));
  });

  it("অজানা কোড + সার্ভার-মেসেজ → সেটাই, upgrade:false", () => {
    const n = guardNoticeFor("SOMETHING_ELSE", "কাস্টম বার্তা");
    assert.deepEqual(n, { upgrade: false, text: "কাস্টম বার্তা" });
  });

  it("অজানা কোড + মেসেজ নেই → null (নীরব)", () => {
    assert.equal(guardNoticeFor("SOMETHING_ELSE"), null);
  });

  it("BLOCKED পথে কলার null দেয় → null", () => {
    assert.equal(guardNoticeFor("BLOCKED", null), null);
  });
});

describe("messenger core — filterConversations / asArray", () => {
  const convos = [
    { id: "c1", partner: { id: "u1", name: "সুচিত্রা বড়ুয়া" } },
    { id: "c2", partner: { id: "u2", name: "Rahim Uddin" } },
    { id: "c3", partner: null },
  ];

  it("partner-নামে কেস-ইনসেনসিটিভ মিল", () => {
    assert.deepEqual(filterConversations(convos, "rahim"), [convos[1]]);
    assert.deepEqual(filterConversations(convos, "সুচি"), [convos[0]]);
  });

  it("partner-নামহীন row ক্র্যাশ করে না, মেলে না", () => {
    assert.doesNotThrow(() => filterConversations(convos, "x"));
    assert.deepEqual(filterConversations(convos, "x"), []);
  });

  it("খালি সার্চ → সব", () => {
    assert.equal(filterConversations(convos, "").length, 3);
  });

  it("asArray: null/অবজেক্ট → []", () => {
    assert.deepEqual(asArray(null), []);
    assert.deepEqual(asArray({ a: 1 }), []);
    assert.deepEqual(asArray([1, 2]), [1, 2]);
  });
});

describe("messenger core — timeLabel", () => {
  it("নাল/অনুপস্থিত iso → খালি স্ট্রিং", () => {
    assert.equal(timeLabel(null), "");
    assert.equal(timeLabel(undefined), "");
    assert.equal(timeLabel(""), "");
  });

  it("আজকের টাইমস্ট্যাম্প → bn-BD সময়-লেবেল", () => {
    const now = new Date("2026-10-03T10:00:00");
    const s = timeLabel("2026-10-03T09:05:00", now);
    assert.ok(typeof s === "string" && s.length > 0);
  });

  it("গতকালের টাইমস্ট্যাম্প → bn-BD তারিখ-লেবেল (আজ নয়)", () => {
    const now = new Date("2026-10-03T10:00:00");
    const s = timeLabel("2026-09-28T09:05:00", now);
    assert.ok(typeof s === "string" && s.length > 0);
  });

  it("আজ বনাম অন্যদিন ভিন্ন শাখা — sameDay নির্ধারক", () => {
    const now = new Date("2026-10-03T23:55:00");
    const today = timeLabel("2026-10-03T00:05:00", now);
    const other = timeLabel("2026-10-02T23:55:00", now);
    assert.ok(today.length > 0 && other.length > 0);
    assert.notEqual(today, other);
  });
});

describe("messenger core — memberRowState", () => {
  const convos = [{ id: "c1", partner: { id: "u1", name: "A" } }];

  it("guard নেই → সক্রিয়, লেবেল নেই", () => {
    const r = memberRowState({ id: "u2" }, convos);
    assert.deepEqual(r, { already: false, disabled: false, reasonLabel: null });
  });

  it("guard:null → সক্রিয় (প্রিভিউ-ব্যর্থতায় ক্লিক অনুমোদিত)", () => {
    const r = memberRowState({ id: "u2", guard: null }, convos);
    assert.equal(r.disabled, false);
  });

  it("canMessage:false + blocked → 'মেসেজিং সম্ভব নয়', নিষ্ক্রিয়", () => {
    const r = memberRowState({ id: "u2", guard: { canMessage: false, blocked: true, reason: "LIMIT_REACHED" } }, convos);
    assert.equal(r.disabled, true);
    assert.equal(r.reasonLabel, MEMBER_ROW_LABELS.blocked);
    assert.equal(r.reasonLabel, "মেসেজিং সম্ভব নয়");
  });

  it("blocked reason-এর আগে আসে", () => {
    const r = memberRowState({ id: "u2", guard: { canMessage: false, blocked: true, reason: "UPGRADE_REQUIRED" } }, convos);
    assert.equal(r.reasonLabel, "মেসেজিং সম্ভব নয়");
  });

  it("LIMIT_REACHED → 'সীমা শেষ — আপগ্রেড বা ম্যাচ'", () => {
    const r = memberRowState({ id: "u2", guard: { canMessage: false, reason: "LIMIT_REACHED" } }, convos);
    assert.equal(r.reasonLabel, "সীমা শেষ — আপগ্রেড বা ম্যাচ");
  });

  it("UPGRADE_REQUIRED / NO_PACKAGE → 'প্যাকেজ আপগ্রেড দরকার'", () => {
    assert.equal(
      memberRowState({ id: "u2", guard: { canMessage: false, reason: "UPGRADE_REQUIRED" } }, convos).reasonLabel,
      "প্যাকেজ আপগ্রেড দরকার"
    );
    assert.equal(
      memberRowState({ id: "u2", guard: { canMessage: false, reason: "NO_PACKAGE" } }, convos).reasonLabel,
      "প্যাকেজ আপগ্রেড দরকার"
    );
  });

  it("canMessage:false + অজানা reason → নিষ্ক্রিয়, লেবেল null (fallback-টেক্সট JSX-এ)", () => {
    const r = memberRowState({ id: "u2", guard: { canMessage: false, reason: "PENDING" } }, convos);
    assert.equal(r.disabled, true);
    assert.equal(r.reasonLabel, null);
  });

  it("canMessage:true → সক্রিয় যদিও guard আছে", () => {
    const r = memberRowState({ id: "u2", guard: { canMessage: true, reason: null } }, convos);
    assert.equal(r.disabled, false);
    assert.equal(r.reasonLabel, null);
  });

  it("already: কথোপকথনে থাকলে true (guard যাই হোক)", () => {
    assert.equal(memberRowState({ id: "u1" }, convos).already, true);
    assert.equal(memberRowState({ id: "u2" }, convos).already, false);
  });

  it("canMessage:false + already একসাথে — দুটোই স্বাধীন", () => {
    const r = memberRowState({ id: "u1", guard: { canMessage: false, reason: "LIMIT_REACHED" } }, convos);
    assert.equal(r.already, true);
    assert.equal(r.disabled, true);
  });
});

describe("messenger core — send gates", () => {
  const chat = { id: "c1", partner: { id: "u2" } };

  it("canSendMessage: খালি/সাদা-স্পেস টেক্সট → নয়", () => {
    assert.equal(canSendMessage("", chat, false), false);
    assert.equal(canSendMessage("   ", chat, false), false);
  });

  it("canSendMessage: চ্যাট নেই বা blocked → নয়", () => {
    assert.equal(canSendMessage("hi", null, false), false);
    assert.equal(canSendMessage("hi", chat, true), false);
  });

  it("canSendMessage: সব ঠিক → true", () => {
    assert.equal(canSendMessage("hi", chat, false), true);
  });

  it("canStartChatWith: ব্যস্ত থাকলে নয়", () => {
    assert.equal(canStartChatWith({ id: "u2" }, "u9"), false);
  });

  it("canStartChatWith: guard-প্রিভিউতে নিষ্ক্রিয় → নয়", () => {
    assert.equal(canStartChatWith({ id: "u2", guard: { canMessage: false } }, null), false);
  });

  it("canStartChatWith: ব্যস্ত নয় + guard নেই/সক্রিয় → true", () => {
    assert.equal(canStartChatWith({ id: "u2" }, null), true);
    assert.equal(canStartChatWith({ id: "u2", guard: { canMessage: true } }, null), true);
  });
});

describe("messenger core — optimistic message", () => {
  it("makeOptimisticMessage: tmp আইডি, sender, টেক্সট, ISO টাইম", () => {
    const now = new Date("2026-10-03T10:00:00Z");
    const m = makeOptimisticMessage({ tmpId: "tmp-1", senderId: "me", text: "হ্যালো", now });
    assert.deepEqual(m, { id: "tmp-1", sender: "me", text: "হ্যালো", createdAt: now.toISOString() });
  });

  it("resolveOptimisticId: শুধু মিলে-যাওয়া row বদলায়, নতুন অ্যারে", () => {
    const prev = [
      { id: "m1", sender: "me", text: "a" },
      { id: "tmp-1", sender: "me", text: "b" },
    ];
    const next = resolveOptimisticId(prev, "tmp-1", "srv-7");
    assert.equal(next[1].id, "srv-7");
    assert.equal(next[0], prev[0], "অমিল row একই রেফারেন্স");
    assert.equal(next[1] !== prev[1], true, "মিলে-যাওয়া row নতুন অবজেক্ট");
    assert.notEqual(next, prev);
  });

  it("resolveOptimisticId: tmp না মিললে অপরিবর্তিত", () => {
    const prev = [{ id: "m1", sender: "me", text: "a" }];
    assert.deepEqual(resolveOptimisticId(prev, "tmp-x", "srv-7"), prev);
  });

  it("revertOptimistic: tmp row বাদ, বাকি অক্ষত", () => {
    const prev = [
      { id: "m1", sender: "me", text: "a" },
      { id: "tmp-1", sender: "me", text: "b" },
      { id: "m2", sender: "u2", text: "c" },
    ];
    const next = revertOptimistic(prev, "tmp-1");
    assert.deepEqual(next.map((m) => m.id), ["m1", "m2"]);
  });
});

describe("messenger core — conversation selection", () => {
  it("findExistingConversation: partner-আইডি মিললে সেটাই", () => {
    const convos = [{ id: "c1", partner: { id: "u1" } }, { id: "c2", partner: { id: "u2" } }];
    assert.equal(findExistingConversation(convos, "u2").id, "c2");
    assert.equal(findExistingConversation(convos, "zz"), null);
    assert.equal(findExistingConversation([], "u1"), null);
  });

  it("buildFallbackConversation: পার্টনার-তথ্যসহ ভার্চুয়াল conversation", () => {
    const c = buildFallbackConversation("cv1", "u9", "নাম", "av.png");
    assert.deepEqual(c, { id: "cv1", partner: { id: "u9", name: "নাম", avatar: "av.png" }, lastMessage: null, unreadCount: 0 });
  });

  it("buildFallbackConversation: নাম/অ্যাভাটার না দিলে null", () => {
    const c = buildFallbackConversation("cv1", "u9");
    assert.equal(c.partner.name, null);
    assert.equal(c.partner.avatar, null);
  });

  it("pickFreshConversation: তালিকায় থাকলে সার্ভার-রেশেপড অবজেক্টই", () => {
    const arr = [{ id: "cv1", partner: { id: "u9", name: "সার্ভার-নাম" }, lastMessage: { text: "হ্যালো" }, unreadCount: 2 }];
    const c = pickFreshConversation(arr, "cv1", "u9", "লোকাল-নাম");
    assert.equal(c.name ?? c.partner.name, "সার্ভার-নাম");
    assert.equal(c.unreadCount, 2);
  });

  it("pickFreshConversation: না পেলে fallback", () => {
    const c = pickFreshConversation([], "cv1", "u9", "নাম");
    assert.deepEqual(c, buildFallbackConversation("cv1", "u9", "নাম"));
  });

  it("shouldAutoOpenFirst: তালিকা আছে + কিছু খোলা নেই → true", () => {
    assert.equal(shouldAutoOpenFirst([{ id: "c1" }], null), true);
    assert.equal(shouldAutoOpenFirst([{ id: "c1" }], { id: "c1" }), false);
    assert.equal(shouldAutoOpenFirst([], null), false);
    assert.equal(shouldAutoOpenFirst(null, null), false);
  });
});

describe("messenger core — chatParamAction (?chat= ডিপ-লিংক গেট)", () => {
  it("chat নেই → null", () => {
    assert.equal(chatParamAction(null, null, true), null);
    assert.equal(chatParamAction(undefined, null, true), null);
    assert.equal(chatParamAction("", null, true), null);
  });

  it("একই chat আবার এলে null (একবারই)", () => {
    assert.equal(chatParamAction("u9", "u9", true), null);
  });

  it("নতুন chat + লগইন → pending=chat, cleanUrl ট্যাব-এনকোডেড", () => {
    const a = chatParamAction("u9", null, true);
    assert.equal(a.chat, "u9");
    assert.equal(a.pending, "u9");
    assert.equal(a.cleanUrl, `/profile?tab=${encodeURIComponent(MESSAGING_TAB)}`);
    assert.equal(decodeURIComponent(new URLSearchParams(a.cleanUrl.split("?")[1]).get("tab")), MESSAGING_TAB);
  });

  it("নতুন chat + গেস্ট → pending null, তবু URL পরিষ্কার হয়", () => {
    const a = chatParamAction("u9", null, false);
    assert.equal(a.pending, null);
    assert.equal(a.chat, "u9");
    assert.ok(a.cleanUrl.startsWith("/profile?tab="));
  });

  it("ভিন্ন chat এলে আবার হ্যান্ডেল হয় (handled রিফ্রেশ)", () => {
    const a = chatParamAction("u9", "old", true);
    assert.equal(a.chat, "u9");
  });

  it("MESSAGING_TAB = 'মেসেজিং' — পেজ-ট্যাবের সাথে যুক্ত", () => {
    assert.equal(MESSAGING_TAB, "মেসেজিং");
  });
});

describe("messenger core — createMemberSearchEngine", () => {
  /** guard-preview.core.test.mjs-এর মতোই নিয়ন্ত্রিত ফেক-টাইমার */
  function fakeTimers() {
    const queue = [];
    return {
      setTimeout(fn, _ms) {
        queue.push(fn);
        return queue.length;
      },
      clearTimeout(handle) {
        const idx = Number(handle) - 1;
        if (idx >= 0 && idx < queue.length) queue[idx] = null;
      },
      async advance() {
        const run = queue.splice(0);
        for (const fn of run) if (fn) await fn();
      },
      get pending() {
        return queue.filter(Boolean).length;
      },
    };
  }

  function makeEngine({ searchImpl, intentImpl, timers = fakeTimers() } = {}) {
    const results = { current: "untouched" };
    const busy = { current: false };
    const searchCalls = [];
    const intentCalls = [];
    const engine = createMemberSearchEngine({
      searchUsers: async (q, limit) => {
        searchCalls.push({ q, limit });
        return searchImpl ? searchImpl(q, limit) : [{ id: "m1", name: q }];
      },
      searchIntent: async (ids) => {
        intentCalls.push(ids);
        return intentImpl ? intentImpl(ids) : ids.map((id) => ({ id, canMessage: true }));
      },
      setResults: (r) => {
        results.current = r;
      },
      setBusy: (b) => {
        busy.current = b;
      },
      timers,
    });
    return { engine, results, busy, searchCalls, intentCalls, timers };
  }

  it("ডিবাউন্স: টাইপের সাথে সাথে কল নয় — টাইমার পেন্ডিং থাকে", () => {
    const { engine, searchCalls, timers } = makeEngine();
    engine.onInput("রহিম");
    assert.equal(timers.pending, 1);
    assert.equal(searchCalls.length, 0);
  });

  it("SEARCH_DEBOUNCE_MS=300, minChars=2, limit=8 — পেজের আচরণের সাথে যুক্ত", () => {
    assert.equal(SEARCH_DEBOUNCE_MS, 300);
    assert.equal(SEARCH_MIN_CHARS, 2);
    assert.equal(MEMBER_SEARCH_LIMIT, 8);
  });

  it("ICE_BREAKER_TEXT — দুই শুরু-পথে একই আইস-ব্রেকার", () => {
    assert.equal(typeof ICE_BREAKER_TEXT, "string");
    assert.ok(ICE_BREAKER_TEXT.includes("আসসালামু"));
  });

  it("minChars-এর কম হলে ফলাফল বন্ধ (null), কোনো কল নয়", async () => {
    const { engine, results, searchCalls, timers } = makeEngine();
    engine.onInput("r");
    assert.equal(timers.pending, 0);
    assert.equal(results.current, null);
    assert.equal(searchCalls.length, 0);
  });

  it("টাইমার চলাকালে নতুন ইনপুট আগের টাইমার বাতিল করে — শেষ কোয়েরিই চলে", async () => {
    const { engine, searchCalls, timers } = makeEngine();
    engine.onInput("ra");
    engine.onInput("rahim");
    assert.equal(timers.pending, 1, "একটাই পেন্ডিং টাইমার");
    await timers.advance();
    await new Promise((r) => setImmediate(r));
    assert.equal(searchCalls.length, 1);
    assert.equal(searchCalls[0].q, "rahim", "আগের কোয়েরি নয় — শেষটা");
  });

  it("advance-এ খোঁজা চলে — ফল+limit, busy true→false", async () => {
    const { engine, searchCalls, busy, timers } = makeEngine();
    engine.onInput("রহিম");
    await timers.advance();
    await new Promise((r) => setImmediate(r));
    assert.equal(searchCalls.length, 1);
    assert.equal(searchCalls[0].limit, MEMBER_SEARCH_LIMIT);
    assert.equal(busy.current, false, "শেষে busy বন্ধ");
  });

  it("ফল এলে guard-প্রিভিউ মার্জ — byId ধরে প্রতিটা row-এ", async () => {
    const { engine, results, timers } = makeEngine({
      searchImpl: async () => [{ id: "m1", name: "A" }, { id: "m2", name: "B" }],
      intentImpl: async () => [{ id: "m2", canMessage: false, blocked: true, reason: "LIMIT_REACHED" }],
    });
    engine.onInput("ab");
    await timers.advance();
    await new Promise((r) => setImmediate(r));
    assert.equal(results.current.length, 2);
    assert.deepEqual(results.current[0].guard, null, "প্রিভিউ-নেই row-এ guard:null");
    assert.equal(results.current[1].guard.canMessage, false);
    assert.equal(results.current[1].guard.reason, "LIMIT_REACHED");
  });

  it("searchIntent ব্যর্থ হলে guard:null — ক্লিক অনুমোদিত, সার্ভার চৌকাঠই শেষ কথা", async () => {
    const { engine, results, timers } = makeEngine({
      intentImpl: async () => {
        throw new Error("429");
      },
    });
    engine.onInput("ab");
    await timers.advance();
    await new Promise((r) => setImmediate(r));
    assert.equal(results.current[0].guard, null);
  });

  it("খোঁজা ব্যর্থ → [] (কোনো সদস্য নেই), busy বন্ধ", async () => {
    const { engine, results, busy, timers } = makeEngine({
      searchImpl: async () => {
        throw new Error("500");
      },
    });
    engine.onInput("ab");
    await timers.advance();
    await new Promise((r) => setImmediate(r));
    assert.deepEqual(results.current, []);
    assert.equal(busy.current, false);
  });

  it("খালি ফল → []", async () => {
    const { engine, results, timers } = makeEngine({ searchImpl: async () => [] });
    engine.onInput("ab");
    await timers.advance();
    await new Promise((r) => setImmediate(r));
    assert.deepEqual(results.current, []);
  });

  it("null ফল (API অন্যরূপ) → []", async () => {
    const { engine, results, timers } = makeEngine({ searchImpl: async () => null });
    engine.onInput("ab");
    await timers.advance();
    await new Promise((r) => setImmediate(r));
    assert.deepEqual(results.current, []);
  });

  it("clear() পেন্ডিং টাইমার বাতিল — advance-এ কিছু চলে না", async () => {
    const { engine, searchCalls, timers } = makeEngine();
    engine.onInput("ab");
    engine.clear();
    assert.equal(timers.pending, 0);
    await timers.advance();
    await new Promise((r) => setImmediate(r));
    assert.equal(searchCalls.length, 0);
  });
});
