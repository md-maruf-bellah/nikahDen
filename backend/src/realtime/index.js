/**
 * Socket.IO রিয়েলটাইম ফাউন্ডেশন।
 *
 * - handshake-এ access token যাচাই (socket.handshake.auth.token) — বৈধ ACTIVE
 *   ইউজার হলেই সংযোগ, নইলে UNAUTHORIZED/FORBIDDEN
 * - প্রতি ইউজার নিজের `user:<id>` room-এ — একাধিক ট্যাব/ডিভাইস একই room
 * - REST write-path থেকে emitToUser() ডাকা হয় — API চুক্তি অপরিবর্তিত:
 *   socket না চালু থাকলে (টেস্ট/আলাদা প্রসেস) emit নীরবে false — কোনো ক্র্যাশ নয়
 *
 * ইভেন্ট (ক্লায়েন্ট → সার্ভার):
 *   typing          — { conversationId, typing } — সদস্যতা সার্ভার-যাচাই,
 *                     অন্য সদস্যদের room-এ রিলে; typing:false কখনো throttle
 *                     হয় না (stop কখনো হারায় না), typing:true প্রতি
 *                     conversation-এ 200ms throttle
 *   presence:query  — userIds[] → সার্ভার `presence:snapshot { online }` ফেরত
 *
 * ইভেন্ট (সার্ভার → ক্লায়েন্ট):
 *   connected         — handshake সফল, { userId }
 *   message:new       — নতুন মেসেজ (প্রাপকের room)
 *   message:read      — প্রাপক পড়েছে (প্রেরকের room): { conversationId, reader }
 *   notification:new  — যেকোনো নোটিফিকেশন (মালিকের room)
 *   typing            — { conversationId, from, typing } (প্রাপকের room)
 *   presence:update   — { userId, online } — শুধু কথোপকথন-পার্টনারদের room-এ;
 *                       প্রথম সংযোগে online, শেষ সংযোগ কাটলে offline
 *   presence:snapshot — { online: [userId] } — presence:query-এর উত্তর
 */
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import { USER_STATUSES } from "../constants/index.js";
import { corsOptions } from "../config/cors.js";
import { isValidObjectId } from "../utils/helpers.js";

let io = null;

/** userId → সক্রিয় socket-id সেট (একাধিক ট্যাব/ডিভাইস) */
const userSockets = new Map();

const TYPING_MIN_GAP_MS = 200;
const PRESENCE_QUERY_MAX = 100;
const CONV_MAP_CAP = 256; // প্রতি সকেটে ক্যাশ/থ্রটল-ম্যাপের উচ্চসীমা

export function isUserOnline(userId) {
  return (userSockets.get(String(userId))?.size ?? 0) > 0;
}

/** এই ইউজারের সব কথোপকথন-পার্টনার (নিজে বাদ) — presence broadcast-এর দর্শক */
async function conversationPartners(userId) {
  try {
    const ids = await Conversation.distinct("participants", { participants: userId });
    return [...new Set(ids.map(String))].filter((id) => id !== String(userId));
  } catch {
    return []; // DB ব্যর্থতায় presence নীরব ছাড় — সংযোগ প্রবাহ ব্যর্থ হয় না
  }
}

function broadcastPresence(userId, online) {
  if (!io) return;
  conversationPartners(userId).then((partners) => {
    if (!io) return;
    for (const partner of partners) {
      io.to(`user:${partner}`).emit("presence:update", { userId: String(userId), online });
    }
  });
}

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
      socket.data.typingTo = new Map(); // conversationId → অন্য সদস্যরা (disconnect-এ stop)
      socket.data.typingAt = new Map(); // conversationId → শেষ typing-emit ts (throttle)
      socket.data.convCache = new Map(); // conversationId → অন্য সদস্যরা (যাচাই-ক্যাশ)
      next();
    } catch {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);

    let set = userSockets.get(userId);
    const firstConnection = !set || set.size === 0;
    if (!set) {
      set = new Set();
      userSockets.set(userId, set);
    }
    set.add(socket.id);

    socket.emit("connected", { userId });
    if (firstConnection) broadcastPresence(userId, true);

    // টাইপিং — সদস্যতা সার্ভার-যাচাই, অন্য সদস্যদের room-এ রিলে
    socket.on("typing", async (payload) => {
      const conversationId =
        typeof payload?.conversationId === "string" ? payload.conversationId : null;
      const typing = Boolean(payload?.typing);
      if (!conversationId || !isValidObjectId(conversationId)) return;

      // কীচাপ-বন্যা ঠেকাতে প্রতি conversation-এ 200ms throttle (ম্যাপ-সাইজ ক্যাপসহ);
      // stop (typing:false) কখনো throttle হয় না — শেষ stop কখনো হারায় না
      if (typing) {
        const now = Date.now();
        const last = socket.data.typingAt.get(conversationId) || 0;
        if (now - last < TYPING_MIN_GAP_MS) return;
        if (
          !socket.data.typingAt.has(conversationId) &&
          socket.data.typingAt.size >= CONV_MAP_CAP
        ) {
          return; // র‍্যান্ডম-id দিয়ে ম্যাপ-বন্যা
        }
        socket.data.typingAt.set(conversationId, now);
      }

      // কথোপকথন-সদস্যতা যাচাই (ক্যাশড) — সদস্য নয় বা জাল id হলে রিলেই হয় না
      let others = socket.data.convCache.get(conversationId);
      if (others === undefined) {
        try {
          const conv = await Conversation.findById(conversationId)
            .select("participants")
            .lean();
          const members = conv ? conv.participants.map(String) : null;
          others =
            members && members.includes(userId)
              ? members.filter((id) => id !== userId)
              : null; // সদস্য নয় → null (যাচাই ব্যর্থতাও এখানেই)
        } catch {
          others = null; // DB ব্যর্থতায় রিলে নয় — typing কখনো জীবন-রেখা নয়
        }
        if (socket.data.convCache.size < CONV_MAP_CAP) {
          socket.data.convCache.set(conversationId, others);
        }
      }
      if (!others || others.length === 0) return;

      if (typing) socket.data.typingTo.set(conversationId, others);
      else socket.data.typingTo.delete(conversationId);
      for (const id of others) {
        io.to(`user:${id}`).emit("typing", { conversationId, from: userId, typing });
      }
    });

    // presence — খোলা তালিকার পার্টনারদের অনলাইন-অবস্থা এক ঝলকে
    socket.on("presence:query", (userIds) => {
      const ids = Array.isArray(userIds)
        ? [
            ...new Set(
              userIds.filter((id) => typeof id === "string" && isValidObjectId(id)),
            ),
          ].slice(0, PRESENCE_QUERY_MAX)
        : [];
      const online = ids.filter((id) => isUserOnline(id));
      socket.emit("presence:snapshot", { online });
    });

    socket.on("disconnect", () => {
      // অসমাপ্ত টাইপিং ভেসে না যায় — যেসব conversation-এ typing চলছিল, stop পাঠাই
      for (const [conversationId, others] of socket.data.typingTo || []) {
        for (const id of others) {
          io.to(`user:${id}`).emit("typing", { conversationId, from: userId, typing: false });
        }
      }

      const live = userSockets.get(userId);
      if (live) {
        live.delete(socket.id);
        if (live.size === 0) userSockets.delete(userId);
      }
      if (!isUserOnline(userId)) broadcastPresence(userId, false);
    });
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
    userSockets.clear();
  }
}
