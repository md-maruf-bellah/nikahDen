/**
 * OAuth handoff — Mongo-backed কি না লাইভ প্রমাণ:
 *   ১) এক প্রসেসে (A) handoff কোড তৈরি
 *   ২) সম্পূর্ণ আলাদা প্রসেসে (B) সেটি consume — মানে শেয়ারড স্টোরে আছে
 *   ৩) A-তে তৈরি কোড B-তে দ্বিতীয়বার consume ব্যর্থ (one-time)
 *
 * চালানো: node scripts/verify-oauth-handoff.js
 * লাইভ সার্ভারে হাত দেয় না — শুধু Mongo-তে oauthhandoffs collection ব্যবহার করে।
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const WORKER = `
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import OauthHandoff from "./src/models/oauthHandoff.model.js";
import { createHandoffCode, consumeHandoffCode } from "./src/modules/auth/oauth.service.js";

const mode = process.argv[1];
await mongoose.connect(process.env.MONGODB_URI);
if (mode === "create") {
  const code = await createHandoffCode({ accessToken: "live-check", refreshToken: "r", user: { id: "live-user" } });
  console.log("CODE:" + code);
} else if (mode === "consume") {
  try {
    const s = await consumeHandoffCode(process.argv[2]);
    console.log("CONSUMED:" + JSON.stringify(s.user));
  } catch (e) {
    console.log("REJECTED:" + (e.errorCode || e.message));
  }
}
await mongoose.disconnect();
`;

async function runWorker(mode, arg) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, ["--input-type=module", "-e", WORKER, mode, arg].filter(Boolean), {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (out += d));
    p.on("close", (c) => (c === 0 ? resolve(out.trim()) : reject(new Error(out.slice(-500)))));
  });
}

const lines = [];
function log(s) { lines.push(s); console.log(s); }

try {
  // ১) প্রসেস A — তৈরি
  const a = await runWorker("create");
  const code = (a.split("\n").find((l) => l.startsWith("CODE:")) || "").slice(5);
  if (!code) throw new Error("worker A did not produce a code:\n" + a);
  log("1) create (process A): code=" + code.slice(0, 10) + "…");

  // ২) প্রসেস B — ভোগ (আলাদা প্রসেস, শেয়ারড Mongo থেকে)
  const b = await runWorker("consume", code);
  const consumed = b.split("\n").find((l) => l.startsWith("CONSUMED:"));
  if (!consumed) throw new Error("worker B could not consume:\n" + b);
  log("2) consume (process B, separate process): " + consumed.slice(9) + " ✓ cross-process");

  // ৩) one-time — আবার দ্বিতীয় প্রসেসে consume ব্যর্থ হওয়াই দরকার
  const c = await runWorker("consume", code);
  const rejected = c.split("\n").find((l) => l.startsWith("REJECTED:"));
  const ok3 = rejected && /OAUTH_CODE_INVALID/.test(rejected);
  log("3) second consume (process C): " + (rejected || "?") + (ok3 ? " ✓ one-time enforced" : " ✗"));
  if (!ok3) throw new Error("one-time consumption NOT enforced");

  log("\nসब প্রমাণিত: handoff Mongo-তে — restart-safe, multi-instance-safe, one-time safe।");
  process.exit(0);
} catch (e) {
  console.error("FAILED:", e.message);
  process.exit(1);
}
