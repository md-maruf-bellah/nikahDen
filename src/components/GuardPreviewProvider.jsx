"use client";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { userApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

/**
 * Guard-প্রিভিউ কনটেক্সট — বায়োডাটা কার্ডের Message বোতাম আগে থেকে নিষ্ক্রিয় দেখাতে।
 *
 * এক পেজে ১০-১৬টা কার্ড থাকে; প্রতিটা কার্ডে আলাদা প্রিভিউ-কল নয় —
 * পেজের সব userId একবারে (≤25 ব্যাচে) GET /users/search-intent-এ পাঠিয়ে
 * ফলাফল সব বোতাম শেয়ার করে। লগইন না থাকলে কোনো কলই হয় না (গেস্ট বোতাম সবসময় সক্রিয়,
 * ক্লিকে লগইনে যায় — সার্ভারের guard-ই তবু শেষ কথা)।
 *
 * রেস-প্রোটেকশন: ইনফ্লাইট ব্যাচ থাকা অবস্থায় নতুন আইডি এলে সেই ব্যাচেই যোগ হয়।
 */
const GuardPreviewContext = createContext(null);

const MAX_BATCH = 25;

export function GuardPreviewProvider({ children }) {
  const { user } = useAuth();
  const [previews, setPreviews] = useState({});
  const inflight = useRef(null); // { ids:Set, timer }
  const loadedIds = useRef(new Set());
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (inflight.current) {
        clearTimeout(inflight.current.timer);
        inflight.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // লগআউট/ইউজার-পরিবর্তনে ক্যাশ পরিষ্কার (প্রিভিউ sender-নির্ভর)
    setPreviews({});
    loadedIds.current = new Set();
  }, [user?.id]);

  const schedule = useCallback(
    (ids) => {
      if (!user?.id || !aliveRef.current) return;
      const unseen = ids.filter((id) => id && !loadedIds.current.has(id));
      if (!unseen.length) return;
      if (inflight.current) {
        unseen.forEach((id) => inflight.current.ids.add(id));
        return;
      }
      const entry = { ids: new Set(unseen), timer: null };
      inflight.current = entry;
      entry.timer = setTimeout(async () => {
        inflight.current = null;
        const batch = [...entry.ids].slice(0, MAX_BATCH);
        batch.forEach((id) => loadedIds.current.add(id));
        // ব্যাচে বাকি থাকলে পরের টিকে আবার
        if (entry.ids.size > MAX_BATCH) schedule([...entry.ids].slice(MAX_BATCH));
        try {
          const res = await userApi.searchIntent(batch);
          if (!aliveRef.current) return;
          const rows = Array.isArray(res) ? res : [];
          setPreviews((prev) => {
            const next = { ...prev };
            for (const r of rows) next[r.id] = r;
            return next;
          });
        } catch {
          /* প্রিভিউ নীরব — বোতাম সক্রিয় থাকে, সার্ভার guard-ই শেষ কথা */
        }
      }, 250); // একই পেজ-রেন্ডারের বোতামগুলো একত্রিত করতে ছোট ডিবাউন্স
    },
    [user?.id]
  );

  const request = useCallback((ids) => schedule(ids), [schedule]);

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
