/**
 * Purchase-gated connects: checkout totals, pack/plan item handling,
 * back-links and ledger row shaping.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  orderTotals,
  connectCountOf,
  checkoutSummary,
  checkoutPathFor,
  ledgerEntry,
} from "../src/lib/connects.core.mjs";

describe("connects core — checkout totals", () => {
  it("computes integer money with a percent discount (same math as the backend)", () => {
    assert.deepEqual(orderTotals(199, 20), { price: 199, discount: 39, total: 160 });
    assert.deepEqual(orderTotals(699), { price: 699, discount: 0, total: 699 });
    assert.deepEqual(orderTotals(0, 20), { price: 0, discount: 0, total: 0 });
  });

  it("never produces negatives or NaN for junk input", () => {
    assert.equal(orderTotals("99.9", 150).discount, 99);
    assert.equal(Number.isNaN(orderTotals(undefined).total), false);
    assert.equal(orderTotals(-50).price, 0);
  });
});

describe("connects core — checkout item handling", () => {
  const pack = { name: "১০ কানেক্ট", nameBn: "১০ কানেক্ট", connects: 10, price: 99 };
  const plan = { name: "Monthly", nameBn: "মান্থলি", connectCount: 10, price: 699 };

  it("reads connects from packs and connectCount from plans", () => {
    assert.equal(connectCountOf(pack), 10);
    assert.equal(connectCountOf(plan), 10);
    assert.equal(connectCountOf({ name: "free" }), 0);
    assert.equal(connectCountOf(null), 0);
  });

  it("builds one summary line for either checkout kind", () => {
    const sPack = checkoutSummary(pack, 20);
    assert.equal(sPack.title, "১০ কানেক্ট");
    assert.equal(sPack.price, 99);
    assert.equal(sPack.connects, 10);
    // floor(99*20/100) = 19 discount → 99 - 19 = 80 (backend applyCoupon math).
    assert.equal(sPack.discount, 19);
    assert.equal(sPack.total, 80);

    const sPlan = checkoutSummary(plan);
    assert.equal(sPlan.title, "মান্থলি");
    assert.equal(sPlan.price, 699);
    assert.equal(sPlan.connects, 10);

    assert.equal(checkoutSummary(null), null);
  });
});

describe("connects core — back-links", () => {
  it("a pack order returns to pack checkout, a plan order to plan checkout", () => {
    assert.equal(
      checkoutPathFor({ kind: "PACK", item: { refId: "p1" } }),
      "/checkout?packId=p1"
    );
    assert.equal(
      checkoutPathFor({ kind: "PLAN", item: { refId: "pl1" } }),
      "/checkout?planId=pl1"
    );
    assert.equal(checkoutPathFor({ kind: "PACK" }), "/checkout?kind=PACK");
    assert.equal(checkoutPathFor(null), "/checkout");
  });
});

describe("connects core — ledger entries", () => {
  it("shapes a purchase credit with a Bengali label", () => {
    const e = ledgerEntry({
      id: "t1",
      type: "PACK_PURCHASE",
      amount: 10,
      balanceAfter: 10,
      reason: "১০ কানেক্ট connect pack",
      createdAt: "2026-10-14T00:00:00.000Z",
    });
    assert.equal(e.credited, true);
    assert.equal(e.label, "কানেক্ট প্যাক কেনা হয়েছে");
    assert.equal(e.balanceAfter, 10);
    assert.equal(e.amount, 10);
  });

  it("shapes a spend as a non-credit and falls back safely on unknown types", () => {
    const spend = ledgerEntry({ id: "t2", type: "BIODATA_VIEW", amount: -1, balanceAfter: 9 });
    assert.equal(spend.credited, false);
    assert.equal(spend.label, "বায়োডাটা দেখা হয়েছে");
    assert.equal(spend.balanceAfter, 9);

    const unknown = ledgerEntry({ type: "SOMETHING_NEW", amount: -2 });
    assert.equal(unknown.label, "SOMETHING_NEW");
    assert.equal(unknown.credited, false);

    assert.equal(ledgerEntry(null), null);
  });
});
