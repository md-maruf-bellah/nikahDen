import mongoose from "mongoose";
import MembershipPlan from "../../models/membershipPlan.model.js";
import ConnectPack from "../../models/connectPack.model.js";
import Subscription from "../../models/subscription.model.js";
import Biodata from "../../models/biodata.model.js";
import Like from "../../models/like.model.js";
import ConnectTransaction from "../../models/connectTransaction.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { isValidObjectId } from "../../utils/helpers.js";
import { getConnectBalance } from "./connect.service.js";
import { CONNECT_TYPES } from "../../constants/index.js";

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------
const withId = (doc) => (doc ? { ...doc, id: doc._id?.toString() ?? doc.id } : doc);
const withIdList = (docs) => docs.map(withId);

export async function listPlans({ isActive } = {}) {
  const filter = {};
  if (isActive === "1" || isActive === "true") filter.isActive = true;
  const plans = await MembershipPlan.find(filter).sort({ sortOrder: 1, price: 1 }).lean();
  return withIdList(plans);
}

export async function getPlan(id) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid plan id", "INVALID_ID");
  const plan = await MembershipPlan.findById(id).lean();
  if (!plan) throw ApiError.notFound("Plan not found", "PLAN_NOT_FOUND");
  return withId(plan);
}

export async function createPlan(data) {
  const existing = await MembershipPlan.exists({ slug: data.slug });
  if (existing) throw ApiError.conflict("A plan with this slug already exists.", "DUPLICATE_SLUG");
  const plan = await MembershipPlan.create(data);
  return withId(plan.toObject());
}

export async function updatePlan(id, data) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid plan id", "INVALID_ID");
  const plan = await MembershipPlan.findById(id);
  if (!plan) throw ApiError.notFound("Plan not found", "PLAN_NOT_FOUND");
  Object.assign(plan, data);
  await plan.save();
  return withId(plan.toObject());
}

export async function deletePlan(id) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid plan id", "INVALID_ID");
  const plan = await MembershipPlan.findById(id);
  if (!plan) throw ApiError.notFound("Plan not found", "PLAN_NOT_FOUND");
  await Subscription.deleteMany({ plan: plan._id });
  await plan.deleteOne();
  return { id };
}

// ---------------------------------------------------------------------------
// Connect packs
// ---------------------------------------------------------------------------
export async function listPacks({ isActive } = {}) {
  const filter = {};
  if (isActive === "1" || isActive === "true") filter.isActive = true;
  const packs = await ConnectPack.find(filter).sort({ sortOrder: 1, price: 1 }).lean();
  return withIdList(packs);
}

export async function createPack(data) {
  const pack = await ConnectPack.create(data);
  return withId(pack.toObject());
}

export async function updatePack(id, data) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid pack id", "INVALID_ID");
  const pack = await ConnectPack.findById(id);
  if (!pack) throw ApiError.notFound("Pack not found", "PACK_NOT_FOUND");
  Object.assign(pack, data);
  await pack.save();
  return withId(pack.toObject());
}

export async function deletePack(id) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid pack id", "INVALID_ID");
  const pack = await ConnectPack.findById(id);
  if (!pack) throw ApiError.notFound("Pack not found", "PACK_NOT_FOUND");
  await pack.deleteOne();
  return { id };
}

// ---------------------------------------------------------------------------
// My membership dashboard (used by the member dashboard UI)
// ---------------------------------------------------------------------------
export async function myMembership(userId) {
  const uid = new mongoose.Types.ObjectId(userId);

  const [subscription, balance, biodataDocs] = await Promise.all([
    Subscription.findOne({ user: userId }).populate("plan").lean(),
    getConnectBalance(userId),
    Biodata.find({ user: uid }).select("_id biodataNo status viewCount gender").lean(),
  ]);

  const myBiodatas = biodataDocs.map((d) => ({ ...d, id: d._id.toString() }));

  const biodataIds = myBiodatas.map((b) => b._id);

  const [viewsReceived, likesReceived, likesSent] = await Promise.all([
    ConnectTransaction.countDocuments({ type: CONNECT_TYPES.BIODATA_VIEW, biodata: { $in: biodataIds } }),
    Like.countDocuments({ targetOwner: userId }),
    Like.countDocuments({ user: userId }),
  ]);

  const now = new Date();
  const isActive = subscription?.status === "ACTIVE" && subscription.expiresAt > now;

  return {
    subscription: subscription
      ? {
          id: subscription._id.toString(),
          plan: subscription.plan ? withId(subscription.plan) : subscription.plan,
          planSnapshot: subscription.planSnapshot,
          status: subscription.status,
          isActive,
          startsAt: subscription.startsAt,
          expiresAt: subscription.expiresAt,
          daysLeft: isActive ? Math.max(0, Math.ceil((subscription.expiresAt - now) / 86400000)) : 0,
        }
      : null,
    connects: { balance },
    stats: {
      biodataVisits: viewsReceived,
      likesReceived,
      likesSent,
    },
    biodata: myBiodatas.map((b) => ({
      id: b.id,
      biodataNo: b.biodataNo,
      status: b.status,
      viewCount: b.viewCount,
    })),
  };
}

export default { listPlans, getPlan, createPlan, updatePlan, deletePlan, listPacks, myMembership };
