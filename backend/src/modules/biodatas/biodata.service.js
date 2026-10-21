import mongoose from "mongoose";
import Biodata from "../../models/biodata.model.js";
import Like from "../../models/like.model.js";
import Notification from "../../models/notification.model.js";
import BiodataView from "../../models/biodataView.model.js";
import User from "../../models/user.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { parsePagination, buildPagination, parseSort } from "../../utils/pagination.js";
import { isValidObjectId, ageFrom } from "../../utils/helpers.js";
import { BIODATA_STATUSES, NOTIFICATION_TYPES, ROLES, GENDERS, CONTACT_VISIBILITY, PHOTO_VISIBILITY } from "../../constants/index.js";
import env from "../../config/env.js";
import { getConnectBalance, deductConnectForView, hasViewedBiodata } from "../membership/connect.service.js";
import { getOwnerPolicies, isMutualMatch, maskBiodataPhotos, canViewPhotos } from "../privacy/privacy.service.js";
import { isBlockedBetween } from "../blocks/block.service.js";
import { computeCompletion } from "./biodata.completion.js";
import { emitNewNotification } from "../notifications/notification.service.js";
import { notifyAdmins } from "../notifications/adminNotification.service.js";

// ---------------------------------------------------------------------------
// Field allow-lists (defense against mass assignment)
// ---------------------------------------------------------------------------
export const BIODATA_UPDATABLE = [
  "gender", "maritalStatus", "religion", "sectOrDenomination", "allowCrossReligion", "division", "district", "thana",
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
  if (body.allowCrossReligion !== undefined) {
    out.allowCrossReligion = Boolean(body.allowCrossReligion);
  }
  // agreed must be explicitly true to count as a pledge.
  if (out.agreed === true) out.agreedAt = new Date();
  if (out.agreed === false) out.agreedAt = null;
  return out;
}

// user → কার্ডগুলোতে ownerId দরকার (মেসেঞ্জার deep-link)
const LIST_PROJECTION =
  "biodataNo fullName gender age religion sectOrDenomination allowCrossReligion maritalStatus division district heightText skinColor occupation education profileImage viewCount status rejectionReason user createdAt updatedAt";

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
  if (query.maritalStatus) filter.maritalStatus = query.maritalStatus;

  // ধর্মভিত্তিক মাল্টি-রিলিজিয়ন ফিল্টারিং ও স্বধর্মীয় সংরক্ষণ
  let viewerReligion = null;
  if (viewer?.id && !isStaffViewer) {
    const viewerBio = await Biodata.findOne({ user: viewer.id }).select("religion").lean();
    if (viewerBio?.religion) {
      viewerReligion = viewerBio.religion;
    }
  }

  if (viewerReligion) {
    if (query.religion) {
      if (query.religion !== viewerReligion) {
        filter.religion = query.religion;
        filter.allowCrossReligion = true;
      } else {
        filter.religion = query.religion;
      }
    } else {
      const religionOr = [{ religion: viewerReligion }, { allowCrossReligion: true }];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: religionOr }];
        delete filter.$or;
      } else if (filter.$and) {
        filter.$and.push({ $or: religionOr });
      } else {
        filter.$or = religionOr;
      }
    }
  } else if (query.religion) {
    filter.religion = query.religion;
  }
  if (query.division) filter.division = { $regex: escapeRegExp(query.division), $options: "i" };
  if (query.district) {
    const rx = { $regex: escapeRegExp(query.district), $options: "i" };
    const DIVISIONS = ["ঢাকা", "চট্টগ্রাম", "খুলনা", "রাজশাহী", "সিলেট", "বরিশাল", "রংপুর", "ময়মনসিংহ"];
    if (DIVISIONS.includes(query.district) && !query.division) {
      filter.$or = [{ district: rx }, { division: rx }];
    } else {
      filter.district = rx;
    }
  }

  const ageFilter = {};
  if (query.ageMin !== undefined) ageFilter.$gte = query.ageMin;
  if (query.ageMax !== undefined) ageFilter.$lte = query.ageMax;
  if (Object.keys(ageFilter).length) filter.age = ageFilter;

  if (query.education) filter.education = { $regex: escapeRegExp(query.education), $options: "i" };
  if (query.occupation) filter.occupation = { $regex: escapeRegExp(query.occupation), $options: "i" };
  if (query.skinColor) filter.skinColor = { $regex: escapeRegExp(query.skinColor), $options: "i" };

  if (query.biodataNo) {
    filter.biodataNo = { $regex: escapeRegExp(query.biodataNo), $options: "i" };
  }

  if (query.search) {
    const rx = { $regex: escapeRegExp(query.search), $options: "i" };
    const searchOr = [
      { biodataNo: rx },
      { fullName: rx },
      { occupation: rx },
      { education: rx },
      { division: rx },
      { district: rx },
    ];
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
      delete filter.$or;
    } else {
      filter.$or = searchOr;
    }
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

  // ownerId → কার্ড থেকে সরাসরি মেসেঞ্জার চ্যাট (?chat=) শুরু করার জন্য; ব্যবহারকারী-আইডি ছাড়া কোনো সংবেদনশীল তথ্য নয়।
  // raw `user` ফিল্ড আগের মতোই বাদ — পাবলিক শেপ অপরিবর্তিত রাখতে।
  const items = docs.map((d) => {
    const { user, ...rest } = d;
    return { ...rest, id: d._id.toString(), ownerId: user ? user.toString() : null, likedByMe: likedSet.has(d._id.toString()) };
  });

  // Privacy choke-point — hides protected photos behind the gender-avatar fallback.
  await maskBiodataPhotos(items, viewer);

  return { items, pagination: buildPagination(total, page, limit) };
}

// ---------------------------------------------------------------------------
// Single biodata (guest summary vs member full view)
// ---------------------------------------------------------------------------
export async function getBiodataById(id, viewer) {
  let doc;
  if (isValidObjectId(id)) {
    doc = await Biodata.findById(id).lean();
  } else if (typeof id === "string" && id.trim()) {
    doc = await Biodata.findOne({ biodataNo: id.trim().toUpperCase() }).lean();
  } else {
    throw ApiError.badRequest("Invalid biodata id", "INVALID_ID");
  }
  if (!doc) throw ApiError.notFound("Biodata not found", "BIODATA_NOT_FOUND");

  const bioObjectId = doc._id.toString();
  const ownerId = doc.user.toString();
  const isOwner = viewer && viewer.id === ownerId;
  const staff = viewer && isStaff(viewer.role);
  const isPublic = doc.status === BIODATA_STATUSES.APPROVED;

  if (!isOwner && !staff && !isPublic) {
    throw ApiError.notFound("Biodata not found", "BIODATA_NOT_FOUND");
  }

  // ধর্মভিত্তিক এক্সেস চেক: ভিন্ন ধর্মের সদস্য অনুমতি ছাড়া বায়োডাটা দেখতে পারবে না
  if (viewer && !isOwner && !staff && doc.religion) {
    const viewerBio = await Biodata.findOne({ user: viewer.id }).select("religion").lean();
    if (viewerBio?.religion && viewerBio.religion !== doc.religion && !doc.allowCrossReligion) {
      throw ApiError.forbidden(
        "এই পাত্র/পাত্রী শুধুমাত্র স্বধর্মীয় সদস্যদের জন্য বায়োডাটা সংরক্ষিত রেখেছেন।",
        "CROSS_RELIGION_RESTRICTED"
      );
    }
  }

  // Block recheck on every read: a block between the parties revokes photo
  // and contact access — the blocked side only ever sees the public summary
  // and is never charged for it.
  const blocked = Boolean(viewer) && !isOwner && !staff && (await isBlockedBetween(viewer.id, ownerId));

  const policies = await getOwnerPolicies(ownerId);
  let matched = false;
  if (viewer && !isOwner && !staff &&
      (policies.contact === CONTACT_VISIBILITY.MATCHED || policies.photo === PHOTO_VISIBILITY.MATCHED)) {
    matched = await isMutualMatch(viewer.id, ownerId);
  }

  // ---- contact gate: connect-charged "full view" --------------------------
  let fullView = isOwner || Boolean(staff);
  let paidView = Boolean(fullView);
  if (!fullView && viewer && !blocked) {
    const freeByPolicy =
      policies.contact === CONTACT_VISIBILITY.PUBLIC ||
      (policies.contact === CONTACT_VISIBILITY.MATCHED && matched);
    if (freeByPolicy) {
      // Owner opted into open contact → no charge (contact policy only).
      fullView = true;
    } else {
      if (!(await hasViewedBiodata(viewer.id, bioObjectId))) {
        const cost = env.VIEW_CONNECT_COST;
        const balance = await getConnectBalance(viewer.id);
        if (balance < cost) {
          throw ApiError.forbidden(
            "You need connects to view full biodata. Buy a membership plan or a connect pack.",
            "CONNECTS_INSUFFICIENT"
          );
        }
        await deductConnectForView({
          userId: viewer.id,
          biodataId: bioObjectId,
          ownerId,
          amount: cost,
          reason: `Viewed biodata ${doc.biodataNo}`,
        });
        // খরচের নোটিফিকেশন — শুধু পেয়েছেন এমন ব্যবহারকারী (নিজের নিজের কাজ)
        const spendNotification = await Notification.create({
          user: viewer.id,
          type: NOTIFICATION_TYPES.SYSTEM,
          title: "Connects spent",
          body: `${cost} connect(s) spent to view biodata ${doc.biodataNo}.`,
          data: { kind: "biodata", id: bioObjectId, cost },
        });
        emitNewNotification(spendNotification);
      }
      fullView = true;
      paidView = true;
    }
  }

  // ---- photo gate (separate billable action — never charged twice) --------
  const photoVisible =
    isOwner || staff
      ? true
      : await canViewPhotos({ viewer, ownerId, biodataId: bioObjectId, policies, blocked, matched, paidView });

  // bump public counter (not for the owner's own reads)
  if (!isOwner) {
    await Biodata.updateOne({ _id: doc._id }, { $inc: { viewCount: 1 } }).lean();

    // Log the view & notify the owner if the viewer is a logged-in user
    if (viewer && viewer.id) {
      try {
        const viewRecord = await BiodataView.findOneAndUpdate(
          { viewer: viewer.id, biodata: doc._id },
          {
            $inc: { count: 1 },
            $set: { targetOwner: doc.user, lastViewedAt: new Date() },
            $setOnInsert: { firstViewedAt: new Date() },
          },
          { upsert: true, new: true }
        );

        // Throttle duplicate unread notifications from the same viewer within 15 minutes
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const recentNotif = await Notification.findOne({
          user: doc.user,
          type: NOTIFICATION_TYPES.BIODATA_VIEW,
          "data.viewerId": viewer.id,
          createdAt: { $gte: fifteenMinutesAgo },
        });

        if (!recentNotif) {
          const [viewerUser, viewerBio] = await Promise.all([
            User.findById(viewer.id).select("firstName lastName avatar").lean(),
            Biodata.findOne({ user: viewer.id }).select("_id biodataNo fullName").lean(),
          ]);
          const viewerName = viewerBio?.fullName || (viewerUser
            ? `${viewerUser.firstName || ""} ${viewerUser.lastName || ""}`.trim()
            : "একজন সদস্য");

          const viewNotification = await Notification.create({
            user: doc.user,
            type: NOTIFICATION_TYPES.BIODATA_VIEW,
            title: `${viewerName || "একজন সদস্য"} আপনার বায়োডাটা দেখেছেন`,
            body: `আপনার বায়োডাটা (${doc.biodataNo || ""}) এই সদস্য মোট ${viewRecord.count} বার দেখেছেন।`,
            data: {
              kind: "biodata",
              id: viewerBio ? viewerBio._id.toString() : doc._id.toString(),
              viewerId: viewer.id,
              viewerBiodataId: viewerBio ? viewerBio._id.toString() : null,
              targetTab: "profileViews",
              count: viewRecord.count,
            },
          });
          emitNewNotification(viewNotification);
        }
      } catch {
        /* non-critical: view logging should never fail the read request */
      }
    }
  }

  const result = toPublicDoc(doc, { full: fullView });

  // ---- contact visibility (policy can widen a summary view; a block always wins) ----
  const contactVisible =
    isOwner || staff
      ? true
      : blocked
        ? false
        : policies.contact === CONTACT_VISIBILITY.PUBLIC
          ? true
          : Boolean(fullView); // PAID → charged full view; MATCHED → free grant or charged

  if (contactVisible && !fullView) {
    for (const f of CONTACT_FIELDS) if (doc[f] !== undefined) result[f] = doc[f];
  } else if (!contactVisible && fullView) {
    for (const f of CONTACT_FIELDS) delete result[f];
  }

  // ---- photo exposure ----
  if (!photoVisible) {
    const hadPhotos = Boolean(result.profileImage || (result.photos && result.photos.length));
    result.photos = [];
    result.profileImage = null;
    if (hadPhotos) {
      result.photoLocked = true;
      result.photoUnlockCost = env.PHOTO_UNLOCK_COST;
    }
  } else {
    result.photoLocked = false;
  }

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
  let base;
  if (isValidObjectId(id)) {
    base = await Biodata.findById(id).lean();
  } else if (typeof id === "string" && id.trim()) {
    base = await Biodata.findOne({ biodataNo: id.trim().toUpperCase() }).lean();
  } else {
    throw ApiError.badRequest("Invalid biodata id", "INVALID_ID");
  }
  if (!base) throw ApiError.notFound("Biodata not found", "BIODATA_NOT_FOUND");

  const filter = {
    _id: { $ne: base._id },
    status: BIODATA_STATUSES.APPROVED,
  };
  if (base.gender) filter.gender = base.gender;
  if (base.religion) filter.religion = base.religion;
  if (base.division) filter.division = base.division;

  const docs = await Biodata.find(filter).sort({ createdAt: -1 }).limit(limit).select(LIST_PROJECTION).lean();
  const items = docs.map((d) => {
    const { user, ...rest } = d;
    return { ...rest, id: d._id.toString(), ownerId: user ? user.toString() : null };
  });
  await maskBiodataPhotos(items, viewer);
  return items;
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

  // Admin Notification: New biodata submitted
  notifyAdmins({
    type: "NEW_BIODATA",
    title: `নতুন বায়োডাটা রিভিউ অপেক্ষমান (#${doc.biodataNo})`,
    body: `${doc.fullName || "ইউজার"} বায়োডাটা #${doc.biodataNo} পর্যালোচনার জন্য জমা দিয়েছেন।`,
    data: { kind: "biodata", id: doc._id.toString(), biodataNo: doc.biodataNo },
    adminCategory: "BIODATA",
  }).catch(() => {});

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

  const statusNotification = await Notification.create({
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
  // পে-লোড DB-ডক থেকে — আসল id সহ (আগে id:null পাঠানো হত)
  emitNewNotification(statusNotification);

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

  // ধর্মভিত্তিক এক্সেস চেক: ভিন্ন ধর্মের সদস্য অনুমতি ছাড়া লাইক বা ম্যাচ করতে পারবে না
  if (biodata.religion) {
    const myBio = await Biodata.findOne({ user: userId }).select("religion").lean();
    if (myBio?.religion && myBio.religion !== biodata.religion && !biodata.allowCrossReligion) {
      throw ApiError.forbidden(
        "এই পাত্র/পাত্রী শুধুমাত্র স্বধর্মীয় সদস্যদের জন্য লাইক ও প্রস্তাবের অনুমতি রেখেছেন।",
        "CROSS_RELIGION_RESTRICTED"
      );
    }
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
  const [likerUser, likerBio] = await Promise.all([
    User.findById(userId).select("firstName lastName avatar").lean(),
    Biodata.findOne({ user: userId }).select("_id biodataNo fullName").lean(),
  ]);
  const likerName = likerBio?.fullName || (likerUser
    ? `${likerUser.firstName || ""} ${likerUser.lastName || ""}`.trim()
    : "একজন সদস্য");

  if (backLike) {
    await Like.updateOne({ _id: backLike._id }, { $set: { isMutual: true } });
    // Notify both sides of the mutual match
    const targetMatchNotification = await Notification.create({
      user: targetUserId,
      type: NOTIFICATION_TYPES.MUTUAL_LIKE,
      title: "পারস্পরিক ম্যাচ! আপনারা পরস্পরকে পছন্দ করেছেন।",
      body: `${likerName} ও আপনি পরস্পরকে পছন্দ করেছেন। এখনই মেসেজে যোগাযোগ শুরু করুন।`,
      data: {
        kind: "biodata",
        id: likerBio ? likerBio._id.toString() : biodataId,
        likerId: userId,
        likerBiodataId: likerBio ? likerBio._id.toString() : null,
      },
    });
    emitNewNotification(targetMatchNotification);
    const myMatchNotification = await Notification.create({
      user: userId,
      type: NOTIFICATION_TYPES.MUTUAL_LIKE,
      title: "It's a match! You both liked each other.",
      body: "Start a conversation now.",
      data: { kind: "biodata", id: myBiodata._id.toString() },
    });
    emitNewNotification(myMatchNotification);
  } else {
    const likeNotification = await Notification.create({
      user: targetUserId,
      type: NOTIFICATION_TYPES.BIODATA_LIKE,
      title: `${likerName} আপনার বায়োডাটা পছন্দ করেছেন`,
      body: `${likerName} আপনার বায়োডাটা পছন্দ করেছেন। বায়োডাটা দেখতে ক্লিক করুন।`,
      data: {
        kind: "biodata",
        id: likerBio ? likerBio._id.toString() : biodataId,
        likerId: userId,
        likerBiodataId: likerBio ? likerBio._id.toString() : null,
        targetTab: "whoLikedYou",
      },
    });
    emitNewNotification(likeNotification);
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
    .map((d) => {
      const { user, ...biodataRest } = d.biodata;
      return {
        id: d._id.toString(),
        likedAt: d.createdAt,
        isMutual: d.isMutual,
        biodata: {
          ...biodataRest,
          id: d.biodata._id.toString(),
          ownerId: user ? user.toString() : null,
        },
      };
    });
  await maskBiodataPhotos(items.map((i) => i.biodata), { id: userId });
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

  const userIds = docs.map((d) => d.user?._id).filter(Boolean);
  const biodatas = await Biodata.find({ user: { $in: userIds } })
    .select(LIST_PROJECTION)
    .lean();
  const bioMap = new Map(biodatas.map((b) => [b.user.toString(), b]));

  const items = docs.map((d) => {
    const uId = d.user ? d.user._id.toString() : null;
    const bio = uId ? bioMap.get(uId) : null;
    return {
      id: d._id.toString(),
      likedAt: d.createdAt,
      isMutual: d.isMutual,
      from: d.user
        ? {
            id: uId,
            name: bio?.fullName || `${d.user.firstName || ""} ${d.user.lastName || ""}`.trim(),
            avatar: d.user.avatar,
            biodata: bio
              ? {
                  id: bio._id.toString(),
                  biodataNo: bio.biodataNo,
                  gender: bio.gender,
                  age: bio.age,
                  occupation: bio.occupation,
                  district: bio.district || bio.division,
                  profileImage: bio.profileImage,
                  status: bio.status,
                }
              : null,
          }
        : null,
    };
  });
  return { items, pagination: buildPagination(total, p, l) };
}

export async function myBiodataViews(userId, { page, limit } = {}) {
  const { page: p, limit: l, skip } = parsePagination({ page, limit });
  const filter = { targetOwner: userId };

  const [total, totalCountAgg, docs] = await Promise.all([
    BiodataView.countDocuments(filter),
    BiodataView.aggregate([
      { $match: { targetOwner: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, totalSeen: { $sum: "$count" } } },
    ]),
    BiodataView.find(filter)
      .sort({ lastViewedAt: -1 })
      .skip(skip)
      .limit(l)
      .populate({
        path: "viewer",
        select: "firstName lastName avatar role email",
      })
      .lean(),
  ]);

  const totalViews = totalCountAgg[0]?.totalSeen || 0;
  const uniqueViewers = total;

  const viewerIds = docs.map((d) => d.viewer?._id).filter(Boolean);
  const biodatas = await Biodata.find({ user: { $in: viewerIds } })
    .select(LIST_PROJECTION)
    .lean();
  const bioMap = new Map(biodatas.map((b) => [b.user.toString(), b]));

  const items = docs.map((d) => {
    const viewerId = d.viewer ? d.viewer._id.toString() : null;
    const bio = viewerId ? bioMap.get(viewerId) : null;
    return {
      id: d._id.toString(),
      count: d.count,
      firstViewedAt: d.firstViewedAt,
      lastViewedAt: d.lastViewedAt,
      viewerId,
      viewerName: bio?.fullName || (d.viewer ? `${d.viewer.firstName || ""} ${d.viewer.lastName || ""}`.trim() : "অজানা সদস্য"),
      viewerAvatar: d.viewer?.avatar || null,
      biodata: bio
        ? {
            id: bio._id.toString(),
            biodataNo: bio.biodataNo,
            gender: bio.gender,
            age: bio.age,
            occupation: bio.occupation,
            district: bio.district || bio.division,
            profileImage: bio.profileImage,
            status: bio.status,
          }
        : null,
    };
  });

  return {
    items,
    stats: { totalViews, uniqueViewers },
    pagination: buildPagination(total, p, l),
  };
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
