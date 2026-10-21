/**
 * Pure helpers for the purchase-gated connects flow.
 *
 * Connects only ever exist after a paid checkout: packs arrive as
 * `connects`, plan grants as `connectCount`, and the ledger rows that back
 * the balance come from /membership/ledger (never from client-side state).
 * Everything here is side-effect free so it can run under `node --test`.
 */

/** Total integer price/discount for a checkout line (mirrors backend applyCoupon). */
export function orderTotals(unitPrice, discountPercent = 0) {
  const price = Math.max(0, Math.floor(Number(unitPrice) || 0));
  const pct = Math.min(100, Math.max(0, Math.floor(Number(discountPercent) || 0)));
  const discount = Math.floor((price * pct) / 100);
  return { price, discount, total: price - discount };
}

/** How many connects an order item carries — packs use `connects`, plans `connectCount`. */
export function connectCountOf(item) {
  if (!item) return 0;
  const n = Math.floor(Number(item.connects ?? item.connectCount ?? 0));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * One order-summary line that works for both kinds of checkout.
 * Returns null when nothing is selected yet.
 */
export function checkoutSummary(item, discountPercent = 0) {
  if (!item) return null;
  const { price, discount, total } = orderTotals(item.price, discountPercent);
  return {
    title: item.nameBn || item.name || "",
    price,
    discount,
    total,
    connects: connectCountOf(item),
  };
}

/** Backend route for an order's back-link (packs go back to pack checkout). */
export function checkoutPathFor(order) {
  const kind = order?.kind === "PACK" ? "PACK" : "PLAN";
  const refId = order?.item?.refId || "";
  if (!refId) return kind === "PACK" ? "/checkout?kind=PACK" : "/checkout";
  return kind === "PACK" ? `/checkout?packId=${refId}` : `/checkout?planId=${refId}`;
}

const TYPE_LABELS = {
  PLAN_GRANT: "প্লানের কানেক্ট",
  PACK_PURCHASE: "কানেক্ট প্যাক কেনা হয়েছে",
  ADMIN_ADJUST: "প্রশাসনিক সমন্বয়",
  BIODATA_VIEW: "বায়োডাটা দেখা হয়েছে",
  PHOTO_UNLOCK: "ছবি আনলক হয়েছে",
  GUARDIAN_REQUEST: "গার্ডিয়ান রিকোয়েস্ট",
  REFUND: "ফেরত",
};

/** Row-shaping for the ledger modal (server row → render-ready view). */
export function ledgerEntry(row) {
  if (!row) return null;
  const amount = Math.floor(Number(row.amount) || 0);
  const balanceAfter = Math.floor(Number(row.balanceAfter) || 0);
  return {
    id: row.id || row._id || null,
    type: row.type,
    label: TYPE_LABELS[row.type] || row.type,
    amount,
    credited: amount > 0,
    balanceAfter,
    reason: row.reason || "",
    createdAt: row.createdAt || null,
  };
}

export default { orderTotals, connectCountOf, checkoutSummary, checkoutPathFor, ledgerEntry };
