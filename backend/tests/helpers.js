/**
 * Test bootstrap shared by every test file:
 *   - boots an in-memory MongoDB (mongodb-memory-server)
 *   - starts the real Express app (no network port)
 *   - seeds the models' indexes + a SUPERADMIN fixture
 *
 * Importing this file has no side effects — call start() from a test file's
 * before hook.
 */
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { connectDB } from "../src/config/db.js";

import "../src/models/user.model.js";
import "../src/models/refreshToken.model.js";
import "../src/models/resetToken.model.js";
import "../src/models/biodata.model.js";
import "../src/models/counter.model.js";
import "../src/models/membershipPlan.model.js";
import "../src/models/connectPack.model.js";
import "../src/models/subscription.model.js";
import "../src/models/connectTransaction.model.js";
import "../src/models/order.model.js";
import "../src/models/coupon.model.js";
import "../src/models/like.model.js";
import "../src/models/notification.model.js";
import "../src/models/conversation.model.js";
import "../src/models/message.model.js";
import "../src/models/contactMessage.model.js";

let mongod = null;
let appInstance = null;
let transactionsEnabled = false;

export async function startServer({ transactions = true } = {}) {
  if (appInstance) return { request: request(appInstance), app: appInstance, transactionsEnabled };

  // Prefer a replica set so the tests exercise real MongoDB transactions.
  // Some platforms (Windows hosts, CI) can't reach the auto-initiated member,
  // so probe it and gracefully fall back to a standalone mongod — the app's
  // withTransaction() helper transparently falls back too.
  if (transactions) {
    try {
      mongod = await MongoMemoryServer.create({ instance: { replSet: "rs0" } });
      const uri = mongod.getUri("nikahdeen_test");
      try {
        await connectDB(uri, { serverSelectionTimeoutMS: 4000 });
        transactionsEnabled = true;
      } catch (probeErr) {
        await mongoose.disconnect().catch(() => {});
        await mongod.stop();
        console.warn("[tests] replSet unreachable, using standalone mongod:", probeErr.message);
        mongod = await MongoMemoryServer.create();
      }
    } catch (err) {
      console.warn("[tests] replSet unavailable, using standalone mongod:", err.message);
      if (mongod) await mongod.stop().catch(() => {});
      mongod = await MongoMemoryServer.create();
    }
  } else {
    mongod = await MongoMemoryServer.create();
    transactionsEnabled = false;
  }

  if (mongoose.connection.readyState !== 1) {
    const uri = mongod.getUri("nikahdeen_test");
    await connectDB(uri, { serverSelectionTimeoutMS: 30000 });
  }

  // Raise rate limits for the test run, then build the app (limiters read env
  // at import time, so the dynamic import must happen after the change).
  process.env.RATE_LIMIT_MAX = "100000";
  process.env.AUTH_RATE_LIMIT_MAX = "100000";
  process.env.CONTACT_RATE_LIMIT_MAX = "100000";
  const { createApp } = await import("../src/app.js");
  appInstance = createApp();

  // Deterministic indexes (unique constraints used heavily in assertions).
  for (const name of mongoose.modelNames()) {
    await mongoose.model(name).init();
  }

  return { request: request(appInstance), app: appInstance, transactionsEnabled };
}

export async function stopServer() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (mongod) await mongod.stop();
  mongod = null;
  appInstance = null;
}

export async function clearDb() {
  const { db } = mongoose.connection;
  const collections = await db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Registers a plain USER via the real API. */
export async function registerUser(requestObj, overrides = {}) {
  const res = await requestObj.post("/api/v1/auth/register").send({
    firstName: "Test",
    lastName: "Member",
    email: `member-${Date.now()}-${Math.floor(Math.random() * 10000)}@test.dev`,
    password: "Passw0rd!",
    ...overrides,
  });
  if (res.status !== 201) {
    throw new Error(`registerUser fixture failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data;
}

export const superAdmin = {
  firstName: "Root",
  lastName: "Admin",
  email: "root@nikahdeen.dev",
  password: "Admin@12345",
};

export async function createSuperAdmin() {
  const User = mongoose.model("User");
  return User.create({
    firstName: superAdmin.firstName,
    lastName: superAdmin.lastName,
    email: superAdmin.email,
    passwordHash: superAdmin.password,
    role: "SUPERADMIN",
    status: "ACTIVE",
  });
}

export async function login(requestObj, email, password) {
  const res = await requestObj.post("/api/v1/auth/login").send({ email, password });
  if (res.status !== 200) {
    throw new Error(`login fixture failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data;
}

/** Admin-create a staff/member and return tokens via a direct login. */
export async function createStaff(requestObj, { role = "ADMIN", email, password = "Admin@12345" } = {}) {
  const root = await login(requestObj, superAdmin.email, superAdmin.password);
  const res = await requestObj
    .post("/api/v1/users")
    .set("Authorization", `Bearer ${root.accessToken}`)
    .send({ firstName: "Staff", lastName: role, email: email || `staff-${Date.now()}@test.dev`, password, role });
  if (res.status !== 201) throw new Error(`createStaff failed: ${JSON.stringify(res.body)}`);
  return login(requestObj, res.body.data.email, password);
}

export function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function approveAllBiodatas() {
  const Biodata = mongoose.model("Biodata");
  await Biodata.updateMany({ status: "PENDING" }, { $set: { status: "APPROVED", approvedAt: new Date() } });
}

export default { startServer, stopServer, clearDb, registerUser, login, createSuperAdmin, createStaff, auth };
