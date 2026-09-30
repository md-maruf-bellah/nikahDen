import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import env from "../../config/env.js";
import User from "../../models/user.model.js";
import RefreshToken from "../../models/refreshToken.model.js";
import ResetToken from "../../models/resetToken.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { hashToken, randomToken } from "../../utils/helpers.js";
import sendMail from "../../utils/emailer.js";
import { ROLES, USER_STATUSES } from "../../constants/index.js";

const ACCESS = "access";
const REFRESH = "refresh";

export function signAccessToken(user) {
  return jwt.sign(
    { type: ACCESS, role: user.role, jti: randomToken(8) },
    env.JWT_ACCESS_SECRET,
    {
      subject: user.id || user._id.toString(),
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    },
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { type: REFRESH, role: user.role, jti: randomToken(8) },
    env.JWT_REFRESH_SECRET,
    {
      subject: user.id || user._id.toString(),
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
  );
}

function refreshExpiryDate() {
  // ms approximation of the JWT expiry for DB-side invalidation.
  const map = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  const raw = env.JWT_REFRESH_EXPIRES_IN;
  const match = /^(\d+)([dhms])$/.exec(raw);
  if (!match) return new Date(Date.now() + 7 * 86400000);
  return new Date(Date.now() + Number(match[1]) * map[match[2]]);
}

async function persistRefreshToken(userId, rawToken, meta = {}) {
  return RefreshToken.create({
    user: userId,
    tokenHash: hashToken(rawToken),
    expiresAt: refreshExpiryDate(),
    userAgent: (meta.userAgent || "").slice(0, 300),
    ip: (meta.ip || "").slice(0, 60),
  });
}

async function revokeRefreshToken(rawToken) {
  await RefreshToken.updateOne(
    { tokenHash: hashToken(rawToken), revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

export async function revokeAllUserTokens(userId) {
  await RefreshToken.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };
}

export async function issueSession(user, meta = {}) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await persistRefreshToken(user._id, refreshToken, meta);
  return { accessToken, refreshToken, user: publicUser(user) };
}

export async function registerUser(data, meta = {}) {
  const exists = await User.findOne({ email: data.email.toLowerCase() }).lean();
  if (exists) {
    throw ApiError.conflict(
      "An account with this email already exists. Please login instead.",
      "EMAIL_ALREADY_REGISTERED",
    );
  }

  const user = await User.create({
    firstName: data.firstName,
    lastName: data.lastName || "",
    email: data.email,
    phone: data.phone || "",
    passwordHash: data.password, // pre-save hook hashes it
    role: ROLES.USER,
    status: USER_STATUSES.ACTIVE,
  });

  return issueSession(user, meta);
}

export async function loginUser({ email, password }, meta = {}) {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+passwordHash",
  );
  if (!user) {
    throw ApiError.unauthorized(
      "Incorrect email or password.",
      "INVALID_CREDENTIALS",
    );
  }
  const ok = await user.comparePassword(password);
  if (!ok) {
    throw ApiError.unauthorized(
      "Incorrect email or password.",
      "INVALID_CREDENTIALS",
    );
  }
  if (
    user.status === USER_STATUSES.INACTIVE ||
    user.status === USER_STATUSES.PENDING
  ) {
    throw ApiError.forbidden(
      "Your account is not active yet. Please contact support.",
      "ACCOUNT_INACTIVE",
    );
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  return issueSession(user, meta);
}

export async function refreshSession(rawRefreshToken, meta = {}) {
  if (!rawRefreshToken) {
    throw ApiError.unauthorized(
      "Refresh token missing.",
      "INVALID_REFRESH_TOKEN",
    );
  }

  const stored = await RefreshToken.findOne({
    tokenHash: hashToken(rawRefreshToken),
  });
  if (!stored || stored.revokedAt) {
    // রোটেশনের পরপরই পুরনো টোকেন আবার এলে সেটি reuse-attack নয় —
    // একই রিফ্রেশ-টোকেনে একসাথে ফায়ার হওয়া কনকারেন্ট রিকোয়েস্টের বেনাইন রেস
    // (একাধিক ট্যাব, পেজ-লোড বার্স্ট, বা সার্ভার রিস্টার্টের পর সব API কল
    // একসাথে 401 খেয়ে স্ট্যাম্পিড রিফ্রেশ)। গ্রেস-উইন্ডোর ভেতরে একই
    // নতুন পেয়ার ফেরত দিলে সবাই বেঁচে যায়; শেয়ার্ড single-flight
    // জাভাস্ক্রিপ্ট এক-পেজে সাধারণত এটাই আটকায়, এটা শেষ সেফটি-জাল।
    if (
      stored?.revokedAt &&
      stored.replacedBy &&
      Date.now() - stored.revokedAt.getTime() <= env.REFRESH_REUSE_GRACE_SECONDS * 1000
    ) {
      const successor = await RefreshToken.findOne({ tokenHash: stored.replacedBy, revokedAt: null });
      if (successor && successor.expiresAt > new Date()) {
        const user = await User.findById(successor.user);
        if (user && user.status === USER_STATUSES.ACTIVE) {
          return {
            accessToken: signAccessToken(user),
            refreshToken: undefined,
            user: publicUser(user),
          };
        }
      }
    }
    // গ্রেস-শেষে replay = আসল token reuse: পুরো session family রিভোক
    // (হাইজ্যাক-ডিটেকশন অক্ষত থাকে)।
    if (stored?.user) await revokeAllUserTokens(stored.user);
    throw ApiError.unauthorized(
      "Refresh token is invalid or has been used already.",
      "INVALID_REFRESH_TOKEN",
    );
  }
  if (stored.expiresAt < new Date()) {
    await revokeRefreshToken(rawRefreshToken);
    throw ApiError.unauthorized(
      "Refresh token has expired. Please login again.",
      "REFRESH_EXPIRED",
    );
  }

  let payload;
  try {
    payload = jwt.verify(rawRefreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw ApiError.unauthorized(
      "Refresh token is invalid.",
      "INVALID_REFRESH_TOKEN",
    );
  }

  const user = await User.findById(payload.sub);
  if (!user || user.status !== USER_STATUSES.ACTIVE) {
    throw ApiError.forbidden("Account is not active.", "ACCOUNT_INACTIVE");
  }

  // Rotate: revoke this one, issue a fresh pair.
  await RefreshToken.updateOne(
    { _id: stored._id },
    { $set: { revokedAt: new Date(), replacedBy: null } },
  );
  const accessToken = signAccessToken(user);
  const newRefresh = signRefreshToken(user);
  const next = await persistRefreshToken(user._id, newRefresh, meta);
  await RefreshToken.updateOne(
    { _id: stored._id },
    { $set: { replacedBy: next.tokenHash } },
  );

  return { accessToken, refreshToken: newRefresh, user: publicUser(user) };
}

export async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found", "USER_NOT_FOUND");
  return publicUser(user);
}

export async function logoutSession(rawRefreshToken) {
  if (rawRefreshToken) await revokeRefreshToken(rawRefreshToken);
  return { success: true };
}

export async function changeUserPassword(
  userId,
  { currentPassword, newPassword },
) {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw ApiError.notFound("User not found", "USER_NOT_FOUND");

  const ok = await user.comparePassword(currentPassword);
  if (!ok) {
    throw ApiError.badRequest(
      "Current password is incorrect.",
      "INVALID_CURRENT_PASSWORD",
    );
  }
  if (await user.comparePassword(newPassword)) {
    throw ApiError.badRequest(
      "New password must be different from the current password.",
      "SAME_PASSWORD",
    );
  }

  user.passwordHash = newPassword; // pre-save hook re-hashes
  await user.save();

  // Force re-login on other devices.
  await revokeAllUserTokens(userId);
  return { success: true };
}

export async function forgotUserPassword(email) {
  const user = await User.findOne({ email: email.toLowerCase() });
  // Always succeed to avoid leaking which emails exist.
  if (!user) return { delivered: false, dev: true };

  await ResetToken.deleteMany({
    user: user._id,
    purpose: "PASSWORD_RESET",
    usedAt: null,
  });

  const rawToken = randomToken(32);
  await ResetToken.create({
    user: user._id,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    purpose: "PASSWORD_RESET",
  });

  const resetUrl = `${env.CLIENT_URL}/reset?token=${rawToken}`;
  return sendMail({
    to: user.email,
    subject: "Reset your Nikah Deen password",
    text: `We received a request to reset your password.\n\nClick the link below (valid 30 minutes):\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`,
  });
}

export async function resetUserPassword(token, newPassword) {
  const doc = await ResetToken.findOne({ tokenHash: hashToken(token) });
  if (!doc || doc.usedAt) {
    throw ApiError.badRequest(
      "This reset link is invalid or has already been used.",
      "INVALID_RESET_TOKEN",
    );
  }
  if (doc.expiresAt < new Date()) {
    throw ApiError.badRequest(
      "This reset link has expired. Please request a new one.",
      "RESET_TOKEN_EXPIRED",
    );
  }

  const user = await User.findById(doc.user);
  if (!user) throw ApiError.notFound("User not found", "USER_NOT_FOUND");

  user.passwordHash = newPassword;
  await user.save();

  doc.usedAt = new Date();
  await doc.save();

  await revokeAllUserTokens(user._id);
  return { success: true };
}

/** Crypto helper used by tests to forge tampered tokens. */
export function forgeToken(payload, secret, opts = {}) {
  return jwt.sign(payload, secret, opts);
}
