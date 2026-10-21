"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  ShieldCheck,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  History,
  X,
  Phone,
  Mail,
  UserCheck,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
} from "lucide-react";
import { adminApi } from "@/lib/api";

const STATUS_TABS = [
  { key: "", label: "সকল গার্ডিয়ান" },
  { key: "VERIFIED", label: "যাচাইকৃত" },
  { key: "CONSENTED", label: "সম্মতি দেওয়া" },
  { key: "DECLARED", label: "ঘোষিত" },
  { key: "REVOKED", label: "বাতিল" },
];

const STATUS_BADGE = {
  DECLARED: "badge-ghost font-bold",
  CONSENTED: "badge-warning text-white font-bold",
  VERIFIED: "badge-success text-white font-bold",
  REVOKED: "badge-error text-white font-bold",
};

const STATUS_LABEL = {
  DECLARED: "ঘোষিত",
  CONSENTED: "সম্মতি দেওয়া",
  VERIFIED: "যাচাইকৃত",
  REVOKED: "বাতিল",
};

const bn = (n) => Number(n ?? 0).toLocaleString("bn-BD");

const fmt = (d) =>
  d
    ? new Date(d).toLocaleString("bn-BD", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

const AUDIT_LABEL = {
  GUARDIAN_DECLARE: "গার্ডিয়ান ঘোষণা",
  GUARDIAN_SESSION_OPENED: "consent লিংক খোলা হয়েছে",
  GUARDIAN_CONSENT: "অভিভাবক সম্মতি",
  GUARDIAN_VERIFY: "পরিচয় যাচাই",
  GUARDIAN_REVOKE: "গার্ডিয়ান বাতিল",
  GUARDIAN_CONTACT_REQUEST: "যোগাযোগ অনুরোধ",
  GUARDIAN_CONTACT_APPROVE: "যোগাযোগ অনুমোদন",
  GUARDIAN_CONTACT_DENY: "যোগাযোগ প্রত্যাখ্যান",
  GUARDIAN_CONTACT_TEARDOWN: "যোগাযোগ চ্যানেল ভাঙা",
};

export default function GuardiansPage() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, consented: 0, declared: 0, revoked: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);

  const [audit, setAudit] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.guardians({
        status: statusTab || undefined,
        q: search.trim() || undefined,
        page,
        limit: 10,
      });
      setItems(res?.data || []);
      setPagination(res?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
    } catch (err) {
      setError(err.message || "গার্ডিয়ান তালিকা লোড করা যায়নি।");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [statusTab, page, search]);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    setAuditError("");
    try {
      const res = await adminApi.auditEvents({ prefix: "GUARDIAN_", limit: 50 });
      setAudit(res?.data || []);
    } catch (err) {
      setAuditError(err.message || "অডিট-ট্রেইল লোড করা যায়নি।");
      setAudit([]);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const [allRes, verifiedRes, consentedRes, revokedRes] = await Promise.all([
        adminApi.guardians({ limit: 1 }),
        adminApi.guardians({ status: "VERIFIED", limit: 1 }),
        adminApi.guardians({ status: "CONSENTED", limit: 1 }),
        adminApi.guardians({ status: "REVOKED", limit: 1 }),
      ]);
      const total = allRes?.pagination?.total || 0;
      const verified = verifiedRes?.pagination?.total || 0;
      const consented = consentedRes?.pagination?.total || 0;
      const revoked = revokedRes?.pagination?.total || 0;
      setStats({
        total,
        verified,
        consented,
        declared: Math.max(0, total - (verified + consented + revoked)),
        revoked,
      });
    } catch {
      // keep initial
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadAudit();
    loadStats();
  }, [loadAudit, loadStats]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-base-300">
        <div>
          <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
            <ShieldCheck className="text-[#fd6969]" size={26} />
            অভিভাবক ও গার্ডিয়ান ভেরিফিকেশন
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            সদস্যদের নিবন্ধিত অভিভাবকের পরিচয় যাচাই, সম্মতি (Consent) ট্র্যাকিং ও নিরাপত্তা অডিট লগ।
          </p>
        </div>

        <button
          onClick={() => {
            load();
            loadAudit();
            loadStats();
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
          <p className="text-[11px] font-bold uppercase text-gray-400">মোট অভিভাবক</p>
          <p className="text-2xl font-black text-[#fd6969] mt-1">{bn(stats.total)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">নিবন্ধিত গার্ডিয়ান</p>
        </div>
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-gray-400">যাচাইকৃত গার্ডিয়ান</p>
          <p className="text-2xl font-black text-green-600 mt-1">{bn(stats.verified)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">পরিচয় সম্পূর্ণ যাচাইকৃত</p>
        </div>
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-gray-400">অপেক্ষমান সম্মতি</p>
          <p className="text-2xl font-black text-amber-500 mt-1">{bn(stats.consented + stats.declared)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">সম্মতি {bn(stats.consented)} • ঘোষিত {bn(stats.declared)}</p>
        </div>
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-gray-400">বাতিলকৃত</p>
          <p className="text-2xl font-black text-purple-600 mt-1">{bn(stats.revoked)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">অনুমতি প্রত্যাহারকৃত</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
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

        <div className="relative flex-1 sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="অভিভাবকের নাম, মোবাইল বা সদস্য..."
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
          <p className="text-xs text-gray-400 mt-2 font-medium">গার্ডিয়ান তালিকা লোড হচ্ছে...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-base-100 rounded-2xl border border-dashed border-gray-300 dark:border-base-300">
          <ShieldCheck size={40} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 font-bold">কোনো গার্ডিয়ান-লিংক পাওয়া যায়নি</p>
          <p className="text-xs text-gray-400 mt-1">অন্য স্ট্যাটাস বা নাম দিয়ে ফিল্টার করুন।</p>
        </div>
      ) : (
        <div className="bg-base-100 rounded-2xl border border-gray-100 dark:border-base-300 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-base-200/60 text-xs font-bold text-gray-600 border-b border-gray-100 dark:border-base-300">
                <tr>
                  <th>অভিভাবকের নাম</th>
                  <th>সম্পর্ক</th>
                  <th>যোগাযোগ নম্বর ও ইমেইল</th>
                  <th>সংশ্লিষ্ট সদস্য</th>
                  <th>স্ট্যাটাস</th>
                  <th>ঘোষণা তারিখ</th>
                  <th className="text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-gray-100 dark:divide-base-300">
                {items.map((g) => (
                  <tr key={g.id} className="hover:bg-base-200/30 transition-colors">
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center text-gray-600 font-bold shrink-0">
                          {g.name?.charAt(0).toUpperCase() || <User size={14} />}
                        </div>
                        <p className="font-bold text-xs">{g.name}</p>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-sm bg-base-200 text-gray-600 border-none font-semibold">
                        {g.relation}
                      </span>
                    </td>
                    <td>
                      <p className="font-semibold text-xs flex items-center gap-1">
                        <Phone size={11} className="text-gray-400" /> {g.contactPhone}
                      </p>
                      {g.contactEmail && (
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Mail size={11} /> {g.contactEmail}
                        </p>
                      )}
                    </td>
                    <td>
                      <p className="font-bold text-xs">{g.member?.name || "—"}</p>
                      <p className="text-[11px] text-gray-400">{g.member?.email}</p>
                    </td>
                    <td>
                      <span className={`badge badge-sm ${STATUS_BADGE[g.status] || "badge-ghost"}`}>
                        {STATUS_LABEL[g.status] || g.status}
                      </span>
                    </td>
                    <td className="text-gray-500">
                      {fmt(g.createdAt)}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => setDetail(g)}
                        className="btn btn-xs bg-base-200 hover:bg-[#fd6969] hover:text-white border-none font-bold transition-colors"
                      >
                        বিস্তারিত
                      </button>
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

      {/* Guardian Audit Trail Card */}
      <div className="bg-base-100 rounded-3xl border border-gray-100 dark:border-base-300 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-base-300">
          <div>
            <h3 className="font-black text-base flex items-center gap-2">
              <History className="text-[#fd6969]" size={18} />
              গার্ডিয়ান নিরাপত্তা অডিট-ট্রেইল
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">সর্বশেষ ৫০টি GUARDIAN_* নিরাপত্তা ও সম্মতি সংক্রান্ত অ্যাকশন হিস্ট্রি</p>
          </div>
          <button onClick={loadAudit} className="btn btn-xs btn-ghost gap-1">
            <RefreshCw size={12} className={auditLoading ? "animate-spin" : ""} /> রিফ্রেশ অডিট
          </button>
        </div>

        {auditError && <div className="alert alert-error text-xs my-3">{auditError}</div>}

        {auditLoading ? (
          <div className="text-center py-8">
            <span className="loading loading-spinner loading-md text-[#fd6969]"></span>
          </div>
        ) : audit.length === 0 ? (
          <p className="text-center py-8 text-xs text-gray-400">কোনো অডিট-ইভেন্ট রেকর্ড পাওয়া যায়নি।</p>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="table table-xs w-full">
              <thead className="bg-base-200/50 text-gray-500 font-bold">
                <tr>
                  <th>তারিখ ও সময়</th>
                  <th>অ্যাকশন</th>
                  <th>অপারেটর (Actor)</th>
                  <th>টার্গেট আইডি</th>
                  <th>ফলাফল</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-base-300">
                {audit.map((e, i) => (
                  <tr key={`${e.action}-${i}`} className="hover:bg-base-200/20">
                    <td className="whitespace-nowrap font-medium text-gray-500">{fmt(e.at)}</td>
                    <td>
                      <p className="font-bold text-xs">{AUDIT_LABEL[e.action] || e.action}</p>
                      <span className="text-[10px] font-mono text-gray-400">{e.action}</span>
                    </td>
                    <td>
                      <span className="badge badge-xs bg-base-200 text-gray-600 font-bold">{e.actorRole || "USER"}</span>
                    </td>
                    <td className="font-mono text-[10px] text-gray-500">{e.targetId || "—"}</td>
                    <td>
                      <span className={`badge badge-xs font-bold ${e.result === "SUCCESS" ? "badge-success text-white" : "badge-error text-white"}`}>
                        {e.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detail && (
        <dialog open className="modal modal-open modal-bottom sm:modal-middle bg-black/40 backdrop-blur-sm z-50">
          <div className="modal-box max-w-lg rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-base-300">
            <div className="flex justify-between items-start pb-4 border-b border-gray-100 dark:border-base-300">
              <div>
                <h3 className="font-black text-xl flex items-center gap-2">{detail.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  সম্পর্ক: {detail.relation} • সদস্য: {detail.member?.name || "—"}
                </p>
              </div>
              <button onClick={() => setDetail(null)} className="btn btn-sm btn-circle btn-ghost">
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-base-300">
                <span className="text-gray-400">ভেরিফিকেশন অবস্থা:</span>
                <span className={`badge badge-sm ${STATUS_BADGE[detail.status] || "badge-ghost"}`}>
                  {STATUS_LABEL[detail.status] || detail.status}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-base-300">
                <span className="text-gray-400">অভিভাবকের মোবাইল:</span>
                <span className="font-bold">{detail.contactPhone}</span>
              </div>
              {detail.contactEmail && (
                <div className="flex justify-between py-1 border-b border-gray-50 dark:border-base-300">
                  <span className="text-gray-400">অভিভাবকের ইমেইল:</span>
                  <span className="font-mono">{detail.contactEmail}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-base-300">
                <span className="text-gray-400">সদস্যের ইমেইল:</span>
                <span className="font-mono">{detail.member?.email || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-base-300">
                <span className="text-gray-400">সম্মতি প্রদান:</span>
                <span>{fmt(detail.consentAt)} {detail.consentChannel ? `(${detail.consentChannel})` : ""}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-base-300">
                <span className="text-gray-400">যাচাইকৃত তারিখ:</span>
                <span>{fmt(detail.verifiedAt)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-base-300">
                <span className="text-gray-400">লিংক ইস্যু:</span>
                <span>{fmt(detail.linkIssuedAt)}</span>
              </div>
              {detail.revokedAt && (
                <div className="flex justify-between py-1 border-b border-gray-50 dark:border-base-300 text-red-500">
                  <span>বাতিলকৃত তারিখ:</span>
                  <span>{fmt(detail.revokedAt)}</span>
                </div>
              )}
              {detail.notes && (
                <div className="pt-2">
                  <p className="text-gray-400 font-bold mb-1">অ্যাডমিন নোট:</p>
                  <p className="bg-base-200/60 p-3 rounded-xl leading-relaxed">{detail.notes}</p>
                </div>
              )}
            </div>

            <div className="modal-action pt-2 border-t border-gray-100 dark:border-base-300">
              <button onClick={() => setDetail(null)} className="btn btn-sm btn-neutral font-bold">
                বন্ধ করুন
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setDetail(null)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
}
