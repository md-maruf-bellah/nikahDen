import mongoose from "mongoose";

export async function connectDB(uri, { serverSelectionTimeoutMS = 10000 } = {}) {
  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => {
    console.log(`[db] MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  });
  mongoose.connection.on("error", (err) => {
    console.error("[db] MongoDB connection error:", err.message);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("[db] MongoDB disconnected");
  });

  await mongoose.connect(uri, { serverSelectionTimeoutMS });

  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

/**
 * Runs `work(session)` inside a MongoDB transaction.
 *
 * Transactions require a replica set (Atlas M0+ and any production cluster
 * qualify; for local development see README section "Local MongoDB setup").
 * On a standalone mongod, transactions are unsupported, so we transparently
 * fall back to running `work(null)` without a transaction.
 */
function transactionsUnsupported(err) {
  return /Transaction numbers are only allowed on a replica set/i.test(err?.message || "") ||
    err?.codeName === "IllegalOperation" ||
    err?.code === 20;
}

export async function withTransaction(work) {
  const session = await mongoose.startSession();
  try {
    try {
      let result;
      await session.withTransaction(async () => {
        result = await work(session);
      });
      return result;
    } catch (err) {
      if (transactionsUnsupported(err)) {
        console.warn("[db] Transactions unavailable (standalone mongod) — running without a transaction.");
        return work(null);
      }
      throw err;
    }
  } finally {
    session.endSession();
  }
}

export default { connectDB, disconnectDB, withTransaction };
