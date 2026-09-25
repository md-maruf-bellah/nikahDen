import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

/** 404 handler for unmatched routes. */
export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`, "ROUTE_NOT_FOUND"));
}

function normalizeError(err) {
  // zod validation errors from validate middleware
  if (err?.name === "ZodError") {
    return ApiError.badRequest("Validation failed", "VALIDATION_ERROR", err.issues?.map((i) => ({
      field: i.path?.join("."),
      message: i.message,
    })));
  }

  if (err instanceof ApiError) return err;

  // Invalid MongoDB ObjectId
  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for "${err.path}"`, "INVALID_ID");
  }

  // Mongoose schema validation
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiError.badRequest("Validation failed", "SCHEMA_VALIDATION_ERROR", details);
  }

  // Duplicate key (unique index)
  if (err?.code === 11000 || err?.name === "MongoServerError" && err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return ApiError.conflict(
      `A record with that ${field} already exists`,
      "DUPLICATE_ENTRY",
      { field }
    );
  }

  // Multer upload errors
  if (err?.name === "MulterError" || err?.code === "INVALID_FILE_TYPE") {
    const map = {
      LIMIT_FILE_SIZE: "File is too large. Maximum size is 2MB.",
      LIMIT_FILE_COUNT: "Too many files uploaded.",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field.",
      INVALID_FILE_TYPE: err.message || "Invalid image type. Use JPG, PNG or WEBP.",
    };
    return ApiError.badRequest(map[err.code] || err.message, "UPLOAD_ERROR");
  }

  return err;
}

/**
 * Central error handler — the only place that turns thrown errors into JSON.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  const normalized = normalizeError(err);
  const status = normalized.statusCode || 500;

  if (status >= 500) {
    console.error("[error]", err);
  }

  const body = {
    success: false,
    message: normalized.message || "Internal server error",
  };
  if (normalized.errorCode) body.errorCode = normalized.errorCode;
  if (normalized.details && !res.headersSent) body.details = normalized.details;

  if (status >= 500 && !body.errorCode) body.errorCode = "INTERNAL_ERROR";
  // Never leak stack traces / internals.
  return res.status(status).json(body);
}

export default errorHandler;
