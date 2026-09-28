import mongoose from "mongoose";
import Biodata from "../../models/biodata.model.js";
import Like from "../../models/like.model.js";
import Notification from "../../models/notification.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { parsePagination, buildPagination, parseSort } from "../../utils/pagination.js";
import { isValidObjectId, ageFrom } from "../../utils/helpers.js";
import { BIODATA_STATUSES, NOTIFICATION_TYPES, ROLES, GENDERS } from "../../constants/index.js";
import { getConnectBalance, deductConnectForView, hasViewedBiodata } from "../membership/connect.service.js";
import { computeCompletion } from "./biodata.completion.js";

// ---------------------------------------------------------------------------
// Field allow-lists (defense against mass assignment)
// ---------------------------------------------------------------------------
export const BIODATA_UPDATABLE = [
  "gender", "maritalStatus", "religion", "sectOrDenomination", "division", "district", "thana",
  "firstName", "lastName", "dateOfBirth", "birthYear", "heightText", "heightCm", "weightKg",
  "skinColor", "bloodGroup", "nationality", "nidNumber", "email",
  "clothingStyle", "healthCondition", "entertainmentHabit", "politicalView",
  "favoriteBooksPeople", "aboutYourself", "specialCategories",
  "religiousPracticeLevel", "placeOfWorshipAttendance", "holyBookReading", "religiousEducation",
  "religiousDressPreference", "charityActivity", "religiousOrganization", "dietaryPractice",
  "futureReligiousGoal", "partnerReligiousExpectation",
  "education", "degree", "institution", "board", "subject", "result", "passingYear", "deeniEducation",
  "occupation", "occupationDetails", "monthlyIncome", "company", "experienceYears",
  "fatherName", "fatherOccupation", "motherName", "motherOccupation", "siblings",
  "phoneNumber", "mobile", "fatherMobile", "presentAddress", "permanentAddress",
  "agreed", "profileImage",
];

const CONTACT_FIELDS = ["phoneNumber", "mobile", "fatherMobile", "email", "nidNumber", "presentAddress", "permanentAddress"];
const STAFF_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.EDITOR];

function isStaff(role) {
  return STAFF_ROLES.includes(role);
}

export function sanitizePayload(body) {
  const out = {};
  for (const key of BIODATA_UPDATABLE) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  // agreed must be explicitly true to count as a pledge.
  if (out.agreed === true) out.agreedAt = new Date();
  if (out.agreed === false) out.agreedAt = null;
  return out;
}

const LIST_PROJECTION =
  "biodataNo fullName gender age religion maritalStatus division district heightText skinColor occupation education profileImage viewCount status rejectionReason createdAt updatedAt";

// ---------------------------------------------------------------------------
// Public directory
// ---------------------------------------------------------------------------
export async function listBiodatas(query, viewer) {
  const isStaffViewer = Boolean(viewer && isStaff(viewer.role));
  const filter = {};

  if (isStaffViewer && (query.all === "1" || query.all === "true")) {
    if (query.status) filter.status = query.status;
  } else if (query.all === "1" || query.all === "true" || query.status) {
    // Staff-only params from a non-staff (or unauthenticated/expired) viewer:
    // refuse instead of silently returning the public approved directory.
    throw ApiError.unauthorized("Staff authentication required.", "STAFF_AUTH_REQUIRED");
  } else {
    filter.status = BIODATA_STATUSES.APPROVED;
  }

  if (query.gender) filter.gender = query.gender;
  if (query.religion) filter.religion = query.religion;
  if (query.maritalStatus) filter.maritalStatus = query.maritalStatus;
  if (query.division) filter.division = { $regex: escapeRegExp(query.division), $options: "i" };
  if (query.district) filter.district = { $regex: escapeRegExp(query.district), $options: "i" };

  const ageFilter = {};
  if (query.ageMin !== undefined) ageFilter.$gte = query.ageMin;
  if (query.ageMax !== undefined) ageFilter.$lte = query.ageMax;
  if (Object.keys(ageFilter).length) filter.age = ageFilter;

  if (query.education) filter.education = { $regex: escapeRegExp(query.education), $options: "i" };
  if (query.occupation) filter.occupation = { $regex: escapeRegExp(query.occupation), $options: "i" };
  if (query.skinColor) filter.skinColor = { $regex: escapeRegExp(query.skinColor), $options: "i" };

  if (query.search) {
    const rx = { $regex: escapeRegExp(query.search), $options: "i" };
    filter.$or = [
      { fullName: rx },
      { occupation: rx },
      { education: rx },
      { division: rx },
      { district: rx },
    ];
  }

  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt", "updatedAt", "age", "fullName", "viewCount"], "createdAt");

  const [total, docs] = await Promise.all([
    Biodata.countDocuments(filter),
    Biodata.find(filter).sort(sort).skip(skip).limit(limit).select(LIST_PROJECTION).lean(),
  ]);

  let likedSet = new Set();
  if (viewer && docs.length) {
    const likes = await Like.find({ user: viewer.id, biodata: { $in: docs.map((d) => d._id) } })
      .select("biodata")
      .lean();
    likedSet = new Set(likes.map((l) => l.biodata.toString()));
  }

  const items = docs.map((d) => ({ ...d, id: d._id.toString(), likedByMe: likedSet.has(d._id.toString()) }));

  return { items, pagination: buildPagination(total, page, limit) };
}

// ---------------------------------------------------------------------------
// Single biodata (guest summary vs member full view)
// ---------------------------------------------------------------------------
export async function getBiodataById(id, viewer) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid biodata id", "INVALID_ID");
  const doc = await Biodata.findById(id).lean();
  if (!doc) throw ApiError.notFound("Biodata not found", "BIODATA_NOT_FOUND");

  const ownerId = doc.user.toString();
  const isOwner = viewer && viewer.id === ownerId;
  const staff = viewer && isStaff(viewer.role);
  const isPublic = doc.status === BIODATA_STATUSES.APPROVED;

  if (!isOwner && !staff && !isPublic) {
    throw ApiError.notFound("Biodata not found", "BIODATA_NOT_FOUND");
  }

  // ---- connect-gated "full view" for members -----------------------------
  let fullView = isOwner || Boolean(staff);
  if (!fullView && viewer) {
    if (!(await hasViewedBiodata(viewer.id, id))) {
      const balance = await getConnectBalance(viewer.id);
      if (balance < 1) {
        throw ApiError.forbidden(
          "You need connects to view full biodata. Buy a membership plan or a connect pack.",
          "CONNECTS_INSUFFICIENT"
        );
      }
      await deductConnectForView({
        userId: viewer.id,
        biodataId: id,
        ownerId,
        amount: 1,
        reason: `Viewed biodata ${doc.biodataNo}`,
      });
    }
    fullView = true;
  }

  // bump public counter (not for the owner's own reads)
  if (!isOwner) {
    await Biodata.updateOne({ _id: doc._id }, { $inc: { viewCount: 1 } }).lean();
  }

  const result = toPublicDoc(doc, { full: fullView });

  if (viewer && viewer.id !== ownerId) {
    const liked = await Like.findOne({ user: viewer.id, biodata: doc._id }).lean();
    result.likedByMe = Boolean(liked);
  } else {
    result.likedByMe = false;
  }
  result.isOwner = Boolean(isOwner);
  return result;
}

export function toPublicDoc(doc, { full = false } = {}) {
  const obj = {
    ...doc,
    id: doc._id.toString(),
    age: doc.age ?? (doc.dateOfBirth ? ageFrom(doc.dateOfBirth) : null),
    ownerId: doc.user.toString(),
  };
  delete obj._id;
  delete obj.__v;
  if (!full) {
    for (const f of CONTACT_FIELDS) delete obj[f];
  }
  // কমপ্লিশন রিপোর্ট শুধু পূর্ণ/নিজের ভিউতে — পাবলিক সারসংক্ষেপে দরকার নেই।
  if (full) {
    obj.completion = computeCompletion(doc);
  }
  return obj;
}

export async function similarBiodatas(id, viewer, limit = 8) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid biodata id", "INVALID_ID");
  const base = await Biodata.findById(id).lean();
  if (!base) throw ApiError.notFound("Biodata not found", "BIODATA_NOT_FOUND");

  const filter = {
    _id: { $ne: base._id },
    status: BIODATA_STATUSES.APPROVED,
  };
  if (base.gender) filter.gender = base.gender;
  if (base.religion) filter.religion = base.religion;
  if (base.division) filter.division = base.division;

  const docs = await Biodata.find(filter).sort({ createdAt: -1 }).limit(limit).select(LIST_PROJECTION).lean();
  return docs.map((d) => ({ ...d, id: d._id.toString() }));
}

// ---------------------------------------------------------------------------
// Own biodata lifecycle
// ---------------------------------------------------------------------------
export async function getMyBiodata(userId) {
  const doc = await Biodata.findOne({ user: userId }).lean();
  if (!doc) return null;
  return toPublicDoc(doc, { full: true });
}

export async function createMyBiodata(userId, body) {
  const exists = await Biodata.exists({ user: userId });
  if (exists) {
    const code = (await Biodata.findOne({ user: userId }).select("status").lean())?.status === "ARCHIVED"
      ? "BIODATA_ARCHIVED"
      : "BIODATA_ALREADY_EXISTS";
    throw ApiError.conflict(
      code === "BIODATA_ARCHIVED"
        ? "Your previous biodata was archived. Restore it to continue editing."
        : "You already have a biodata. Update it instead of creating another.",
      code
    );
  }
  const payload = sanitizePayload(body);
  const doc = await Biodata.create({ user: userId, ...payload });
  return toPublicDoc(doc.toObject(), { full: true });
}

export async function updateMyBiodata(userId, body) {
  const doc = await Biodata.findOne({ user: userId });
  if (!doc) {
    throw ApiError.notFound("No biodata found for this account. Create one first.", "BIODATA_NOT_FOUND");
  }
  const payload = sanitizePayload(body);
  for (const [key, value] of Object.entries(payload)) doc[key] = value;
  await doc.save();
  return toPublicDoc(doc.toObject(), { full: true });
}

/** Fields that must exist before a biodata can be submitted for review. */
export function missingCoreFields(doc) {
  const missing = [];
  if (!doc.fullName || doc.fullName.trim().length < 3) missing.push("firstName/lastName");
  if (!doc.gender) missing.push("gender");
  if (!doc.religion) missing.push("religion");
  if (!doc.maritalStatus) missing.push("maritalStatus");
  if (!doc.division && !doc.district) missing.push("division/district");
  const age = doc.age ?? (doc.dateOfBirth ? ageFrom(doc.dateOfBirth) : null);
  if (age === null || age < 18) missing.push("age (must be 18+)");
  if (!doc.occupation) missing.push("occupation");
  if (!doc.education) missing.push("education");
  if (!doc.mobile && !doc.phoneNumber) missing.push("mobile/phoneNumber");
  if (!doc.agreed) missing.push("agreed (pledge of authenticity)");
  return missing;
}

export async function submitMyBiodata(userId) {
  const doc = await Biodata.findOne({ user: userId });
  if (!doc) throw ApiError.notFound("No biodata found for this account.", "BIODATA_NOT_FOUND");
  if (doc.status === BIODATA_STATUSES.APPROVED) {
    throw ApiError.conflict("Your biodata is already approved and live.", "ALREADY_APPROVED");
  }

  const missing = missingCoreFields(doc);
  if (missing.length) {
    throw ApiError.unprocessable(
      `Biodata is incomplete. Missing: ${missing.join(", ")}`,
      "BIODATA_INCOMPLETE",
      { missing }
    );
  }

  doc.status = BIODATA_STATUSES.PENDING;
  doc.submittedAt = new Date();
  doc.rejectionReason = "";
  await doc.save();
  return toPublicDoc(doc.toObject(), { full: true });
}

export async function archiveMyBiodata(userId) {
  const doc = await Biodata.findOne({ user: userId });
  if (!doc) throw ApiError.notFound("No biodata found for this account.", "BIODATA_NOT_FOUND");
  doc.status = BIODATA_STATUSES.ARCHIVED;
  await doc.save();
  return { id: doc._id.toString(), status: doc.status };
}

export async function restoreMyBiodata(userId) {
  const doc = await Biodata.findOne({ user: userId });
  if (!doc) throw ApiError.notFound("No biodata found for this account.", "BIODATA_NOT_FOUND");
  if (doc.status !== BIODATA_STATUSES.ARCHIVED) {
    throw ApiError.conflict("Only archived biodata can be restored.", "NOT_ARCHIVED");
  }
  doc.status = BIODATA_STATUSES.DRAFT;
  await doc.save();
  return toPublicDoc(doc.toObject(), { full: true });
}

export async function addMyBiodataPhoto(userId, publicUrl) {
  const doc = await Biodata.findOne({ user: userId });
  if (!doc) throw ApiError.notFound("No biodata found for this account.", "BIODATA_NOT_FOUND");
  if (!doc.photos.includes(publicUrl)) {
    doc.photos.push(publicUrl);
    if (!doc.profileImage) doc.profileImage = publicUrl;
    await doc.save();
  }
  return toPublicDoc(doc.toObject(), { full: true });
}

export async function removeBiodataPhoto(id, index, actor) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid biodata id", "INVALID_ID");
  const doc = await Biodata.findById(id);
  if (!doc) throw ApiError.notFound("Biodata not found", "BIODATA_NOT_FOUND");

  const isOwner = doc.user.toString() === actor.id;
  const staff = isStaff(actor.role);
  if (!isOwner && !staff) {
    throw ApiError.forbidden("You can only edit your own biodata.", "OWNER_ONLY");
  }
  if (index >= doc.photos.length) throw ApiError.badRequest("Invalid photo index", "INVALID_INDEX");

  doc.photos.splice(index, 1);
  if (doc.profileImage && !doc.photos.includes(doc.profileImage)) {
    doc.profileImage = doc.photos[0] || null;
  }
  await doc.save();
  return { id: doc._id.toString(), photos: doc.photos, profileImage: doc.profileImage };
}

export async function setProfileImage(id, url, actor) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid biodata id", "INVALID_ID");
  const doc = await Biodata.findById(id);
  if (!doc) throw ApiError.notFound("Biodata not found", "BIODATA_NOT_FOUND");
  const isOwner = doc.user.toString() === actor.id;
  if (!isOwner && !isStaff(actor.role)) {
    throw ApiError.forbidden("You can only edit your own biodata.", "OWNER_ONLY");
  }
  if (!doc.photos.includes(url) && !isStaff(actor.role)) {
    throw ApiError.badRequest("Photo must be one of the uploaded photos.", "INVALID_PHOTO");
  }
  doc.profileImage = url;
  await doc.save();
  return { id: doc._id.toString(), profileImage: doc.profileImage };
}

// ---------------------------------------------------------------------------
// Admin moderation
// ---------------------------------------------------------------------------
export async function moderateBiodata(id, { status, rejectionReason }, reviewer) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid biodata id", "INVALID_ID");
  const doc = await Biodata.findById(id);
  if (!doc) throw ApiError.notFound("Biodata not found", "BIODATA_NOT_FOUND");

  doc.status = status;
  doc.reviewedBy = reviewer.id;
  if (status === BIODATA_STATUSES.APPROVED) {
    doc.approvedAt = new Date();
    doc.rejectionReason = "";
  }
  if (status === BIODATA_STATUSES.REJECTED) {
    doc.rejectionReason = rejectionReason || "Does not meet our community guidelines.";
  }

  await doc.save();

  await Notification.create({
    user: doc.user,
    type: NOTIFICATION_TYPES.BIODATA_STATUS,
    title:
      status === BIODATA_STATUSES.APPROVED
        ? `Your biodata ${doc.biodataNo} is now live`
        : `Your biodata ${doc.biodataNo} needs attention`,
    body:
      status === BIODATA_STATUSES.APPROVED
        ? "Congratulations! Your biodata has been approved and is visible to other members."
        : `Reason: ${doc.rejectionReason}`,
    data: { kind: "biodata", id: doc._id.toString(), status },
  });

  return toPublicDoc(doc.toObject(), { full: true });
}

export async function adminDeleteBiodata(id) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid biodata id", "INVALID_ID");
  const doc = await Biodata.findById(id);
  if (!doc) throw ApiError.notFound("Biodata not found", "BIODATA_NOT_FOUND");
  doc.status = BIODATA_STATUSES.ARCHIVED;
  await doc.save();
  return { id: doc._id.toString(), status: doc.status };
}

// ---------------------------------------------------------------------------
// Likes (like list, received likes, notifications, mutual match)
// ---------------------------------------------------------------------------
export async function likeBiodata(userId, biodataId) {
  if (!isValidObjectId(biodataId)) throw ApiError.badRequest("Invalid biodata id", "INVALID_ID");
  const biodata = await Biodata.findById(biodataId);
  if (!biodata || biodata.status !== BIODATA_STATUSES.APPROVED) {
    throw ApiError.notFound("Biodata not found", "BIODATA_NOT_FOUND");
  }
  if (biodata.user.toString() === userId) {
    throw ApiError.badRequest("You cannot like your own biodata.", "SELF_LIKE_FORBIDDEN");
  }

  const existing = await Like.findOne({ user: userId, biodata: biodataId });
  if (existing) {
    throw ApiError.conflict("You already liked this biodata.", "ALREADY_LIKED");
  }

  // Does the owner already like my biodata? -> mutual match
  const myBiodata = await Biodata.findOne({ user: userId }).select("_id status").lean();
  const backLike = myBiodata
    ? await Like.findOne({ user: biodata.user, biodata: myBiodata._id })
    : null;

  const like = await Like.create({
    user: userId,
    biodata: biodata._id,
    targetOwner: biodata.user,
    isMutual: Boolean(backLike),
  });

  const targetUserId = biodata.user.toString();
  if (backLike) {
    await Like.updateOne({ _id: backLike._id }, { $set: { isMutual: true } });
    // Notify both sides of the mutual match
    await Notification.create({
      user: targetUserId,
      type: NOTIFICATION_TYPES.MUTUAL_LIKE,
      title: "It's a match! You both liked each other.",
      body: "You can now start a conversation.",
      data: { kind: "biodata", id: biodataId },
    });
    await Notification.create({
      user: userId,
      type: NOTIFICATION_TYPES.MUTUAL_LIKE,
      title: "It's a match! You both liked each other.",
      body: "Start a conversation now.",
      data: { kind: "biodata", id: myBiodata._id.toString() },
    });
  } else {
    await Notification.create({
      user: targetUserId,
      type: NOTIFICATION_TYPES.BIODATA_LIKE,
      title: "Someone liked your biodata",
      body: "A member liked your biodata. Open the like list to view details.",
      data: { kind: "like", id: like._id.toString(), biodataId },
    });
  }

  return { id: like._id.toString(), isMutual: like.isMutual };
}

export async function unlikeBiodata(userId, biodataId) {
  if (!isValidObjectId(biodataId)) throw ApiError.badRequest("Invalid biodata id", "INVALID_ID");
  const like = await Like.findOne({ user: userId, biodata: biodataId });
  if (!like) throw ApiError.notFound("Like not found", "LIKE_NOT_FOUND");

  if (like.isMutual) {
    // Breaking the match also clears the flag on the other side's like.
    const myBiodatas = await Biodata.find({ user: userId }).select("_id").lean();
    if (myBiodatas.length) {
      await Like.updateMany(
        { user: like.targetOwner, biodata: { $in: myBiodatas.map((b) => b._id) }, isMutual: true },
        { $set: { isMutual: false } }
      );
    }
  }

  await like.deleteOne();
  return { success: true };
}

export async function sentLikes(userId, { page, limit }) {
  const { page: p, limit: l, skip } = parsePagination({ page, limit });
  const filter = { user: userId };
  const [total, docs] = await Promise.all([
    Like.countDocuments(filter),
    Like.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l).populate({
      path: "biodata",
      select: LIST_PROJECTION,
    }).lean(),
  ]);
  const items = docs
    .filter((d) => d.biodata)
    .map((d) => ({
      id: d._id.toString(),
      likedAt: d.createdAt,
      isMutual: d.isMutual,
      biodata: d.biodata ? { ...d.biodata, id: d.biodata._id.toString() } : null,
    }));
  return { items, pagination: buildPagination(total, p, l) };
}

export async function receivedLikes(userId, { page, limit }) {
  const { page: p, limit: l, skip } = parsePagination({ page, limit });
  const filter = { targetOwner: userId };
  const [total, docs] = await Promise.all([
    Like.countDocuments(filter),
    Like.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l).populate({
      path: "user",
      select: "firstName lastName avatar role",
    }).lean(),
  ]);
  const items = docs.map((d) => ({
    id: d._id.toString(),
    likedAt: d.createdAt,
    isMutual: d.isMutual,
    from: d.user ? { id: d.user._id.toString(), name: `${d.user.firstName} ${d.user.lastName}`.trim(), avatar: d.user.avatar } : null,
  }));
  return { items, pagination: buildPagination(total, p, l) };
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------
export function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function publicBiodataStats() {
  return Promise.all([
    Biodata.countDocuments({ status: BIODATA_STATUSES.APPROVED, gender: GENDERS.MALE }),
    Biodata.countDocuments({ status: BIODATA_STATUSES.APPROVED, gender: GENDERS.FEMALE }),
    Biodata.countDocuments({ status: BIODATA_STATUSES.APPROVED }),
  ]).then(([grooms, brides, total]) => ({ total, grooms, brides }));
}
