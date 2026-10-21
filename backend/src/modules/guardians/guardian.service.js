/**
 * Guardian/Family — সদস্যↅঅভিভাবক লিংক সার্ভিস।
 *
 * স্টেট-মেশিন:
 *   declare   → DECLARED + সাইনড one-time consent link (একবার ফেরত)
 *   exchange  → লিংক রিডিম করে অভিভাবকের নিজের guardian-session (একবার, 24h)
 *   consent   → DECLARED|CONSENTED → CONSENTED (অভিভাবকের guardian-session থেকে)
 *   verify    → CONSENTED → VERIFIED (একই guardian-session থেকে)
 *   consent/verify সদস্যের access-token দিয়ে নয় — authenticateGuardian আলাদা সিক্রেটে বাধা দেয়)
 *   revoke    → যেকোনো স্তর → REVOKED (সদস্য নিজে)
 *
 * সব লেখা-পথে notify (নোটিফিকেশনে SYSTEM টাইপ + real-time socket emit)।
 * রিং-অডিট প্রতি সংবেদনশীল মিউটেশনে রেকর্ড — UNLOCK/DELETE থেকে আলাদা অ্যাকশন,
 * admin-কর্তৃত্ব নয় বলে এখানে রেকর্ড করা হয় (সদস্য-ফেরতগুলোর অডিটও থাকায়)।
 */
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import env from "../../config/env.js";
import Guardian, { GUARDIAN_STATUSES, GUARDIAN_RELATIONS } from "../../models/guardian.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { isValidObjectId, hashToken, randomToken } from "../../utils/helpers.js";
import { USER_STATUSES } from "../../constants/index.js";
import { recordAdminAction } from "../admin/adminAudit.service.js";
import { notify } from "./guardian.notify.js";
import { teardownForGuardian } from "./guardianContactRequest.service.js";
import User from "../../models/user.model.js";

const ACTIVE_STATUSES = [GUARDIAN_STATUSES.DECLARED, GUARDIAN_STATUSES.CONSENTED, GUARDIAN_STATUSES.VERIFIED];

function toPublicLink(doc) {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    member: doc.member?._id?.toString() || doc.member?.toString(),
    name: doc.name,
    relation: doc.relation,
    contactPhone: doc.contactPhone,
    contactEmail: doc.contactEmail,
    status: doc.status,
    consentAt: doc.consentAt,
    consentChannel: doc.consentChannel,
    verifiedAt: doc.verifiedAt,
    revokedAt: doc.revokedAt,
    notes: doc.notes,
    createdAt: doc.createdAt,
  };
}

async function insistMemberActive(memberId) {
  const member = await User.findById(memberId).select("status").lean();
  if (!member) throw ApiError.notFound("Member not found", "USER_NOT_FOUND");
  if (member.status !== USER_STATUSES.ACTIVE) {
    throw ApiError.forbidden("Only active members can manage guardianship.", "ACCOUNT_INACTIVE");
  }
  return member;
}

/** সদস্য: অভিভাবক ঘোষণা — পুরনো REVOKED লিংক পেলে স্থাপনার নতুন রেকর্ড; অন্যথায় conflict। */
export async function declareGuardian(memberId, data) {
  if (!isValidObjectId(memberId)) throw ApiError.badRequest("Invalid member id", "INVALID_ID");
  await insistMemberActive(memberId);

  const existingActive = await Guardian.findOne({
    member: memberId,
    status: { $in: ACTIVE_STATUSES },
  });
  if (existingActive) {
    throw ApiError.conflict(
      "A guardianship link already exists. Revoke it before declaring a new guardian.",
      "GUARDIAN_LINK_EXISTS",
    );
  }

  const doc = await Guardian.create({
    member: memberId,
    name: data.name,
    relation: data.relation,
    contactPhone: data.contactPhone,
    contactEmail: data.contactEmail || "",
    status: GUARDIAN_STATUSES.DECLARED,
    consentChannel: data.consentChannel || "MANUAL",
    notes: data.notes || "",
  });

  // সাইনড এক-বার-ব্যবহার consent link — শুধু hash DB-তে, raw টোকেন একবার ফেরত
  const consentToken = jwt.sign(
    { type: "guardian-consent", jti: randomToken(8) },
    env.GUARDIAN_SESSION_SECRET,
    { subject: doc._id.toString(), expiresIn: env.GUARDIAN_LINK_EXPIRES_IN },
  );
  const decodedExp = jwt.decode(consentToken)?.exp;
  doc.consentLinkHash = hashToken(consentToken);
  doc.consentLinkIssuedAt = new Date();
  doc.consentLinkExpiresAt = decodedExp ? new Date(decodedExp * 1000) : null;
  await doc.save();

  await notify(
    memberId,
    "অভিভাবক ঘোষণা সম্পন্ন হয়েছে",
    `অভিভাবক "${doc.name}" (${doc.relation}) ঘোষিত হয়েছে। এক-বার-ব্যবহার consent link অভিভাবককে পাঠান।`,
    { kind: "guardian", id: doc._id.toString(), action: "declare" },
  );
  await recordAdminAction("GUARDIAN_DECLARE", { id: memberId, role: "USER" }, { id: doc._id.toString() });

  return {
    consentToken,
    consentLink: `${env.CLIENT_URL}/guardian/consent?token=${encodeURIComponent(consentToken)}`,
    ...toPublicLink(doc.toObject()),
  };
}

/**
 * অভিভাবক: consent link রিডিম → নিজের guardian-session (একবার-ব্যবহার লিংক)।
 * লিংক-সিক্রেট আলাদা — member access-token এখানে কাজ করে না, উল্টোটাও নয়।
 */
export async function exchangeConsentSession(token) {
  if (!token || typeof token !== "string") {
    throw ApiError.badRequest("Consent link token required.", "GUARDIAN_LINK_REQUIRED");
  }

  let payload;
  try {
    payload = jwt.verify(token, env.GUARDIAN_SESSION_SECRET);
  } catch (err) {
    if (err?.name === "TokenExpiredError") {
      throw new ApiError(410, "Consent link has expired. Ask the member to issue a new one.", "GUARDIAN_LINK_EXPIRED");
    }
    throw ApiError.unauthorized("Invalid consent link.", "GUARDIAN_LINK_INVALID");
  }
  if (payload?.type !== "guardian-consent") {
    throw ApiError.unauthorized("Invalid consent link.", "GUARDIAN_LINK_INVALID");
  }

  const doc = await Guardian.findById(payload.sub).select("+consentLinkHash");
  if (!doc) throw ApiError.unauthorized("Invalid consent link.", "GUARDIAN_LINK_INVALID");

  const now = new Date();
  if (doc.status === GUARDIAN_STATUSES.REVOKED) {
    throw new ApiError(410, "This guardianship was revoked.", "GUARDIAN_LINK_REVOKED");
  }
  if (doc.consentLinkUsedAt) {
    throw new ApiError(410, "Consent link already used.", "GUARDIAN_LINK_USED");
  }
  if (doc.status === GUARDIAN_STATUSES.VERIFIED) {
    throw ApiError.conflict("Guardianship already verified — no session needed.", "GUARDIAN_LINK_INACTIVE");
  }
  if (!doc.consentLinkExpiresAt || doc.consentLinkExpiresAt <= now) {
    throw new ApiError(410, "Consent link has expired. Ask the member to issue a new one.", "GUARDIAN_LINK_EXPIRED");
  }
  const presented = Buffer.from(hashToken(token));
  const stored = Buffer.from(doc.consentLinkHash || "");
  if (
    !doc.consentLinkHash ||
    presented.length !== stored.length ||
    !crypto.timingSafeEqual(presented, stored)
  ) {
    throw ApiError.unauthorized("Invalid consent link.", "GUARDIAN_LINK_INVALID");
  }

  // একবার-ব্যবহার — রিডিম করলেই লিংক মরে
  doc.consentLinkUsedAt = now;
  await doc.save();

  const guardianSession = jwt.sign(
    { type: "guardian-session", jti: randomToken(8) },
    env.GUARDIAN_SESSION_SECRET,
    { subject: doc._id.toString(), expiresIn: env.GUARDIAN_SESSION_EXPIRES_IN },
  );

  await notify(
    doc.member,
    "অভিভাবক consent লিংক খুলেছেন",
    `অভিভাবক "${doc.name}" আপনার পাঠানো consent link ব্যবহার করেছেন — consent/যাচাই তাঁর নিজের সেশনে সম্পন্ন হবে।`,
    { kind: "guardian", id: doc._id.toString(), action: "session" },
  );
  await recordAdminAction(
    "GUARDIAN_SESSION_OPENED",
    { id: doc._id.toString(), role: "GUARDIAN" },
    { id: doc.member.toString() },
  );

  return {
    guardianSession,
    expiresIn: env.GUARDIAN_SESSION_EXPIRES_IN,
    guardian: toPublicLink(doc.toObject()),
  };
}

/**
 * অভিভাবক consent — *অভিভাবকের guardian-session থেকে* (সদস্যের access-token নয়)।
 * DECLARED (প্রথম) বা CONSENTED (আপডেট) অবস্থায় পাওয়া যায়।
 */
export async function recordConsent(guardianCtx, data = {}) {
  if (!guardianCtx?.id || !isValidObjectId(guardianCtx.id)) {
    throw ApiError.unauthorized("Guardian session required.", "GUARDIAN_SESSION_REQUIRED");
  }
  const doc = await Guardian.findOne({
    _id: guardianCtx.id,
    status: { $in: [GUARDIAN_STATUSES.DECLARED, GUARDIAN_STATUSES.CONSENTED] },
  });
  if (!doc) throw ApiError.notFound("No guardianship link awaiting consent", "GUARDIAN_NOT_FOUND");

  doc.consentAt = new Date();
  doc.consentChannel = data.consentChannel || doc.consentChannel || "MANUAL";
  doc.status = GUARDIAN_STATUSES.CONSENTED;
  await doc.save();

  await notify(
    doc.member,
    "অভিভাবক consent রেকর্ড হয়েছে",
    `অভিভাবক "${doc.name}" নিজের সেশনে consent দিয়েছেন — এখন পরিচয় যাচাই সম্পন্ন করুন।`,
    { kind: "guardian", id: doc._id.toString(), action: "consent" },
  );
  await recordAdminAction(
    "GUARDIAN_CONSENT",
    { id: doc._id.toString(), role: "GUARDIAN" },
    { id: doc.member.toString() },
  );

  return toPublicLink(doc.toObject());
}

/**
 * অভিভাবক পরিচয় যাচাই — একই guardian-session থেকে CONSENTED → VERIFIED।
 * সেশন না থাকলে (মেম্বার টোকেনসহ) অনুমতি নেই — অভিভাবকের নিজের সেশনই প্রমাণ।
 */
export async function verifyGuardian(guardianCtx) {
  if (!guardianCtx?.id || !isValidObjectId(guardianCtx.id)) {
    throw ApiError.unauthorized("Guardian session required.", "GUARDIAN_SESSION_REQUIRED");
  }
  const doc = await Guardian.findOne({ _id: guardianCtx.id, status: GUARDIAN_STATUSES.CONSENTED });
  if (!doc) throw ApiError.notFound("No consented guardianship link to verify", "GUARDIAN_NOT_FOUND");

  doc.status = GUARDIAN_STATUSES.VERIFIED;
  doc.verifiedAt = new Date();
  await doc.save();

  await notify(
    doc.member,
    "অভিভাবক যাচাই সফল",
    `অভিভাবক "${doc.name}" পরিচয় যাচাই সম্পন্ন — সুরক্ষিত যোগাযোগ মেডিয়েশন সক্রিয়।`,
    { kind: "guardian", id: doc._id.toString(), action: "verify" },
  );
  await recordAdminAction(
    "GUARDIAN_VERIFY",
    { id: doc._id.toString(), role: "GUARDIAN" },
    { id: doc.member.toString() },
  );

  return toPublicLink(doc.toObject());
}

/** সদস্য: ঘোষণা বাতিল (যেকোনো স্তর থেকে) — রেভোক, টোকেন-প্লেট বাতিল। */
export async function revokeGuardian(memberId, actor, reason = "") {
  if (!isValidObjectId(memberId)) throw ApiError.badRequest("Invalid member id", "INVALID_ID");
  const doc = await Guardian.findOne({ member: memberId, status: { $in: ACTIVE_STATUSES } });
  if (!doc) throw ApiError.notFound("No active guardianship link to revoke", "GUARDIAN_NOT_FOUND");

  doc.status = GUARDIAN_STATUSES.REVOKED;
  doc.revokedAt = new Date();
  doc.revokedBy = actor?.id || memberId;
  if (reason) doc.notes = `${doc.notes ? `${doc.notes} | ` : ""}revoked: ${reason}`.slice(0, 1000);
  // লিংক-প্লেট বাতিল — পুরনো consent link আর exchange/consent-এ চলে না;
  // guardian-session-ও পরবর্তী রিকোয়েস্টে status=REVOKED দেখে বাতিল হবে
  doc.consentLinkHash = null;
  doc.consentLinkUsedAt = doc.consentLinkUsedAt || new Date();
  await doc.save();

  // গার্ডিয়ান-টু-গার্ডিয়ান চ্যানেল ভাঙা — এই লিংক জড়িত সকল সক্রিয় contact-request TEARDOWN
  await teardownForGuardian(doc, { id: actor?.id || memberId, role: actor?.role || "USER" }, reason || "guardianship revoked");

  await notify(
    memberId,
    "অভিভাবক ঘোষণা বাতিল",
    `অভিভাবক "${doc.name}" ঘোষণা বাতিল হয়েছে।${reason ? ` কারণ: ${reason}` : ""}`,
    { kind: "guardian", id: doc._id.toString(), action: "revoke" },
  );
  await recordAdminAction("GUARDIAN_REVOKE", { id: memberId, role: actor?.role || "USER" }, { id: doc._id.toString() });

  return toPublicLink(doc.toObject());
}

/** সদস্য: সক্রিয় অভিভাবক-লিংক পড়া */
export async function getMyGuardian(memberId) {
  if (!isValidObjectId(memberId)) throw ApiError.badRequest("Invalid member id", "INVALID_ID");
  const doc = await Guardian.findOne({ member: memberId, status: { $in: ACTIVE_STATUSES } });
  return toPublicLink(doc?.toObject());
}
