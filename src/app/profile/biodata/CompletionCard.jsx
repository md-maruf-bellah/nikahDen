"use client";
import { useMemo } from "react";
import { CircleCheck } from "lucide-react";

const GROUP_LABELS = {
  basic: "মৌলিক তথ্য",
  personal: "ব্যক্তিগত",
  religious: "ধর্মীয়",
  education: "শিক্ষাগত",
  profession: "পেশাগত",
  family: "পারিবারিক",
  contact: "যোগাযোগ",
  media: "ছবি",
};

// গ্রুপ-কী → /profile/biodata-এর SECTIONS-এর ভিজ্যুয়াল ইনডেক্স (0-based: basic=0...)
const GROUP_SECTION_INDEX = {
  basic: 0,
  personal: 1,
  religious: 2,
  education: 3,
  profession: 4,
  family: 5,
  contact: 6,
};

export default function CompletionCard({ report, onEditSection, compact = false }) {
  const percent = report?.percent ?? 0;
  const color = percent >= 80 ? "#16a34a" : percent >= 50 ? "#f59e0b" : "#ef4444";

  // SVG রিং গণনা
  const ring = useMemo(() => {
    const r = 34;
    const c = 2 * Math.PI * r;
    return { r, c, offset: c * (1 - percent / 100) };
  }, [percent]);

  if (!report) return null;

  return (
    <div className={`card bg-base-200 p-4 ${compact ? "" : "md:p-5"}`}>
      <div className="flex items-center gap-4">
        {/* প্রগ্রেস রিং */}
        <div className="relative shrink-0" style={{ width: 88, height: 88 }}>
          <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
            <circle cx="44" cy="44" r={ring.r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="44"
              cy="44"
              r={ring.r}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={ring.c}
              strokeDashoffset={ring.offset}
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold leading-none">{percent}%</span>
            <span className="text-[10px] text-gray-400">সম্পূর্ণ</span>
          </div>
        </div>

        {/* অবস্থা + সারসংক্ষেপ */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-sm">প্রোফাইল কমপ্লিশন</h3>
            {report.status && <StatusBadge status={report.status} />}
          </div>
          {report.missing?.length === 0 ? (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <CircleCheck size={13} /> সব তথ্য পূর্ণ — দুর্দান্ত!
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              আরও {report.missing?.length ?? 0}টি তথ্য যোগ করলে প্রোফাইল ১০০% হবে
            </p>
          )}
        </div>
      </div>

      {/* গ্রুপ-প্রতি অগ্রগতি */}
      {!compact && report.groups?.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 mt-4">
          {report.groups.map((g) => (
            <div key={g.key}>
              <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                <span>{GROUP_LABELS[g.key] || g.key}</span>
                <span>{g.filled}/{g.total}</span>
              </div>
              <progress
                className={`progress progress-xs w-full ${g.filled === g.total ? "progress-success" : g.filled === 0 ? "progress-error" : "progress-warning"}`}
                value={g.filled}
                max={g.total}
              />
            </div>
          ))}
        </div>
      )}

      {/* অনুপস্থিত ফিল্ড — ক্লিক করলে সংশ্লিষ্ট সেকশন এডিটর খোলে */}
      {!compact && onEditSection && report.missing?.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-gray-500 mb-1.5">বাকি আছে — যেকোনোটিতে ক্লিক করে পূরণ করুন:</p>
          <div className="flex flex-wrap gap-1.5">
            {report.missing.slice(0, 12).map((m) => (
              <button
                key={m.field}
                onClick={() => onEditSection(m.group)}
                className="badge badge-outline border-red-200 text-red-400 hover:bg-red-50 cursor-pointer py-2 px-2.5 text-[11px]"
                title={`${GROUP_LABELS[m.group] || m.group} সেকশনে যান`}
              >
                + {m.label}
              </button>
            ))}
            {report.missing.length > 12 && (
              <span className="text-[11px] text-gray-400 self-center">+{report.missing.length - 12} আরও</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_LABELS = {
  DRAFT: { text: "খসড়া", cls: "badge-ghost" },
  PENDING: { text: "পর্যালোচনাধীন", cls: "badge-warning" },
  APPROVED: { text: "অনুমোদিত", cls: "badge-success" },
  REJECTED: { text: "প্রত্যাখ্যাত", cls: "badge-error" },
  ARCHIVED: { text: "সংরক্ষিত", cls: "badge-ghost" },
};

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] || STATUS_LABELS.DRAFT;
  return <span className={`badge badge-sm ${s.cls}`}>{s.text}</span>;
}
