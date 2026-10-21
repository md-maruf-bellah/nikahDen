/**
 * Forgot-password flow — pure decisions shared by /email (Step 1) and /reset
 * (Steps 2-3). No React and no fetch here, so node:test can verify the rules
 * the UI shows: email format, weak/mismatched passwords, and which server
 * errors are safe to surface verbatim.
 *
 * Backend rules mirrored from backend/src/modules/auth/auth.validation.js
 * (zod): 8..72 chars, at least one letter and one number.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

/** Step 1 — email format, same shape the backend zod schema accepts. */
export function isValidEmail(value) {
  const v = (value ?? "").trim();
  if (!v || v.length > 120) return false;
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
}

/**
 * Step 2 — the two-field form. Order matters: the mismatch check runs against
 * whatever was typed, so a short password reports both problems rather than
 * claiming the passwords merely "don't match".
 */
export function validateResetForm(password, confirm) {
  const pwd = password ?? "";
  const conf = confirm ?? "";
  const errors = {};

  if (pwd.length < PASSWORD_MIN_LENGTH) {
    errors.password = "কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড দিন";
  } else if (pwd.length > PASSWORD_MAX_LENGTH) {
    errors.password = "সর্বোচ্চ ৭২ অক্ষর দিতে পারেন";
  } else if (!/[a-zA-Z]/.test(pwd)) {
    errors.password = "পাসওয়ার্ডে অন্তত একটি অক্ষর থাকতে হবে";
  } else if (!/[0-9]/.test(pwd)) {
    errors.password = "পাসওয়ার্ডে অন্তত একটি সংখ্যা থাকতে হবে";
  }

  if (conf !== pwd) errors.confirm = "দুটি পাসওয়ার্ড মিলছে না";

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Step 1 — which failure text to show.
 *
 * The exact server strings are shown for the answers the user is entitled to
 * ("No account found with this email address." and a clearly-reported missing
 * email service); everything else falls back to Bengali copy so network and
 * rate-limit noise never surfaces raw API text.
 */
export function forgotErrorMessage(err, fallback = "অনুরোধ পাঠানো যায়নি। আবার চেষ্টা করুন।") {
  switch (err?.errorCode) {
    case "EMAIL_NOT_FOUND":
    case "EMAIL_NOT_CONFIGURED":
    case "EMAIL_DELIVERY_FAILED":
      return err.message || fallback;
    case "VALIDATION_ERROR":
      return "সঠিক ই-মেইল লিখুন।";
    case "RATE_LIMITED":
      return "অনেকবার চেষ্টা করা হয়েছে — কিছুক্ষণ পরে আবার চেষ্টা করুন।";
    default:
      return fallback;
  }
}
