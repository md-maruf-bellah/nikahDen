import env from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import * as authService from "./auth.service.js";

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
