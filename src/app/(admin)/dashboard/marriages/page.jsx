"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  HeartHandshake,
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Phone,
  Calendar,
  AlertCircle,
  Save,
  Trash2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { marriageApi } from "@/lib/api";

const bn = (n) => Number(n ?? 0).toLocaleString("bn-BD");

export default function AdminMarriagesPage() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, hiddenProfiles: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  // Modals
  const [detailModalItem, setDetailModalItem] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    groomName: "",
    groomBiodataNo: "",
    groomPhone: "",
    brideName: "",
    brideBiodataNo: "",
    bridePhone: "",
    marriageDate: new Date().toISOString().split("T")[0],
    story: "",
    status: "VERIFIED",
    groomHidden: true,
    brideHidden: true,
    isPublicSuccessStory: true,
    adminNotes: "",
  });
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await marriageApi.adminList({
        page,
        limit: 10,
        status: statusTab !== "ALL" ? statusTab : undefined,
        q: search || undefined,
      });
      // API returns sendSuccess(res, msg, { items, stats }, pagination)
      const data = res?.data || {};
      setItems(Array.isArray(data.items) ? data.items : []);
      if (data.stats) setStats(data.stats);
      setPagination(res?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusTab, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleHide = async (item, target) => {
    // target is 'groom' or 'bride'
    setBusyId(item.id + target);
    try {
      const payload = {};
      if (target === "groom") payload.groomHidden = !item.groomHidden;
      if (target === "bride") payload.brideHidden = !item.brideHidden;

      const updated = await marriageApi.adminUpdate(item.id, payload);
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, ...updated } : x)));
      if (detailModalItem?.id === item.id) {
        setDetailModalItem((prev) => ({ ...prev, ...updated }));
      }
    } catch (err) {
      alert(err.message || "দৃশ্যমানতা পরিবর্তন করা যায়নি।");
    } finally {
      setBusyId(null);
    }
  };

  const handleUpdateStatus = async (item, newStatus) => {
    setBusyId(item.id);
    try {
      const updated = await marriageApi.adminUpdate(item.id, { status: newStatus });
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, ...updated } : x)));
      if (detailModalItem?.id === item.id) {
        setDetailModalItem((prev) => ({ ...prev, ...updated }));
      }
    } catch (err) {
      alert(err.message || "স্ট্যাটাস পরিবর্তন করা যায়নি।");
    } finally {
      setBusyId(null);
    }
  };

  const handleTogglePublicStory = async (item) => {
    setBusyId(item.id);
    try {
      const updated = await marriageApi.adminUpdate(item.id, {
        isPublicSuccessStory: !item.isPublicSuccessStory,
      });
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, ...updated } : x)));
    } catch (err) {
      alert(err.message || "আপডেট করা যায়নি।");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("আপনি কি নিশ্চিত যে এই রেকর্ডটি মুছে ফেলতে চান? সংশ্লিষ্ট বায়োডাটাগুলোর হাইড স্ট্যাটাস পুনরায় সক্রিয় হবে।")) {
      return;
    }
    setBusyId(id);
    try {
      await marriageApi.adminDelete(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      if (detailModalItem?.id === id) setDetailModalItem(null);
      await loadData();
    } catch (err) {
      alert(err.message || "মুছে ফেলা যায়নি।");
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await marriageApi.adminCreate(createForm);
      setShowCreateModal(false);
      setCreateForm({
        groomName: "",
        groomBiodataNo: "",
        groomPhone: "",
        brideName: "",
        brideBiodataNo: "",
        bridePhone: "",
        marriageDate: new Date().toISOString().split("T")[0],
        story: "",
        status: "VERIFIED",
        groomHidden: true,
        brideHidden: true,
        isPublicSuccessStory: true,
        adminNotes: "",
      });
      await loadData();
    } catch (err) {
      alert(err.message || "বিবাহ রেকর্ড তৈরি করা যায়নি।");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header & KPI Summary Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-base-300">
        <div>
          <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
            <HeartHandshake className="text-[#fd6969]" size={26} />
            সফল বিবাহ ও বিবাহিত জুটি ব্যবস্থাপনা
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            যে সকল সদস্য বিবাহ চূড়ান্ত করেছেন তাদের রেকর্ড, আইডি হাইড স্ট্যাটাস ও সফল জুটির বিবরণ।
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-sm bg-[#fd6969] hover:bg-[#e05858] text-white border-none gap-2 font-bold shadow-sm"
        >
          <Plus size={16} />
          নতুন বিবাহ যোগ করুন
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-gray-400">মোট সফল বিবাহ</p>
          <p className="text-2xl font-black text-[#fd6969] mt-1">{bn(stats.total)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">নিবন্ধিত দম্পতি</p>
        </div>
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-gray-400">ভেরিফাইড বিবাহ</p>
          <p className="text-2xl font-black text-green-600 mt-1">{bn(stats.verified)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">যাচাইকৃত জুটি</p>
        </div>
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-gray-400">অপেক্ষমান রিভিউ</p>
          <p className="text-2xl font-black text-amber-500 mt-1">{bn(stats.pending)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">নতুন আবেদন</p>
        </div>
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-gray-400">হাইডকৃত প্রোফাইল</p>
          <p className="text-2xl font-black text-purple-600 mt-1">{bn(stats.hiddenProfiles)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">সার্চ থেকে লুকানো</p>
        </div>
      </div>

      {/* Search, Filter Tabs & Refresh */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-base-100 p-3 rounded-2xl border border-gray-100 dark:border-base-300">
        <div className="flex items-center gap-1 bg-base-200/50 p-1 rounded-xl w-full sm:w-auto">
          {["ALL", "VERIFIED", "PENDING_VERIFICATION"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusTab(st);
                setPage(1);
              }}
              className={`btn btn-xs rounded-lg font-bold ${
                statusTab === st ? "bg-[#fd6969] text-white border-none shadow-sm" : "btn-ghost text-gray-600"
              }`}
            >
              {st === "ALL" ? "সকল বিবাহ" : st === "VERIFIED" ? "ভেরিফাইড" : "অপেক্ষমান"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="বর, কনে বা বায়োডাটা নং..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="input input-bordered input-sm pl-8 w-full bg-base-100 text-xs"
            />
          </div>

          <button onClick={loadData} className="btn btn-sm btn-ghost btn-square" title="রিফ্রেশ">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Couples Table */}
      <div className="overflow-x-auto bg-base-100 rounded-2xl border border-gray-100 dark:border-base-300">
        <table className="table w-full">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-100 dark:border-base-300 bg-base-200/30">
              <th>বর (Groom)</th>
              <th>কনে (Bride)</th>
              <th>বিবাহের তারিখ</th>
              <th>স্ট্যাটাস</th>
              <th>হোমপেজ ফিচার</th>
              <th className="text-center">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <Loader2 className="animate-spin mx-auto text-[#fd6969]" size={24} />
                  <p className="text-xs text-gray-400 mt-2">লোড হচ্ছে...</p>
                </td>
              </tr>
            )}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-16 text-gray-400">
                  <HeartHandshake size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">কোনো বিবাহ রেকর্ড পাওয়া যায়নি।</p>
                </td>
              </tr>
            )}

            {!loading &&
              items.map((it) => (
                <tr key={it.id} className="hover:bg-gray-50/50 dark:hover:bg-base-200/50 transition-colors border-b border-gray-50 dark:border-base-300">
                  {/* Groom */}
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div>
                        <p className="font-bold text-sm text-base-content">{it.groomName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {it.groomBiodataNo ? (
                            <Link
                              href={`/details?id=${it.groomBiodata?._id || it.groomBiodata || ""}`}
                              className="text-[11px] font-mono text-[#fd6969] hover:underline"
                            >
                              {it.groomBiodataNo}
                            </Link>
                          ) : (
                            <span className="text-[10px] text-gray-400">অফলাইন</span>
                          )}
                          <span
                            onClick={() => handleToggleHide(it, "groom")}
                            title={it.groomHidden ? "বায়োডাটা হাইড আছে (ক্লিক করে সক্রিয় করুন)" : "বায়োডাটা সক্রিয় আছে (ক্লিক করে হাইড করুন)"}
                            className={`badge badge-xs cursor-pointer ${
                              it.groomHidden ? "badge-error text-white" : "badge-success text-white"
                            }`}
                          >
                            {it.groomHidden ? "হাইড" : "উন্মুক্ত"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Bride */}
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div>
                        <p className="font-bold text-sm text-base-content">{it.brideName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {it.brideBiodataNo ? (
                            <Link
                              href={`/details?id=${it.brideBiodata?._id || it.brideBiodata || ""}`}
                              className="text-[11px] font-mono text-[#fd6969] hover:underline"
                            >
                              {it.brideBiodataNo}
                            </Link>
                          ) : (
                            <span className="text-[10px] text-gray-400">অফলাইন</span>
                          )}
                          <span
                            onClick={() => handleToggleHide(it, "bride")}
                            title={it.brideHidden ? "বায়োডাটা হাইড আছে (ক্লিক করে সক্রিয় করুন)" : "বায়োডাটা সক্রিয় আছে (ক্লিক করে হাইড করুন)"}
                            className={`badge badge-xs cursor-pointer ${
                              it.brideHidden ? "badge-error text-white" : "badge-success text-white"
                            }`}
                          >
                            {it.brideHidden ? "হাইড" : "উন্মুক্ত"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="text-xs text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1">
                      <Calendar size={13} className="text-gray-400" />
                      <span>{it.marriageDate ? new Date(it.marriageDate).toLocaleDateString("bn-BD") : "—"}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    <span
                      onClick={() => handleUpdateStatus(it, it.status === "VERIFIED" ? "PENDING_VERIFICATION" : "VERIFIED")}
                      className={`badge badge-sm font-bold cursor-pointer ${
                        it.status === "VERIFIED"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-amber-100 text-amber-700 border-amber-200"
                      }`}
                      title="ক্লিক করে স্ট্যাটাস পরিবর্তন করুন"
                    >
                      {it.status === "VERIFIED" ? "✓ ভেরিফাইড" : "অপেক্ষমান"}
                    </span>
                  </td>

                  {/* Featured */}
                  <td>
                    <input
                      type="checkbox"
                      checked={it.isPublicSuccessStory}
                      onChange={() => handleTogglePublicStory(it)}
                      className="checkbox checkbox-xs checkbox-primary"
                      title="হোমপেজে গল্প প্রদর্শন"
                    />
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setDetailModalItem(it)}
                        className="btn btn-xs btn-outline border-gray-300 hover:border-[#fd6969] hover:bg-[#fd6969] hover:text-white"
                      >
                        বিস্তারিত
                      </button>
                      <button
                        onClick={() => handleDelete(it.id)}
                        disabled={busyId === it.id}
                        className="btn btn-xs btn-ghost text-error"
                        title="মুছুন"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
          <span>মোট {bn(pagination.total)} টি রেকর্ডের মধ্যে পৃষ্ঠা {bn(pagination.page)} / {bn(pagination.totalPages)}</span>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn btn-xs btn-outline"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="btn btn-xs btn-outline"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModalItem && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setDetailModalItem(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-[#fd6969] flex items-center justify-center">
                <HeartHandshake size={22} />
              </div>
              <div>
                <h3 className="font-bold text-lg">বিবাহের পূর্ণাঙ্গ বিবরণ ও রিভিউ</h3>
                <p className="text-xs text-gray-400">আইডি: {detailModalItem.id}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-base-200/50">
                <div>
                  <p className="font-bold text-gray-500">বর:</p>
                  <p className="text-sm font-bold text-base-content">{detailModalItem.groomName}</p>
                  <p className="text-gray-400 font-mono">{detailModalItem.groomBiodataNo || "বায়োডাটা নম্বর নেই"}</p>
                  <p className="text-gray-400">{detailModalItem.groomPhone || "ফোন নেই"}</p>
                  <p className="mt-1 font-semibold text-[#fd6969]">
                    বায়োডাটা: {detailModalItem.groomHidden ? "হাইড করা" : "উন্মুক্ত"}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-gray-500">কনে:</p>
                  <p className="text-sm font-bold text-base-content">{detailModalItem.brideName}</p>
                  <p className="text-gray-400 font-mono">{detailModalItem.brideBiodataNo || "বায়োডাটা নম্বর নেই"}</p>
                  <p className="text-gray-400">{detailModalItem.bridePhone || "ফোন নেই"}</p>
                  <p className="mt-1 font-semibold text-[#fd6969]">
                    বায়োডাটা: {detailModalItem.brideHidden ? "হাইড করা" : "উন্মুক্ত"}
                  </p>
                </div>
              </div>

              {detailModalItem.story && (
                <div className="p-3 rounded-xl bg-base-200/30 border border-gray-100">
                  <p className="font-bold text-gray-500 mb-1">দম্পতির গল্প / বক্তব্য:</p>
                  <p className="text-gray-600 leading-relaxed italic">"{detailModalItem.story}"</p>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-xl bg-base-200/30">
                <span className="font-bold text-gray-500">স্ট্যাটাস:</span>
                <span className="badge badge-sm font-bold bg-green-100 text-green-700">
                  {detailModalItem.status}
                </span>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block font-bold text-gray-500 mb-1">অ্যাডমিন নোটস:</label>
                <textarea
                  rows={2}
                  defaultValue={detailModalItem.adminNotes || ""}
                  onBlur={(e) => {
                    marriageApi.adminUpdate(detailModalItem.id, { adminNotes: e.target.value });
                  }}
                  placeholder="অ্যাডমিনের অভ্যন্তরীণ মন্তব্য লিখুন (স্বয়ংক্রিয় সংরক্ষণ)..."
                  className="textarea textarea-bordered w-full text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => handleToggleHide(detailModalItem, "groom")}
                  className="btn btn-xs btn-outline"
                >
                  বরের বায়োডাটা {detailModalItem.groomHidden ? "আনহাইড" : "হাইড"}
                </button>
                <button
                  onClick={() => handleToggleHide(detailModalItem, "bride")}
                  className="btn btn-xs btn-outline"
                >
                  কনের বায়োডাটা {detailModalItem.brideHidden ? "আনহাইড" : "হাইড"}
                </button>
                <button
                  onClick={() => setDetailModalItem(null)}
                  className="btn btn-xs bg-[#fd6969] text-white"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-[#fd6969] flex items-center justify-center">
                <Plus size={22} />
              </div>
              <div>
                <h3 className="font-bold text-lg">নতুন বিবাহ রেকর্ড যোগ করুন</h3>
                <p className="text-xs text-gray-400">অফলাইন বা সরাসরি নিশ্চিত হওয়া বিবাহ অন্তর্ভুক্ত করুন</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">বরের নাম *</label>
                  <input
                    type="text"
                    required
                    value={createForm.groomName}
                    onChange={(e) => setCreateForm({ ...createForm, groomName: e.target.value })}
                    className="input input-bordered input-sm w-full"
                    placeholder="বরের পূর্ণ নাম"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">বরের বায়োডাটা নম্বর</label>
                  <input
                    type="text"
                    value={createForm.groomBiodataNo}
                    onChange={(e) => setCreateForm({ ...createForm, groomBiodataNo: e.target.value })}
                    className="input input-bordered input-sm w-full"
                    placeholder="NKD-2026-XXXXXX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">কনের নাম *</label>
                  <input
                    type="text"
                    required
                    value={createForm.brideName}
                    onChange={(e) => setCreateForm({ ...createForm, brideName: e.target.value })}
                    className="input input-bordered input-sm w-full"
                    placeholder="কনের পূর্ণ নাম"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">কনের বায়োডাটা নম্বর</label>
                  <input
                    type="text"
                    value={createForm.brideBiodataNo}
                    onChange={(e) => setCreateForm({ ...createForm, brideBiodataNo: e.target.value })}
                    className="input input-bordered input-sm w-full"
                    placeholder="NKD-2026-XXXXXX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">বিবাহের তারিখ</label>
                  <input
                    type="date"
                    value={createForm.marriageDate}
                    onChange={(e) => setCreateForm({ ...createForm, marriageDate: e.target.value })}
                    className="input input-bordered input-sm w-full"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">স্ট্যাটাস</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    className="select select-bordered select-sm w-full"
                  >
                    <option value="VERIFIED">VERIFIED (যাচাইকৃত)</option>
                    <option value="PENDING_VERIFICATION">PENDING (অপেক্ষমান)</option>
                    <option value="COMPLETED">COMPLETED (সম্পন্ন)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">সাফল্যের গল্প / মন্তব্য</label>
                <textarea
                  rows={2}
                  value={createForm.story}
                  onChange={(e) => setCreateForm({ ...createForm, story: e.target.value })}
                  className="textarea textarea-bordered w-full text-xs"
                  placeholder="কীভাবে বিবাহ সম্পন্ন হলো..."
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createForm.groomHidden}
                    onChange={(e) => setCreateForm({ ...createForm, groomHidden: e.target.checked })}
                    className="checkbox checkbox-xs checkbox-primary"
                  />
                  <span>বরের বায়োডাটা পাবলিক সার্চ থেকে হাইড করুন</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createForm.brideHidden}
                    onChange={(e) => setCreateForm({ ...createForm, brideHidden: e.target.checked })}
                    className="checkbox checkbox-xs checkbox-primary"
                  />
                  <span>কনের বায়োডাটা পাবলিক সার্চ থেকে হাইড করুন</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-sm btn-ghost"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-sm bg-[#fd6969] text-white hover:bg-[#e05858] font-bold"
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : "সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
