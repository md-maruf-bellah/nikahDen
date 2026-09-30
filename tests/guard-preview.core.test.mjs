import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createGuardPreviewEngine, MAX_BATCH, DEBOUNCE_MS } from "../src/components/GuardPreview.core.mjs";

/**
 * নিয়ন্ত্রিত ফেক-টাইমার — setTimeout কলব্যাক সারিবদ্ধ রাখে,
 * advance() ডাকলেই তখনকার সব পেন্ডিং কলব্যাক চলে (ক্রমে)।
 */
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
    advance() {
      const run = queue.splice(0);
      for (const fn of run) if (fn) fn();
    },
    get pending() {
      return queue.filter(Boolean).length;
    },
  };
}

/** previews স্টেটের সরল প্রতিরূপ — reducer ফাংশন প্রয়োগ করে রাখে */
function stateSink() {
  let state = {};
  return {
    setter: (updater) => {
      state = updater(state);
    },
    get: () => state,
  };
}

function makeEngine({ userId = "u1", fetchImpl, timers = fakeTimers() } = {}) {
  const sink = stateSink();
  const calls = [];
  const fetchIntent =
    fetchImpl || (async (ids) => ids.map((id) => ({ id, canMessage: true, blocked: false, reason: null })));
  const engine = createGuardPreviewEngine({
    fetchIntent: async (ids) => {
      calls.push(ids);
      return fetchIntent(ids);
    },
    setPreviews: sink.setter,
    getUserId: () => userId,
    timers,
  });
  return { engine, sink, calls, timers };
}

describe("guard-preview core", () => {
  it("debounce-এর ভেতরে একাধিক schedule একটাই কলে একত্রিত হয়", async () => {
    const { engine, calls, timers, sink } = makeEngine();
    engine.schedule(["a", "b"]);
    engine.schedule(["c"]);
    assert.equal(timers.pending, 1, "একটাই পেন্ডিং টাইমার");

    await Promise.resolve();
    timers.advance();
    await new Promise((r) => setImmediate(r));

    assert.equal(calls.length, 1);
    assert.deepEqual([...calls[0]].sort(), ["a", "b", "c"]);
    assert.equal(Object.keys(sink.get()).length, 3);
  });

  it("MAX_BATCH (25)-এর বেশি আইডি হলে বাকিটা পরের ব্যাচে যায়", async () => {
    const { engine, calls, timers, sink } = makeEngine();
    const ids = Array.from({ length: 32 }, (_, i) => `id${i}`);
    engine.schedule(ids);

    await Promise.resolve();
    timers.advance(); // প্রথম ব্যাচ (25) ফায়ার
    await new Promise((r) => setImmediate(r));
    assert.equal(calls.length, 1);
    assert.equal(calls[0].length, MAX_BATCH);

    timers.advance(); // বাকি ৭-এর দ্বিতীয় ব্যাচ
    await new Promise((r) => setImmediate(r));
    assert.equal(calls.length, 2);
    assert.equal(calls[1].length, 7);
    assert.equal(Object.keys(sink.get()).length, 32);
  });

  it("একবার লোড হওয়া আইডি dedup — আর কলে যায় না", async () => {
    const { engine, calls, timers, sink } = makeEngine();
    engine.schedule(["a", "b"]);
    await Promise.resolve();
    timers.advance();
    await new Promise((r) => setImmediate(r));
    assert.equal(calls.length, 1);

    engine.schedule(["a", "b", "c"]); // a,b আগেই লোডড — শুধু c যাবে
    await Promise.resolve();
    timers.advance();
    await new Promise((r) => setImmediate(r));

    assert.equal(calls.length, 2);
    assert.deepEqual(calls[1], ["c"]);
    assert.equal(Object.keys(sink.get()).length, 3);
  });

  it("টাইমার চলাকালে নতুন আইডি ইনফ্লাইট ব্যাচেই কোলেস হয়", () => {
    const { engine, timers } = makeEngine();
    engine.schedule(["a"]);
    assert.deepEqual(engine.pending, ["a"]);
    engine.schedule(["b"]); // টাইমার এখনো পেন্ডিং — একই ব্যাচে যোগ
    assert.deepEqual([...engine.pending].sort(), ["a", "b"]);
    assert.equal(timers.pending, 1);
  });

  it("গেস্ট (userId null) হলে কোনো কলই হয় না", async () => {
    const { engine, calls, timers, sink } = makeEngine({ userId: null });
    engine.schedule(["a", "b"]);
    timers.advance();
    await new Promise((r) => setImmediate(r));
    assert.equal(calls.length, 0);
    assert.deepEqual(sink.get(), {});
  });

  it("API ব্যর্থ হলে নীরব — previews অপরিবর্তিত", async () => {
    const { engine, timers, sink } = makeEngine({ fetchImpl: async () => { throw new Error("429"); } });
    engine.schedule(["a"]);
    await Promise.resolve();
    timers.advance();
    await new Promise((r) => setImmediate(r));
    assert.deepEqual(sink.get(), {}, "ব্যর্থতায় স্টেট নোংরা হয় না");
  });

  it("clearCache করলে একই আইডি আবার ফেচ হয় (ইউজার-পরিবর্তন পথ)", async () => {
    const { engine, calls, timers } = makeEngine();
    engine.schedule(["a"]);
    await Promise.resolve();
    timers.advance();
    await new Promise((r) => setImmediate(r));
    assert.equal(calls.length, 1);

    engine.clearCache();
    engine.schedule(["a"]);
    await Promise.resolve();
    timers.advance();
    await new Promise((r) => setImmediate(r));
    assert.equal(calls.length, 2, "ক্যাশ মোছা প্রিভিউ sender-নির্ভর — রি-ফেচ জরুরি");
  });

  it("dispose পেন্ডিং টাইমার বাতিল করে — ফলাফল আর স্টেটে লেখা হয় না (unmount)", async () => {
    const { engine, timers, sink, calls } = makeEngine();
    engine.schedule(["a"]);
    engine.dispose();
    assert.equal(timers.pending, 0, "টাইমার বাতিল");

    timers.advance(); // কিছুই ফায়ার করবে না
    await new Promise((r) => setImmediate(r));
    assert.equal(calls.length, 0);
    assert.deepEqual(sink.get(), {});
  });

  it("DEBOUNCE_MS 250ms — প্রোভাইডারের আচরণের সাথে যুক্ত", () => {
    assert.equal(DEBOUNCE_MS, 250);
  });
});
