"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  CreditCard,
  UserPlus,
  FileText,
  HeartHandshake,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { adminNotificationApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const bn = (n) => Number(n ?? 0).toLocaleString("bn-BD");

const CATEGORY_META = {
  ALL: { label: "সব নোটিফিকেশন", icon: <Bell size={15} />, color: "text-primary bg-primary/10" },
  PAYMENT: { label: "পেমেন্ট ও অর্ডার", icon: <CreditCard size={15} />, color: "text-green-600 bg-green-50" },
  USER: { label: "নতুন ইউজার", icon: <UserPlus size={15} />, color: "text-purple-600 bg-purple-50" },
  BIODATA: { label: "বায়োডাটা রিভিউ", icon: <FileText size={15} />, color: "text-sky-600 bg-sky-50" },
  MARRIAGE: { label: "বিবাহ ও জুটি", icon: <HeartHandshake size={15} />, color: "text-rose-600 bg-rose-50" },
  SUPPORT: { label: "সাপোর্ট মেসেজ", icon: <MessageSquare size={15} />, color: "text-orange-600 bg-orange-50" },
  SYSTEM: { label: "সিস্টেম", icon: <Sparkles size={15} />, color: "text-gray-600 bg-gray-50" },
};

export default function AdminNotificationsPage({ onNavigateTab }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({ ALL: 0, PAYMENT: 0, USER: 0, BIODATA: 0, MARRIAGE: 0, SUPPORT: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [categoryTab, setCategoryTab] = useState("ALL");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminNotificationApi.list({
        page,
        limit: 12,
        category: categoryTab !== "ALL" ? categoryTab : undefined,
        unread: unreadOnly ? "1" : undefined,
        search: search.trim() || undefined,
      });

      setItems(res?.data || []);
      setPagination(res?.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });
      setUnreadCount(res?.unreadCount ?? 0);
      if (res?.categoryCounts) {
        setCategoryCounts(res.categoryCounts);
      }
    } catch (err) {
      setError(err.message || "নোটিফিকেশন লোড করা যায়নি।");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, categoryTab, unreadOnly, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Mark single read
  const handleMarkRead = async (id) => {
    try {
      setActionLoadingId(id);
      await adminNotificationApi.read(id);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Mark all read
  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await adminNotificationApi.readAll();
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(err.message || "সব নোটিফিকেশন পড়া হিসেবে চিহ্নিত করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  // Delete single notification
  const handleDelete = async (id) => {
    try {
      setActionLoadingId(id);
      await adminNotificationApi.delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setCategoryCounts((prev) => ({
        ...prev,
        ALL: Math.max(0, prev.ALL - 1),
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    try {
      setDeletingAll(true);
      await adminNotificationApi.clearAll({ category: categoryTab !== "ALL" ? categoryTab : undefined });
      setConfirmDeleteAll(false);
      loadData();
    } catch (err) {
      setError(err.message || "নোটিফিকেশন মুছতে ব্যর্থ হয়েছে।");
    } finally {
      setDeletingAll(false);
    }
  };

  // Format date in Bengali
  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString("bn-BD", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  // Resolve target tab for on-click navigation
  const resolveTargetTab = (notif) => {
    const cat = notif.adminCategory;
    if (cat === "PAYMENT") return "invoices";
    if (cat === "USER") return "users";
    if (cat === "BIODATA") return "biodatas";
    if (cat === "MARRIAGE") return "marriages";
    if (cat === "SUPPORT") return "support";
    return null;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ===== Header ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-base-200">
        <div>
          <h2 className="text-2xl font-black text-base-content flex items-center gap-2.5">
            <Bell className="text-primary" size={26} />
            <span>অ্যাডমিন নোটিফিকেশন সেন্টার</span>
          </h2>
          <p className="text-xs text-base-content/60 mt-1">
            ওয়েবসাইটের সকল ব্যবসায়িক ইভেন্ট, নতুন ইউজার, পেমেন্ট, বায়োডাটা ও সাপোর্ট নোটিফিকেশন
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || loading}
            className="btn btn-sm btn-outline gap-1.5 border-base-300 hover:border-primary"
            title="সবগুলো পড়া হিসেবে চিহ্নিত করুন"
          >
            <CheckCheck size={16} />
            <span className="hidden sm:inline">সব পড়া মার্ক করুন</span>
          </button>

          <button
            onClick={() => setConfirmDeleteAll(true)}
            disabled={items.length === 0 || loading}
            className="btn btn-sm btn-outline border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
            title="সব নোটিফিকেশন মুছে ফেলুন"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">সব মুছুন</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="btn btn-sm btn-primary text-white gap-1.5 shadow-sm shadow-primary/20"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>রিফ্রেশ</span>
          </button>
        </div>
      </div>

      {/* ===== KPI Summary Cards ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Card 1: Total Notifications */}
        <div className="card bg-base-100 border border-base-200 shadow-xs p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase text-base-content/60 tracking-wider">মোট নোটিফিকেশন</p>
              <p className="text-2xl font-black text-base-content mt-1">{bn(categoryCounts.ALL)}</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Bell size={22} />
            </div>
          </div>
          <p className="text-[11px] text-base-content/50 mt-2">প্ল্যাটফর্মের সকল রেকর্ড</p>
        </div>

        {/* Card 2: Unread */}
        <div className="card bg-base-100 border border-base-200 shadow-xs p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase text-base-content/60 tracking-wider">অপঠিত বার্তা</p>
              <p className="text-2xl font-black text-orange-600 mt-1">{bn(unreadCount)}</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Clock size={22} />
            </div>
          </div>
          <p className="text-[11px] text-orange-600/70 mt-2">এখনও চেক করা হয়নি</p>
        </div>

        {/* Card 3: Payments */}
        <div className="card bg-base-100 border border-base-200 shadow-xs p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase text-base-content/60 tracking-wider">পেমেন্ট ও অর্ডার</p>
              <p className="text-2xl font-black text-green-600 mt-1">{bn(categoryCounts.PAYMENT)}</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
              <CreditCard size={22} />
            </div>
          </div>
          <p className="text-[11px] text-green-600/70 mt-2">সফল মেম্বারশিপ ক্রয়</p>
        </div>

        {/* Card 4: New Users & Biodatas */}
        <div className="card bg-base-100 border border-base-200 shadow-xs p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase text-base-content/60 tracking-wider">ইউজার ও বায়োডাটা</p>
              <p className="text-2xl font-black text-purple-600 mt-1">
                {bn((categoryCounts.USER || 0) + (categoryCounts.BIODATA || 0))}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <UserPlus size={22} />
            </div>
          </div>
          <p className="text-[11px] text-purple-600/70 mt-2">নতুন প্রোফাইল ও সাবমিশন</p>
        </div>
      </div>

      {/* ===== Filters & Tabs ===== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-base-100 p-3 rounded-2xl border border-base-200">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const count = key === "ALL" ? categoryCounts.ALL : categoryCounts[key] || 0;
            const active = categoryTab === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setCategoryTab(key);
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  active
                    ? "bg-primary text-white shadow-xs"
                    : "bg-base-200/60 text-base-content/70 hover:bg-base-200 hover:text-base-content"
                }`}
              >
                {meta.icon}
                <span>{meta.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      active ? "bg-white/20 text-white" : "bg-base-300 text-base-content/80"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Search & Unread Toggle */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs font-bold text-base-content/70 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => {
                setUnreadOnly(e.target.checked);
                setPage(1);
              }}
              className="checkbox checkbox-xs checkbox-primary rounded-md"
            />
            <span>শুধু অপঠিত</span>
          </label>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput);
              setPage(1);
            }}
            className="relative"
          >
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="খুঁজুন..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input input-xs input-bordered pl-8 pr-6 rounded-lg w-36 sm:w-48 text-xs"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
              >
                <X size={12} />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* ===== Notification Items List ===== */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-base-content/50">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm font-bold">নোটিফিকেশন লোড হচ্ছে...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-center bg-base-100 rounded-3xl border border-base-200">
          <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center text-base-content/40">
            <Bell size={28} />
          </div>
          <h4 className="text-base font-bold text-base-content">কোনো নোটিফিকেশন পাওয়া যায়নি</h4>
          <p className="text-xs text-base-content/60 max-w-sm">
            {search || unreadOnly
              ? "আপনার ফিল্টারের সাথে মিলে এমন কোনো নোটিফিকেশন নেই।"
              : "নতুন কোনো ব্যবসায়িক নোটিফিকেশন এখনও জমা পড়েনি।"}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => {
            const meta = CATEGORY_META[item.adminCategory] || CATEGORY_META.SYSTEM;
            const targetTab = resolveTargetTab(item);

            return (
              <div
                key={item.id}
                className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition-all duration-150 ${
                  item.isRead
                    ? "bg-base-100 border-base-200 hover:border-base-300"
                    : "bg-primary/5 border-primary/20 shadow-xs"
                }`}
              >
                {/* Unread Glowing Dot */}
                {!item.isRead && (
                  <span className="absolute top-4 left-2 w-2 h-2 rounded-full bg-primary ring-4 ring-primary/20" />
                )}

                <div className="flex items-start gap-3 min-w-0 pl-2">
                  {/* Category Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
                    {meta.icon}
                  </div>

                  {/* Content */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-base-content">{item.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-base-200 text-base-content/70">
                        {meta.label}
                      </span>
                    </div>

                    <p className="text-xs text-base-content/70 mt-1 leading-relaxed">{item.body}</p>

                    <div className="flex items-center gap-3 text-[11px] text-base-content/40 mt-1.5 font-medium">
                      <span>{formatDate(item.createdAt)}</span>
                      {targetTab && onNavigateTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab(targetTab)}
                          className="text-primary hover:underline flex items-center gap-1 font-bold"
                        >
                          <span>সংশ্লিষ্ট মডিউল দেখুন</span>
                          <ExternalLink size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(item.id)}
                      disabled={actionLoadingId === item.id}
                      className="btn btn-xs btn-ghost text-primary gap-1 font-bold"
                      title="পড়া হয়েছে"
                    >
                      <CheckCircle2 size={13} />
                      <span className="hidden md:inline">পড়া মার্ক</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={actionLoadingId === item.id}
                    className="btn btn-xs btn-ghost text-base-content/50 hover:text-red-600 hover:bg-red-50 p-1.5"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== Pagination ===== */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-base-200">
          <p className="text-xs text-base-content/60">
            মোট {bn(pagination.total)} টির মধ্যে পৃষ্ঠা {bn(pagination.page)} / {bn(pagination.totalPages)}
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn btn-xs btn-outline rounded-lg"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-bold px-2">{bn(page)}</span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="btn btn-xs btn-outline rounded-lg"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ===== Clear All Confirmation Modal ===== */}
      {confirmDeleteAll && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-base-100 rounded-3xl p-6 shadow-2xl border border-base-300 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
              <AlertTriangle size={28} />
            </div>

            <h3 className="text-lg font-black text-base-content">
              {categoryTab !== "ALL" ? `${CATEGORY_META[categoryTab]?.label} নোটিফিকেশন মুছবেন?` : "সব নোটিফিকেশন মুছে ফেলতে চান?"}
            </h3>

            <p className="text-xs text-base-content/70 mt-2 leading-relaxed px-2">
              এই কাজটি নিশ্চিত করলে আপনার অ্যাকাউন্টের সংশ্লিষ্ট নোটিফিকেশনগুলো সম্পূর্ণভাবে মুছে যাবে। এই কাজটি আর ফিরিয়ে আনা যাবে না।
            </p>

            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteAll(false)}
                className="btn btn-sm btn-ghost flex-1 font-bold"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={deletingAll}
                className="btn btn-sm btn-error text-white flex-1 font-bold gap-1.5 shadow-md shadow-red-200"
              >
                {deletingAll ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>হ্যাঁ, সম্পূর্ণ মুছুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
