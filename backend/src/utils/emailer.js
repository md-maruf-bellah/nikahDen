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
 * Sends an email when SMTP is configured. In development without SMTP the
 * message is printed to the console so flows (e.g. reset password) stay
 * testable. Returns true when "sent" (logged), false when skipped entirely.
 */
export async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[mail][dev, no SMTP] To: ${to} | Subject: ${subject}\n${text ?? ""}`);
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
