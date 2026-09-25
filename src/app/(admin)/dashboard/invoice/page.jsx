"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Receipt, RefreshCw, Search, ChevronLeft, ChevronRight, User } from "lucide-react";
import { orderApi } from "@/lib/api";

const bn = (n) => Number(n ?? 0).toLocaleString("bn-BD");
const taka = (n) => `৳ ${Number(n ?? 0).toLocaleString("bn-BD")}`;

const STATUS_STYLE = {
  PAID: { label: "পরিশোধিত", cls: "bg-green-100 text-green-700 ring-green-200" },
  PENDING: { label: "অপেক্ষমান", cls: "bg-orange-100 text-orange-700 ring-orange-200" },
  FAILED: { label: "ব্যর্থ", cls: "bg-red-100 text-red-700 ring-red-200" },
  CANCELLED: { label: "বাতিল", cls: "bg-gray-100 text-gray-600 ring-gray-200" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || { label: status, cls: "bg-gray-100 text-gray-600 ring-gray-200" };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ring-1 ${s.cls}`}>
      {s.label}
    </span>
  );
};

const InvoiceAdmin = () => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await orderApi.adminList({
        page,
        limit: 10,
        status: statusFilter || undefined,
        kind: kindFilter || undefined,
        search: search || undefined,
      });
      setItems(res?.data || []);
      setPagination(res?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
    } catch (err) {
      setError(err.message || "অর্ডার লোড করা যায়নি।");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, kindFilter, search]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) return load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black tracking-tighter">অর্ডার ও ইনভয়েস</h2>
          <p className="text-xs text-gray-400 mt-1">সব মেম্বারশিপ ও কানেক্ট প্যাক অর্ডার — মোট {pagination.total} টি</p>
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
              placeholder="অর্ডার/ইনভয়েস নম্বর..."
              className="input input-bordered input-sm w-52 pl-9 focus:outline-none"
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
            <option value="PAID">পরিশোধিত</option>
            <option value="PENDING">অপেক্ষমান</option>
            <option value="FAILED">ব্যর্থ</option>
            <option value="CANCELLED">বাতিল</option>
          </select>
          <select
            className="select select-bordered select-sm focus:outline-none"
            value={kindFilter}
            onChange={(e) => {
              setKindFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">সব ধরন</option>
            <option value="PLAN">প্লান</option>
            <option value="PACK">কানেক্ট প্যাক</option>
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
          <Receipt size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">কোনো অর্ডার নেই।</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="py-4 px-4 border-b border-gray-300 font-semibold">অর্ডার নং</th>
                <th className="py-4 px-4 border-b border-gray-300 font-semibold">কাস্টমার</th>
                <th className="py-4 px-4 border-b border-gray-300 font-semibold">আইটেম</th>
                <th className="py-4 px-4 border-b border-gray-300 font-semibold">টাকা</th>
                <th className="py-4 px-4 border-b border-gray-300 font-semibold">স্ট্যাটাস</th>
                <th className="py-4 px-4 border-b border-gray-300 font-semibold">তারিখ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className="hover:bg-red-50/20 transition-all cursor-pointer"
                >
                  <td className="py-4 px-4 border-b border-gray-50">
                    <p className="font-bold text-sm">{o.orderNo}</p>
                    {o.invoiceNo && <p className="text-[11px] text-gray-400">{o.invoiceNo}</p>}
                  </td>
                  <td className="py-4 px-4 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{o.customer?.name || "—"}</p>
                        <p className="text-[11px] text-gray-400">{o.customer?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 border-b border-gray-50">
                    <p className="text-sm">{o.item?.titleBn || o.item?.title}</p>
                    <p className="text-[11px] text-gray-400">
                      {o.kind === "PLAN" ? "মেম্বারশিপ প্লান" : "কানেক্ট প্যাক"}
                    </p>
                  </td>
                  <td className="py-4 px-4 border-b border-gray-50 font-bold text-sm">
                    {taka(o.total)}
                    {o.discount > 0 && (
                      <p className="text-[11px] text-green-600 font-medium">
                        ছাড় {taka(o.discount)}
                      </p>
                    )}
                  </td>
                  <td className="py-4 px-4 border-b border-gray-50">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="py-4 px-4 border-b border-gray-50 text-xs">
                    {new Date(o.createdAt).toLocaleDateString("bn-BD", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            className="btn btn-sm btn-circle"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-gray-400">
            পৃষ্ঠা {pagination.page} / {pagination.totalPages}
          </span>
          <button
            className="btn btn-sm btn-circle"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-lg">
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <h3 className="font-black text-lg">অর্ডার {selected.orderNo}</h3>
              <StatusBadge status={selected.status} />
            </div>
            <div className="py-4 space-y-2 text-sm">
              {[
                ["ইনভয়েস নং", selected.invoiceNo || "—"],
                ["কাস্টমার", selected.customer?.name || "—"],
                ["ইমেইল", selected.customer?.email || "—"],
                ["ফোন", selected.customer?.phone || "—"],
                ["আইটেম", selected.item?.titleBn || selected.item?.title],
                ["ইউনিট মূল্য", taka(selected.item?.unitPrice)],
                ["সাবটোটাল", taka(selected.subtotal)],
                ["ডিসকাউন্ট", taka(selected.discount)],
                ["মোট", taka(selected.total)],
                ["পেমেন্ট মাধ্যম", selected.paymentMethod || "—"],
                ["ট্রানজেকশন", selected.transactionId || "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-medium text-right">{v}</span>
                </div>
              ))}
            </div>
            <div className="modal-action">
              <button onClick={() => setSelected(null)} className="btn btn-sm btn-outline">
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
};

export default InvoiceAdmin;
