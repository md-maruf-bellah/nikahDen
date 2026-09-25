/**
 * Operational error carrying an HTTP status + machine readable errorCode.
 */
export class ApiError extends Error {
  constructor(statusCode, message, errorCode = "INTERNAL_ERROR", details = undefined) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message, errorCode = "BAD_REQUEST", details) {
    return new ApiError(400, message, errorCode, details);
  }

  static unauthorized(message = "Authentication required", errorCode = "UNAUTHORIZED") {
    return new ApiError(401, message, errorCode);
  }

  static forbidden(message = "You do not have permission to perform this action", errorCode = "FORBIDDEN") {
    return new ApiError(403, message, errorCode);
  }

  static notFound(message = "Resource not found", errorCode = "NOT_FOUND") {
    return new ApiError(404, message, errorCode);
  }

  static conflict(message, errorCode = "CONFLICT") {
    return new ApiError(409, message, errorCode);
  }

  static unprocessable(message, errorCode = "UNPROCESSABLE_ENTITY", details) {
    return new ApiError(422, message, errorCode, details);
  }

  static tooMany(message = "Too many requests, please slow down", errorCode = "RATE_LIMITED") {
    return new ApiError(429, message, errorCode);
  }
}
