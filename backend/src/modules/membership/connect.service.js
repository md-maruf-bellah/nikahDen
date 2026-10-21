import mongoose from "mongoose";
import ConnectTransaction from "../../models/connectTransaction.model.js";
import { CONNECT_TYPES } from "../../constants/index.js";

/**
 * Authoritative connect balance = SUM of every ledger event.
 * balanceAfter columns are audit aids; never trust them as source of truth.
 */
export async function getConnectBalance(userId, session = null) {
  const pipeline = [
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ];
  const cursor = ConnectTransaction.aggregate(pipeline);
  if (session) cursor.session(session);
  const result = await cursor;
  return result.length ? result[0].total : 0;
}

export async function lastBalanceBefore(userId, session = null) {
  const doc = await ConnectTransaction.findOne({ user: userId })
    .sort({ createdAt: -1, _id: -1 })
    .session(session ?? null)
    .lean();
  return doc?.balanceAfter ?? 0;
}

/** True when the user has already paid to view this biodata (one-time charge). */
export async function hasViewedBiodata(userId, biodataId) {
  const found = await ConnectTransaction.exists({
    user: userId,
    biodata: biodataId,
    type: CONNECT_TYPES.BIODATA_VIEW,
  });
  return Boolean(found);
}

/** Logs one connect spent to view a biodata (one charge per biodata per user). */
export async function deductConnectForView({ userId, biodataId, ownerId, amount, reason }, session = null) {
  const balance = await getConnectBalance(userId, session);
  const balanceAfter = balance - amount;
  const doc = await ConnectTransaction.create(
    [{
      user: userId,
      type: CONNECT_TYPES.BIODATA_VIEW,
      amount: -amount,
      balanceAfter,
      reason: reason || "Biodata view",
      biodata: biodataId,
      viewedByUser: ownerId,
    }],
    { session: session ?? undefined }
  );
  return doc[0];
}

/**
 * True when the user already has this biodata's photos: either they paid the
 * one-time photo unlock, OR they paid the full biodata view (a full view has
 * always included photos — never charge twice for the same access).
 */
export async function hasPhotoAccess(userId, biodataId) {
  const found = await ConnectTransaction.exists({
    user: userId,
    biodata: biodataId,
    type: { $in: [CONNECT_TYPES.PHOTO_UNLOCK, CONNECT_TYPES.BIODATA_VIEW] },
  });
  return Boolean(found);
}

/**
 * Generic one-time deduction used by non-view charges (photo unlock,
 * guardian connection). One ledger row per (user, type, biodata) so the same
 * billable action is never charged twice.
 */
export async function deductConnectOnce({ userId, type, amount, reason, biodata = null, ownerId = null }) {
  if (biodata) {
    const already = await ConnectTransaction.exists({ user: userId, biodata, type });
    if (already) return { alreadyCharged: true };
  }
  const balance = await getConnectBalance(userId);
  if (balance < amount) return null;
  const balanceAfter = balance - amount;
  const doc = await ConnectTransaction.create([{
    user: userId,
    type,
    amount: -amount,
    balanceAfter,
    reason: reason || "Connect spend",
    biodata,
    viewedByUser: ownerId,
  }]);
  return { alreadyCharged: false, txn: doc[0], balanceAfter };
}

/** Generic credit used by the orders module (grants are recorded here). */
export async function addConnectCredit({ userId, type, amount, reason, order = null, metadata = {} }, session = null) {
  const balance = await getConnectBalance(userId, session);
  const balanceAfter = balance + amount;
  const doc = await ConnectTransaction.create(
    [{
      user: userId,
      type,
      amount,
      balanceAfter,
      reason,
      order,
      metadata,
    }],
    { session: session ?? undefined }
  );
  return doc[0];
}

export default {
  getConnectBalance,
  addConnectCredit,
  deductConnectForView,
  hasViewedBiodata,
  hasPhotoAccess,
  deductConnectOnce,
  lastBalanceBefore,
};
