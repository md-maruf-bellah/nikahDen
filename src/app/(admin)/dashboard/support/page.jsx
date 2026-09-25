"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Mail, MailOpen, RefreshCw, Trash2, X, Phone, Calendar, Search, Inbox } from "lucide-react";
import { contactApi } from "@/lib/api";

const STATUS_STYLE = {
  NEW: { label: "নতুন", cls: "bg-orange-100 text-orange-700 ring-orange-200" },
  REPLIED: { label: "উত্তর দেওয়া", cls: "bg-green-100 text-green-700 ring-green-200" },
  CLOSED: { label: "বন্ধ", cls: "bg-gray-100 text-gray-600 ring-gray-200" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || { label: status, cls: "bg-gray-100 text-gray-600 ring-gray-200" };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ring-1 ${s.cls}`}>
      {s.label}
    </span>
  );
};

const SupportInbox = () => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await contactApi.list({
        page,
        limit: 10,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setItems(res?.data || []);
      setPagination(res?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
    } catch (err) {
      setError(err.message || "বার্তা লোড করা যায়নি।");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) return load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const openDetail = async (item) => {
    try {
      const doc = await contactApi.get(item.id);
      setSelected(doc);
      setReply(doc.reply || "");
    } catch {
      setSelected(item); // fall back to the list row data
    }
  };

  const changeStatus = async (id, status) => {
    setSaving(true);
    try {
      const updated = await contactApi.update(id, { status, reply: reply || undefined });
      setSelected(updated);
      setItems((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (err) {
      window.alert(err.message || "আপডেট করা যায়নি");
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
        reply: reply || undefined,
      });
      setSelected(updated);
      setItems((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (err) {
      window.alert(err.message || "উত্তর সংরক্ষণ করা যায়নি");
    } finally {
      setSaving(false);
    }
  };

  const removeMessage = async (id) => {
    if (!window.confirm("এই বার্তাটি মুছে ফেলবেন?")) return;
    try {
      await contactApi.remove(id);
      setItems((prev) => prev.filter((m) => m.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      window.alert(err.message || "মুছে ফেলা যায়নি");
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black tracking-tighter">সাপোর্ট ইনবক্স</h2>
          <p className="text-xs text-gray-400 mt-1">
            কন্টাক্ট ফর্ম থেকে আসা বার্তা — মোট {pagination.total} টি
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="নাম/ইমেইল/ফোন খুঁজুন..."
              className="input input-bordered input-sm w-60 pl-9 focus:outline-none"
            />
          </div>
          <select
            className="select select-bordered select-sm focus:outline-none"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">সব স্ট্যাটাস</option>
            <option value="NEW">নতুন</option>
            <option value="REPLIED">উত্তর দেওয়া</option>
            <option value="CLOSED">বন্ধ</option>
          </select>
          <button onClick={load} className="btn btn-sm btn-outline gap-2">
            <RefreshCw size={14} /> রিফ্রেশ
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error text-sm mb-4">{error}</div>}

      {loading ? (
        <div className="text-center py-20">
          <span className="loading loading-spinner loading-lg text-red-400"></span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-gray-300 rounded-xl">
          <Inbox size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">কোনো বার্তা নেই।</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <div
              key={m.id}
              className={`card bg-base-100 border shadow-sm hover:shadow transition-all p-4 cursor-pointer ${
                m.status === "NEW" ? "border-orange-200" : "border-gray-100"
              }`}
              onClick={() => openDetail(m)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {m.status === "NEW" ? (
                    <Mail className="text-orange-500 shrink-0 mt-0.5" size={18} />
                  ) : (
                    <MailOpen className="text-gray-400 shrink-0 mt-0.5" size={18} />
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{m.email}</p>
                    <p className="text-sm mt-1 line-clamp-1 text-gray-600">{m.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={m.status} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMessage(m.id);
                    }}
                    className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition-all"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            className="btn btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            «
          </button>
          <span className="text-xs text-gray-400">
            পৃষ্ঠা {pagination.page} / {pagination.totalPages}
          </span>
          <button
            className="btn btn-sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            »
          </button>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-black text-lg">
                  {selected.firstName} {selected.lastName}
                </h3>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Mail size={12} /> {selected.email}
                  </span>
                  {selected.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} /> {selected.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(selected.createdAt).toLocaleString("bn-BD", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selected.status} />
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="py-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">
                বার্তা
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap bg-base-200 rounded-lg p-4">
                {selected.message}
              </p>
            </div>

            <div className="pb-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">
                অ্যাডমিন উত্তর
              </p>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="অভ্যন্তরীণ উত্তর/নোট লিখুন..."
                className="textarea textarea-bordered w-full focus:outline-none text-sm"
              />
              {selected.repliedAt && (
                <p className="text-[11px] text-gray-400 mt-1">
                  সর্বশেষ হাতে নেওয়া হয়েছে:{" "}
                  {new Date(selected.repliedAt).toLocaleString("bn-BD", {
                    day: "numeric",
                    month: "long",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>

            <div className="modal-action">
              <div className="flex flex-wrap items-center gap-2 w-full justify-between">
                <div className="flex gap-2">
                  <button
                    disabled={saving || selected.status === "REPLIED"}
                    onClick={() => changeStatus(selected.id, "REPLIED")}
                    className="btn btn-sm bg-green-500 hover:bg-green-600 border-none text-white"
                  >
                    উত্তর দেওয়া হয়েছে
                  </button>
                  <button
                    disabled={saving || selected.status === "CLOSED"}
                    onClick={() => changeStatus(selected.id, "CLOSED")}
                    className="btn btn-sm btn-outline"
                  >
                    বন্ধ করুন
                  </button>
                  {selected.status !== "NEW" && (
                    <button
                      disabled={saving}
                      onClick={() => changeStatus(selected.id, "NEW")}
                      className="btn btn-sm btn-ghost"
                    >
                      নতুন করুন
                    </button>
                  )}
                </div>
                <button
                  disabled={saving}
                  onClick={saveReply}
                  className="btn btn-sm bg-red-500 hover:bg-red-600 border-none text-white"
                >
                  {saving ? "সংরক্ষণ হচ্ছে..." : "উত্তর সংরক্ষণ করুন"}
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
};

export default SupportInbox;
