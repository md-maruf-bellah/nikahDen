import nodemailer from "nodemailer";
import env from "../config/env.js";

let transporter = null;

function getTransporter() {
  if (!env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

/**
 * True when a real mail path exists: either SMTP is configured, or the test
 * outbox (below) is switched on. Used to fail loudly BEFORE creating a
 * password-reset token, so an undeliverable mail never leaves a live token
 * behind.
 */
export function isMailConfigured() {
  return Boolean(env.SMTP_HOST) || outboxEnabled();
}

// ---------------------------------------------------------------------------
// Test outbox — NOT a delivery channel.
//
// Tests set MAIL_OUTBOX=1 to capture an outgoing mail in memory instead of
// sending it, so a test can follow the emailed reset link end-to-end. It is
// opt-in via process.env (evaluated per call, so a test can toggle it),
// never written to any log, and never reachable in production: the raw reset
// token must not appear in server logs.
// ---------------------------------------------------------------------------
const outbox = [];

const outboxEnabled = () => process.env.MAIL_OUTBOX === "1";

/** Removes and returns everything captured since the last call (tests only). */
export function takeOutbox() {
  return outbox.splice(0, outbox.length);
}

/**
 * Sends an email through SMTP.
 *
 * Never logs the message body — reset mails contain a single-use raw token,
 * and spec forbids exposing reset tokens in logs. Without SMTP the mail is
 * skipped and reported as `{ delivered: false, dev: true }` so the caller can
 * surface a clear "email service is not configured" error instead of silently
 * bypassing verification.
 *
 * @returns {Promise<{delivered: boolean, dev: boolean}>}
 */
export async function sendMail({ to, subject, text, html }) {
  if (outboxEnabled()) {
    outbox.push({ to, subject, text: text ?? "", html: html ?? null, at: new Date() });
    return { delivered: true, dev: false };
  }

  const t = getTransporter();
  if (!t) {
    console.warn(`[mail] SMTP not configured — message to <${to}> ("${subject}") was NOT sent.`);
    return { delivered: false, dev: true };
  }

  try {
    await t.sendMail({ from: env.MAIL_FROM, to, subject, text, html });
    return { delivered: true, dev: false };
  } catch (err) {
    console.error("[mail] send failed:", err.message);
    return { delivered: false, dev: false };
  }
}

export default sendMail;
