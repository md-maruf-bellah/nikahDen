import env from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import * as authService from "./auth.service.js";
import * as oauthService from "./oauth.service.js";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.IS_PROD,
  path: "/",
};

function attachAuthCookies(res, accessToken, refreshToken) {
  if (!env.USE_COOKIES) return;
  res.cookie(env.ACCESS_COOKIE_NAME, accessToken, { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 });
  res.cookie(env.REFRESH_COOKIE_NAME, refreshToken, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

const metaFrom = (req) => ({ ip: req.ip, userAgent: req.headers["user-agent"] });

export const register = asyncHandler(async (req, res) => {
  const session = await authService.registerUser(req.body, metaFrom(req));
  attachAuthCookies(res, session.accessToken, session.refreshToken);
  return sendSuccess(res, "Account created successfully. Welcome to Nikah Deen!", session, undefined, 201);
});

export const login = asyncHandler(async (req, res) => {
  const session = await authService.loginUser(req.body, metaFrom(req));
  attachAuthCookies(res, session.accessToken, session.refreshToken);
  return sendSuccess(res, "Login successful", session);
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.body?.refreshToken || req.cookies?.[env.REFRESH_COOKIE_NAME];
  if (!refreshToken) {
    throw ApiError.unauthorized("Refresh token missing.", "INVALID_REFRESH_TOKEN");
  }
  const session = await authService.refreshSession(refreshToken, metaFrom(req));
  attachAuthCookies(res, session.accessToken, session.refreshToken);
  return sendSuccess(res, "Tokens refreshed", session);
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.body?.refreshToken || req.cookies?.[env.REFRESH_COOKIE_NAME];
  await authService.logoutSession(refreshToken);
  if (env.USE_COOKIES) {
    res.clearCookie(env.ACCESS_COOKIE_NAME, COOKIE_OPTS);
    res.clearCookie(env.REFRESH_COOKIE_NAME, COOKIE_OPTS);
  }
  return sendSuccess(res, "Logged out successfully");
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  return sendSuccess(res, "Current user", user);
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changeUserPassword(req.user.id, req.body);
  return sendSuccess(res, "Password changed successfully. Please login again on other devices.");
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotUserPassword(req.body.email);
  const devNote = result.dev && !result.delivered ? " (development: reset link printed in server log)" : "";
  return sendSuccess(res, `If an account exists for this email, a reset link has been sent.${devNote}`);
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetUserPassword(req.body.token, req.body.newPassword);
  return sendSuccess(res, "Password has been reset. You can login now.");
});

// ---------------------------------------------------------------------------
// OAuth (Google / Facebook)
// ---------------------------------------------------------------------------

// GET /auth/oauth/providers — frontend বাটন enable/disable করতে
export const oauthProviders = asyncHandler(async (_req, res) => {
  const providers = {
    google: oauthService.providerConfigured("google"),
    facebook: oauthService.providerConfigured("facebook"),
  };
  return sendSuccess(res, "OAuth providers", providers);
});

// GET /auth/oauth/:provider/start → 302 প্রোভাইডারে
export const oauthStart = asyncHandler(async (req, res) => {
  const { url } = oauthService.buildAuthUrl(req.params.provider);
  return res.redirect(302, url);
});

// verifyState কে controller থেকে ব্যবহারের জন্য re-export
export const verifyStateForController = (state) => oauthService.verifyState(state);

// GET /auth/oauth/:provider/callback → কোড এক্সচেঞ্জ → handoff কোড দিয়ে frontend-এ
export const oauthCallback = asyncHandler(async (req, res) => {
  const { provider } = req.params;
  const { code, state, error, error_description } = req.query;

  // ইউজার প্রোভাইডারে বাতিল করলে
  if (error) {
    const desc = error === "access_denied" ? "আপনি অনুমতি দেননি।" : String(error_description || error);
    return res.redirect(302, `${env.CLIENT_URL}/auth/callback?error=${encodeURIComponent(desc)}`);
  }

  try {
    // state আগে যাচাই (CSRF) — provider mismatch ধরা পড়ুক
    const statePayload = verifyStateForController(state);
    if (statePayload.provider !== provider) {
      const e = new Error("state provider mismatch");
      e.errorCode = "OAUTH_STATE_INVALID";
      throw e;
    }
    if (!code) throw new Error("MISSING_CODE");
    const session = await oauthService.completeOAuthLogin(provider, code);
    const handoffCode = oauthService.createHandoffCode(session);
    return res.redirect(302, `${env.CLIENT_URL}/auth/callback?code=${handoffCode}`);
  } catch (err) {
    // অভ্যন্তরীণ বার্তা লিক না করে ব্যবহারকারী-বান্ধব বার্তায় ম্যাপ
    const map = {
      STATE_MISMATCH: "নিরাপত্তা যাচাই ব্যর্থ — আবার লগইন করুন।",
      MISSING_CODE: "লগইন সম্পন্ন হয়নি — আবার চেষ্টা করুন।",
      OAUTH_STATE_EXPIRED: "সেশনের মেয়াদ শেষ — আবার লগইন করুন।",
      OAUTH_STATE_INVALID: "নিরাপত্তা যাচাই ব্যর্থ — আবার লগইন করুন।",
      OAUTH_EMAIL_REQUIRED: "ইমেইল শেয়ার করার অনুমতি দিয়ে আবার চেষ্টা করুন।",
      ACCOUNT_INACTIVE: "অ্যাকাউন্ট সক্রিয় নয় — সাপোর্টে যোগাযোগ করুন।",
      OAUTH_EXCHANGE_FAILED: "প্রোভাইডার লগইন গ্রহণ করেনি — আবার চেষ্টা করুন।",
      OAUTH_PROFILE_FAILED: "প্রোফাইল তথ্য আনা যায়নি — আবার চেষ্টা করুন।",
    };
    const msg = map[err?.errorCode] || map[err?.message] || "সোশ্যাল লগইন ব্যর্থ হয়েছে — আবার চেষ্টা করুন।";
    return res.redirect(302, `${env.CLIENT_URL}/auth/callback?error=${encodeURIComponent(msg)}`);
  }
});

// POST /auth/oauth/exchange { code } → session tokens (one-time handoff ভোগ করে)
export const oauthExchange = asyncHandler(async (req, res) => {
  const session = oauthService.consumeHandoffCode(req.body?.code);
  return sendSuccess(res, "OAuth login successful", session);
});
