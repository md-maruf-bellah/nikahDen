import mongoose from "mongoose";
import User from "../../models/user.model.js";
import Biodata from "../../models/biodata.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { parsePagination, buildPagination, parseSort } from "../../utils/pagination.js";
import { isValidObjectId } from "../../utils/helpers.js";
import { ROLES, USER_STATUSES } from "../../constants/index.js";

const PUBLIC_FIELDS =
  "firstName lastName email phone role status avatar createdAt updatedAt lastLoginAt";

export function toPublicUser(u) {
  if (!u) return null;
  return {
    id: u._id?.toString() || u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    name: `${u.firstName} ${u.lastName}`.trim(),
    email: u.email,
    phone: u.phone,
    role: u.role,
    status: u.status,
    avatar: u.avatar,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
  };
}

/** List users — admin only. */
export async function listUsers({ page = 1, limit = 10, search, role, status, sortBy, sortOrder }, actor) {
  const filter = {};

  if (role) filter.role = role;
  if (status) filter.status = status;
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { firstName: { $regex: safe, $options: "i" } },
      { lastName: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
      { phone: { $regex: safe, $options: "i" } },
    ];
  }

  const { page: p, limit: l, skip } = parsePagination({ page, limit });
  const sort = parseSort(
    { sortBy, sortOrder },
    ["createdAt", "name", "email"],
    "createdAt"
  );

  // name sort needs aggregation; fall back to firstName ordering.
  if (sort.name) {
    delete sort.name;
    sort.firstName = sortOrder === "asc" ? 1 : -1;
  }

  const [total, docs] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort(sort).skip(skip).limit(l).select(PUBLIC_FIELDS).lean(),
  ]);

  const items = docs.map((u) => toPublicUser(u));
  const canDeleteSuperAdmin = actor?.role === ROLES.SUPERADMIN;

  return { items, pagination: buildPagination(total, p, l), meta: { canDeleteSuperAdmin } };
}

export async function getUserById(id) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid user id", "INVALID_ID");
  const user = await User.findById(id).select(PUBLIC_FIELDS).lean();
  if (!user) throw ApiError.notFound("User not found", "USER_NOT_FOUND");
  return toPublicUser(user);
}

/** Only a SUPERADMIN may create/alter admins or themselves. */
export async function createUser(data, actor) {
  const { email } = data;
  const existing = await User.findOne({ email: email.toLowerCase() }).lean();
  if (existing) {
    throw ApiError.conflict("A user with this email already exists.", "EMAIL_ALREADY_REGISTERED");
  }

  const role = data.role || ROLES.USER;
  if ((role === ROLES.SUPERADMIN || role === ROLES.ADMIN) && actor.role !== ROLES.SUPERADMIN) {
    throw ApiError.forbidden("Only the platform owner can create admin accounts.", "ADMIN_CREATE_FORBIDDEN");
  }

  const user = await User.create({
    firstName: data.firstName,
    lastName: data.lastName || "",
    email,
    phone: data.phone || "",
    passwordHash: data.password, // pre-save hash
    role,
    status: data.status || USER_STATUSES.ACTIVE,
  });
  return toPublicUser(user.toObject());
}

export async function updateUser(id, data, actor) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid user id", "INVALID_ID");
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound("User not found", "USER_NOT_FOUND");

  if (user.role === ROLES.SUPERADMIN && actor.id !== user._id.toString()) {
    throw ApiError.forbidden("The platform owner account cannot be edited by others.", "SUPERADMIN_PROTECTED");
  }

  // Only SUPERADMIN can grant elevated roles or edit staff accounts.
  const actingOnStaff = user.role !== ROLES.USER && actor.id !== user._id.toString();
  const becomingStaff = data.role !== undefined && data.role !== ROLES.USER;
  if ((actingOnStaff || becomingStaff) && actor.role !== ROLES.SUPERADMIN) {
    throw ApiError.forbidden("Only the platform owner can manage staff accounts.", "ADMIN_MANAGE_FORBIDDEN");
  }

  for (const key of ["firstName", "lastName", "phone", "role", "status"]) {
    if (data[key] !== undefined) user[key] = data[key];
  }
  // Do not allow admin to lock out themselves accidentally.
  if (data.status && user._id.toString() === actor.id && data.status !== USER_STATUSES.ACTIVE) {
    throw ApiError.badRequest("You cannot deactivate your own account.", "SELF_DEACTIVATE_FORBIDDEN");
  }
  await user.save();

  return toPublicUser(user.toObject());
}

export async function deleteUser(id, actor) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid user id", "INVALID_ID");
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound("User not found", "USER_NOT_FOUND");

  if (user._id.toString() === actor.id) {
    throw ApiError.badRequest("You cannot delete your own account.", "SELF_DELETE_FORBIDDEN");
  }
  if (user.role === ROLES.SUPERADMIN) {
    throw ApiError.forbidden("The platform owner account cannot be deleted.", "SUPERADMIN_PROTECTED");
  }

  // Soft delete: archive the account and its biodata (if any).
  user.status = USER_STATUSES.INACTIVE;
  await user.save({ validateBeforeSave: false });

  await Biodata.updateOne(
    { user: user._id, status: { $ne: "ARCHIVED" } },
    { $set: { status: "ARCHIVED" } }
  );

  return { id: user._id.toString(), status: user.status };
}

/** Self profile update. */
export async function updateMyProfile(userId, data) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found", "USER_NOT_FOUND");

  for (const key of ["firstName", "lastName", "phone", "avatar"]) {
    if (data[key] !== undefined) user[key] = data[key];
  }
  await user.save();
  return toPublicUser(user.toObject());
}

/** Stats card values for a member dashboard. */
export async function memberDashboardSummary(userId) {
  const uid = new mongoose.Types.ObjectId(userId);
  const [myBiodata] = await Biodata.find({ user: uid }).select("biodataNo status viewCount").lean();

  return {
    hasBiodata: Boolean(myBiodata),
    biodata: myBiodata || null,
  };
}
