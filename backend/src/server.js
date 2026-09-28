import { createApp } from "./app.js";
import env from "./config/env.js";
import { connectDB } from "./config/db.js";
import { ensureOauthEventCapped } from "./models/oauthEvent.model.js";

async function bootstrap() {
  const app = createApp();

  await connectDB(env.MONGODB_URI);

  // OAuth ইভেন্ট-হিস্ট্রির capped collection আছে কি না নিশ্চিত করা
  try {
    await ensureOauthEventCapped();
  } catch (err) {
    console.warn("[server] oauth_events capped collection ensure failed:", err.message);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`[server] Nikah Deen API listening on http://localhost:${env.PORT}`);
    console.log(`[server] Environment: ${env.NODE_ENV}`);
    console.log(`[server] Health check: http://localhost:${env.PORT}/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n[server] ${signal} received — shutting down...`);
    server.close(async () => {
      try {
        const { mongoose } = await import("mongoose");
        await mongoose.disconnect();
      } finally {
        process.exit(0);
      }
    });
    // Force-exit if connections hang
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap().catch((err) => {
  console.error("[server] Failed to start:", err.message);
  process.exit(1);
});
