"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { notificationApi } from "@/lib/api";

/**
 * Navbar notification bell — unread badge + dropdown।
 * - প্রতি ৩০ সেকেন্ডে unread count পোল করে (লগইন থাকলেই)
 * - খুললে সর্বশেষ ৬টি নোটিফিকেশন + "সব পড়া হয়েছে" মার্ক বাটন
 * - বাইরে ক্লিকে বন্ধ; "সব দেখুন" → /profile?tab=নোটিফিকেশন
 * - blocks-changed-এর মতো গ্লোবাল ইভেন্ট "notifications-changed" এলে সাথে সাথে রিফ্রেশ
 */
export default function NotificationBell() {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const boxRef = useRef(null);

  const refreshCount = useCallback(async () => {
    try {
      const res = await notificationApi.list({ page: 1, limit: 1 });
      // res = { data: { items, unreadCount }, pagination }
      setUnread(Number(res?.data?.unreadCount) || 0);
    } catch {
      /* লগইন নেই/নেটওয়ার্ক — নীরব */
    }
  }, []);

  const loadItems = useCallback(async () => {
    try {
      const res = await notificationApi.list({ page: 1, limit: 6 });
      setItems(Array.isArray(res?.data?.items) ? res.data.items : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    refreshCount();
    const timer = setInterval(() => {
      if (alive) refreshCount();
    }, 30000);
    const onChange = () => refreshCount();
    window.addEventListener("notifications-changed", onChange);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("notifications-changed", onChange);
    };
  }, [refreshCount]);

  // বাইরে ক্লিকে ড্রপডাউন বন্ধ
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      await loadItems();
      refreshCount();
    }
  };

  const markAll = async () => {
    setBusy(true);
    try {
      await notificationApi.readAll();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
      window.dispatchEvent(new Event("notifications-changed"));
    } catch {
      /* নীরব */
    } finally {
      setBusy(false);
    }
  };

  const goToAll = () => {
    setOpen(false);
    router.push("/profile?tab=নোটিফিকেশন");
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={toggle}
        title="নোটিফিকেশন"
        aria-label="নোটিফিকেশন"
        className="btn btn-ghost btn-circle btn-sm relative text-gray-600 hover:text-[#fd6969]"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#fd6969] text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "৯+" : unread.toLocaleString("bn-BD")}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-base-100 border border-gray-100 rounded-xl shadow-xl z-[80] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="font-bold text-sm">নোটিফিকেশন</p>
            {unread > 0 && (
              <button
                onClick={markAll}
                disabled={busy}
                className="btn btn-ghost btn-xs text-[#fd6969] gap-1"
              >
                <CheckCheck size={14} /> সব পড়া হয়েছে
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {items.length === 0 && (
              <p className="text-center text-xs text-gray-400 py-8">কোনো নোটিফিকেশন নেই।</p>
            )}
            {items.map((n) => (
              <button
                key={n.id}
                onClick={goToAll}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  n.isRead ? "opacity-60" : ""
                }`}
              >
                <p className="text-xs font-bold flex items-center gap-2">
                  {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-[#fd6969] shrink-0" />}
                  <span className="truncate">{n.title || "নোটিফিকেশন"}</span>
                </p>
                <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{n.body}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(n.createdAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short" })}
                </p>
              </button>
            ))}
          </div>

          <button
            onClick={goToAll}
            className="w-full py-2.5 text-xs font-bold text-[#fd6969] hover:bg-red-50 transition-colors border-t border-gray-100"
          >
            সব দেখুন
          </button>
        </div>
      )}
    </div>
  );
}
