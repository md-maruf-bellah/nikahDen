import dotenv from "dotenv";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";

const requiredInProd = [
  "MONGODB_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
];

if (isProd) {
  const missing = requiredInProd.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables in production: ${missing.join(", ")}`);
    process.exit(1);
  }
}

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PROD: isProd,

  PORT: parseInt(process.env.PORT || "5000", 10),

  MONGODB_URI:
    process.env.MONGODB_URI ||
    (isProd ? "" : "mongodb://127.0.0.1:27017/nikahdeen_dev"),

  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",

  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-me-in-production",
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",

  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me-in-production",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  // রোটেশনের পর এই সেকেন্ডের ভেতরে পুরনো refresh token আবার এলে সেটি
  // আক্রমণ নয় — কনকারেন্ট ট্যাব/রিস্টার্ট-পরবর্তী বেনাইন রেস ধরা হয়
  // (রিফ্রেশ-স্ট্যাম্পিডে ফ্যামিলি-রিভোকে লগইন মারা যায় না)। গ্রেস শেষে
  // replay মানেই আসল reuse — পুরো session family রিভোক।
  REFRESH_REUSE_GRACE_SECONDS: parseInt(process.env.REFRESH_REUSE_GRACE_SECONDS || "60", 10),

  ACCESS_COOKIE_NAME: "nikahdeen_access",
  REFRESH_COOKIE_NAME: "nikahdeen_refresh",

  // Tokens are returned in the JSON body by default. Set to "true" to ALSO
  // store them in httpOnly cookies (needed when the frontend cannot keep
  // tokens in JS, e.g. server-rendered pages).
  USE_COOKIES: process.env.USE_COOKIES === "true",

  // Cost (in connects) for a member to view another member's biodata.
  VIEW_CONNECT_COST: parseInt(process.env.VIEW_CONNECT_COST || "1", 10),

  // In-memory / local uploads folder. Swap for S3/Cloudinary in production.
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",

  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "15", 10) * 60 * 1000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || "300", 10),
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX || "20", 10),

  SMTP_HOST: process.env.SMTP_HOST || "",

  // ------------------------------------------------------------------
  // OAuth (Google / Facebook)। কনফিগার না থাকলে সংশ্লিষ্ট প্রোভাইডারের
  // বাটন frontend-এ নিষ্ক্রিয় থাকে এবং ব্যাকএন্ড 503 দেয় — ক্র্যাশ নয়।
  // ------------------------------------------------------------------
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || "",
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || "",

  // OAuth এন্ডপয়েন্টের নিজস্ব রেট-লিমিট (প্রতি ১৫ মিনিটে, প্রতি IP + path)
  OAUTH_RATE_LIMIT_MAX: parseInt(process.env.OAUTH_RATE_LIMIT_MAX || "10", 10),

  // OAuth fail2ban — window-এ এত ব্যর্থ চেষ্টা হলে IP ব্লক (start/callback/exchange সব)
  OAUTH_FAILURE_LIMIT: parseInt(process.env.OAUTH_FAILURE_LIMIT || "5", 10),
  OAUTH_FAILURE_WINDOW_MS: parseInt(process.env.OAUTH_FAILURE_WINDOW_MS || "900000", 10),
  OAUTH_FAILURE_BLOCK_MS: parseInt(process.env.OAUTH_FAILURE_BLOCK_MS || "900000", 10),

  oauthEnabled(provider) {
    if (provider === "google") return Boolean(this.GOOGLE_CLIENT_ID && this.GOOGLE_CLIENT_SECRET);
    if (provider === "facebook") return Boolean(this.FACEBOOK_APP_ID && this.FACEBOOK_APP_SECRET);
    return false;
  },
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  MAIL_FROM: process.env.MAIL_FROM || "Nikah Deen <no-reply@nikahdeen.local>",
};

export default env;
