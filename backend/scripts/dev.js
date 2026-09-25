/* eslint-disable no-console */
/**
 * Zero-install dev runner: starts an in-memory MongoDB (mongodb-memory-server),
 * seeds it, then boots the real API on PORT (default 5000).
 *
 * Usage:  node scripts/dev.js        (or)  npm run dev:memory
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log(`[dev] in-memory MongoDB ready at ${uri}`);

  process.env.MONGODB_URI = uri;

  // 1) seed
  const seed = spawn(process.execPath, ["scripts/seed.js"], {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env },
    stdio: "inherit",
  });
  const seedCode = await new Promise((resolve) => seed.on("exit", resolve));
  if (seedCode !== 0) {
    console.error("[dev] seeding failed — aborting");
    process.exit(1);
  }

  // 2) boot the real API in this process
  const { pathToFileURL } = await import("node:url");
  const serverPath = path.resolve(__dirname, "..", "src", "server.js");
  const { default: server } = await import(pathToFileURL(serverPath).href);
  return server;
}

main().catch((err) => {
  console.error("[dev] failed:", err);
  process.exit(1);
});