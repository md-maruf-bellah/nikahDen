import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { corsOptions } from "./config/cors.js";
import env from "./config/env.js";
import { apiLimiter } from "./middleware/rateLimiter.middleware.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import { ensureUploadDirs, UPLOAD_ROOT } from "./middleware/upload.middleware.js";
import routes from "./routes/index.js";

export function createApp() {
  const app = express();

  // trust the first proxy (set NODE_ENV=production behind nginx/reverse proxy)
  if (env.IS_PROD) app.set("trust proxy", 1);

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // CORS (allow the Next.js frontend)
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // dev request logger
  if (!env.IS_PROD) {
    app.use((req, _res, next) => {
      console.log(`[req] ${req.method} ${req.originalUrl}`);
      next();
    });
  }

  // Global rate limit on /api
  app.use("/api", apiLimiter);

  ensureUploadDirs();
  // Serve uploaded images locally (/uploads/...)
  app.use("/uploads", express.static(path.resolve(UPLOAD_ROOT), { maxAge: "7d" }));

  // API routes
  app.use(routes);

  // Central 404 + error handler
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
