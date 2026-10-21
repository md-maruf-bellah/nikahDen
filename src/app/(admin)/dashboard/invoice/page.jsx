"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  CreditCard,
  Receipt,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Printer,
  Download,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";
import { orderApi, adminApi } from "@/lib/api";

const bn = (n) => Number(n ?? 0).toLocaleString("bn-BD");
const taka = (n) => `৳ ${Number(n ?? 0).toLocaleString("bn-BD")}`;

const STATUS_TABS = [
  { key: "", label: "সকল অর্ডার" },
  { key: "PAID", label: "পরিশোধিত" },
  { key: "PENDING", label: "অপেক্ষমান" },
  { key: "FAILED", label: "ব্যর্থ" },
  { key: "CANCELLED", label: "বাতিল" },
];

const STATUS_STYLE = {
  PAID: { label: "পরিশোধিত", badge: "badge-success text-white font-bold" },
  PENDING: { label: "অপেক্ষমান", badge: "badge-warning text-white font-bold" },
  FAILED: { label: "ব্যর্থ", badge: "badge-error text-white font-bold" },
  CANCELLED: { label: "বাতিল", badge: "badge-neutral font-bold" },
};

export default function InvoiceAdmin() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ revenue: 0, paid: 0, pending: 0, failed: 0, total: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [res, statsRes] = await Promise.all([
        orderApi.adminList({
          page,
          limit: 10,
          status: statusFilter || undefined,
          kind: kindFilter || undefined,
          search: search.trim() || undefined,
        }),
        adminApi.stats().catch(() => null),
      ]);

      setItems(res?.data || []);
      setPagination(res?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });

      if (statsRes) {
        setStats({
          revenue: statsRes.revenueTotal || 0,
          paid: statsRes.paidOrders || 0,
          pending: statsRes.ordersPending || 0,
          failed: statsRes.ordersFailed || 0,
          total: (statsRes.paidOrders || 0) + (statsRes.ordersPending || 0) + (statsRes.ordersFailed || 0),
        });
      }
    } catch (err) {
      setError(err.message || "অর্ডার লোড করা যায়নি।");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, kindFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-base-300">
        <div>
          <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
            <CreditCard className="text-[#fd6969]" size={26} />
            অর্ডার, ইনভয়েস ও পেমেন্ট অডিট
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            সকল মেম্বারশিপ প্ল্যান ও কানেক্ট প্যাক অর্ডারের হিসাব, ট্রানজেকশন আইডি ও লাইভ রেভিনিউ অডিট।
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
          <p className="text-[11px] font-bold uppercase text-gray-400">মোট পরিশোধিত আয়</p>
          <p className="text-2xl font-black text-green-600 mt-1">{taka(stats.revenue)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">লাইভ পেমেন্ট গেটওয়ে</p>
        </div>
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-gray-400">সফল অর্ডার (PAID)</p>
          <p className="text-2xl font-black text-[#fd6969] mt-1">{bn(stats.paid)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">সফল লেনদেন</p>
        </div>
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-gray-400">অপেক্ষমান অর্ডার</p>
          <p className="text-2xl font-black text-amber-500 mt-1">{bn(stats.pending)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">পেমেন্ট পেন্ডিং</p>
        </div>
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-gray-400">ব্যর্থ ও বাতিল</p>
          <p className="text-2xl font-black text-gray-500 mt-1">{bn(stats.failed)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">ব্যর্থ বা বাতিলকৃত</p>
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Kind Filter */}
          <select
            className="select select-bordered select-sm bg-base-100 text-xs focus:outline-none"
            value={kindFilter}
            onChange={(e) => {
              setKindFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">সকল ধরন</option>
            <option value="PLAN">মেম্বারশিপ প্ল্যান</option>
            <option value="PACK">কানেক্ট প্যাক</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="অর্ডার নং, ইনভয়েস বা কাস্টমার..."
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
          <p className="text-xs text-gray-400 mt-2 font-medium">অর্ডার তালিকা লোড হচ্ছে...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-base-100 rounded-2xl border border-dashed border-gray-300 dark:border-base-300">
          <Receipt size={40} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 font-bold">কোনো অর্ডার পাওয়া যায়নি</p>
          <p className="text-xs text-gray-400 mt-1">ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।</p>
        </div>
      ) : (
        <div className="bg-base-100 rounded-2xl border border-gray-100 dark:border-base-300 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-base-200/60 text-xs font-bold text-gray-600 border-b border-gray-100 dark:border-base-300">
                <tr>
                  <th>অর্ডার ও ইনভয়েস</th>
                  <th>কাস্টমার বিবরণ</th>
                  <th>প্যাকেজ / আইটেম</th>
                  <th>পরিশোধিত টাকা</th>
                  <th>পেমেন্ট গেটওয়ে</th>
                  <th>স্ট্যাটাস</th>
                  <th className="text-right">ইনভয়েস</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-gray-100 dark:divide-base-300">
                {items.map((o) => {
                  const s = STATUS_STYLE[o.status] || { label: o.status, badge: "badge-ghost font-bold" };
                  return (
                    <tr key={o.id} className="hover:bg-base-200/30 transition-colors">
                      <td>
                        <p className="font-black text-sm text-gray-800 dark:text-gray-100">{o.orderNo}</p>
                        {o.invoiceNo ? (
                          <span className="badge badge-xs bg-base-200 text-gray-500 border-none font-mono">
                            {o.invoiceNo}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">—</span>
                        )}
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(o.createdAt).toLocaleDateString("bn-BD", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center text-gray-500 font-bold shrink-0">
                            {o.customer?.name ? o.customer.name.charAt(0).toUpperCase() : <User size={14} />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs truncate max-w-[150px]">{o.customer?.name || "—"}</p>
                            <p className="text-[11px] text-gray-400 truncate max-w-[150px]">{o.customer?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="font-bold text-xs">{o.item?.titleBn || o.item?.title}</p>
                        <span className={`badge badge-xs ${o.kind === "PLAN" ? "badge-primary" : "badge-secondary"} badge-outline mt-0.5 font-bold`}>
                          {o.kind === "PLAN" ? "মেম্বারশিপ প্ল্যান" : "কানেক্ট প্যাক"}
                        </span>
                      </td>
                      <td>
                        <p className="font-black text-sm text-[#fd6969]">{taka(o.total)}</p>
                        {o.discount > 0 && (
                          <p className="text-[10px] text-green-600 font-bold">ছাড়: {taka(o.discount)}</p>
                        )}
                      </td>
                      <td>
                        <p className="font-semibold text-xs">{o.paymentMethod || "SSLCOMMERZ"}</p>
                        {o.transactionId && (
                          <p className="text-[10px] font-mono text-gray-400 truncate max-w-[120px]" title={o.transactionId}>
                            {o.transactionId}
                          </p>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-sm ${s.badge}`}>{s.label}</span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => setSelected(o)}
                          className="btn btn-xs bg-base-200 hover:bg-[#fd6969] hover:text-white border-none gap-1 font-bold transition-colors"
                        >
                          <Receipt size={12} /> বিবরণ
                        </button>
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

      {/* Printable / Detail Invoice Modal */}
      {selected && (
        <dialog open className="modal modal-open modal-bottom sm:modal-middle bg-black/40 backdrop-blur-sm z-50">
          <div className="modal-box max-w-lg rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-base-300">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-gray-100 dark:border-base-300">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#fd6969]">NikahDeen Official Invoice</span>
                <h3 className="font-black text-xl flex items-center gap-2 mt-0.5">
                  অর্ডার: {selected.orderNo}
                </h3>
                {selected.invoiceNo && (
                  <p className="text-xs text-gray-400 font-mono mt-0.5">ইনভয়েস নং: {selected.invoiceNo}</p>
                )}
              </div>
              <button onClick={() => setSelected(null)} className="btn btn-sm btn-circle btn-ghost">
                <X size={18} />
              </button>
            </div>

            {/* Customer Details */}
            <div className="bg-base-200/50 rounded-2xl p-4 my-4 text-xs space-y-1.5">
              <p className="font-black text-gray-500 uppercase text-[10px] tracking-widest mb-1">কাস্টমার তথ্য</p>
              <div className="flex justify-between">
                <span className="text-gray-400">নাম:</span>
                <span className="font-bold">{selected.customer?.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ইমেইল:</span>
                <span className="font-medium font-mono">{selected.customer?.email || "—"}</span>
              </div>
              {selected.customer?.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-400">মোবাইল:</span>
                  <span className="font-medium">{selected.customer?.phone}</span>
                </div>
              )}
            </div>

            {/* Bill Breakdown */}
            <div className="py-2 space-y-2 text-xs border-b border-gray-100 dark:border-base-300">
              <div className="flex justify-between">
                <span className="text-gray-400">আইটেম:</span>
                <span className="font-bold">{selected.item?.titleBn || selected.item?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ধরন:</span>
                <span>{selected.kind === "PLAN" ? "মেম্বারশিপ সাবস্ক্রিপশন" : "কানেক্ট ক্রেডিট প্যাক"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ইউনিট মূল্য:</span>
                <span>{taka(selected.item?.unitPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">সাবটোটাল:</span>
                <span>{taka(selected.subtotal)}</span>
              </div>
              {selected.discount > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>ডিসকাউন্ট:</span>
                  <span>- {taka(selected.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-[#fd6969] pt-2 border-t border-gray-100 dark:border-base-300">
                <span>সর্বমোট পরিশোধিত:</span>
                <span>{taka(selected.total)}</span>
              </div>
            </div>

            {/* Payment Audit */}
            <div className="py-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-400">পেমেন্ট গেটওয়ে:</span>
                <span className="font-bold">{selected.paymentMethod || "SSLCOMMERZ"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ট্রানজেকশন আইডি:</span>
                <span className="font-mono">{selected.transactionId || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">পেমেন্ট স্ট্যাটাস:</span>
                <span className={`badge badge-xs ${STATUS_STYLE[selected.status]?.badge || "badge-ghost"}`}>
                  {STATUS_STYLE[selected.status]?.label || selected.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">তারিখ ও সময়:</span>
                <span>
                  {new Date(selected.createdAt).toLocaleString("bn-BD", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="modal-action flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-base-300">
              <button onClick={handlePrint} className="btn btn-sm btn-outline gap-1.5 font-bold">
                <Printer size={14} /> প্রিন্ট ইনভয়েস
              </button>
              <button onClick={() => setSelected(null)} className="btn btn-sm btn-neutral font-bold">
                বন্ধ করুন
              </button>
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
