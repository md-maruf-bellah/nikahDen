import crypto from "node:crypto";
import mongoose from "mongoose";

/** sha256 hex digest (used for refresh/reset tokens stored in DB). */
export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

export function randomCode(len = 6) {
  const max = Math.pow(10, len);
  return crypto.randomInt(0, max).toString().padStart(len, "0");
}

/** True when value is a valid ObjectId string. */
export function isValidObjectId(value) {
  return mongoose.isValidObjectId(value);
}

export function toObjectId(value) {
  return new mongoose.Types.ObjectId(value);
}

/** Number of full years between now and a date. */
export function ageFrom(dateOfBirth, now = new Date()) {
  if (!dateOfBirth) return undefined;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return undefined;
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age < 0 ? 0 : age;
}

/** Safe parseInt that returns null on garbage. */
export function toInt(value) {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

export function pick(obj, keys) {
  const out = {};
  for (const key of keys) {
    if (obj?.[key] !== undefined) out[key] = obj[key];
  }
  return out;
}

export default { hashToken, randomToken, randomCode, isValidObjectId, ageFrom, toInt, pick };
