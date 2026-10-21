import mongoose from "mongoose";
import Marriage from "../../models/marriage.model.js";
import Biodata from "../../models/biodata.model.js";
import User from "../../models/user.model.js";
import Conversation from "../../models/conversation.model.js";
import Like from "../../models/like.model.js";
import Notification from "../../models/notification.model.js";
import { notifyAdmins } from "../notifications/adminNotification.service.js";
import { BIODATA_STATUSES } from "../../constants/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { isValidObjectId } from "../../utils/helpers.js";
import { parsePagination, buildPagination } from "../../utils/pagination.js";

/** Candidate partners discovery from conversations and likes */
export async function candidatePartners(userId) {
  const uid = new mongoose.Types.ObjectId(userId);

  // 1. Find user's own gender
  const myBio = await Biodata.findOne({ user: uid }).select("gender fullName").lean();
  const oppositeGender = myBio?.gender === "FEMALE" ? "MALE" : myBio?.gender === "MALE" ? "FEMALE" : null;

  // 2. Collect partner user IDs from conversations
  const convs = await Conversation.find({ participants: uid }).select("participants").lean();
  const convPartnerIds = new Set();
  for (const c of convs) {
    for (const p of c.participants) {
      const s = p.toString();
      if (s !== userId.toString()) convPartnerIds.add(s);
    }
  }

  // 3. Collect partner user IDs from likes
  const likes = await Like.find({
    $or: [{ user: uid }, { targetOwner: uid }],
  }).select("user targetOwner").lean();

  for (const l of likes) {
    const u1 = l.user?.toString();
    const u2 = l.targetOwner?.toString();
    if (u1 && u1 !== userId.toString()) convPartnerIds.add(u1);
    if (u2 && u2 !== userId.toString()) convPartnerIds.add(u2);
  }

  const partnerIds = Array.from(convPartnerIds).map((id) => new mongoose.Types.ObjectId(id));
  if (!partnerIds.length) return [];

  // 4. Fetch their biodata
  const filter = { user: { $in: partnerIds } };
  if (oppositeGender) filter.gender = oppositeGender;

  const partnerBios = await Biodata.find(filter)
    .populate("user", "firstName lastName email")
    .select("user biodataNo fullName firstName lastName gender age occupation district profileImage")
    .lean();

  return partnerBios.map((b) => ({
    userId: b.user?._id?.toString(),
    biodataId: b._id.toString(),
    biodataNo: b.biodataNo,
    name: b.fullName || [b.user?.firstName, b.user?.lastName].filter(Boolean).join(" ").trim() || "সদস্য",
    gender: b.gender,
    age: b.age,
    occupation: b.occupation,
    district: b.district,
    avatarUrl: b.profileImage || null,
  }));
}

/** User declares their marriage and hides their biodata */
export async function declareMarriage(userId, data = {}) {
  const uid = new mongoose.Types.ObjectId(userId);
  const user = await User.findById(uid).lean();
  const userBio = await Biodata.findOne({ user: uid });

  if (!userBio) {
    throw ApiError.badRequest("আপনার কোনো বায়োডাটা পাওয়া যায়নি। প্রথমে বায়োডাটা তৈরি করুন।", "NO_BIODATA");
  }

  const {
    partnerUserId,
    partnerBiodataNo,
    marriageDate,
    story,
    feedback,
    hideMyBiodata = true,
    hidePartnerBiodata = true,
  } = data;

  // Resolve partner
  let partnerUser = null;
  let partnerBio = null;

  if (partnerUserId && isValidObjectId(partnerUserId)) {
    partnerUser = await User.findById(partnerUserId).lean();
    partnerBio = await Biodata.findOne({ user: partnerUserId });
  } else if (partnerBiodataNo && String(partnerBiodataNo).trim()) {
    const no = String(partnerBiodataNo).trim().toUpperCase();
    partnerBio = await Biodata.findOne({ biodataNo: no });
    if (partnerBio?.user) {
      partnerUser = await User.findById(partnerBio.user).lean();
    }
  }

  // Determine who is Groom and who is Bride
  const isMale = userBio.gender === "MALE";
  const groomUser = isMale ? user : partnerUser;
  const groomBio = isMale ? userBio : partnerBio;
  const brideUser = !isMale ? user : partnerUser;
  const brideBio = !isMale ? userBio : partnerBio;

  const groomName = groomBio?.fullName || (groomUser ? [groomUser.firstName, groomUser.lastName].filter(Boolean).join(" ") : "") || "বর";
  const brideName = brideBio?.fullName || (brideUser ? [brideUser.firstName, brideUser.lastName].filter(Boolean).join(" ") : "") || "কনে";

  const marriage = await Marriage.create({
    groom: groomUser?._id || null,
    groomBiodata: groomBio?._id || null,
    groomBiodataNo: groomBio?.biodataNo || "",
    groomName,
    groomPhone: groomBio?.mobile || groomBio?.phoneNumber || "",
    groomPhoto: groomBio?.profileImage || "",

    bride: brideUser?._id || null,
    brideBiodata: brideBio?._id || null,
    brideBiodataNo: brideBio?.biodataNo || "",
    brideName,
    bridePhone: brideBio?.mobile || brideBio?.phoneNumber || "",
    bridePhoto: brideBio?.profileImage || "",

    declaredBy: uid,
    declaredRole: isMale ? "GROOM" : "BRIDE",
    marriageDate: marriageDate ? new Date(marriageDate) : new Date(),
    story: story || "",
    feedback: feedback || "",
    status: "VERIFIED",
    isPublicSuccessStory: true,
    groomHidden: Boolean(hideMyBiodata && isMale) || Boolean(hidePartnerBiodata && !isMale),
    brideHidden: Boolean(hideMyBiodata && !isMale) || Boolean(hidePartnerBiodata && isMale),
  });

  // Hide user's biodata
  if (hideMyBiodata) {
    userBio.status = BIODATA_STATUSES.HIDDEN;
    userBio.hiddenReason = "MARRIED";
    userBio.marriage = marriage._id;
    await userBio.save();
  }

  // Hide partner's biodata if requested & partner found
  if (hidePartnerBiodata && partnerBio) {
    partnerBio.status = BIODATA_STATUSES.HIDDEN;
    partnerBio.hiddenReason = "MARRIED";
    partnerBio.marriage = marriage._id;
    await partnerBio.save();
  }

  // Send congratulatory notification to partner
  if (partnerUser?._id) {
    await Notification.create({
      user: partnerUser._id,
      title: "মাশাআল্লাহ! বিবাহ চূড়ান্ত ও প্রোফাইল হাইড",
      body: (userBio.fullName || user.firstName) + " আপনার সাথে বিবাহ চূড়ান্ত ঘোষণা করেছেন। আপনাদের দাম্পত্য জীবনের জন্য শুভকামনা!",
      type: "SYSTEM",
      data: {
        kind: "marriage",
        targetTab: "marriage",
        marriageId: marriage._id.toString(),
      },
    }).catch(() => {});
  }

  // Send confirmation notification to declaring user
  await Notification.create({
    user: uid,
    title: "আলহামদুলিল্লাহ! শুভ বিবাহ ও মোবারকবাদ",
    body: "আপনার বিবাহ সফলভাবে নিবন্ধিত হয়েছে এবং আপনার বায়োডাটা পাবলিক সার্চ থেকে হাইড করা হয়েছে।",
    type: "SYSTEM",
    data: {
      kind: "marriage",
      targetTab: "marriage",
      marriageId: marriage._id.toString(),
    },
  }).catch(() => {});

  // Dispatch live notification to all admins
  notifyAdmins({
    type: "NEW_MARRIAGE",
    title: "নতুন বিবাহের ঘোষণা ও জুটি জমা পড়েছে",
    body: `পাত্র ${groomName} (#${groomBio?.biodataNo || ""}) এবং পাত্রী ${brideName} (#${brideBio?.biodataNo || ""}) বিবাহ সম্পন্ন হওয়ার ঘোষণা দিয়েছেন।`,
    data: { kind: "marriage", id: marriage._id.toString() },
    adminCategory: "MARRIAGE",
  }).catch(() => {});

  return marriage.toObject();
}

/** Get current user's marriage & profile hide status */
export async function myMarriage(userId) {
  const uid = new mongoose.Types.ObjectId(userId);
  const [marriage, userBio] = await Promise.all([
    Marriage.findOne({
      $or: [{ groom: uid }, { bride: uid }, { declaredBy: uid }],
    }).sort({ createdAt: -1 }).lean(),
    Biodata.findOne({ user: uid }).select("biodataNo status hiddenReason fullName profileImage").lean(),
  ]);

  return {
    marriage: marriage ? { ...marriage, id: marriage._id.toString() } : null,
    isMarried: Boolean(marriage),
    biodata: userBio ? { ...userBio, id: userBio._id.toString() } : null,
  };
}

/** Unhide biodata and restore to APPROVED */
export async function unhideMyBiodata(userId) {
  const uid = new mongoose.Types.ObjectId(userId);
  const bio = await Biodata.findOne({ user: uid });
  if (!bio) throw ApiError.notFound("বায়োডাটা পাওয়া যায়নি।", "BIODATA_NOT_FOUND");

  bio.status = BIODATA_STATUSES.APPROVED;
  bio.hiddenReason = null;
  await bio.save();

  // If there is an existing marriage doc, update visibility flag
  const marriage = await Marriage.findOne({
    $or: [{ groom: uid }, { bride: uid }],
  });
  if (marriage) {
    if (marriage.groom?.toString() === userId.toString()) marriage.groomHidden = false;
    if (marriage.bride?.toString() === userId.toString()) marriage.brideHidden = false;
    await marriage.save();
  }

  return { id: bio._id.toString(), status: bio.status, hiddenReason: bio.hiddenReason };
}

// ---------------------------------------------------------------------------
// Admin Management Services
// ---------------------------------------------------------------------------

/** Admin lists all marriages with search, filter, and stats */
export async function adminListMarriages({ q, status, page, limit } = {}) {
  const { page: p, limit: l, skip } = parsePagination({ page, limit });
  const filter = {};

  if (status && status !== "ALL") {
    filter.status = status;
  }

  if (q && String(q).trim()) {
    const term = String(q).trim();
    filter.$or = [
      { groomName: { $regex: term, $options: "i" } },
      { brideName: { $regex: term, $options: "i" } },
      { groomBiodataNo: { $regex: term, $options: "i" } },
      { brideBiodataNo: { $regex: term, $options: "i" } },
      { groomPhone: { $regex: term, $options: "i" } },
      { bridePhone: { $regex: term, $options: "i" } },
    ];
  }

  const [total, docs, totalMarriages, verifiedMarriages, pendingMarriages, hiddenGrooms, hiddenBrides] = await Promise.all([
    Marriage.countDocuments(filter),
    Marriage.find(filter)
      .populate("groom", "firstName lastName email")
      .populate("bride", "firstName lastName email")
      .populate("groomBiodata", "biodataNo fullName status hiddenReason profileImage")
      .populate("brideBiodata", "biodataNo fullName status hiddenReason profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    Marriage.countDocuments(),
    Marriage.countDocuments({ status: { $in: ["VERIFIED", "COMPLETED"] } }),
    Marriage.countDocuments({ status: "PENDING_VERIFICATION" }),
    Marriage.countDocuments({ groomHidden: true }),
    Marriage.countDocuments({ brideHidden: true }),
  ]);

  const items = docs.map((d) => ({
    id: d._id.toString(),
    ...d,
  }));

  return {
    items,
    pagination: buildPagination(total, p, l),
    stats: {
      total: totalMarriages,
      verified: verifiedMarriages,
      pending: pendingMarriages,
      hiddenProfiles: hiddenGrooms + hiddenBrides,
    },
  };
}

/** Admin manually records a marriage (offline or verified) */
export async function adminCreateMarriage(data = {}, adminUser) {
  const {
    groomName,
    groomBiodataNo,
    groomPhone,
    brideName,
    brideBiodataNo,
    bridePhone,
    marriageDate,
    story,
    status = "VERIFIED",
    groomHidden = true,
    brideHidden = true,
    isPublicSuccessStory = true,
    adminNotes = "",
  } = data;

  if (!groomName || !brideName) {
    throw ApiError.badRequest("বর এবং কনের নাম প্রদান করা আবশ্যক।", "NAMES_REQUIRED");
  }

  // Lookup biodatas if biodata numbers provided
  let groomBio = null;
  let brideBio = null;
  if (groomBiodataNo) {
    groomBio = await Biodata.findOne({ biodataNo: groomBiodataNo.trim().toUpperCase() });
  }
  if (brideBiodataNo) {
    brideBio = await Biodata.findOne({ biodataNo: brideBiodataNo.trim().toUpperCase() });
  }

  const doc = await Marriage.create({
    groom: groomBio?.user || null,
    groomBiodata: groomBio?._id || null,
    groomBiodataNo: groomBiodataNo || groomBio?.biodataNo || "",
    groomName: groomName.trim(),
    groomPhone: groomPhone || groomBio?.mobile || "",
    groomPhoto: groomBio?.profileImage || "",

    bride: brideBio?.user || null,
    brideBiodata: brideBio?._id || null,
    brideBiodataNo: brideBiodataNo || brideBio?.biodataNo || "",
    brideName: brideName.trim(),
    bridePhone: bridePhone || brideBio?.mobile || "",
    bridePhoto: brideBio?.profileImage || "",

    declaredRole: "ADMIN",
    declaredBy: adminUser?._id || null,
    marriageDate: marriageDate ? new Date(marriageDate) : new Date(),
    story: story || "",
    status,
    groomHidden: Boolean(groomHidden),
    brideHidden: Boolean(brideHidden),
    isPublicSuccessStory: Boolean(isPublicSuccessStory),
    adminNotes,
    verifiedBy: adminUser?._id || null,
    verifiedAt: new Date(),
  });

  // Apply hide if requested
  if (groomBio && groomHidden) {
    groomBio.status = BIODATA_STATUSES.HIDDEN;
    groomBio.hiddenReason = "MARRIED";
    groomBio.marriage = doc._id;
    await groomBio.save();
  }
  if (brideBio && brideHidden) {
    brideBio.status = BIODATA_STATUSES.HIDDEN;
    brideBio.hiddenReason = "MARRIED";
    brideBio.marriage = doc._id;
    await brideBio.save();
  }

  return { id: doc._id.toString(), ...doc.toObject() };
}

/** Admin updates marriage details, toggle visibility or verification */
export async function adminUpdateMarriage(id, data = {}, adminUser) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid marriage id", "INVALID_ID");
  const doc = await Marriage.findById(id);
  if (!doc) throw ApiError.notFound("Marriage record not found", "NOT_FOUND");

  const fields = ["status", "isPublicSuccessStory", "adminNotes", "story", "marriageDate", "groomName", "brideName"];
  for (const f of fields) {
    if (data[f] !== undefined) doc[f] = data[f];
  }

  if (data.status === "VERIFIED" && doc.status !== "VERIFIED") {
    doc.verifiedBy = adminUser?._id || null;
    doc.verifiedAt = new Date();
  }

  // Handle Groom visibility toggle
  if (data.groomHidden !== undefined) {
    doc.groomHidden = Boolean(data.groomHidden);
    if (doc.groomBiodata) {
      const gBio = await Biodata.findById(doc.groomBiodata);
      if (gBio) {
        gBio.status = doc.groomHidden ? BIODATA_STATUSES.HIDDEN : BIODATA_STATUSES.APPROVED;
        gBio.hiddenReason = doc.groomHidden ? "MARRIED" : null;
        await gBio.save();
      }
    }
  }

  // Handle Bride visibility toggle
  if (data.brideHidden !== undefined) {
    doc.brideHidden = Boolean(data.brideHidden);
    if (doc.brideBiodata) {
      const bBio = await Biodata.findById(doc.brideBiodata);
      if (bBio) {
        bBio.status = doc.brideHidden ? BIODATA_STATUSES.HIDDEN : BIODATA_STATUSES.APPROVED;
        bBio.hiddenReason = doc.brideHidden ? "MARRIED" : null;
        await bBio.save();
      }
    }
  }

  await doc.save();
  return { id: doc._id.toString(), ...doc.toObject() };
}

/** Admin deletes a marriage record */
export async function adminDeleteMarriage(id) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid marriage id", "INVALID_ID");
  const doc = await Marriage.findById(id);
  if (!doc) throw ApiError.notFound("Marriage record not found", "NOT_FOUND");

  // Restore biodatas if they were hidden due to this marriage
  if (doc.groomBiodata) {
    await Biodata.updateOne(
      { _id: doc.groomBiodata, hiddenReason: "MARRIED" },
      { $set: { status: BIODATA_STATUSES.APPROVED, hiddenReason: null, marriage: null } }
    );
  }
  if (doc.brideBiodata) {
    await Biodata.updateOne(
      { _id: doc.brideBiodata, hiddenReason: "MARRIED" },
      { $set: { status: BIODATA_STATUSES.APPROVED, hiddenReason: null, marriage: null } }
    );
  }

  await doc.deleteOne();
  return { id };
}
