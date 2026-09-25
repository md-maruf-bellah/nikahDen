export const corsOptions = {
  origin(origin, callback) {
    // Allow same-origin / non-browser requests (curl, supertest, servers).
    if (!origin) return callback(null, true);

    const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  maxAge: 86400,
};
