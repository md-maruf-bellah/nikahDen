/**
 * Profile privacy — policy CRUD + access resolution for every entry point.
 *
 * All reads go through here so list, detail, similar, likes, matches and the
 * photo-unlock endpoint enforce the SAME rules:
 *   - owner/staff always full access
 *   - a block between the parties revokes photo/contact access (recheck on read)
 *   - photo policy PUBLIC / MEMBERS / MATCHED / UNLOCK (point unlock)
 *   - contact policy PAID (legacy connect charge) / MATCHED / PUBLIC
 *
 * Defaults are legacy-equivalent (photo PUBLIC, contact PAID) so existing
 * behavior and API contracts are preserved until a member opts in.
 */
import env from "../../config/env.js";
import Biodata from "../../models/biodata.model.js";
import Like from "../../models/like.model.js";
import ProfilePrivacy from "../../models/profilePrivacy.model.js";
import UserBlock from "../../models/userBlock.model.js";
import ConnectTransaction from "../../models/connectTransaction.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { isValidObjectId } from "../../utils/helpers.js";
import { BIODATA_STATUSES, CONNECT_TYPES, CONTACT_VISIBILITY, PHOTO_VISIBILITY, ROLES } from "../../constants/index.js";
import { deductConnectOnce, hasPhotoAccess, getConnectBalance } from "../membership/connect.service.js";
import Notification from "../../models/notification.model.js";
import { NOTIFICATION_TYPES } from "../../constants/index.js";
import { emitNewNotification } from "../notifications/notification.service.js";
import { isBlockedBetween } from "../blocks/block.service.js";

export const DEFAULT_PRIVACY = Object.freeze({
  photoVisibility: PHOTO_VISIBILITY.PUBLIC,
  contactVisibility: CONTACT_VISIBILITY.PAID,
  allowCrossReligion: false,
});

// ---------------------------------------------------------------------------
// Own policy (per-member settings)
// ---------------------------------------------------------------------------

export async function getMyPrivacy(userId) {
  const doc = await ProfilePrivacy.findOne({ user: userId }).lean();
  if (!doc) return { id: null, isNew: true, ...DEFAULT_PRIVACY };
  return {
    id: doc._id.toString(),
    isNew: false,
    photoVisibility: doc.photoVisibility,
    contactVisibility: doc.contactVisibility,
    allowCrossReligion: doc.allowCrossReligion ?? false,
  };
}

export async function updateMyPrivacy(userId, body) {
  const payload = {};
  if (body.photoVisibility !== undefined) payload.photoVisibility = body.photoVisibility;
  if (body.contactVisibility !== undefined) payload.contactVisibility = body.contactVisibility;
  if (body.allowCrossReligion !== undefined) {
    payload.allowCrossReligion = Boolean(body.allowCrossReligion);
    // এছাড়াও ইউজারের বায়োডাটার allowCrossReligion ফ্ল্যাগটি সাথে সাথে সিঙ্ক করা হয়
    await Biodata.updateOne({ user: userId }, { $set: { allowCrossReligion: payload.allowCrossReligion } }).catch(() => {});
  }

  const before = await ProfilePrivacy.findOne({ user: userId }).lean();
  const doc = await ProfilePrivacy.findOneAndUpdate(
    { user: userId },
    { $set: { ...payload, user: userId } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();

  // নোটিফিকেশন — শুধু সত্যিকারের পরিবর্তনে (no-op সেভ ব্যানার-বর্জ্য নয়); নিজের
  // কাজের নিশ্চিতকরণ, লাইভ socket দিয়ে একাধিক ট্যাবে সাথে সাথে পৌঁছায়।
  const changed =
    !before ||
    before.photoVisibility !== doc.photoVisibility ||
    before.contactVisibility !== doc.contactVisibility ||
    before.allowCrossReligion !== doc.allowCrossReligion;
  if (changed) {
    const privacyNotification = await Notification.create({
      user: userId,
      type: NOTIFICATION_TYPES.SYSTEM,
      title: "Privacy settings updated",
      body: `Photo: ${doc.photoVisibility} • Contact: ${doc.contactVisibility} • Interfaith: ${doc.allowCrossReligion ? "Allowed" : "Restricted"}`,
      data: {
        kind: "privacy",
        photoVisibility: doc.photoVisibility,
        contactVisibility: doc.contactVisibility,
        allowCrossReligion: doc.allowCrossReligion,
      },
    });
    emitNewNotification(privacyNotification);
  }

  return {
    id: doc._id.toString(),
    isNew: false,
    photoVisibility: doc.photoVisibility,
    contactVisibility: doc.contactVisibility,
    allowCrossReligion: doc.allowCrossReligion ?? false,
  };
}

// ---------------------------------------------------------------------------
// Shared access resolution
// ---------------------------------------------------------------------------

async function privacyMapFor(ownerIds) {
  const unique = [...new Set(ownerIds.filter(Boolean))];
  if (!unique.length) return new Map();
  const docs = await ProfilePrivacy.find({ user: { $in: unique } }).lean();
  const map = new Map();
  for (const d of docs) map.set(d.user.toString(), d);
  return map;
}

export async function getOwnerPolicies(ownerId) {
  const doc = await ProfilePrivacy.findOne({ user: ownerId }).lean();
  return {
    photo: doc?.photoVisibility || DEFAULT_PRIVACY.photoVisibility,
    contact: doc?.contactVisibility || DEFAULT_PRIVACY.contactVisibility,
    allowCrossReligion: doc?.allowCrossReligion ?? false,
  };
}

/** viewer ↔ owner পারস্পরিক লাইক (isMutual) আছে কি না। */
export function isMutualMatch(viewerId, ownerId) {
  return Like.exists({ user: viewerId, targetOwner: ownerId, isMutual: true }).then(Boolean);
}

async function matchedOwnerSet(viewerId, ownerIds) {
  const likes = await Like.find({ user: viewerId, targetOwner: { $in: ownerIds }, isMutual: true })
    .select("targetOwner")
    .lean();
  return new Set(likes.map((l) => l.targetOwner.toString()));
}

async function blockedOwnerSet(viewerId, ownerIds) {
  const rows = await UserBlock.find({
    $or: [
      { blocker: viewerId, blocked: { $in: ownerIds } },
      { blocker: { $in: ownerIds }, blocked: viewerId },
    ],
  })
    .select("blocker blocked")
    .lean();
  const set = new Set();
  for (const r of rows) {
    const b = r.blocker.toString();
    const k = r.blocked.toString();
    set.add(b === viewerId ? k : b);
  }
  return set;
}

async function unlockedBiodataSet(viewerId, biodataIds) {
  if (!biodataIds.length) return new Set();
  const rows = await ConnectTransaction.find({
    user: viewerId,
    biodata: { $in: biodataIds },
    type: { $in: [CONNECT_TYPES.PHOTO_UNLOCK, CONNECT_TYPES.BIODATA_VIEW] },
  })
    .select("biodata")
    .lean();
  return new Set(rows.map((r) => r.biodata.toString()));
}

/**
 * Batch photo masking for list-shaped items ({ id, ownerId, profileImage }).
 * Hides profileImage behind a policy, replaces it with null so every screen
 * falls back to the gender-based default avatar, and flags `photoLocked`
 * (only when the target actually has a photo) for unlock CTAs.
 */
const STAFF_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.EDITOR];

export async function maskBiodataPhotos(items, viewer) {
  if (!items?.length) return items;
  // Staff moderation views are exempt (same as the detail endpoint).
  if (viewer?.role && STAFF_ROLES.includes(viewer.role)) return items;
  const ownerIds = [...new Set(items.map((i) => i.ownerId).filter(Boolean))];
  if (!ownerIds.length) return items;

  const polMap = await privacyMapFor(ownerIds);

  const needMatch = new Set();
  const needUnlockIds = [];
  for (const item of items) {
    const owner = item.ownerId;
    if (!owner) continue;
    const pol = polMap.get(owner)?.photoVisibility || DEFAULT_PRIVACY.photoVisibility;
    if (pol === PHOTO_VISIBILITY.MATCHED && viewer) needMatch.add(owner);
    if (pol === PHOTO_VISIBILITY.UNLOCK && viewer) needUnlockIds.push(item.id);
  }

  const matchedSet = needMatch.size ? await matchedOwnerSet(viewer?.id, [...needMatch]) : new Set();
  const unlockedSet = viewer && needUnlockIds.length ? await unlockedBiodataSet(viewer.id, needUnlockIds) : new Set();
  // Block recheck applies to EVERY policy (including PUBLIC) — a block revokes
  // photo access on read, everywhere.
  const blockedSet = viewer ? await blockedOwnerSet(viewer.id, ownerIds) : new Set();

  for (const item of items) {
    const owner = item.ownerId;
    if (!owner) continue;
    const pol = polMap.get(owner)?.photoVisibility || DEFAULT_PRIVACY.photoVisibility;

    let visible;
    if (viewer && blockedSet.has(owner)) visible = false;
    else if (pol === PHOTO_VISIBILITY.PUBLIC) visible = true;
    else if (pol === PHOTO_VISIBILITY.MEMBERS) visible = Boolean(viewer);
    else if (!viewer) visible = false;
    else if (pol === PHOTO_VISIBILITY.MATCHED) visible = matchedSet.has(owner);
    else visible = unlockedSet.has(item.id); // UNLOCK

    const hadPhoto = Boolean(item.profileImage || (Array.isArray(item.photos) && item.photos.length));
    if (!visible) {
      // photoLocked only when there is actually something to unlock.
      item.photoLocked = hadPhoto;
      item.profileImage = null;
      if (Array.isArray(item.photos)) item.photos = [];
    } else {
      item.photoLocked = false;
    }
  }
  return items;
}

/**
 * Detail-level photo decision for one biodata.
 * `paidView` = viewer paid (this request or earlier) for the full biodata view —
 * a full view has always included photos, so it satisfies UNLOCK without a
 * second charge (never charge twice for the same access).
 */
export async function canViewPhotos({ viewer, ownerId, biodataId, policies, blocked, matched, paidView }) {
  if (blocked) return false;
  const pol = policies.photo;
  if (pol === PHOTO_VISIBILITY.PUBLIC) return true;
  if (pol === PHOTO_VISIBILITY.MEMBERS) return Boolean(viewer);
  if (!viewer) return false;
  if (pol === PHOTO_VISIBILITY.MATCHED) return Boolean(matched);
  // UNLOCK
  if (paidView) return true;
  return hasPhotoAccess(viewer.id, biodataId);
}

/**
 * Photo unlock (point charge) — separate configurable billable action.
 * One-time per (viewer, biodata); a prior paid full view already includes
 * photos so it returns free (never charge twice).
 */
export async function unlockBiodataPhoto(userId, biodataId) {
  if (!isValidObjectId(biodataId)) throw ApiError.badRequest("Invalid biodata id", "INVALID_ID");
  const doc = await Biodata.findById(biodataId)
    .select("user status biodataNo")
    .lean();
  if (!doc || doc.status !== BIODATA_STATUSES.APPROVED) {
    throw ApiError.notFound("Biodata not found", "BIODATA_NOT_FOUND");
  }

  const ownerId = doc.user.toString();
  if (ownerId === userId) {
    return { unlocked: true, alreadyUnlocked: true, cost: 0, reason: "OWNER" };
  }
  if (await isBlockedBetween(userId, ownerId)) {
    throw ApiError.forbidden("This profile is not available.", "BLOCKED");
  }

  const policies = await getOwnerPolicies(ownerId);
  if (policies.photo === PHOTO_VISIBILITY.PUBLIC || policies.photo === PHOTO_VISIBILITY.MEMBERS) {
    // Nothing to unlock for an authenticated member under these policies.
    return { unlocked: true, alreadyUnlocked: true, cost: 0, reason: "POLICY_OPEN" };
  }
  if (policies.photo === PHOTO_VISIBILITY.MATCHED) {
    const matched = await isMutualMatch(userId, ownerId);
    if (matched) return { unlocked: true, alreadyUnlocked: true, cost: 0, reason: "MATCHED" };
    throw ApiError.forbidden("Photos are visible only after a mutual match.", "PHOTO_LOCKED");
  }

  // POLICY UNLOCK — prior paid access (photo unlock or full view) is free.
  if (await hasPhotoAccess(userId, biodataId)) {
    return { unlocked: true, alreadyUnlocked: true, cost: 0, reason: "ALREADY_PAID" };
  }

  const cost = env.PHOTO_UNLOCK_COST;
  const result = await deductConnectOnce({
    userId,
    type: CONNECT_TYPES.PHOTO_UNLOCK,
    amount: cost,
    reason: `Unlocked photos of biodata ${doc.biodataNo}`,
    biodata: doc._id,
    ownerId,
  });
  if (result === null) {
    throw ApiError.forbidden(
      "You need connects to unlock this photo. Buy a membership plan or a connect pack.",
      "CONNECTS_INSUFFICIENT"
    );
  }
  if (result.alreadyCharged) {
    return { unlocked: true, alreadyUnlocked: true, cost: 0, reason: "ALREADY_PAID" };
  }
  // খরচের নোটিফিকেশন — শুধু নিজের কাজের ফল নিজেই জানে (ইমিট-এর সাথে লাইভ আপডেট)
  const spendNotification = await Notification.create({
    user: userId,
    type: NOTIFICATION_TYPES.SYSTEM,
    title: "Connects spent",
    body: `${cost} connect(s) spent to unlock photos of biodata ${doc.biodataNo}.`,
    data: { kind: "biodata", id: biodataId, cost },
  });
  emitNewNotification(spendNotification);
  return { unlocked: true, alreadyUnlocked: false, cost, balance: result.balanceAfter };
}

/** Balance helper for the frontend unlock CTA (avoid extra /membership/me call). */
export async function photoUnlockQuote(userId) {
  const balance = await getConnectBalance(userId);
  return { cost: env.PHOTO_UNLOCK_COST, balance };
}

export default {
  DEFAULT_PRIVACY,
  getMyPrivacy,
  updateMyPrivacy,
  getOwnerPolicies,
  isMutualMatch,
  maskBiodataPhotos,
  canViewPhotos,
  unlockBiodataPhoto,
  photoUnlockQuote,
};
