/**
 * Socket.IO রিয়েলটাইম ফাউন্ডেশন।
 *
 * - handshake-এ access token যাচাই (socket.handshake.auth.token) — বৈধ ACTIVE
 *   ইউজার হলেই সংযোগ, নইলে UNAUTHORIZED/FORBIDDEN
 * - প্রতি ইউজার নিজের `user:<id>` room-এ — একাধিক ট্যাব/ডিভাইস একই room
 * - REST write-path থেকে emitToUser() ডাকা হয় — API চুক্তি অপরিবর্তিত:
 *   socket না চালু থাকলে (টেস্ট/আলাদা প্রসেস) emit নীরবে false — কোনো ক্র্যাশ নয়
 *
 * ইভেন্ট (সার্ভার → ক্লায়েন্ট):
 *   connected         — handshake সফল, { userId }
 *   message:new       — নতুন মেসেজ (প্রাপকের room)
 *   message:read      — প্রাপক পড়েছে (প্রেরকের room): { conversationId, reader }
 *   notification:new  — যেকোনো নোটিফিকেশন (মালিকের room)
 */
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../models/user.model.js";
import { USER_STATUSES } from "../constants/index.js";
import { corsOptions } from "../config/cors.js";

let io = null;

export function initRealtime(httpServer) {
  if (io) return io;

  io = new Server(httpServer, {
    // REST-এর একই allowlist — origin ফাংশন socket.io-র ভেতরের cors প্যাকেজেও চলে
    cors: { origin: corsOptions.origin, credentials: true },
  });

  // JWT handshake — সংযোগের আগেই যাচাই; বাকি রাউটগুলোর মতো একই access secret
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("UNAUTHORIZED"));

      let payload;
      try {
        payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
      } catch {
        return next(new Error("UNAUTHORIZED"));
      }

      const user = await User.findById(payload.sub).select("status").lean();
      if (!user) return next(new Error("UNAUTHORIZED"));
      if (user.status !== USER_STATUSES.ACTIVE) return next(new Error("FORBIDDEN"));

      socket.data.userId = user._id.toString();
      next();
    } catch {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.userId}`);
    socket.emit("connected", { userId: socket.data.userId });
  });

  return io;
}

export function getIo() {
  return io;
}

/**
 * নির্দিষ্ট ইউজারের room-এ emit — REST write-path-দের একমাত্র প্রবেশদ্বার।
 * socket চালু না থাকলে নীরবে false (আচরণ অপরিবর্তিত)।
 */
export function emitToUser(userId, event, payload) {
  if (!io) return false;
  io.to(`user:${String(userId)}`).emit(event, payload);
  return true;
}

export function closeRealtime() {
  if (!io) return;
  try {
    io.close(); // underlying http server সহ বন্ধ
  } finally {
    io = null;
  }
}
