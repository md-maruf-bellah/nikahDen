import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import multer from "multer";
import env from "../config/env.js";

const UPLOAD_ROOT = path.resolve(process.cwd(), env.UPLOAD_DIR);

export function ensureUploadDirs() {
  for (const dir of ["avatar", "biodata"]) {
    fs.mkdirSync(path.join(UPLOAD_ROOT, dir), { recursive: true });
  }
}

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

function makeStorage(subDir) {
  return multer.diskStorage({
    destination(_req, _file, cb) {
      const dir = path.join(UPLOAD_ROOT, subDir);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(_req, file, cb) {
      const ext = path.extname(file.originalname || "").toLowerCase();
      const safe = ALLOWED_EXT.has(ext) ? ext : ".jpg";
      const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${safe}`;
      cb(null, name);
    },
  });
}

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (ALLOWED_EXT.has(ext)) return cb(null, true);
  const err = new Error("Only .jpg, .jpeg, .png and .webp images are allowed");
  err.code = "INVALID_FILE_TYPE";
  cb(err);
}

export const uploadAvatar = multer({
  storage: makeStorage("avatar"),
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter,
}).single("avatar");

export const uploadBiodataPhoto = multer({
  storage: makeStorage("biodata"),
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter,
}).single("photo");

/** Relative URL from the multer file, e.g. /uploads/biodata/123.jpg */
export function toPublicUrl(file) {
  if (!file) return null;
  const rel = path.relative(UPLOAD_ROOT, file.path).split(path.sep).join("/");
  return `/uploads/${rel}`;
}

export { UPLOAD_ROOT };
