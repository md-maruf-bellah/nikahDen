import { ApiError } from "../utils/ApiError.js";

/**
 * validate(schema, "body" | "query" | "params")
 * Parses the target source with zod; on success replaces req[source] with the
 * parsed (defaulted/coerced) value.
 */
export function validate(schema, source = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const first = result.error.issues[0];
      const details = result.error.issues.map((i) => ({
        field: i.path.join(".") || source,
        message: i.message,
      }));
      return next(
        ApiError.badRequest(first?.message || "Validation failed", "VALIDATION_ERROR", details)
      );
    }
    req[source] = result.data;
    next();
  };
}

export default validate;
