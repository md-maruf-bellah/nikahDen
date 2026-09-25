/**
 * Standard API success envelope used by every controller:
 *   { success, message, data, pagination? }
 * Controllers return { message, data } and controllersApi middleware wraps it,
 * or handlers call sendSuccess directly via ApiResponse.
 */
export class ApiResponse {
  constructor(success, message, data = null, pagination = undefined) {
    this.success = success;
    this.message = message;
    this.data = data;
    if (pagination) this.pagination = pagination;
  }

  static success(message, data = null, pagination = undefined) {
    return new ApiResponse(true, message, data, pagination);
  }
}

/** Express helper: res.success(...) */
export function sendSuccess(res, message, data = null, pagination = undefined, status = 200) {
  const body = { success: true, message, data };
  if (pagination) body.pagination = pagination;
  return res.status(status).json(body);
}
