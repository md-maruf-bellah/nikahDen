"use client";

/**
 * Socket.IO ক্লায়েন্ট — সিঙ্গলটন।
 *
 * লগইন-অবস্থায় যুক্ত হয় (AuthProvider), লগআউটে বিচ্ছিন্ন।
 * access token ১৫ মিনিটে রোটেট হয় — তাই প্রতি connect attempt-এ টাটকা
 * token provider পড়ে; reconnect-এও টাটকা টোকেন যায়।
 *
 * ইভেন্ট (সার্ভার → ক্লায়েন্ট): connected, message:new, message:read,
 * notification:new, notification:read
 *
 * ব্যবহার:
 *   const socket = ensureSocket(() => tokenStore.getAccess());
 *   const off = onSocketEvent("message:new", handler); // off() = আনসাবস্ক্রাইব
 */
import { io } from "socket.io-client";

let socket = null;

/** বর্তমান socket বা null (টেস্ট/SSR-নিরাপদ) */
export function getSocket() {
  return socket;
}

/**
 * লগইন-অবস্থায় socket যুক্ত করে (আগে থেকে থাকলে সেটাই ফেরে)।
 * @param {() => string | null} getToken  প্রতি connect attempt-এ টাটকা access token
 */
export function ensureSocket(getToken) {
  if (socket) return socket;
  if (typeof window === "undefined") return null;

  const url = new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1");
  socket = io(url.origin, {
    autoConnect: false,
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true, // অটো-রিকানেক্ট — ব্যাকঅফসহ, আনলিমিটেড
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 15000,
    auth: (cb) => cb({ token: getToken?.() || null }),
  });

  socket.connect();
  return socket;
}

/** সক্রিয় socket-এ ইভেন্ট-লিসেনার; off() ফেরত দেয়। socket নেই হলে নীরব no-op। */
export function onSocketEvent(event, fn) {
  if (!socket) return () => {};
  socket.on(event, fn);
  return () => socket.off(event, fn);
}

/** লগআউট/unmount — বিচ্ছিন্ন ও লিসেনার পরিষ্কার */
export function destroySocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}
