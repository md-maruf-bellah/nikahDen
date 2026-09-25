import { ApiError } from "../utils/ApiError.js";
import { hasPermission } from "../constants/index.js";

/**
 * authorize("ADMIN", "SUPERADMIN") — allow only listed roles.
 * Must run after `authenticate`.
 */
export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden("You do not have permission to access this resource."));
    }
    next();
  };
}

/**
 * requirePermission("biodata:approve") — permission based check.
 */
export function requirePermission(permission) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!hasPermission(req.user.role, permission)) {
      return next(
        ApiError.forbidden(
          `Missing required permission: ${permission}`,
          "MISSING_PERMISSION"
        )
      );
    }
    next();
  };
}

export default authorize;
