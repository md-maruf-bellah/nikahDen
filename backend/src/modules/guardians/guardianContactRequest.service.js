/**
 * Guardian-to-Guardian contact request — গেট, approval state machine, teardown।
 *
 * গেট (create-এ এবং approve/contact-read-এ *আবার*, live যাচাই):
 *   1. দুই সদস্যের মধ্যে mutual like/match (messagingGuard-এর isMatchBetween)
 *   2. উভয় সদস্যের গার্ডিয়ান-লিংক বর্তমানে VERIFIED
 *   3. কোনো একদিকেরও block নেই (silent wall — assertNotBlockedBetween)
 * গেট ভাঙলে snapshot-এ ভরসা নয় — প্রতিটি transition-এ live re-verify:
 * একদিকের গার্ডিয়ানই revoke হলে (revoke-হুক না চললেও) approve আটকে যায়,
 * আর APPROVED চ্যানেলের contact-read-ও বন্ধ হয়।
 *
 * State machine:
 *   PENDING  → APPROVED (প্রাপক-সদস্য approve; চ্যানেল খোলে)
 *   PENDING  → DENIED   (প্রাপক-সদস্য deny; আবার অনুরোধ চলে)
 *   PENDING|APPROVED → TEARDOWN (যেকোনো পক্ষের গার্ডিয়ান revoke/unverify)
 *
 * Contact exchange শুধু APPROVED ও বর্তমানে উভয় লিংক VERIFIED থাকলে;
 * প্রতিটি transition-এ SYSTEM নোটিফিকেশন (emit + socket) ও capped-অডিট।
 */
import GuardianContactRequest, { CONTACT_REQUEST_STATUSES } from "../../models/guardianContactRequest.model.js";
import Guardian, { GUARDIAN_STATUSES } from "../../models/guardian.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { isValidObjectId } from "../../utils/helpers.js";
import { recordAdminAction } from "../admin/adminAudit.service.js";
import { notify } from "./guardian.notify.js";
import env from "../../config/env.js";
import { CONNECT_TYPES } from "../../constants/index.js";
import { deductConnectOnce } from "../membership/connect.service.js";

const OPEN_STATUSES = [CONTACT_REQUEST_STATUSES.PENDING, CONTACT_REQUEST_STATUSES.APPROVED];

// ---------------------------------------------------------------------------
// গেট — live re-verify প্রতি transition-এ
// ---------------------------------------------------------------------------

async function mutualMatch(a, b) {
  // messagingGuard-এর isMatchBetween এক-দিক পরীক্ষা করে; mutual হলে উভয় দিকে
  // isMutual:true বসে তাই এক-দিক যথেষ্ট — তবু দুই-দিকে যাচাই করে symmetry নিশ্চিত করি
  const { isMatchBetween } = await import("../messages/messagingGuard.service.js");
  const [ab, ba] = await Promise.all([isMatchBetween(a, b), isMatchBetween(b, a)]);
  return ab || ba;
}

async function verifiedGuardianOf(memberId) {
  return Guardian.findOne({ member: memberId, status: GUARDIAN_STATUSES.VERIFIED });
}

/**
 * গেট যাচাই — ম্যাচ + উভয় VERIFIED গার্ডিয়ান + block-মুক্ত।
 * @throws 403 GUARDIAN_CONTACT_NO_MATCH / GUARDIAN_CONTACT_NOT_VERIFIED / BLOCKED
 */
export async function assertContactGate(requesterId, targetId) {
  const [matched, reqGuardian, tgtGuardian] = await Promise.all([
    mutualMatch(requesterId, targetId),
    verifiedGuardianOf(requesterId),
    verifiedGuardianOf(targetId),
  ]);
  if (!matched) {
    throw ApiError.forbidden(
      "Guardian contact requests require a mutual match between the two members.",
      "GUARDIAN_CONTACT_NO_MATCH",
    );
  }
  if (!reqGuardian || !tgtGuardian) {
    throw ApiError.forbidden(
      "Both members must have a VERIFIED guardianship before guardian-to-guardian contact is possible.",
      "GUARDIAN_CONTACT_NOT_VERIFIED",
    );
  }

  const { assertNotBlockedBetween } = await import("../blocks/block.service.js");
  await assertNotBlockedBetween(requesterId, targetId);

  return { reqGuardian, tgtGuardian };
}

// ---------------------------------------------------------------------------
// Public shape
// ---------------------------------------------------------------------------

function toPublicRequest(doc, { reqG, tgtG }) {
  const d = doc.toObject ? doc.toObject() : doc;
  const expose = contactExposed(d.status, reqG, tgtG);
  const guardian = (g) =>
    expose && g
      ? { name: g.name, relation: g.relation, contactPhone: g.contactPhone, contactEmail: g.contactEmail }
      : null;
  return {
    id: d._id.toString(),
    requesterMember: d.requesterMember?.toString(),
    targetMember: d.targetMember?.toString(),
    status: d.status,
    matchedAt: d.matchedAt,
    respondedAt: d.respondedAt,
    denialReason: d.denialReason,
    tornDownAt: d.tornDownAt,
    teardownReason: d.teardownReason,
    createdAt: d.createdAt,
    // শুধু APPROVED + বর্তমানে উভয় লিংক VERIFIED → contact exchange প্রকাশিত
    requesterGuardianContact: guardian(reqG),
    targetGuardianContact: guardian(tgtG),
  };
}

/** APPROVED হলেও live VERIFIED-যাচাই ফেলে গেলে contact ফাঁস হয় না। */
function contactExposed(status, reqG, tgtG) {
  return (
    status === CONTACT_REQUEST_STATUSES.APPROVED &&
    reqG?.status === GUARDIAN_STATUSES.VERIFIED &&
    tgtG?.status === GUARDIAN_STATUSES.VERIFIED
  );
}

async function hydrate(doc) {
  const [reqG, tgtG] = await Promise.all([
    Guardian.findById(doc.requesterGuardian),
    Guardian.findById(doc.targetGuardian),
  ]);
  return toPublicRequest(doc, { reqG, tgtG });
}

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

/** অনুরোধকারী সদস্য: ম্যাচ + উভয় VERIFIED গেট পাসে PENDING অনুরোধ খোলে। */
export async function createContactRequest(requesterId, targetMemberId) {
  if (!isValidObjectId(requesterId)) throw ApiError.badRequest("Invalid member id", "INVALID_ID");
  if (!isValidObjectId(targetMemberId)) throw ApiError.badRequest("Invalid target member id", "INVALID_ID");
  if (requesterId === targetMemberId) {
    throw ApiError.badRequest("You cannot open a guardian contact request with yourself.", "GUARDIAN_CONTACT_SELF");
  }

  const { reqGuardian, tgtGuardian } = await assertContactGate(requesterId, targetMemberId);

  // বিপরীত দিকেও সক্রিয় অনুরোধ নেই (unordered pair — service-স্তরে যাচাই)
  const existing = await GuardianContactRequest.findOne({
    $or: [
      { requesterMember: requesterId, targetMember: targetMemberId },
      { requesterMember: targetMemberId, targetMember: requesterId },
    ],
    status: { $in: OPEN_STATUSES },
  });
  if (existing) {
    throw ApiError.conflict(
      "An open guardian contact request already exists between these members.",
      "GUARDIAN_CONTACT_EXISTS",
    );
  }

  // Guardian-connection হলো আলাদা configurable billable action (ডিফল্ট 0 = ফ্রি,
  // আগের আচরণ অপরিবর্তিত)। GUARDIAN_REQUEST লেজারে দরিদ্র অবস্থায় 403।
  const cost = env.GUARDIAN_REQUEST_COST;
  if (cost > 0) {
    const charge = await deductConnectOnce({
      userId: requesterId,
      type: CONNECT_TYPES.GUARDIAN_REQUEST,
      amount: cost,
      reason: "Guardian-to-guardian contact request",
    });
    if (charge === null) {
      throw ApiError.forbidden(
        "You need connects to open a guardian contact request. Buy a membership plan or a connect pack.",
        "CONNECTS_INSUFFICIENT"
      );
    }
  }

  const doc = await GuardianContactRequest.create({
    requesterMember: requesterId,
    targetMember: targetMemberId,
    requesterGuardian: reqGuardian._id,
    targetGuardian: tgtGuardian._id,
    status: CONTACT_REQUEST_STATUSES.PENDING,
    matchedAt: new Date(),
  });

  await notify(
    targetMemberId,
    "অভিভাবকদের মধ্যে যোগাযোগের অনুরোধ",
    `আপনার ম্যাচের অন্য পক্ষের অভিভাবক আপনার অভিভাবকের সাথে যোগাযোগ চাইছেন — অনুমোদন বা প্রত্যাখ্যান করুন।`,
    { kind: "guardianContact", id: doc._id.toString(), action: "request" },
  );
  await recordAdminAction(
    "GUARDIAN_CONTACT_REQUEST",
    { id: requesterId, role: "USER" },
    { id: doc._id.toString() },
  );

  return hydrate(doc);
}

/** প্রাপক-সদস্য: PENDING → APPROVED (live re-verify ফেলে গেলে আটকে যায়)। */
export async function approveContactRequest(actorId, requestId) {
  const { doc, reqG, tgtG } = await loadForActor(actorId, requestId);
  if (doc.status !== CONTACT_REQUEST_STATUSES.PENDING) {
    throw ApiError.conflict("This request is not awaiting approval.", "GUARDIAN_CONTACT_INVALID_STATE");
  }

  // live re-verify — একদিকের গার্ডিয়ান revoke হলে approve চলে না
  await assertContactGate(doc.requesterMember.toString(), doc.targetMember.toString());

  doc.status = CONTACT_REQUEST_STATUSES.APPROVED;
  doc.respondedBy = actorId;
  doc.respondedAt = new Date();
  await doc.save();

  await notify(
    doc.requesterMember,
    "অভিভাবক যোগাযোগ অনুমোদিত",
    `প্রাপক পক্ষের অভিভাবক যোগাযোগের অনুরোধ অনুমোদন করেছেন — এখন দুই অভিভাবকের যোগাযোগ তথ্য পারস্পরিকভাবে দৃশ্যমান।`,
    { kind: "guardianContact", id: doc._id.toString(), action: "approve" },
  );
  await recordAdminAction(
    "GUARDIAN_CONTACT_APPROVE",
    { id: actorId, role: "USER" },
    { id: doc._id.toString() },
  );

  return hydrate(doc);
}

/** প্রাপক-সদস্য: PENDING → DENIED (পরে নতুন অনুরোধ চলে)। */
export async function denyContactRequest(actorId, requestId, reason = "") {
  const { doc } = await loadForActor(actorId, requestId);
  if (doc.status !== CONTACT_REQUEST_STATUSES.PENDING) {
    throw ApiError.conflict("This request is no longer pending.", "GUARDIAN_CONTACT_INVALID_STATE");
  }

  doc.status = CONTACT_REQUEST_STATUSES.DENIED;
  doc.respondedBy = actorId;
  doc.respondedAt = new Date();
  doc.denialReason = reason || "";
  await doc.save();

  await notify(
    doc.requesterMember,
    "অভিভাবক যোগাযোগ অনুরোধ প্রত্যাখ্যাত",
    `প্রাপক পক্ষের অভিভাবক যোগাযোগের অনুরোধ প্রত্যাখ্যান করেছেন।${reason ? ` কারণ: ${reason}` : ""}`,
    { kind: "guardianContact", id: doc._id.toString(), action: "deny" },
  );
  await recordAdminAction(
    "GUARDIAN_CONTACT_DENY",
    { id: actorId, role: "USER" },
    { id: doc._id.toString() },
  );

  return hydrate(doc);
}

/** সদস্য: নিজের জড়িত সব অনুরোধ (পাঠানো + পাওয়া) — contact শুধু live-যাচাইপরে প্রকাশিত। */
export async function listContactRequests(memberId) {
  if (!isValidObjectId(memberId)) throw ApiError.badRequest("Invalid member id", "INVALID_ID");
  const docs = await GuardianContactRequest.find({
    $or: [{ requesterMember: memberId }, { targetMember: memberId }],
  }).sort({ createdAt: -1 });

  const out = [];
  for (const doc of docs) out.push(await hydrate(doc));
  return out;
}

/** শুধু প্রাপক-সদস্য পড়তে/অনুমোদন করতে পারে; 404 অন্যের জন্য (যেন বিদ্যমানতা ফাঁস না যায়)। */
async function loadForActor(actorId, requestId) {
  if (!isValidObjectId(requestId)) throw ApiError.badRequest("Invalid request id", "INVALID_ID");
  const doc = await GuardianContactRequest.findById(requestId);
  if (!doc || doc.targetMember.toString() !== actorId) {
    throw ApiError.notFound("Guardian contact request not found", "GUARDIAN_CONTACT_NOT_FOUND");
  }
  const [reqG, tgtG] = await Promise.all([
    Guardian.findById(doc.requesterGuardian),
    Guardian.findById(doc.targetGuardian),
  ]);
  return { doc, reqG, tgtG };
}

/**
 * Revoke-হুক থেকে কল হয় — এই গার্ডিয়ান-লিংক জড়িত সব সক্রিয় (PENDING|APPROVED)
 * অনুরোধ TEARDOWN: চ্যানেল ভেঙে ফেলা, দুই পক্ষের নোটিফিকেশন + অডিট।
 */
export async function teardownForGuardian(guardianDoc, actor, reason = "") {
  if (!guardianDoc?._id) return 0;
  const gid = guardianDoc._id;

  const affected = await GuardianContactRequest.find({
    $or: [{ requesterGuardian: gid }, { targetGuardian: gid }],
    status: { $in: OPEN_STATUSES },
  });
  if (!affected.length) return 0;

  for (const doc of affected) {
    doc.status = CONTACT_REQUEST_STATUSES.TEARDOWN;
    doc.tornDownAt = new Date();
    doc.tornDownBy = actor?.id || doc.targetMember;
    doc.teardownReason = reason || "guardianship revoked";
    await doc.save();

    for (const userId of new Set([doc.requesterMember.toString(), doc.targetMember.toString()])) {
      await notify(
        userId,
        "অভিভাবক যোগাযোগ চ্যানেল বন্ধ",
        `একজন অভিভাবকের গার্ডিয়ান-লিংক বাতিল হওয়ায় অভিভাবকদের যোগাযোগ চ্যানেল বন্ধ হয়েছে।${reason ? ` কারণ: ${reason}` : ""}`,
        { kind: "guardianContact", id: doc._id.toString(), action: "teardown" },
      );
    }
    await recordAdminAction(
      "GUARDIAN_CONTACT_TEARDOWN",
      { id: actor?.id || doc.targetMember, role: actor?.role || "USER" },
      { id: doc._id.toString() },
    );
  }
  return affected.length;
}

export default {
  assertContactGate,
  createContactRequest,
  approveContactRequest,
  denyContactRequest,
  listContactRequests,
  teardownForGuardian,
};
