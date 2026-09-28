/**
 * OAuth (Google / Facebook) — নির্ভরতাহীন বাস্তবায়ন (fetch দিয়ে টোকেন এক্সচেঞ্জ)।
 *
 * ফ্লো: /auth/oauth/:provider/start → প্রোভাইডারে (state + redirect_uri সহ)
 *      → প্রোভাইডার /auth/oauth/:provider/callback?code&state
 *      → কোড এক্সচেঞ্জ → প্রোফাইল → ইউজার আপসার্ট → আমাদের JWT issue
 *      → সংক্ষিপ্ত একবার-ব্যবহারযোগ্য কোডে frontend /auth/callback?code=...-এ রিডাইরেক্ট।
 *
 * নোট: টোকেন URL-এ যায় না; ৬০ সেকেন্ডে মেয়াদোত্তীর্ণ একক-ব্যবহার কোড হয়,
 * আর state HMAC-স্বাক্ষরিত (CSRF প্রতিরোধ)।
 */
import crypto from "node:crypto";
import env from "../../config/env.js";
import User from "../../models/user.model.js";
import RefreshToken from "../../models/refreshToken.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ROLES, USER_STATUSES } from "../../constants/index.js";
import { issueSession } from "./auth.service.js";

const OAUTH_TIMEOUT_MS = 8000;

export const PROVIDERS = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "openid email profile",
  },
  facebook: {
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    scope: "email public_profile",
  },
};

export function providerConfigured(provider) {
  return env.oauthEnabled(provider);
}

function assertProvider(provider) {
  if (!PROVIDERS[provider]) throw ApiError.notFound("Unknown OAuth provider", "OAUTH_PROVIDER_UNKNOWN");
  if (!providerConfigured(provider)) {
    throw new ApiError(503, `${provider} login is not configured on this server.`, "OAUTH_NOT_CONFIGURED");
  }
}

// ---------------------------------------------------------------------------
// Redirect URIs & state
// ---------------------------------------------------------------------------

export function callbackUrl(provider) {
  const base = `${env.CLIENT_URL.replace(/\/$/, "")}`;
  // ব্যাকএন্ড API-এর বাইরে থাকলে API origin ব্যবহার করা উচিত; ডিফল্টে একই host:5000
  const apiOrigin = process.env.OAUTH_API_ORIGIN || base.replace(":3000", ":5000");
  return `${apiOrigin}/api/v1/auth/oauth/${provider}/callback`;
}

const STATE_TTL_MS = 10 * 60 * 1000;

function signState(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", env.JWT_ACCESS_SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verifyState(state) {
  if (!state || typeof state !== "string" || !state.includes(".")) {
    throw ApiError.badRequest("Invalid OAuth state", "OAUTH_STATE_INVALID");
  }
  const [body, sig] = state.split(".");
  const expect = crypto.createHmac("sha256", env.JWT_ACCESS_SECRET).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw ApiError.badRequest("Invalid OAuth state", "OAUTH_STATE_INVALID");
  }
  const payload = JSON.parse(Buffer.from(body, "base64url").toString());
  if (Date.now() - payload.t > STATE_TTL_MS) {
    throw ApiError.badRequest("OAuth state expired — try again.", "OAUTH_STATE_EXPIRED");
  }
  return payload;
}

export { verifyState };

/** test helper */
export function handoffMapForTests() { return handoff; }

export function buildAuthUrl(provider) {
  assertProvider(provider);
  const conf = PROVIDERS[provider];
  const state = signState({ provider, t: Date.now(), nonce: crypto.randomBytes(8).toString("hex") });
  const params = new URLSearchParams({
    client_id: provider === "google" ? env.GOOGLE_CLIENT_ID : env.FACEBOOK_APP_ID,
    redirect_uri: callbackUrl(provider),
    response_type: "code",
    scope: conf.scope,
    state,
  });
  if (provider === "google") {
    params.set("access_type", "online");
    params.set("prompt", "select_account");
  }
  return { url: `${conf.authUrl}?${params.toString()}`, state };
}

// ---------------------------------------------------------------------------
// Code exchange + profile
// ---------------------------------------------------------------------------

async function exchangeCode(provider, code) {
  const conf = PROVIDERS[provider];
  const body = new URLSearchParams({
    client_id: provider === "google" ? env.GOOGLE_CLIENT_ID : env.FACEBOOK_APP_ID,
    client_secret: provider === "google" ? env.GOOGLE_CLIENT_SECRET : env.FACEBOOK_APP_SECRET,
    code,
    redirect_uri: callbackUrl(provider),
    grant_type: "authorization_code",
  });
  const res = await fetch(conf.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
    signal: AbortSignal.timeout(OAUTH_TIMEOUT_MS),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw ApiError.badRequest(
      `Provider rejected the login (${json.error || res.status}).`,
      "OAUTH_EXCHANGE_FAILED",
    );
  }
  return json;
}

async function fetchProfile(provider, accessToken) {
  if (provider === "google") {
    const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(OAUTH_TIMEOUT_MS),
    });
    if (!res.ok) throw ApiError.badRequest("Could not read Google profile.", "OAUTH_PROFILE_FAILED");
    const p = await res.json();
    return { providerId: p.sub, email: p.email, emailVerified: p.email_verified !== false, firstName: p.given_name || p.name || "Google", lastName: p.family_name || "", avatar: p.picture || null };
  }
  // facebook
  const res = await fetch(
    `https://graph.facebook.com/v19.0/me?fields=id,name,email,picture.width(256).height(256)&access_token=${encodeURIComponent(accessToken)}`,
    { signal: AbortSignal.timeout(OAUTH_TIMEOUT_MS) },
  );
  if (!res.ok) throw ApiError.badRequest("Could not read Facebook profile.", "OAUTH_PROFILE_FAILED");
  const p = await res.json();
  const nameParts = (p.name || "Facebook User").split(" ");
  return {
    providerId: p.id,
    email: p.email || null,
    emailVerified: Boolean(p.email),
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(" "),
    avatar: p.picture?.data?.url || null,
  };
}

// ---------------------------------------------------------------------------
// Upsert / linking
// ---------------------------------------------------------------------------

function randomPasswordlessSecret() {
  // বায়োডাটার passwordHash required — OAuth ইউজারের জন্য অজানা র‍্যান্ডম মান।
  return crypto.randomBytes(32).toString("hex") + crypto.randomBytes(16).toString("hex");
}

export async function upsertOAuthUser(provider, profile) {
  const idField = provider === "google" ? "googleId" : "facebookId";

  // ১) আগে এই প্রোভাইডার-আইডিতে কেউ আছে কি না
  let user = await User.findOne({ [idField]: profile.providerId });

  // ২) একই ইমেইলে লোকাল অ্যাকাউন্ট থাকলে লিংক করে দিই (একই মানুষ, একই অ্যাকাউন্ট)
  if (!user && profile.email) {
    user = await User.findOne({ email: profile.email.toLowerCase() });
    if (user) {
      user[idField] = profile.providerId;
      user.authProvider = user.authProvider === "local" ? provider : user.authProvider;
      if (!user.avatar && profile.avatar) user.avatar = profile.avatar;
      await user.save({ validateBeforeSave: false });
      return user;
    }
  }

  // ৩) নতুন অ্যাকাউন্ট — email না পেলে (Facebook deny) এগোনো অসম্ভব
  if (!user) {
    if (!profile.email) {
      throw ApiError.badRequest(
        "আপনার ইমেইল অ্যাক্সেস অনুমোদন করা হয়নি। ইমেইল শেয়ার করে আবার চেষ্টা করুন।",
        "OAUTH_EMAIL_REQUIRED",
      );
    }
    user = await User.create({
      firstName: profile.firstName.slice(0, 100),
      lastName: (profile.lastName || "").slice(0, 100),
      email: profile.email.toLowerCase(),
      passwordHash: randomPasswordlessSecret(), // pre-save hook হ্যাশ করে
      role: ROLES.USER,
      status: USER_STATUSES.ACTIVE,
      avatar: profile.avatar,
      [idField]: profile.providerId,
      authProvider: provider,
    });
  }

  return user;
}

// ---------------------------------------------------------------------------
// One-time handoff code (backend → frontend without tokens in URL)
// ---------------------------------------------------------------------------

const handoff = new Map(); // code → { session, expiresAt }

export function createHandoffCode(session) {
  const code = crypto.randomBytes(24).toString("base64url");
  handoff.set(code, { session, expiresAt: Date.now() + 60_000 });
  if (handoff.size > 500) {
    // পুরনোগুলো ঝাড়ু
    const now = Date.now();
    for (const [k, v] of handoff) if (v.expiresAt < now) handoff.delete(k);
  }
  return code;
}

export function consumeHandoffCode(code) {
  const entry = handoff.get(code);
  if (!entry) throw ApiError.badRequest("Login code invalid or already used.", "OAUTH_CODE_INVALID");
  handoff.delete(code);
  if (entry.expiresAt < Date.now()) {
    throw ApiError.badRequest("Login code expired — please login again.", "OAUTH_CODE_EXPIRED");
  }
  return entry.session;
}

export async function completeOAuthLogin(provider, code) {
  assertProvider(provider);
  const tokenJson = await exchangeCode(provider, code);
  const profile = await fetchProfile(provider, tokenJson.access_token);
  const user = await upsertOAuthUser(provider, profile);
  if (user.status !== USER_STATUSES.ACTIVE) {
    throw ApiError.forbidden("Your account is not active. Please contact support.", "ACCOUNT_INACTIVE");
  }
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  return issueSession(user, { userAgent: "oauth:" + provider });
}
