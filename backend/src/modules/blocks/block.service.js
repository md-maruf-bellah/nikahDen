import UserBlock from "../../models/userBlock.model.js";
import User from "../../models/user.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { isValidObjectId } from "../../utils/helpers.js";
import { parsePagination, buildPagination } from "../../utils/pagination.js";
import { USER_STATUSES } from "../../constants/index.js";
import { GUARD_ERROR_CODES } from "../../../../shared/guardReasons.mjs";

/** এই দুজনের মধ্যে (যেকোনো দিক থেকে) block আছে কি না — messaging choke-point ব্যবহার করে। */
export async function isBlockedBetween(userA, userB) {
  return Boolean(await UserBlock.exists({ $or: [{ blocker: userA, blocked: userB }, { blocker: userB, blocked: userA }] }));
}

/**
 * messaging-এর প্রবেশদ্বার — দুই দিকের যেকোনো block থাকলে একই নিরপেক্ষ ত্রুটি:
 * blocked পক্ষ পার্থক্য বুঝতে না পারে বলে কারণ ফাঁস করা হয় না (৪০৩, BLOCKED)।
 */
export async function assertNotBlockedBetween(userA, userB) {
  if (await isBlockedBetween(userA, userB)) {
    throw ApiError.forbidden("Messaging is not available between these accounts.", GUARD_ERROR_CODES.BLOCKED);
  }
}

/** আমি কাউকে block করেছি কি না (UI-তে বাটন-স্টেটের জন্য)। */
export async function didIBlock(blockerId, userId) {
  return Boolean(await UserBlock.exists({ blocker: blockerId, blocked: userId }));
}

export async function listMyBlocks(blockerId, { page, limit } = {}) {
  const { page: p, limit: l, skip } = parsePagination({ page, limit });
  const filter = { blocker: blockerId };
  const [total, docs] = await Promise.all([
    UserBlock.countDocuments(filter),
    UserBlock.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l).populate({
      path: "blocked",
      select: "firstName lastName avatar role",
    }).lean(),
  ]);
  const items = docs
    .filter((d) => d.blocked)
    .map((d) => ({
      id: d._id.toString(),
      blockedAt: d.createdAt,
      user: { id: d.blocked._id.toString(), name: `${d.blocked.firstName} ${d.blocked.lastName}`.trim(), avatar: d.blocked.avatar },
    }));
  return { items, pagination: buildPagination(total, p, l) };
}

export async function blockUser(blockerId, { userId, reason = "" }) {
  if (!isValidObjectId(userId)) throw ApiError.badRequest("Invalid userId", "INVALID_ID");
  if (userId === blockerId) throw ApiError.badRequest("You cannot block yourself.", "SELF_BLOCK");
  const target = await User.findOne({ _id: userId, status: USER_STATUSES.ACTIVE }).select("_id").lean();
  if (!target) throw ApiError.notFound("User not found", "USER_NOT_FOUND");
  // Idempotent: আগে থেকে থাকলে চুপচাপ সফল — double-tap/UI retry-তে এরর নয়।
  await UserBlock.updateOne(
    { blocker: blockerId, blocked: userId },
    { $setOnInsert: { blocker: blockerId, blocked: userId, reason: String(reason).slice(0, 200) } },
    { upsert: true },
  );
  return { blocked: userId, blockedByMe: true };
}

export async function unblockUser(blockerId, userId) {
  if (!isValidObjectId(userId)) throw ApiError.badRequest("Invalid userId", "INVALID_ID");
  const res = await UserBlock.deleteOne({ blocker: blockerId, blocked: userId });
  if (res.deletedCount === 0) throw ApiError.notFound("This user is not blocked.", "BLOCK_NOT_FOUND");
  return { unblocked: userId };
}

export default { isBlockedBetween, assertNotBlockedBetween, didIBlock, listMyBlocks, blockUser, unblockUser };
