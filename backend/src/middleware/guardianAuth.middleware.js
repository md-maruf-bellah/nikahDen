/**
 * Guardian-session authentication — অভিভাবকের নিজের সেশন।
 *
 * consent link রিডিম করে ইস্যু হওয়া JWT (GUARDIAN_SESSION_SECRET, type: guardian-session)
 * যাচাই করে req.guardian = { id, memberId, name, relation, status } বসায়।
 *
 * সদস্যের access-token এখানে চলে না (ভিন্ন সিক্রেট + ভিন্ন type) — ঠিক তাই
 * consent/verify সদস্যের সেশন থেকে রেকর্ড করা যায় না। উল্টোটাও নয়:
 * guardian-session দিয়ে member-route-এ যাওয়া যায় না।
 *
 * revoke হলেই সেশন মরে — প্রতিটি রিকোয়েস্টে live status যাচাই হয়।
 */
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import Guardian, { GUARDIAN_STATUSES } from "../models/guardian.model.js";
import { ApiError } from "../utils/ApiError.js";

function extractGuardianToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return null;
}

export async function authenticateGuardian(req, _res, next) {
  try {
    const token = extractGuardianToken(req);
    if (!token) {
      throw ApiError.unauthorized("Guardian session required.", "GUARDIAN_SESSION_REQUIRED");
    }

    let payload;
    try {
      payload = jwt.verify(token, env.GUARDIAN_SESSION_SECRET);
    } catch (err) {
      if (err?.name === "TokenExpiredError") {
        throw ApiError.unauthorized("Guardian session expired. Open the consent link again.", "GUARDIAN_SESSION_EXPIRED");
      }
      // সদস্যের access-tokenসহ যেকোনো অন্য টোকেন — guardian session নয়
      throw ApiError.unauthorized("Guardian session required.", "GUARDIAN_SESSION_REQUIRED");
    }

    if (payload.type !== "guardian-session") {
      throw ApiError.unauthorized("Guardian session required.", "GUARDIAN_SESSION_REQUIRED");
    }

    const guardian = await Guardian.findById(payload.sub).lean();
    if (!guardian) {
      throw ApiError.unauthorized("Guardian session no longer exists.", "GUARDIAN_SESSION_INVALID");
    }
    if (guardian.status === GUARDIAN_STATUSES.REVOKED) {
      throw ApiError.unauthorized("Guardianship was revoked — session is no longer valid.", "GUARDIAN_SESSION_REVOKED");
    }

    req.guardian = {
      id: guardian._id.toString(),
      memberId: guardian.member.toString(),
      name: guardian.name,
      relation: guardian.relation,
      status: guardian.status,
    };
    next();
  } catch (err) {
    next(err);
  }
}

export default authenticateGuardian;
