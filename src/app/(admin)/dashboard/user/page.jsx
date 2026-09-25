"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  Check, X, RefreshCw, Eye, EyeOff, ChevronLeft, ChevronRight, X as CloseIcon, Images,
} from "lucide-react";
import Link from "next/link";
import { biodataApi, adminApi } from "@/lib/api";

const STATUS_TABS = [
  { key: "PENDING", label: "অপেক্ষমান" },
  { key: "APPROVED", label: "অনুমোদিত" },
  { key: "REJECTED", label: "বাতিল" },
  { key: "HIDDEN", label: "লুকানো" },
  { key: "DRAFT", label: "ড্রাফট" },
];

const bn = (n) => Number(n ?? 0).toLocaleString("bn-BD");

const MARITAL_LABEL = {
  UNMARRIED: "অবিবাহিত",
  DIVORCED: "তালাকপ্রাপ্ত",
  WIDOWED: "বিধবা/বিপত্নীক",
  OTHER: "অন্যান্য",
};

const UserPage = () => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTargetId, setRejectTargetId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await biodataApi.list({ status: statusTab, all: "1", page, limit: 10 });
      setItems(res?.data || []);
      setPagination(res?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
    } catch (err) {
      setError(err.message || "বায়োডাটা লোড করা যায়নি।");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [statusTab, page]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) return load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const openDetail = async (b) => {
    setDetail(b);
    setRejectReason("");
    setRejectTargetId(null);
    try {
      // staff fetch → full doc (connects are never charged for staff)
      const full = await biodataApi.get(b.id);
      if (full) setDetail(full);
    } catch {
      /* keep the list row data */
    }
  };

  const moderate = async (id, status, rejectionReason) => {
    setBusyId(id);
    try {
      const updated = await adminApi.moderate(id, status, rejectionReason);
      if (status === "APPROVED") {
        setItems((prev) => prev.filter((x) => x.id !== id));
      } else {
        setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: updated.status, rejectionReason: updated.rejectionReason } : x)));
      }
      if (detail?.id === id) setDetail({ ...detail, ...updated });
      setRejectTargetId(null);
      setRejectReason("");
    } catch (err) {
      window.alert(err.message || "অপারেশন ব্যর্থ হয়েছে");
    } finally {
      setBusyId(null);
    }
  };

  const rejectBtn = (b, small = false) => (
    <button
      disabled={busyId === b.id}
      onClick={() => {
        setRejectReason(b.rejectionReason || "");
        setRejectTargetId(b.id);
      }}
      className={`btn ${small ? "btn-xs" : "btn-sm"} bg-red-400 hover:bg-red-500 border-none text-white gap-1`}
    >
      <X size={small ? 13 : 14} /> বাতিল
    </button>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-black tracking-tighter">বায়োডাটা মডারেশন</h2>
          <p className="text-xs text-gray-400 mt-1">মোট {bn(pagination.total)} টি প্রোফাইল</p>
        </div>
        <button onClick={load} className="btn btn-sm btn-outline gap-2">
          <RefreshCw size={14} /> রিফ্রেশ
        </button>
      </div>

      {/* Status tabs */}
      <div role="tablist" className="tabs tabs-boxed bg-base-200 w-fit mb-5">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            className={`tab ${statusTab === t.key ? "tab-active" : ""}`}
            onClick={() => {
              setStatusTab(t.key);
              setPage(1);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error text-sm mb-4">{error}</div>}

      {loading ? (
        <div className="text-center py-20">
          <span className="loading loading-spinner loading-lg text-red-400"></span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-300 rounded-xl">
          <p className="text-gray-400">এই স্ট্যাটাসে কোনো বায়োডাটা নেই।</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((b) => (
            <div key={b.id} className="card bg-base-100 border border-gray-100 shadow-sm p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <button onClick={() => openDetail(b)} className="flex items-center gap-3 text-left flex-1 min-w-0 group">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-base-200 shrink-0">
                    {b.profileImage ? (
                      <img src={b.profileImage} alt={b.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Images size={18} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm group-hover:text-red-500 transition-colors truncate">
                      {b.biodataNo} • {b.fullName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {b.gender === "MALE" ? "পাত্র" : "পাত্রী"} • {b.age || "—"} বছর • {b.district || b.division || "—"} • {b.occupation || "—"}
                    </p>
                    {b.rejectionReason && (
                      <p className="text-[11px] text-red-400 mt-0.5 truncate">কারণ: {b.rejectionReason}</p>
                    )}
                  </div>
                </button>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {statusTab !== "APPROVED" && (
                    <button
                      disabled={busyId === b.id}
                      onClick={() => moderate(b.id, "APPROVED")}
                      className="btn btn-xs bg-green-500 hover:bg-green-600 border-none text-white gap-1"
                    >
                      <Check size={13} /> অনুমোদন
                    </button>
                  )}
                  {statusTab !== "REJECTED" && rejectBtn(b, true)}
                  {statusTab !== "HIDDEN" && (
                    <button
                      disabled={busyId === b.id}
                      onClick={() => moderate(b.id, "HIDDEN")}
                      className="btn btn-xs btn-outline gap-1"
                      title="পাবলিক তালিকা থেকে লুকান"
                    >
                      <EyeOff size={13} /> লুকান
                    </button>
                  )}
                  {statusTab === "HIDDEN" && (
                    <button
                      disabled={busyId === b.id}
                      onClick={() => moderate(b.id, "APPROVED")}
                      className="btn btn-xs btn-outline gap-1"
                    >
                      <Eye size={13} /> প্রকাশ করুন
                    </button>
                  )}
                  <button onClick={() => openDetail(b)} className="btn btn-xs btn-ghost">
                    বিস্তারিত
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full-profile drawer */}
      {detail && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-black text-xl">{detail.fullName}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {detail.biodataNo} • {detail.gender === "MALE" ? "পাত্র" : "পাত্রী"} •{" "}
                  {detail.age ? `${detail.age} বছর` : "বয়স নেই"} • {detail.district || detail.division || "—"} •{" "}
                  {detail.status}
                </p>
              </div>
              <button onClick={() => setDetail(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <CloseIcon size={18} />
              </button>
            </div>

            {/* photos */}
            <div className="py-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">
                ছবি ({(detail.photos || []).length})
              </p>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {(detail.photos || []).length === 0 && !detail.profileImage ? (
                  <p className="text-xs text-gray-400">কোনো ছবি নেই।</p>
                ) : (
                  [detail.profileImage, ...(detail.photos || [])]
                    .filter((u, i, arr) => u && arr.indexOf(u) === i)
                    .map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt="profile"
                        className="w-28 h-28 object-cover rounded-xl border border-gray-200"
                      />
                    ))
                )}
              </div>
            </div>

            {/* key fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 pb-2 text-sm">
              {[
                ["ধর্ম", detail.religion],
                ["বৈবাহিক অবস্থা", MARITAL_LABEL[detail.maritalStatus]],
                ["শিক্ষা", detail.education],
                ["পেশা", detail.occupation],
                ["মাসিক আয়", detail.monthlyIncome ? `৳${bn(detail.monthlyIncome)}` : null],
                ["উচ্চতা", detail.heightText],
                ["গাত্রবর্ণ", detail.skinColor],
                ["রক্তের গ্রুপ", detail.bloodGroup],
                ["মোবাইল", detail.mobile || detail.phoneNumber],
                ["ইমেইল", detail.email],
                ["পিতা", detail.fatherName],
                ["মাতা", detail.motherName],
                ["বর্তমান ঠিকানা", detail.presentAddress],
                ["স্থায়ী ঠিকানা", detail.permanentAddress],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-gray-50 py-1">
                    <span className="text-gray-400 text-xs">{k}</span>
                    <span className="font-medium text-right text-xs">{v}</span>
                  </div>
                ))}
            </div>

            {detail.aboutYourself && (
              <div className="py-2">
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1">নিজের সম্পর্কে</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap bg-base-200 rounded-lg p-3">
                  {detail.aboutYourself}
                </p>
              </div>
            )}

            {detail.rejectionReason && (
              <div className="mt-2">
                <p className="text-[11px] font-black uppercase tracking-widest text-red-400 mb-1">বাতিলের কারণ</p>
                <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{detail.rejectionReason}</p>
              </div>
            )}

            {/* moderation actions */}
            <div className="modal-action flex-wrap gap-2">
              {detail.status !== "APPROVED" && (
                <button
                  disabled={busyId === detail.id}
                  onClick={() => moderate(detail.id, "APPROVED")}
                  className="btn btn-sm bg-green-500 hover:bg-green-600 border-none text-white gap-1"
                >
                  <Check size={14} /> অনুমোদন ও প্রকাশ
                </button>
              )}
              {detail.status !== "REJECTED" && (
                <button
                  disabled={busyId === detail.id}
                  onClick={() => {
                    setRejectReason(detail.rejectionReason || "");
                    setRejectTargetId(detail.id);
                  }}
                  className="btn btn-sm bg-red-400 hover:bg-red-500 border-none text-white gap-1"
                >
                  <X size={14} /> বাতিল
                </button>
              )}
              {detail.status !== "HIDDEN" && (
                <button
                  disabled={busyId === detail.id}
                  onClick={() => moderate(detail.id, "HIDDEN")}
                  className="btn btn-sm btn-outline gap-1"
                >
                  <EyeOff size={14} /> লুকান
                </button>
              )}
              <Link href={`/details?id=${detail.id}`} target="_blank" className="btn btn-sm btn-ghost">
                পাবলিক পেজে দেখুন
              </Link>
              <button onClick={() => setDetail(null)} className="btn btn-sm">
                বন্ধ
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setDetail(null)}>close</button>
          </form>
        </dialog>
      )}

      {/* rejection reason prompt */}
      {rejectTargetId && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-black text-lg mb-2">বাতিলের কারণ</h3>
            <p className="text-xs text-gray-400 mb-3">
              কারণটি ব্যবহারকারীর নোটিফিকেশনে যাবে। খালি রাখলে সাধারণ বার্তা যাবে।
            </p>
            <textarea
              autoFocus
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="যেমন: ছবি অস্পষ্ট / ভুয়া তথ্য / অসম্পূর্ণ শিক্ষা তথ্য..."
              className="textarea textarea-bordered w-full focus:outline-none text-sm"
            />
            <div className="modal-action">
              <button onClick={() => setRejectTargetId(null)} className="btn btn-sm btn-ghost">
                ফিরে যান
              </button>
              <button
                disabled={busyId === rejectTargetId}
                onClick={() => moderate(rejectTargetId, "REJECTED", rejectReason.trim() || undefined)}
                className="btn btn-sm bg-red-500 hover:bg-red-600 border-none text-white"
              >
                {busyId === rejectTargetId ? "পাঠানো হচ্ছে..." : "নিশ্চিত করুন"}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setRejectTargetId(null)}>close</button>
          </form>
        </dialog>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button className="btn btn-sm btn-circle" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-gray-400">পৃষ্ঠা {pagination.page} / {pagination.totalPages}</span>
          <button
            className="btn btn-sm btn-circle"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default UserPage;

