"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  X,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Crown,
  Loader2,
  FileText,
  ExternalLink,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { usersApi } from "@/lib/api";
import { formatCountdown, lockedRemainingSeconds } from "@/lib/login-lockout.core.mjs";

const bn = (n) => Number(n ?? 0).toLocaleString("bn-BD");

const ROLE_META = {
  SUPERADMIN: { label: "মালিক (Owner)", badge: "bg-purple-100 text-purple-700 border-purple-200" },
  ADMIN: { label: "অ্যাডমিন", badge: "bg-primary/10 text-primary border-primary/20" },
  EDITOR: { label: "এডিটর", badge: "bg-sky-100 text-sky-700 border-sky-200" },
  USER: { label: "ব্যবহারকারী", badge: "bg-base-200 text-base-content/70 border-base-300" },
};

const STATUS_META = {
  ACTIVE: { label: "সক্রিয়", badge: "badge-success text-white font-bold" },
  PENDING: { label: "অপেক্ষমান", badge: "badge-warning text-white font-bold" },
  INACTIVE: { label: "নিষ্ক্রিয়", badge: "badge-ghost text-base-content/60 font-bold" },
};

const TIER_META = {
  ROYAL_VIP: { label: "Royal VIP", cls: "bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black" },
  SILVER: { label: "Silver", cls: "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold" },
  FREE: { label: "Free", cls: "bg-base-200 text-base-content/60 font-medium" },
};

const toRow = (u) => ({
  id: u.id,
  name: u.name || u.email,
  firstName: u.firstName || "",
  lastName: u.lastName || "",
  email: u.email,
  phone: u.phone || "—",
  joined: u.createdAt,
  lastLoginAt: u.lastLoginAt,
  role: u.role,
  status: u.status,
  avatar: u.avatar || null,
  failedLoginCount: u.failedLoginCount || 0,
  lockedUntil: u.lockedUntil || null,
  biodata: u.biodata || null,
  subscription: u.subscription || null,
});

export default function UserManagement() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [statusTab, setStatusTab] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1 });

  // Modals
  const [currentUser, setCurrentUser] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unlockingId, setUnlockingId] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const hasLocked = data.some((u) => lockedRemainingSeconds(u.lockedUntil, now) > 0);

  useEffect(() => {
    if (!hasLocked) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [hasLocked]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.list({
        page,
        limit: 10,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusTab !== "ALL" && statusTab !== "LOCKED" ? statusTab : undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      let rows = (Array.isArray(res?.data) ? res.data : []).map(toRow);
      if (statusTab === "LOCKED") {
        rows = rows.filter((u) => lockedRemainingSeconds(u.lockedUntil, Date.now()) > 0);
      }
      if (tierFilter) {
        rows = rows.filter((u) => (u.subscription?.tier || "FREE") === tierFilter);
      }
      setData(rows);
      setPagination(res?.pagination || { total: 0, totalPages: 1, page: 1 });
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, tierFilter, statusTab]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleOpenModal = (user = null) => {
    if (user) {
      setCurrentUser({ ...user, password: "", phone: user.phone === "—" ? "" : user.phone });
      setIsEdit(true);
    } else {
      setCurrentUser({ firstName: "", lastName: "", email: "", phone: "", password: "", role: "USER", status: "ACTIVE" });
      setIsEdit(false);
    }
    setModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await usersApi.update(currentUser.id, {
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          phone: currentUser.phone,
          role: currentUser.role,
          status: currentUser.status,
        });
      } else {
        await usersApi.create({
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          email: currentUser.email,
          phone: currentUser.phone,
          password: currentUser.password,
          role: currentUser.role,
        });
      }
      setModalOpen(false);
      load();
    } catch (err) {
      alert(err.message || "ব্যবহারকারী সংরক্ষণ করা যায়নি।");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("আপনি কি নিশ্চিত যে এই ব্যবহারকারী অ্যাকাউন্টটি মুছে ফেলতে চান?")) {
      return;
    }
    try {
      await usersApi.remove(id);
      setData((prev) => prev.filter((u) => u.id !== id));
      load();
    } catch (err) {
      alert(err.message || "মুছে ফেলা যায়নি।");
    }
  };

  const handleUnlockUser = async (id) => {
    setUnlockingId(id);
    try {
      const res = await usersApi.unlock(id);
      setData((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, lockedUntil: null, failedLoginCount: 0 }
            : u
        )
      );
      if (res?.wasLocked) {
        alert("অ্যাকাউন্ট সফলভাবে আনলক করা হয়েছে।");
      }
    } catch (err) {
      alert(err.message || "আনলক করা যায়নি।");
    } finally {
      setUnlockingId(null);
    }
  };

  // KPI Calculations
  const totalCount = pagination.total;
  const activeCount = data.filter((u) => u.status === "ACTIVE").length;
  const biodataCount = data.filter((u) => u.biodata !== null).length;
  const lockedCount = data.filter((u) => lockedRemainingSeconds(u.lockedUntil, now) > 0).length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ===== Header ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-base-300">
        <div>
          <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
            <Users className="text-[#fd6969]" size={26} />
            ব্যবহারকারী ও অ্যাকাউন্ট ব্যবস্থাপনা
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            সদস্যদের পূর্ণ প্রোফাইল, সংযুক্ত বায়োডাটা, সাবস্ক্রিপশন প্ল্যান, রোল ও সিকিউরিটি লকআউট নিয়ন্ত্রণ।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="btn btn-sm btn-outline gap-2 font-bold hover:bg-[#fd6969] hover:border-[#fd6969]"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            রিফ্রেশ
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-sm bg-[#fd6969] hover:bg-[#e05858] text-white border-none gap-2 font-bold shadow-sm"
          >
            <Plus size={16} />
            নতুন ইউজার যোগ
          </button>
        </div>
      </div>

      {/* ===== 4 Top KPI Cards ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-gray-400">মোট নিবন্ধিত ইউজার</p>
          <p className="text-2xl font-black text-[#fd6969] mt-1">{bn(totalCount)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">প্ল্যাটফর্ম সদস্য সংখ্যা</p>
        </div>
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-gray-400">সক্রিয় ইউজার</p>
          <p className="text-2xl font-black text-green-600 mt-1">{bn(activeCount)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">সক্রিয় ও লগইনযোগ্য</p>
        </div>
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-gray-400">বায়োডাটাধারী সদস্য</p>
          <p className="text-2xl font-black text-purple-600 mt-1">{bn(biodataCount)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">বায়োডাটা তৈরি সম্পন্ন</p>
        </div>
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-gray-400">সিকিউরিটি লকড</p>
          <p className="text-2xl font-black text-orange-600 mt-1">{bn(lockedCount)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">নিরাপত্তা লকআউট কার্যকর</p>
        </div>
      </div>

      {/* ===== Filter & Search Bar ===== */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-base-100 p-3 rounded-2xl border border-gray-100 dark:border-base-300">
        <div className="flex flex-wrap items-center gap-1 bg-base-200/50 p-1 rounded-xl">
          {[
            { key: "ALL", label: "সকল ইউজার" },
            { key: "ACTIVE", label: "সক্রিয়" },
            { key: "PENDING", label: "অপেক্ষমান" },
            { key: "INACTIVE", label: "নিষ্ক্রিয়" },
            { key: "LOCKED", label: "লকড" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusTab(tab.key);
                setPage(1);
              }}
              className={`btn btn-xs rounded-lg font-bold ${
                statusTab === tab.key ? "bg-[#fd6969] text-white border-none shadow-sm" : "btn-ghost text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="select select-bordered select-sm bg-base-100 text-xs focus:outline-none"
          >
            <option value="">সকল রোল</option>
            <option value="USER">সাধারণ ইউজার</option>
            <option value="EDITOR">এডিটর</option>
            <option value="ADMIN">অ্যাডমিন</option>
            <option value="SUPERADMIN">মালিক (Owner)</option>
          </select>

          {/* Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => {
              setTierFilter(e.target.value);
              setPage(1);
            }}
            className="select select-bordered select-sm bg-base-100 text-xs focus:outline-none"
          >
            <option value="">সকল প্যাকেজ</option>
            <option value="FREE">Free</option>
            <option value="SILVER">Silver</option>
            <option value="ROYAL_VIP">Royal VIP</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-60">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="নাম, ইমেইল বা ফোন..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input input-bordered input-sm pl-8 w-full bg-base-100 text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ===== Data Table ===== */}
      {loading ? (
        <div className="text-center py-20 bg-base-100 rounded-2xl border border-gray-100 dark:border-base-300">
          <span className="loading loading-spinner loading-lg text-[#fd6969]"></span>
          <p className="text-xs text-gray-400 mt-2 font-medium">ইউজার তালিকা লোড হচ্ছে...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-20 bg-base-100 rounded-2xl border border-dashed border-gray-300 dark:border-base-300">
          <Users size={40} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 font-bold">কোনো ব্যবহারকারী পাওয়া যায়নি</p>
          <p className="text-xs text-gray-400 mt-1">ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।</p>
        </div>
      ) : (
        <div className="bg-base-100 rounded-2xl border border-gray-100 dark:border-base-300 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-base-200/60 text-xs font-bold text-gray-600 border-b border-gray-100 dark:border-base-300">
                <tr>
                  <th>ব্যবহারকারী ও ইমেইল</th>
                  <th>বায়োডাটা স্ট্যাটাস</th>
                  <th>প্যাকেজ টিয়ার</th>
                  <th>ফোন নম্বর</th>
                  <th>স্ট্যাটাস / লকআউট</th>
                  <th>নিবন্ধন তারিখ</th>
                  <th className="text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-gray-100 dark:divide-base-300">
                {data.map((u) => {
                  const roleMeta = ROLE_META[u.role] || ROLE_META.USER;
                  const statusMeta = STATUS_META[u.status] || STATUS_META.ACTIVE;
                  const tierMeta = TIER_META[u.subscription?.tier] || TIER_META.FREE;
                  const rem = lockedRemainingSeconds(u.lockedUntil, now);

                  return (
                    <tr key={u.id} className="hover:bg-base-200/30 transition-colors">
                      {/* User Info */}
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-base-200 flex items-center justify-center font-bold text-gray-600 shrink-0 border border-gray-200">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              u.firstName ? u.firstName.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => setViewUser(u)}
                              className="font-bold text-xs hover:text-[#fd6969] transition-colors truncate block text-left"
                            >
                              {u.name}
                            </button>
                            <p className="text-[11px] text-gray-400 truncate max-w-[150px] font-mono">{u.email}</p>
                            <span className={`badge badge-xs mt-0.5 font-bold ${roleMeta.badge}`}>
                              {roleMeta.label}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Biodata info */}
                      <td>
                        {u.biodata ? (
                          <div>
                            <Link
                              href={`/details?id=${u.biodata.id}`}
                              target="_blank"
                              className="font-black text-xs text-[#fd6969] hover:underline flex items-center gap-1"
                            >
                              {u.biodata.biodataNo}
                              <ExternalLink size={11} />
                            </Link>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] text-gray-500 font-semibold">
                                {u.biodata.gender === "MALE" ? "পাত্র" : "পাত্রী"}
                              </span>
                              <span className="text-[10px] text-gray-400">• {u.biodata.district || "—"}</span>
                            </div>
                            <span className={`badge badge-xs mt-0.5 font-bold ${
                              u.biodata.status === "APPROVED" ? "badge-success text-white" :
                              u.biodata.status === "PENDING" ? "badge-warning text-white" : "badge-ghost"
                            }`}>
                              {u.biodata.status}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">কোনো বায়োডাটা নেই</span>
                        )}
                      </td>

                      {/* Package Tier */}
                      <td>
                        <span className={`badge badge-xs px-2 py-1 rounded-md shadow-xs ${tierMeta.cls}`}>
                          {tierMeta.label}
                        </span>
                      </td>

                      {/* Phone */}
                      <td>
                        <p className="font-semibold text-xs text-gray-700 dark:text-gray-300">{u.phone}</p>
                      </td>

                      {/* Status / Lockout */}
                      <td>
                        {rem > 0 ? (
                          <div className="flex items-center gap-1 text-orange-600 font-bold text-[11px]">
                            <Lock size={12} />
                            <span>লকড ({formatCountdown(rem)})</span>
                          </div>
                        ) : (
                          <span className={`badge badge-sm ${statusMeta.badge}`}>
                            {statusMeta.label}
                          </span>
                        )}
                        {u.failedLoginCount > 0 && rem === 0 && (
                          <p className="text-[10px] text-orange-500 mt-0.5">
                            ব্যর্থ লগইন: {bn(u.failedLoginCount)} বার
                          </p>
                        )}
                      </td>

                      {/* Registration Date */}
                      <td className="text-gray-500 text-xs">
                        {new Date(u.joined).toLocaleDateString("bn-BD", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Action buttons */}
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewUser(u)}
                            className="btn btn-xs btn-ghost text-gray-500 hover:text-[#fd6969]"
                            title="বিস্তারিত প্রোফাইল দেখুন"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() => handleOpenModal(u)}
                            className="btn btn-xs btn-ghost text-gray-500 hover:text-blue-600"
                            title="সম্পাদনা করুন"
                          >
                            <Edit3 size={14} />
                          </button>

                          {rem > 0 && (
                            <button
                              disabled={unlockingId === u.id}
                              onClick={() => handleUnlockUser(u.id)}
                              className="btn btn-xs bg-orange-100 hover:bg-orange-200 text-orange-700 border-none font-bold"
                              title="তাৎক্ষণিক আনলক করুন"
                            >
                              <Unlock size={12} />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="btn btn-xs btn-ghost text-gray-400 hover:text-red-500"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== Pagination ===== */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            className="btn btn-sm btn-circle btn-ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-gray-500 font-medium">
            পৃষ্ঠা {bn(pagination.page)} / {bn(pagination.totalPages)} (মোট {bn(pagination.total)} টি)
          </span>
          <button
            className="btn btn-sm btn-circle btn-ghost"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ===== User Full View Drawer Modal ===== */}
      {viewUser && (
        <dialog open className="modal modal-open modal-bottom sm:modal-middle bg-black/40 backdrop-blur-sm z-50">
          <div className="modal-box max-w-lg rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-base-300">
            <div className="flex justify-between items-start pb-4 border-b border-gray-100 dark:border-base-300">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-base-200 flex items-center justify-center text-lg font-bold border border-gray-200">
                  {viewUser.avatar ? (
                    <img src={viewUser.avatar} alt={viewUser.name} className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    viewUser.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-black text-lg">{viewUser.name}</h3>
                  <p className="text-xs text-gray-400 font-mono">{viewUser.email}</p>
                </div>
              </div>
              <button onClick={() => setViewUser(null)} className="btn btn-sm btn-circle btn-ghost">
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-base-300">
                <span className="text-gray-400">রোল / পদবী:</span>
                <span className={`badge badge-xs font-bold ${ROLE_META[viewUser.role]?.badge || ""}`}>
                  {ROLE_META[viewUser.role]?.label || viewUser.role}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-base-300">
                <span className="text-gray-400">একাউন্ট স্ট্যাটাস:</span>
                <span className={`badge badge-xs ${STATUS_META[viewUser.status]?.badge || "badge-ghost"}`}>
                  {STATUS_META[viewUser.status]?.label || viewUser.status}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-base-300">
                <span className="text-gray-400">ফোন নম্বর:</span>
                <span className="font-bold">{viewUser.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-base-300">
                <span className="text-gray-400">প্যাকেজ টিয়ার:</span>
                <span className={`badge badge-xs ${TIER_META[viewUser.subscription?.tier]?.cls || TIER_META.FREE.cls}`}>
                  {viewUser.subscription?.tier || "Free"}
                </span>
              </div>
              {viewUser.biodata && (
                <div className="flex justify-between py-1 border-b border-gray-50 dark:border-base-300">
                  <span className="text-gray-400">সংযুক্ত বায়োডাটা:</span>
                  <Link
                    href={`/details?id=${viewUser.biodata.id}`}
                    target="_blank"
                    className="font-bold text-[#fd6969] hover:underline flex items-center gap-1"
                  >
                    {viewUser.biodata.biodataNo} ({viewUser.biodata.gender === "MALE" ? "পাত্র" : "পাত্রী"})
                    <ExternalLink size={12} />
                  </Link>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-base-300">
                <span className="text-gray-400">নিবন্ধন সময়:</span>
                <span>{new Date(viewUser.joined).toLocaleString("bn-BD")}</span>
              </div>
              {viewUser.lastLoginAt && (
                <div className="flex justify-between py-1 border-b border-gray-50 dark:border-base-300">
                  <span className="text-gray-400">সর্বশেষ লগইন:</span>
                  <span>{new Date(viewUser.lastLoginAt).toLocaleString("bn-BD")}</span>
                </div>
              )}
              {viewUser.failedLoginCount > 0 && (
                <div className="flex justify-between py-1 border-b border-gray-50 dark:border-base-300 text-orange-600">
                  <span>ব্যর্থ লগইন সংখ্যা:</span>
                  <span className="font-bold">{bn(viewUser.failedLoginCount)} বার</span>
                </div>
              )}
            </div>

            <div className="modal-action pt-2 border-t border-gray-100 dark:border-base-300">
              <button
                onClick={() => {
                  setViewUser(null);
                  handleOpenModal(viewUser);
                }}
                className="btn btn-sm btn-outline gap-1 font-bold"
              >
                <Edit3 size={13} /> সম্পাদনা করুন
              </button>
              <button onClick={() => setViewUser(null)} className="btn btn-sm btn-neutral font-bold">
                বন্ধ করুন
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setViewUser(null)}>close</button>
          </form>
        </dialog>
      )}

      {/* ===== Create / Edit User Modal ===== */}
      {modalOpen && (
        <dialog open className="modal modal-open modal-bottom sm:modal-middle bg-black/40 backdrop-blur-sm z-50">
          <div className="modal-box max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-base-300">
            <h3 className="font-black text-xl mb-4">
              {isEdit ? "ইউজার তথ্য সম্পাদনা" : "নতুন ইউজার তৈরি করুন"}
            </h3>

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">নামের প্রথম অংশ</label>
                  <input
                    type="text"
                    required
                    value={currentUser.firstName}
                    onChange={(e) => setCurrentUser({ ...currentUser, firstName: e.target.value })}
                    className="input input-sm input-bordered w-full rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">নামের শেষ অংশ</label>
                  <input
                    type="text"
                    required
                    value={currentUser.lastName}
                    onChange={(e) => setCurrentUser({ ...currentUser, lastName: e.target.value })}
                    className="input input-sm input-bordered w-full rounded-xl"
                  />
                </div>
              </div>

              {!isEdit && (
                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">ইমেইল ঠিকানা</label>
                  <input
                    type="email"
                    required
                    value={currentUser.email}
                    onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                    className="input input-sm input-bordered w-full rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-gray-500 block mb-1">মোবাইল নম্বর</label>
                <input
                  type="text"
                  value={currentUser.phone}
                  onChange={(e) => setCurrentUser({ ...currentUser, phone: e.target.value })}
                  placeholder="০১৭xxxxxxxx"
                  className="input input-sm input-bordered w-full rounded-xl"
                />
              </div>

              {!isEdit && (
                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">পাসওয়ার্ড</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={currentUser.password}
                    onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
                    className="input input-sm input-bordered w-full rounded-xl"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">রোল (পদবী)</label>
                  <select
                    value={currentUser.role}
                    onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value })}
                    className="select select-sm select-bordered w-full rounded-xl text-xs"
                  >
                    <option value="USER">User (সদস্য)</option>
                    <option value="EDITOR">Editor (এডিটর)</option>
                    <option value="ADMIN">Admin (অ্যাডমিন)</option>
                  </select>
                </div>
                {isEdit && (
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 block mb-1">স্ট্যাটাস</label>
                    <select
                      value={currentUser.status}
                      onChange={(e) => setCurrentUser({ ...currentUser, status: e.target.value })}
                      className="select select-sm select-bordered w-full rounded-xl text-xs"
                    >
                      <option value="ACTIVE">সক্রিয়</option>
                      <option value="PENDING">অপেক্ষমান</option>
                      <option value="INACTIVE">নিষ্ক্রিয়</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-action flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-base-300">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-sm btn-ghost"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-sm bg-[#fd6969] hover:bg-[#e05858] text-white border-none font-bold"
                >
                  {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setModalOpen(false)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
}
