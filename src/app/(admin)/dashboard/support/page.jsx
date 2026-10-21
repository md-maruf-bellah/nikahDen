"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  MessageSquare,
  Mail,
  MailOpen,
  RefreshCw,
  Trash2,
  X,
  Phone,
  Calendar,
  Search,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle2,
  Clock,
  User,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { contactApi } from "@/lib/api";

const bn = (n) => Number(n ?? 0).toLocaleString("bn-BD");

const STATUS_TABS = [
  { key: "", label: "সকল বার্তা" },
  { key: "NEW", label: "নতুন" },
  { key: "REPLIED", label: "উত্তর দেওয়া" },
  { key: "CLOSED", label: "বন্ধ" },
];

const STATUS_STYLE = {
  NEW: { label: "নতুন বার্তা", badge: "badge-warning text-white font-bold" },
  REPLIED: { label: "উত্তর দেওয়া", badge: "badge-success text-white font-bold" },
  CLOSED: { label: "বন্ধ", badge: "badge-neutral font-bold" },
};

const CANNED_REPLIES = [
  "ধন্যবাদ! আপনার অনুসন্ধানটি আমরা পেয়েছি এবং পর্যালোচনা করছি।",
  "অনুগ্রহ করে আপনার বায়োডাটা নম্বর ও নিবন্ধিত ফোন নম্বর প্রদান করুন।",
  "আপনার অনুরোধকৃত বিষয়টি সমাধান করা হয়েছে। কোনো সমস্যা থাকলে পুনরায় জানান।",
  "আমাদের হেল্পলাইনে সরাসরি যোগাযোগের জন্য সকাল ১০টা থেকে রাত ৮টা পর্যন্ত কল করুন।",
];

export default function SupportInbox() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, newMsgs: 0, replied: 0, closed: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [res, countRes] = await Promise.all([
        contactApi.list({
          page,
          limit: 10,
          status: statusFilter || undefined,
          search: search.trim() || undefined,
        }),
        contactApi.newCount().catch(() => ({ count: 0 })),
      ]);

      const data = res?.data || [];
      setItems(data);
      const total = res?.pagination?.total || 0;
      setPagination(res?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });

      const newMsgs = Number(countRes?.count) || 0;
      setStats((prev) => ({
        ...prev,
        total: Math.max(total, prev.total),
        newMsgs,
      }));

      // Synchronize dashboard notification/badge event
      window.dispatchEvent(new CustomEvent("support:changed"));
    } catch (err) {
      setError(err.message || "বার্তা লোড করা যায়নি।");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  const loadFullStats = useCallback(async () => {
    try {
      const [allRes, newRes, repliedRes, closedRes] = await Promise.all([
        contactApi.list({ limit: 1 }),
        contactApi.list({ status: "NEW", limit: 1 }),
        contactApi.list({ status: "REPLIED", limit: 1 }),
        contactApi.list({ status: "CLOSED", limit: 1 }),
      ]);
      setStats({
        total: allRes?.pagination?.total || 0,
        newMsgs: newRes?.pagination?.total || 0,
        replied: repliedRes?.pagination?.total || 0,
        closed: closedRes?.pagination?.total || 0,
      });
    } catch {
      // keep
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadFullStats();
  }, [loadFullStats]);

  const openDetail = async (item) => {
    try {
      const doc = await contactApi.get(item.id);
      setSelected(doc || item);
      setReply(doc?.reply || item.reply || "");
    } catch {
      setSelected(item);
      setReply(item.reply || "");
    }
  };

  const changeStatus = async (id, status) => {
    setSaving(true);
    try {
      const updated = await contactApi.update(id, { status, reply: reply.trim() || undefined });
      setSelected(updated);
      setItems((prev) => prev.map((m) => (m.id === id ? updated : m)));
      loadFullStats();
    } catch (err) {
      alert(err.message || "স্ট্যাটাস পরিবর্তন করা যায়নি");
    } finally {
      setSaving(false);
    }
  };

  const saveReply = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await contactApi.update(selected.id, {
        status: "REPLIED",
        reply: reply.trim() || undefined,
      });
      setSelected(updated);
      setItems((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      loadFullStats();
      alert("উত্তর সফলভাবে সংরক্ষণ করা হয়েছে!");
    } catch (err) {
      alert(err.message || "উত্তর সংরক্ষণ করা যায়নি");
    } finally {
      setSaving(false);
    }
  };

  const removeMessage = async (id) => {
    if (!window.confirm("আপনি কি নিশ্চিত যে এই বার্তাটি মুছে ফেলতে চান?")) return;
    try {
      await contactApi.remove(id);
      setItems((prev) => prev.filter((m) => m.id !== id));
      if (selected?.id === id) setSelected(null);
      loadFullStats();
    } catch (err) {
      alert(err.message || "মুছে ফেলা যায়নি");
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-base-300">
        <div>
          <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
            <MessageSquare className="text-[#fd6969]" size={26} />
            সাপোর্ট ইনবক্স ও হেল্পডেস্ক
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            ব্যবহারকারী ও আগ্রহীদের পাঠানো বার্তা, পরামর্শ, অভিযোগ ও উত্তর ব্যবস্থাপনা।
          </p>
        </div>

        <button
          onClick={() => {
            loadData();
            loadFullStats();
          }}
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
          <p className="text-[11px] font-bold uppercase text-gray-400">মোট বার্তা</p>
          <p className="text-2xl font-black text-[#fd6969] mt-1">{bn(stats.total)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">সর্বমোট ইনকোয়ারি</p>
        </div>
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-gray-400">নতুন বার্তা</p>
          <p className="text-2xl font-black text-amber-500 mt-1">{bn(stats.newMsgs)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">উত্তর দেওয়া প্রয়োজন</p>
        </div>
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-gray-400">উত্তর প্রদানকৃত</p>
          <p className="text-2xl font-black text-green-600 mt-1">{bn(stats.replied)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">যথাযথভাবে উত্তর সম্পন্ন</p>
        </div>
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-gray-400">বন্ধ ও সমাধানকৃত</p>
          <p className="text-2xl font-black text-gray-500 mt-1">{bn(stats.closed)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">আর্কাইভ বার্তা</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-base-100 p-3 rounded-2xl border border-gray-100 dark:border-base-300">
        <div className="flex flex-wrap items-center gap-1 bg-base-200/50 p-1 rounded-xl">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setStatusFilter(t.key);
                setPage(1);
              }}
              className={`btn btn-xs rounded-lg font-bold ${
                statusFilter === t.key ? "bg-[#fd6969] text-white border-none shadow-sm" : "btn-ghost text-gray-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="নাম, ইমেইল বা ফোন দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input input-bordered input-sm pl-8 w-full bg-base-100 text-xs focus:outline-none"
          />
        </div>
      </div>

      {error && <div className="alert alert-error text-sm">{error}</div>}

      {/* Table Data View */}
      {loading ? (
        <div className="text-center py-20 bg-base-100 rounded-2xl border border-gray-100 dark:border-base-300">
          <span className="loading loading-spinner loading-lg text-[#fd6969]"></span>
          <p className="text-xs text-gray-400 mt-2 font-medium">বার্তা তালিকা লোড হচ্ছে...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-base-100 rounded-2xl border border-dashed border-gray-300 dark:border-base-300">
          <Inbox size={40} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 font-bold">কোনো বার্তা নেই</p>
          <p className="text-xs text-gray-400 mt-1">ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।</p>
        </div>
      ) : (
        <div className="bg-base-100 rounded-2xl border border-gray-100 dark:border-base-300 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-base-200/60 text-xs font-bold text-gray-600 border-b border-gray-100 dark:border-base-300">
                <tr>
                  <th>প্রেরক</th>
                  <th>যোগাযোগ</th>
                  <th>বার্তার বিবরণ</th>
                  <th>স্ট্যাটাস</th>
                  <th>তারিখ</th>
                  <th className="text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-gray-100 dark:divide-base-300">
                {items.map((m) => {
                  const s = STATUS_STYLE[m.status] || { label: m.status, badge: "badge-ghost font-bold" };
                  return (
                    <tr
                      key={m.id}
                      onClick={() => openDetail(m)}
                      className="hover:bg-base-200/30 transition-colors cursor-pointer"
                    >
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                            m.status === "NEW" ? "bg-amber-100 text-amber-700" : "bg-base-200 text-gray-600"
                          }`}>
                            {m.firstName ? m.firstName.charAt(0).toUpperCase() : <User size={14} />}
                          </div>
                          <div>
                            <p className="font-bold text-xs">
                              {m.firstName} {m.lastName}
                            </p>
                            {m.subject && (
                              <p className="text-[10px] text-gray-400 truncate max-w-[130px]">{m.subject}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="font-mono text-xs">{m.email}</p>
                        {m.phone && <p className="text-[11px] text-gray-400 mt-0.5">{m.phone}</p>}
                      </td>
                      <td>
                        <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-1 max-w-[280px]">
                          {m.message}
                        </p>
                        {m.reply && (
                          <p className="text-[10px] text-green-600 truncate max-w-[280px] mt-0.5">
                            উত্তর: {m.reply}
                          </p>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-sm ${s.badge}`}>{s.label}</span>
                      </td>
                      <td className="text-gray-500 whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleDateString("bn-BD", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openDetail(m)}
                            className="btn btn-xs bg-base-200 hover:bg-[#fd6969] hover:text-white border-none font-bold"
                          >
                            উত্তর দিন
                          </button>
                          <button
                            onClick={() => removeMessage(m.id)}
                            className="btn btn-xs btn-ghost text-gray-400 hover:text-red-500"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={13} />
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

      {/* Interactive Detail & Reply Modal */}
      {selected && (
        <dialog open className="modal modal-open modal-bottom sm:modal-middle bg-black/40 backdrop-blur-sm z-50">
          <div className="modal-box max-w-2xl rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-base-300">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-gray-100 dark:border-base-300">
              <div>
                <h3 className="font-black text-xl flex items-center gap-2">
                  {selected.firstName} {selected.lastName}
                  <span className={`badge badge-sm ${STATUS_STYLE[selected.status]?.badge || "badge-ghost"}`}>
                    {STATUS_STYLE[selected.status]?.label || selected.status}
                  </span>
                </h3>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Mail size={12} /> {selected.email}
                  </span>
                  {selected.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} /> {selected.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />{" "}
                    {new Date(selected.createdAt).toLocaleString("bn-BD", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="btn btn-sm btn-circle btn-ghost">
                <X size={18} />
              </button>
            </div>

            {/* Message Body */}
            <div className="py-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                ব্যবহারকারীর বার্তা:
              </p>
              <div className="bg-base-200/60 rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap border border-gray-100 dark:border-base-300">
                {selected.message}
              </div>
            </div>

            {/* Quick Canned Replies */}
            <div className="mb-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1.5 flex items-center gap-1">
                <Sparkles size={12} className="text-[#fd6969]" /> দ্রুত উত্তরের টেমপ্লেট:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CANNED_REPLIES.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setReply(c)}
                    className="badge badge-sm badge-outline hover:badge-primary text-[10px] cursor-pointer py-2.5 transition-colors"
                  >
                    {c.slice(0, 35)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Reply Input */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                অ্যাডমিন উত্তর (সংরক্ষিত থাকবে):
              </label>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
                placeholder="ব্যবহারকারীর বার্তার উত্তর এখানে লিখুন..."
                className="textarea textarea-bordered w-full text-xs focus:outline-none rounded-xl"
              />
            </div>

            {/* Status Change Buttons & Actions */}
            <div className="modal-action flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-gray-100 dark:border-base-300">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400 font-bold">স্ট্যাটাস:</span>
                <button
                  disabled={saving || selected.status === "NEW"}
                  onClick={() => changeStatus(selected.id, "NEW")}
                  className="btn btn-xs btn-outline btn-warning"
                >
                  নতুন
                </button>
                <button
                  disabled={saving || selected.status === "CLOSED"}
                  onClick={() => changeStatus(selected.id, "CLOSED")}
                  className="btn btn-xs btn-outline btn-neutral"
                >
                  বন্ধ
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={saving}
                  onClick={saveReply}
                  className="btn btn-sm bg-[#fd6969] hover:bg-[#e05858] text-white border-none gap-1 font-bold"
                >
                  <Send size={13} />
                  {saving ? "সংরক্ষণ হচ্ছে..." : "উত্তর সংরক্ষণ করুন"}
                </button>
                <button onClick={() => setSelected(null)} className="btn btn-sm btn-ghost">
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setSelected(null)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
}
