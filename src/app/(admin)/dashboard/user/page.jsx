"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  FileCheck2,
  Check,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Search,
  Images,
  ExternalLink,
  AlertTriangle,
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  Shield,
  Sparkles,
  Info,
} from "lucide-react";
import Link from "next/link";
import { biodataApi, adminApi } from "@/lib/api";

const bn = (n) => Number(n ?? 0).toLocaleString("bn-BD");

const STATUS_TABS = [
  { key: "ALL", label: "সকল বায়োডাটা" },
  { key: "PENDING", label: "অপেক্ষমান" },
  { key: "APPROVED", label: "অনুমোদিত" },
  { key: "REJECTED", label: "বাতিল" },
  { key: "HIDDEN", label: "লুকানো" },
  { key: "DRAFT", label: "ড্রাফট" },
];

const MARITAL_LABEL = {
  UNMARRIED: "অবিবাহিত",
  DIVORCED: "তালাকপ্রাপ্ত",
  WIDOWED: "বিধবা/বিপত্নীক",
  OTHER: "অন্যান্য",
};

const QUICK_REJECT_REASONS = [
  "ছবি অস্পষ্ট বা অনুপযুক্ত",
  "ভুয়া বা বিভ্রান্তিকর তথ্য প্রদান",
  "অসম্পূর্ণ শিক্ষাগত ও পারিবারিক তথ্য",
  "অভিভাবকের সঠিক যোগাযোগ নম্বর অনুপস্থিত",
  "কমিউনিটি নীতিমালা ও শরিয়াহ নির্দেশিকা লঙ্ঘন",
];

export default function BiodataModeration() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, hidden: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState("PENDING");
  const [genderFilter, setGenderFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Modals
  const [detail, setDetail] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [res, statsRes] = await Promise.all([
        biodataApi.list({
          status: statusTab !== "ALL" ? statusTab : undefined,
          gender: genderFilter || undefined,
          search: search.trim() || undefined,
          all: "1",
          page,
          limit: 10,
        }),
        adminApi.stats().catch(() => null),
      ]);

      setItems(res?.data || []);
      setPagination(res?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });

      if (statsRes) {
        setStats({
          total: statsRes.biodataTotal || 0,
          approved: statsRes.biodataApproved || 0,
          pending: statsRes.biodataPending || 0,
          rejected: statsRes.biodataRejected || 0,
          hidden: statsRes.biodataHidden || 0,
        });
      }
    } catch (err) {
      setError(err.message || "বায়োডাটা লোড করা যায়নি।");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [statusTab, genderFilter, search, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openDetail = async (b) => {
    setDetail(b);
    try {
      const full = await biodataApi.get(b.id);
      if (full) setDetail(full);
    } catch {
      // keep basic row
    }
  };

  const moderate = async (id, status, reason) => {
    setBusyId(id);
    try {
      const updated = await adminApi.moderate(id, status, reason);
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, status: updated.status, rejectionReason: updated.rejectionReason } : x))
      );
      if (detail?.id === id) {
        setDetail((prev) => ({ ...prev, status: updated.status, rejectionReason: updated.rejectionReason }));
      }
      setRejectTarget(null);
      setRejectReason("");
      // Refresh stats
      adminApi.stats().then((s) => {
        if (s) {
          setStats({
            total: s.biodataTotal || 0,
            approved: s.biodataApproved || 0,
            pending: s.biodataPending || 0,
            rejected: s.biodataRejected || 0,
            hidden: s.biodataHidden || 0,
          });
        }
      });
    } catch (err) {
      alert(err.message || "মডারেশন অপারেশন ব্যর্থ হয়েছে");
    } finally {
      setBusyId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return <span className="badge badge-sm badge-success gap-1 font-bold text-white">অনুমোদিত</span>;
      case "PENDING":
        return <span className="badge badge-sm badge-warning gap-1 font-bold text-white">অপেক্ষমান</span>;
      case "REJECTED":
        return <span className="badge badge-sm badge-error gap-1 font-bold text-white">বাতিল</span>;
      case "HIDDEN":
        return <span className="badge badge-sm badge-neutral gap-1 font-bold">লুকানো</span>;
      default:
        return <span className="badge badge-sm badge-ghost gap-1 font-bold">{status}</span>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-base-300">
        <div>
          <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
            <FileCheck2 className="text-[#fd6969]" size={26} />
            বায়োডাটা মডারেশন ও অনুমোদন
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            বায়োডাটার সত্যতা যাচাই, দ্রুত অনুমোদন, সংশোধন নির্দেশ বা পাবলিক তালিকা থেকে লুকানো/প্রকাশ নিয়ন্ত্রণ।
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="btn btn-sm btn-outline gap-2 font-bold hover:bg-[#fd6969] hover:border-[#fd6969]"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          রিফ্রেশ
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-gray-400">মোট বায়োডাটা</p>
          <p className="text-2xl font-black text-[#fd6969] mt-1">{bn(stats.total)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">সর্বমোট নিবন্ধিত</p>
        </div>
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-gray-400">অনুমোদিত ও লাইভ</p>
          <p className="text-2xl font-black text-green-600 mt-1">{bn(stats.approved)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">পাবলিক সার্চে দৃশ্যমান</p>
        </div>
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-gray-400">অপেক্ষমান রিভিউ</p>
          <p className="text-2xl font-black text-amber-500 mt-1">{bn(stats.pending)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">অনুমোদন প্রয়োজন</p>
        </div>
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-gray-400">বাতিল ও লুকানো</p>
          <p className="text-2xl font-black text-purple-600 mt-1">{bn(stats.rejected + stats.hidden)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">বাতিল {bn(stats.rejected)} • লুকানো {bn(stats.hidden)}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-base-100 p-3 rounded-2xl border border-gray-100 dark:border-base-300">
        <div className="flex flex-wrap items-center gap-1 bg-base-200/50 p-1 rounded-xl">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setStatusTab(t.key);
                setPage(1);
              }}
              className={`btn btn-xs rounded-lg font-bold ${
                statusTab === t.key ? "bg-[#fd6969] text-white border-none shadow-sm" : "btn-ghost text-gray-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Gender Filter */}
          <select
            value={genderFilter}
            onChange={(e) => {
              setGenderFilter(e.target.value);
              setPage(1);
            }}
            className="select select-bordered select-sm bg-base-100 text-xs focus:outline-none"
          >
            <option value="">সকল পাত্র/পাত্রী</option>
            <option value="MALE">শুধুমাত্র পাত্র</option>
            <option value="FEMALE">শুধুমাত্র পাত্রী</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="বায়োডাটা নং, নাম, জেলা বা পেশা..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="input input-bordered input-sm pl-8 w-full bg-base-100 text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error text-sm">{error}</div>}

      {/* Table Data View */}
      {loading ? (
        <div className="text-center py-20 bg-base-100 rounded-2xl border border-gray-100 dark:border-base-300">
          <span className="loading loading-spinner loading-lg text-[#fd6969]"></span>
          <p className="text-xs text-gray-400 mt-2 font-medium">বায়োডাটা তালিকা লোড হচ্ছে...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-base-100 rounded-2xl border border-dashed border-gray-300 dark:border-base-300">
          <FileCheck2 size={40} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 font-bold">কোনো বায়োডাটা পাওয়া যায়নি</p>
          <p className="text-xs text-gray-400 mt-1">ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।</p>
        </div>
      ) : (
        <div className="bg-base-100 rounded-2xl border border-gray-100 dark:border-base-300 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-base-200/60 text-xs font-bold text-gray-600 border-b border-gray-100 dark:border-base-300">
                <tr>
                  <th>প্রার্থী ও বায়োডাটা</th>
                  <th>বয়স ও উচ্চতা</th>
                  <th>পেশা ও জেলা</th>
                  <th>বৈবাহিক অবস্থা</th>
                  <th>স্ট্যাটাস</th>
                  <th className="text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-gray-100 dark:divide-base-300">
                {items.map((b) => (
                  <tr key={b.id} className="hover:bg-base-200/30 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-base-200 shrink-0 border border-gray-200">
                          {b.profileImage ? (
                            <img src={b.profileImage} alt={b.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <User size={18} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => openDetail(b)}
                            className="font-black text-sm text-left hover:text-[#fd6969] transition-colors truncate block"
                          >
                            {b.fullName}
                          </button>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="badge badge-xs bg-[#fd6969]/10 text-[#fd6969] border-none font-bold">
                              {b.biodataNo}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {b.gender === "MALE" ? "পাত্র" : "পাত্রী"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="font-semibold">{b.age ? `${bn(b.age)} বছর` : "—"}</p>
                      <p className="text-[11px] text-gray-400">{b.heightText || "—"}</p>
                    </td>
                    <td>
                      <p className="font-medium truncate max-w-[140px]">{b.occupation || "—"}</p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-0.5">
                        <MapPin size={11} /> {b.district || b.division || "—"}
                      </p>
                    </td>
                    <td>
                      <span className="font-medium">{MARITAL_LABEL[b.maritalStatus] || "—"}</span>
                    </td>
                    <td>
                      {getStatusBadge(b.status)}
                      {b.rejectionReason && (
                        <p className="text-[10px] text-red-500 truncate max-w-[120px] mt-0.5" title={b.rejectionReason}>
                          কারণ: {b.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Quick Approve */}
                        {b.status !== "APPROVED" && (
                          <button
                            disabled={busyId === b.id}
                            onClick={() => moderate(b.id, "APPROVED")}
                            className="btn btn-xs bg-green-500 hover:bg-green-600 text-white border-none gap-1 font-bold"
                            title="অনুমোদন করুন"
                          >
                            <Check size={12} /> অনুমোদন
                          </button>
                        )}

                        {/* Quick Reject */}
                        {b.status !== "REJECTED" && (
                          <button
                            disabled={busyId === b.id}
                            onClick={() => {
                              setRejectTarget(b);
                              setRejectReason(b.rejectionReason || "");
                            }}
                            className="btn btn-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 gap-1 font-bold"
                            title="বাতিল করুন"
                          >
                            <X size={12} /> বাতিল
                          </button>
                        )}

                        {/* Hide / Unhide */}
                        {b.status !== "HIDDEN" ? (
                          <button
                            disabled={busyId === b.id}
                            onClick={() => moderate(b.id, "HIDDEN")}
                            className="btn btn-xs btn-ghost text-gray-500"
                            title="পাবলিক তালিকা থেকে লুকান"
                          >
                            <EyeOff size={13} />
                          </button>
                        ) : (
                          <button
                            disabled={busyId === b.id}
                            onClick={() => moderate(b.id, "APPROVED")}
                            className="btn btn-xs btn-ghost text-green-600"
                            title="প্রকাশ করুন"
                          >
                            <Eye size={13} />
                          </button>
                        )}

                        {/* Detail modal */}
                        <button
                          onClick={() => openDetail(b)}
                          className="btn btn-xs btn-outline btn-neutral font-bold"
                        >
                          বিস্তারিত
                        </button>

                        {/* Public Link */}
                        <Link
                          href={`/details?id=${b.id}`}
                          target="_blank"
                          className="btn btn-xs btn-ghost text-gray-400 hover:text-[#fd6969]"
                          title="পাবলিক পেজ দেখুন"
                        >
                          <ExternalLink size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
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

      {/* Full-profile Detail Modal */}
      {detail && (
        <dialog open className="modal modal-open modal-bottom sm:modal-middle bg-black/40 backdrop-blur-sm z-50">
          <div className="modal-box max-w-3xl rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-base-300">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-gray-100 dark:border-base-300">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-base-200 border border-gray-200 shrink-0">
                  {detail.profileImage ? (
                    <img src={detail.profileImage} alt={detail.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <User size={24} />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-black text-xl flex items-center gap-2">
                    {detail.fullName}
                    <span className="badge badge-sm bg-[#fd6969]/10 text-[#fd6969] border-none font-bold">
                      {detail.biodataNo}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {detail.gender === "MALE" ? "পাত্রের বায়োডাটা" : "পাত্রীর বায়োডাটা"} •{" "}
                    {detail.age ? `${bn(detail.age)} বছর` : "বয়স নেই"} • {detail.district || detail.division || "—"} •{" "}
                    {detail.occupation || "—"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <X size={18} />
              </button>
            </div>

            {/* Photos */}
            <div className="py-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
                <Images size={13} /> ফটো গ্যালারি ({(detail.photos || []).length + (detail.profileImage ? 1 : 0)})
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {[detail.profileImage, ...(detail.photos || [])]
                  .filter((u, i, arr) => u && arr.indexOf(u) === i)
                  .map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="profile photo"
                      className="w-24 h-24 object-cover rounded-xl border border-gray-200 shadow-sm shrink-0"
                    />
                  ))}
                {!(detail.profileImage || (detail.photos || []).length) && (
                  <p className="text-xs text-gray-400 italic">কোনো ছবি আপলোড করা হয়নি।</p>
                )}
              </div>
            </div>

            {/* Key Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 py-3 text-xs border-t border-b border-gray-100 dark:border-base-300">
              {[
                ["ধর্ম ও মাযহাব", detail.religion],
                ["বৈবাহিক অবস্থা", MARITAL_LABEL[detail.maritalStatus] || detail.maritalStatus],
                ["উচ্চতা ও গাত্রবর্ণ", `${detail.heightText || "—"} • ${detail.skinColor || "—"}`],
                ["ওজন ও রক্তের গ্রুপ", `${detail.weight ? `${detail.weight} কেজি` : "—"} • ${detail.bloodGroup || "—"}`],
                ["শিক্ষা", detail.education],
                ["পেশা ও কর্মক্ষেত্র", detail.occupation],
                ["মাসিক আয়", detail.monthlyIncome ? `৳ ${bn(detail.monthlyIncome)}` : "গোপনীয়"],
                ["বর্তমান ঠিকানা", detail.presentAddress],
                ["স্থায়ী ঠিকানা", detail.permanentAddress],
                ["পিতার নাম ও পেশা", detail.fatherName],
                ["মাতার নাম ও পেশা", detail.motherName],
                ["অভিভাবকের মোবাইল", detail.guardianPhone || detail.phoneNumber || detail.mobile],
              ]
                .filter(([, v]) => v)
                .map(([label, val]) => (
                  <div key={label} className="flex justify-between py-1 border-b border-gray-50 dark:border-base-300">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-semibold text-right max-w-[200px] truncate">{val}</span>
                  </div>
                ))}
            </div>

            {/* About yourself */}
            {detail.aboutYourself && (
              <div className="mt-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1">নিজের সম্পর্কে</p>
                <p className="text-xs bg-base-200/60 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">
                  {detail.aboutYourself}
                </p>
              </div>
            )}

            {/* Expected partner */}
            {detail.expectedPartner && (
              <div className="mt-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1">প্রত্যাশিত জীবনসঙ্গী</p>
                <p className="text-xs bg-base-200/60 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">
                  {detail.expectedPartner}
                </p>
              </div>
            )}

            {/* Rejection Reason Notice */}
            {detail.rejectionReason && (
              <div className="mt-3 alert alert-error text-xs rounded-xl">
                <AlertTriangle size={15} />
                <span>বাতিলের কারণ: {detail.rejectionReason}</span>
              </div>
            )}

            {/* Actions */}
            <div className="modal-action flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-base-300">
              <Link
                href={`/details?id=${detail.id}`}
                target="_blank"
                className="btn btn-sm btn-ghost gap-1 font-bold text-gray-500 hover:text-[#fd6969]"
              >
                <ExternalLink size={14} /> পাবলিক পেজে দেখুন
              </Link>

              <div className="flex items-center gap-2">
                {detail.status !== "APPROVED" && (
                  <button
                    disabled={busyId === detail.id}
                    onClick={() => moderate(detail.id, "APPROVED")}
                    className="btn btn-sm bg-green-500 hover:bg-green-600 text-white border-none gap-1 font-bold"
                  >
                    <Check size={14} /> অনুমোদন ও প্রকাশ
                  </button>
                )}

                {detail.status !== "REJECTED" && (
                  <button
                    disabled={busyId === detail.id}
                    onClick={() => {
                      setRejectTarget(detail);
                      setRejectReason(detail.rejectionReason || "");
                    }}
                    className="btn btn-sm bg-red-500 hover:bg-red-600 text-white border-none gap-1 font-bold"
                  >
                    <X size={14} /> বাতিল করুন
                  </button>
                )}

                {detail.status !== "HIDDEN" ? (
                  <button
                    disabled={busyId === detail.id}
                    onClick={() => moderate(detail.id, "HIDDEN")}
                    className="btn btn-sm btn-outline gap-1 font-bold"
                  >
                    <EyeOff size={14} /> লুকান
                  </button>
                ) : (
                  <button
                    disabled={busyId === detail.id}
                    onClick={() => moderate(detail.id, "APPROVED")}
                    className="btn btn-sm btn-outline btn-success gap-1 font-bold"
                  >
                    <Eye size={14} /> প্রকাশ করুন
                  </button>
                )}

                <button onClick={() => setDetail(null)} className="btn btn-sm btn-neutral font-bold">
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setDetail(null)}>close</button>
          </form>
        </dialog>
      )}

      {/* Rejection Prompt Modal with Quick Chips */}
      {rejectTarget && (
        <dialog open className="modal modal-open modal-bottom sm:modal-middle bg-black/40 backdrop-blur-sm z-50">
          <div className="modal-box max-w-md rounded-3xl p-6 shadow-2xl">
            <h3 className="font-black text-lg text-red-600 flex items-center gap-2">
              <AlertTriangle size={20} />
              বায়োডাটা বাতিলের কারণ
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-3">
              প্রার্থীর নোটিফিকেশনে কারণটি পাঠানো হবে যাতে তিনি সংশোধন করে পুনরায় জমা দিতে পারেন।
            </p>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {QUICK_REJECT_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRejectReason(r)}
                  className="badge badge-sm badge-outline hover:badge-error text-[10px] cursor-pointer py-2.5 transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>

            <textarea
              autoFocus
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="বিস্তারিত কারণ লিখুন বা উপরের ড্রপডাউন সিলেক্ট করুন..."
              className="textarea textarea-bordered w-full text-xs focus:outline-none rounded-xl"
            />

            <div className="modal-action flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectTarget(null)}
                className="btn btn-sm btn-ghost"
              >
                ফিরে যান
              </button>
              <button
                disabled={busyId === rejectTarget.id}
                onClick={() => moderate(rejectTarget.id, "REJECTED", rejectReason.trim() || undefined)}
                className="btn btn-sm bg-red-500 hover:bg-red-600 text-white border-none font-bold"
              >
                {busyId === rejectTarget.id ? "প্রক্রিয়াধীন..." : "বাতিল নিশ্চিত করুন"}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setRejectTarget(null)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
}
