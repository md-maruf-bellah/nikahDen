"use client";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { userApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { createGuardPreviewEngine } from "./GuardPreview.core.mjs";

/**
 * Guard-প্রিভিউ কনটেক্সট — বায়োডাটা কার্ডের Message বোতাম আগে থেকে নিষ্ক্রিয় দেখাতে।
 *
 * এক পেজে ১০-১৬টা কার্ড থাকে; প্রতিটা কার্ডে আলাদা প্রিভিউ-কল নয় —
 * পেজের সব userId একবারে (≤25 ব্যাচে) GET /users/search-intent-এ পাঠিয়ে
 * ফলাফল সব বোতাম শেয়ার করে। লগইন না থাকলে কোনো কলই হয় না (গেস্ট বোতাম সবসময় সক্রিয়,
 * ক্লিকে লগইনে যায় — সার্ভারের guard-ই তবু শেষ কথা)।
 *
 * ব্যাচিং/ডিবাউন্স/dedup/dispose-লজিক GuardPreview.core.mjs-এ — ইউনিট-টেস্টেড।
 */
const GuardPreviewContext = createContext(null);

export function GuardPreviewProvider({ children }) {
  const { user } = useAuth();
  const [previews, setPreviews] = useState({});
  const engineRef = useRef(null);
  const userRef = useRef(user);

  // ইউজার পরিবর্তনে নতুন ইঞ্জিন (ক্যাশ অটো-ফাঁকা) — পুরনোটা dispose
  useEffect(() => {
    engineRef.current = createGuardPreviewEngine({
      fetchIntent: (ids) => userApi.searchIntent(ids),
      setPreviews,
      getUserId: () => userRef.current?.id,
    });
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    userRef.current = user;
    // লগআউট/ইউজার-পরিবর্তনে ক্যাশ পরিষ্কার (প্রিভিউ sender-নির্ভর)
    setPreviews({});
    engineRef.current?.clearCache();
  }, [user?.id]);

  const request = useCallback((ids) => engineRef.current?.schedule(ids), []);

  return (
    <GuardPreviewContext.Provider value={{ previews, request }}>
      {children}
    </GuardPreviewContext.Provider>
  );
}

/**
 * বোতামের ভেতর থেকে: [preview, ready]
 * preview = { canMessage, blocked, reason } | null
 *
 * auth হাইড্রেট রেস-সেফ: /auth/me শেষ না হলে রিকোয়েস্ট পেন্ডিং থাকে —
 * ইউজার এলে আবার চেষ্টা হয় (নইলে প্রথম পেজ-লোডে প্রিভিউ চিরতরে হারায়)।
 */
export function useGuardPreview(userId) {
  const ctx = useContext(GuardPreviewContext);
  const { user } = useAuth();
  const requested = useRef(false);

  useEffect(() => {
    requested.current = false;
  }, [userId]);

  useEffect(() => {
    if (!ctx || !userId || requested.current || !user?.id) return;
    requested.current = true;
    ctx.request([userId]);
  }, [ctx, userId, user?.id]);

  if (!ctx) return [null, false];
  return [ctx.previews[userId] || null, true];
}
