/**
 * Forgot-password UI rules — the pure logic behind /email (Step 1) and
 * /reset (Steps 2-3), so mismatch/weak-password/format behaviour is verified
 * without a browser.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isValidEmail,
  validateResetForm,
  forgotErrorMessage,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from "../src/lib/passwordReset.core.mjs";

describe("passwordReset core — Step 1 email format", () => {
  it("accepts ordinary addresses", () => {
    assert.equal(isValidEmail("rahim@example.com"), true);
    assert.equal(isValidEmail("  user.name+tag@nikahdeen.dev  "), true);
  });

  it("rejects missing, malformed and empty addresses", () => {
    assert.equal(isValidEmail("not-an-email"), false);
    assert.equal(isValidEmail("no-at-sign.com"), false);
    assert.equal(isValidEmail("user@nodot"), false);
    assert.equal(isValidEmail("two @signs.com"), false);
    assert.equal(isValidEmail(""), false);
    assert.equal(isValidEmail("   "), false);
    assert.equal(isValidEmail(undefined), false);
    assert.equal(isValidEmail(`${"a".repeat(110)}@example.com`), false);
  });

  it("trims surrounding whitespace", () => {
    assert.equal(isValidEmail("  rahim@example.com "), true);
  });
});

describe("passwordReset core — Step 2 form validation", () => {
  it("accepts a strong, matching pair", () => {
    const out = validateResetForm("ResetMe123", "ResetMe123");
    assert.deepEqual(out, { valid: true, errors: {} });
    assert.equal(Object.keys(out.errors).length, 0);
  });

  it("flags a short password as weak", () => {
    const out = validateResetForm("Ab1", "Ab1");
    assert.equal(out.valid, false);
    assert.ok(out.errors.password);
    // The length rule, not the mismatch rule (copy uses the Bengali numeral).
    assert.match(out.errors.password, /কমপক্ষে/);
    assert.equal(out.errors.confirm, undefined);
  });

  it("rejects passwords without a letter or without a number", () => {
    assert.ok(validateResetForm("abcdefghij", "abcdefghij").errors.password);
    assert.ok(validateResetForm("1234567890", "1234567890").errors.password);
  });

  it("enforces the backend maximum length", () => {
    const long = "a1".repeat(PASSWORD_MAX_LENGTH); // 144 > 72
    assert.ok(validateResetForm(long, long).errors.password);
  });

  it("reports password mismatch", () => {
    const out = validateResetForm("ResetMe123", "ResetMe124");
    assert.equal(out.valid, false);
    assert.equal(out.errors.confirm, "দুটি পাসওয়ার্ড মিলছে না");
    assert.equal(out.errors.password, undefined);
  });

  it("reports both problems when a short password also mismatches", () => {
    const out = validateResetForm("short", "shorter");
    assert.equal(out.valid, false);
    assert.ok(out.errors.password);
    assert.ok(out.errors.confirm);
  });

  it("treats empty fields as invalid rather than valid", () => {
    assert.equal(validateResetForm("", "").valid, false);
    assert.equal(validateResetForm(undefined, undefined).valid, false);
  });

  it("applies the exact minimum length from the shared constant", () => {
    const pad = "a1b2c3d4e5f6";
    const below = pad.slice(0, PASSWORD_MIN_LENGTH - 1);
    const atMin = pad.slice(0, PASSWORD_MIN_LENGTH);
    assert.equal(validateResetForm(below, below).valid, false);
    assert.equal(validateResetForm(atMin, atMin).valid, true);
  });
});

describe("passwordReset core — Step 1 error copy", () => {
  it("shows the exact server message for an unregistered email", () => {
    const err = { errorCode: "EMAIL_NOT_FOUND", message: "No account found with this email address." };
    assert.equal(forgotErrorMessage(err), "No account found with this email address.");
  });

  it("surfaces a missing/failed email service verbatim", () => {
    const err = { errorCode: "EMAIL_NOT_CONFIGURED", message: "Email service is not configured." };
    assert.equal(forgotErrorMessage(err), "Email service is not configured.");
    const failed = { errorCode: "EMAIL_DELIVERY_FAILED", message: "The reset email could not be sent." };
    assert.equal(forgotErrorMessage(failed), "The reset email could not be sent.");
  });

  it("translates validation and rate-limit errors", () => {
    assert.equal(forgotErrorMessage({ errorCode: "VALIDATION_ERROR", message: "Validation failed" }), "সঠিক ই-মেইল লিখুন।");
    assert.match(forgotErrorMessage({ errorCode: "RATE_LIMITED", message: "Too many" }), /অনেকবার/);
  });

  it("falls back for unknown/network errors and never shows raw API noise", () => {
    assert.equal(forgotErrorMessage({ errorCode: "NETWORK_ERROR", message: "Request failed (0)" }), "অনুরোধ পাঠানো যায়নি। আবার চেষ্টা করুন।");
    assert.equal(forgotErrorMessage(undefined), "অনুরোধ পাঠানো যায়নি। আবার চেষ্টা করুন।");
    assert.equal(forgotErrorMessage(null, "fallback"), "fallback");
  });
});
