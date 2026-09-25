import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { USER_STATUSES } from "../constants/index.js";

const UNAUTHORIZED = () =>
  ApiError.unauthorized("Invalid or expired token. Please login again.", "INVALID_TOKEN");

/** Extract bearer token or httpOnly cookie. */
function extractToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return req.cookies?.[env.ACCESS_COOKIE_NAME] || null;
}

/**
 * Required authentication. Attaches req.user = { id, role, email, status }.
 */
export async function authenticate(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw UNAUTHORIZED();

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err?.name === "TokenExpiredError") {
        throw ApiError.unauthorized("Your session has expired. Please login again.", "TOKEN_EXPIRED");
      }
      throw UNAUTHORIZED();
    }

    const user = await User.findById(payload.sub).select("role email firstName lastName status avatar phone").lean();
    if (!user) throw ApiError.unauthorized("Account no longer exists.", "USER_NOT_FOUND");

    if (user.status === USER_STATUSES.INACTIVE || user.status === USER_STATUSES.PENDING) {
      throw ApiError.forbidden(
        "Your account is not active. Contact support or wait for admin approval.",
        "ACCOUNT_INACTIVE"
      );
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      status: user.status,
      name: `${user.firstName} ${user.lastName}`.trim(),
    };
    next();
  } catch (err) {
    next(err);
  }
}

/** Authenticate when a token is present, but never reject (public routes). */
export async function optionalAuth(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) return next();

    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const user = await User.findById(payload.sub).select("role email status").lean();
    if (user && user.status === USER_STATUSES.ACTIVE) {
      req.user = {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
        status: user.status,
      };
    }
    next();
  } catch {
    next(); // invalid/expired token on a public route => treat as anonymous
  }
}

export default authenticate;
