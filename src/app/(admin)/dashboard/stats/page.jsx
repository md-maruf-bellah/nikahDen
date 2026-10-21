"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserPlus,
  FileText,
  CheckCircle2,
  Clock,
  Wallet,
  CreditCard,
  Heart,
  HeartHandshake,
  RefreshCw,
  Crown,
  MessageSquare,
  MessageCircle,
  Mail,
  Eye,
  EyeOff,
  TrendingUp,
  AlertTriangle,
  CalendarDays,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
  Activity,
  Layers,
  ChevronRight,
  LogIn,
  KeyRound,
  Ban,
  X,
  Plus,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const bn = (n) => Number(n ?? 0).toLocaleString("bn-BD");
const taka = (n) => `৳ ${Number(n ?? 0).toLocaleString("bn-BD")}`;

// Staff-style Bengali time format
const timeBn = (iso) => {
  try {
    return new Date(iso).toLocaleString("bn-BD", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const OAUTH_EVENT_META = {
  start: { label: "কনসেন্ট শুরু", tone: "badge-info" },
  start_failed: { label: "শুরু ব্যর্থ", tone: "badge-error" },
  provider_denied: { label: "অনুমতি ফিরিয়ে দেওয়া", tone: "badge-warning" },
  state_failed: { label: "CSRF state ব্যর্থ", tone: "badge-error" },
  exchange_failed: { label: "কোড এক্সচেঞ্জ ব্যর্থ", tone: "badge-error" },
  exchange_success: { label: "এক্সচেঞ্জ সফল", tone: "badge-success text-white" },
  login_success: { label: "সফল লগইন", tone: "badge-success text-white" },
  rate_limited: { label: "রেট-লিমিট (429)", tone: "badge-warning" },
  failure_blocked: { label: "ফেইল২ব্যান ব্লক", tone: "badge-error text-white" },
};

/**
 * ---------------------------------------------------------------------------
 * Interactive SVG Revenue Trend Chart (Area + Bar combo)
 * ---------------------------------------------------------------------------
 */
function RevenueTrendChart({ trends, revenueStats }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Generate 7-day array even if backend has missing dates
  const points = React.useMemo(() => {
    const list = [];
    const now = new Date();
    const rawMap = new Map((trends?.dailyRevenue || []).map((x) => [x._id, x]));

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const found = rawMap.get(key);
      const dayName = d.toLocaleDateString("bn-BD", { weekday: "short", day: "numeric" });
      list.push({
        date: key,
        label: dayName,
        amount: Number(found?.amount || 0),
        orders: Number(found?.orders || 0),
      });
    }
    return list;
  }, [trends]);

  const maxAmount = Math.max(...points.map((p) => p.amount), 1000);
  const chartHeight = 160;
  const chartWidth = 500;
  const paddingX = 30;
  const paddingY = 25;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;

  // Compute SVG coordinates
  const coords = points.map((p, idx) => {
    const x = paddingX + (idx / (points.length - 1)) * usableWidth;
    const y = chartHeight - paddingY - (p.amount / maxAmount) * usableHeight;
    return { ...p, x, y };
  });

  // Build curved path
  const pathD = coords.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[idx - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (pt.x - prev.x) / 2;
    const cp2y = pt.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pt.x} ${pt.y}`;
  }, "");

  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${chartHeight - paddingY} L ${coords[0].x} ${chartHeight - paddingY} Z`;

  return (
    <div className="bg-base-100 rounded-3xl p-5 border border-gray-100 dark:border-base-300 shadow-sm flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-base-300">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#fd6969] animate-pulse"></span>
            <h3 className="font-black text-base text-gray-800 dark:text-gray-100">
              রেভিনিউ আয় ট্রেন্ড (গত ৭ দিন)
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">দৈনিক সফল মেম্বারশিপ ও কানেক্ট প্যাক বিক্রির হিসাব</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-400 font-semibold">এই সপ্তাহের মোট আয়</p>
            <p className="text-lg font-black text-[#fd6969]">{taka(revenueStats?.thisWeekBdt)}</p>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative my-3">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fd6969" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#fd6969" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="currentColor" strokeDasharray="3 3" opacity="0.08" />
          <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="currentColor" strokeDasharray="3 3" opacity="0.08" />
          <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="currentColor" opacity="0.15" />

          {/* Area fill & smooth stroke */}
          <path d={areaD} fill="url(#revGrad)" />
          <path d={pathD} fill="none" stroke="#fd6969" strokeWidth="3" strokeLinecap="round" />

          {/* Data Points */}
          {coords.map((pt, idx) => (
            <g key={pt.date} onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)} className="cursor-pointer">
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIdx === idx ? 6 : 4}
                fill={hoveredIdx === idx ? "#fd6969" : "#fff"}
                stroke="#fd6969"
                strokeWidth="2.5"
                className="transition-all"
              />
              <text
                x={pt.x}
                y={chartHeight - 6}
                textAnchor="middle"
                fontSize="9"
                fill="currentColor"
                opacity={hoveredIdx === idx ? 1 : 0.6}
                fontWeight={hoveredIdx === idx ? "bold" : "normal"}
              >
                {pt.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover Tooltip Popup */}
        {hoveredIdx !== null && (
          <div
            className="absolute -top-1 bg-gray-900 text-white text-[11px] px-3 py-1.5 rounded-xl shadow-xl pointer-events-none transform -translate-x-1/2 transition-all z-20"
            style={{ left: `${(coords[hoveredIdx].x / chartWidth) * 100}%` }}
          >
            <p className="font-bold text-[#fd6969]">{coords[hoveredIdx].label}</p>
            <p className="font-black text-sm">{taka(coords[hoveredIdx].amount)}</p>
            <p className="text-[10px] text-gray-300">অর্ডার: {bn(coords[hoveredIdx].orders)} টি</p>
          </div>
        )}
      </div>

      {/* Footer stats summary */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 dark:border-base-300 text-xs">
        <div>
          <span className="text-gray-400 text-[10px] uppercase font-bold">আজকের আয়</span>
          <p className="font-black text-gray-700 dark:text-gray-200">{taka(revenueStats?.todayBdt)}</p>
        </div>
        <div>
          <span className="text-gray-400 text-[10px] uppercase font-bold">এই মাসের আয়</span>
          <p className="font-black text-green-600">{taka(revenueStats?.thisMonthBdt)}</p>
        </div>
        <div>
          <span className="text-gray-400 text-[10px] uppercase font-bold">পরিশোধিত অর্ডার</span>
          <p className="font-black text-purple-600">{bn(revenueStats?.totalPaidOrders)} টি</p>
        </div>
      </div>
    </div>
  );
}

/**
 * ---------------------------------------------------------------------------
 * Biodata Grooms vs Brides & Status Distribution
 * ---------------------------------------------------------------------------
 */
function BiodataDistributionChart({ biodatas }) {
  const grooms = Number(biodatas?.grooms || 0);
  const brides = Number(biodatas?.brides || 0);
  const totalProfiles = Math.max(grooms + brides, 1);
  const groomPct = Math.round((grooms / totalProfiles) * 100);
  const bridePct = 100 - groomPct;

  const approved = Number(biodatas?.approved || 0);
  const pending = Number(biodatas?.pending || 0);
  const rejected = Number(biodatas?.rejected || 0);
  const hidden = Number(biodatas?.hidden || 0);
  const totalStatus = Math.max(approved + pending + rejected + hidden, 1);

  return (
    <div className="bg-base-100 rounded-3xl p-5 border border-gray-100 dark:border-base-300 shadow-sm flex flex-col justify-between">
      <div className="pb-3 border-b border-gray-100 dark:border-base-300">
        <h3 className="font-black text-base text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Layers size={18} className="text-[#fd6969]" />
          বায়োডাটা অনুপাত ও স্ট্যাটাস
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">পাত্র-পাত্রীর অনুপাত ও মডারেশন কিউ বিশ্লেষণ</p>
      </div>

      {/* Visual Ring / Progress Display */}
      <div className="py-4 space-y-4">
        {/* Grooms vs Brides bar */}
        <div>
          <div className="flex justify-between items-center text-xs font-bold mb-1.5">
            <span className="text-blue-600 flex items-center gap-1">
              পাত্র (বর): {bn(grooms)} ({bn(groomPct)}%)
            </span>
            <span className="text-rose-500 flex items-center gap-1">
              পাত্রী (কনে): {bn(brides)} ({bn(bridePct)}%)
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-base-200 overflow-hidden flex shadow-inner">
            <div style={{ width: `${groomPct}%` }} className="bg-blue-500 transition-all duration-500" title="পাত্র"></div>
            <div style={{ width: `${bridePct}%` }} className="bg-[#fd6969] transition-all duration-500" title="পাত্রী"></div>
          </div>
        </div>

        {/* Status Distribution Progress Bars */}
        <div className="space-y-2 pt-2 text-xs">
          <div>
            <div className="flex justify-between text-gray-500 font-semibold mb-1">
              <span className="flex items-center gap-1 text-green-600 font-bold">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> অনুমোদিত ও লাইভ
              </span>
              <span className="font-bold">{bn(approved)} ({bn(Math.round((approved / totalStatus) * 100))}%)</span>
            </div>
            <progress className="progress progress-success w-full h-2" value={approved} max={totalStatus}></progress>
          </div>

          <div>
            <div className="flex justify-between text-gray-500 font-semibold mb-1">
              <span className="flex items-center gap-1 text-amber-500 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> অপেক্ষমান রিভিউ
              </span>
              <span className="font-bold">{bn(pending)} ({bn(Math.round((pending / totalStatus) * 100))}%)</span>
            </div>
            <progress className="progress progress-warning w-full h-2" value={pending} max={totalStatus}></progress>
          </div>

          <div>
            <div className="flex justify-between text-gray-500 font-semibold mb-1">
              <span className="flex items-center gap-1 text-purple-600 font-bold">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span> পাবলিক থেকে লুকানো
              </span>
              <span className="font-bold">{bn(hidden)} ({bn(Math.round((hidden / totalStatus) * 100))}%)</span>
            </div>
            <progress className="progress progress-secondary w-full h-2" value={hidden} max={totalStatus}></progress>
          </div>
        </div>
      </div>

      {/* Total views badge */}
      <div className="pt-3 border-t border-gray-100 dark:border-base-300 flex items-center justify-between text-xs">
        <span className="text-gray-400 font-medium flex items-center gap-1">
          <Eye size={13} /> মোট পাবলিক প্রোফাইল ভিউ:
        </span>
        <span className="font-black text-[#fd6969] text-sm">{bn(biodatas?.totalViews)} বার</span>
      </div>
    </div>
  );
}

/**
 * ---------------------------------------------------------------------------
 * Platform Funnel & Social Engagement Funnel
 * ---------------------------------------------------------------------------
 */
function PlatformFunnelChart({ users, biodatas, interests, marriages }) {
  const steps = [
    { label: "নিবন্ধিত ইউজার", value: Number(users?.total || 0), icon: <Users size={14} />, color: "bg-blue-500" },
    { label: "তৈরিকৃত বায়োডাটা", value: Number(biodatas?.total || 0), icon: <FileText size={14} />, color: "bg-purple-500" },
    { label: "আগ্রহ ও লাইক আদান-প্রদান", value: Number(interests?.sent || 0), icon: <Heart size={14} />, color: "bg-rose-500" },
    { label: "মিউচুয়াল ম্যাচ (উভয়পক্ষ)", value: Number(interests?.accepted || 0), icon: <HeartHandshake size={14} />, color: "bg-amber-500" },
    { label: "সম্পন্ন সফল বিবাহ", value: Number(marriages?.total || 0), icon: <Sparkles size={14} />, color: "bg-green-500" },
  ];

  const maxVal = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className="bg-base-100 rounded-3xl p-5 border border-gray-100 dark:border-base-300 shadow-sm">
      <div className="pb-3 border-b border-gray-100 dark:border-base-300 mb-4">
        <h3 className="font-black text-base text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Activity size={18} className="text-[#fd6969]" />
          ম্যাচমেকিং ও কনভার্সন ফানেল
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">নিবন্ধন থেকে সফল বিবাহ পর্যন্ত ব্যবহারকারীদের যাত্রা</p>
      </div>

      <div className="space-y-3">
        {steps.map((s, idx) => {
          const pct = Math.max(Math.round((s.value / maxVal) * 100), 4);
          return (
            <div key={s.label} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                  <span className={`w-5 h-5 rounded-md text-white flex items-center justify-center ${s.color}`}>
                    {s.icon}
                  </span>
                  {s.label}
                </span>
                <span className="font-black text-gray-800 dark:text-gray-100">{bn(s.value)}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-base-200 overflow-hidden">
                <div
                  style={{ width: `${pct}%` }}
                  className={`h-full rounded-full ${s.color} transition-all duration-700`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StatsDashboard({ onNavigateTab }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // OAuth Events
  const [oauthEvents, setOauthEvents] = useState([]);
  const [oauthEventsLoading, setOauthEventsLoading] = useState(true);
  const [oauthEventsError, setOauthEventsError] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [ipFilter, setIpFilter] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.stats();
      setStats(res);
    } catch (err) {
      setError(err.message || "পরিসংখ্যান লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOauthEvents = useCallback(async () => {
    setOauthEventsLoading(true);
    setOauthEventsError("");
    try {
      const res = await adminApi.oauthEvents({
        event: eventFilter || undefined,
        ip: ipFilter.trim() || undefined,
        limit: 20,
      });
      setOauthEvents(res?.data || []);
    } catch (err) {
      setOauthEventsError(err.message || "OAuth ইভেন্ট লোড করা যায়নি");
    } finally {
      setOauthEventsLoading(false);
    }
  }, [eventFilter, ipFilter]);

  useEffect(() => {
    loadData();
    loadOauthEvents();
  }, [loadData, loadOauthEvents]);

  if (loading) {
    return (
      <div className="text-center py-28">
        <span className="loading loading-spinner loading-lg text-[#fd6969]"></span>
        <p className="text-xs text-gray-400 mt-2 font-medium">অ্যাডমিন ড্যাশবোর্ড ডেটা লোড হচ্ছে...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="alert alert-error max-w-md mx-auto text-xs">{error || "ডেটা পাওয়া যায়নি"}</div>
        <button onClick={loadData} className="btn btn-sm btn-outline gap-2 font-bold">
          <RefreshCw size={14} /> পুনরায় চেষ্টা করুন
        </button>
      </div>
    );
  }

  const { users, biodatas, revenue, interests, messaging, payments, membership, marriages, support, oauth, trends } = stats;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ===== Hero Greeting & Control Banner ===== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-[#fd6969]/10 via-base-100 to-base-200 border border-gray-100 dark:border-base-300 shadow-xs">
        <div>
          <span className="badge badge-sm bg-[#fd6969] text-white border-none font-bold gap-1 mb-1">
            <Crown size={12} /> অ্যাডমিন কন্ট্রোল সেন্টার
          </span>
          <h2 className="text-xl md:text-2xl font-black text-gray-800 dark:text-gray-100 flex items-center gap-2">
            আসসালামু আলাইকুম, {user?.firstName || "অ্যাডমিন"}!
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            আজ {new Date().toLocaleDateString("bn-BD", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} • প্ল্যাটফর্মের সকল লাইভ ডেটা ও পারফরম্যান্স মেট্রিক্স
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateTab && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => onNavigateTab("marriages")}
                className="btn btn-xs bg-base-100 hover:bg-[#fd6969] hover:text-white border-gray-200 dark:border-base-300 font-bold transition-colors"
              >
                💍 বিবাহ রেকর্ড
              </button>
              <button
                onClick={() => onNavigateTab("biodatas")}
                className="btn btn-xs bg-base-100 hover:bg-[#fd6969] hover:text-white border-gray-200 dark:border-base-300 font-bold transition-colors"
              >
                📝 বায়োডাটা রিভিউ ({bn(biodatas?.pending)})
              </button>
              <button
                onClick={() => onNavigateTab("invoices")}
                className="btn btn-xs bg-base-100 hover:bg-[#fd6969] hover:text-white border-gray-200 dark:border-base-300 font-bold transition-colors"
              >
                💳 ইনভয়েস
              </button>
            </div>
          )}

          <button
            onClick={loadData}
            disabled={loading}
            className="btn btn-sm btn-outline gap-2 font-bold hover:bg-[#fd6969] hover:border-[#fd6969]"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            রিফ্রেশ
          </button>
        </div>
      </div>

      {/* ===== 4 Top Primary KPI Cards ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Revenue */}
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase text-gray-400">সর্বমোট সংগৃহীত আয়</span>
            <div className="w-8 h-8 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-green-600 mt-2">{taka(revenue?.revenueBdt)}</p>
          <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-base-300">
            <span>আজকের: {taka(revenue?.todayBdt)}</span>
            <span className="text-green-600 font-bold">এই মাসে {taka(revenue?.thisMonthBdt)}</span>
          </div>
        </div>

        {/* Total Users */}
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase text-gray-400">নিবন্ধিত ব্যবহারকারী</span>
            <div className="w-8 h-8 rounded-xl bg-[#fd6969]/10 text-[#fd6969] flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-[#fd6969] mt-2">{bn(users?.total)}</p>
          <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-base-300">
            <span>সক্রিয়: {bn(users?.active)} জন</span>
            <span className="text-sky-600 font-bold">+ আজ {bn(users?.newToday)} জন</span>
          </div>
        </div>

        {/* Biodatas */}
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase text-gray-400">অনুমোদিত বায়োডাটা</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 mt-2">{bn(biodatas?.approved)}</p>
          <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-base-300">
            <span>মোট: {bn(biodatas?.total)} টি</span>
            <span className="text-amber-500 font-bold">অপেক্ষমান {bn(biodatas?.pending)}</span>
          </div>
        </div>

        {/* Successful Marriages */}
        <div className="card bg-base-100 border border-gray-100 dark:border-base-300 p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase text-gray-400">সফল বিবাহ ও জুটি</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <HeartHandshake size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{bn(marriages?.total)}</p>
          <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-base-300">
            <span>যাচাইকৃত: {bn(marriages?.verified)} জুটি</span>
            <span className="text-purple-600 font-bold">লুকানো ID: {bn(marriages?.hiddenProfiles)}</span>
          </div>
        </div>
      </div>

      {/* ===== Main Interactive Charts Row ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Area Chart */}
        <RevenueTrendChart trends={trends} revenueStats={revenue} />

        {/* Biodata Gender & Status Distribution */}
        <BiodataDistributionChart biodatas={biodatas} />
      </div>

      {/* ===== Secondary Row: Conversion Funnel & Social Engagement ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Matchmaking Funnel */}
        <div className="lg:col-span-2">
          <PlatformFunnelChart users={users} biodatas={biodatas} interests={interests} marriages={marriages} />
        </div>

        {/* Messaging & Engagement Stats */}
        <div className="bg-base-100 rounded-3xl p-5 border border-gray-100 dark:border-base-300 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-black text-base text-gray-800 dark:text-gray-100 flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-base-300">
              <MessageSquare size={18} className="text-[#fd6969]" />
              মেসেজিং ও সামাজিক মিথস্ক্রিয়া
            </h3>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-base-300">
                <span className="text-gray-400">মোট লাইক ও আগ্রহ পাঠানো:</span>
                <span className="font-bold">{bn(interests?.sent)} বার</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-base-300">
                <span className="text-gray-400">মিউচুয়াল ম্যাচ (উভয়পক্ষ):</span>
                <span className="font-black text-green-600">{bn(interests?.accepted)} টি</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-base-300">
                <span className="text-gray-400">মোট মেসেজিং কথোপকথন:</span>
                <span className="font-bold">{bn(messaging?.conversations)} টি</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-base-300">
                <span className="text-gray-400">সক্রিয় কথোপকথন (৭ দিন):</span>
                <span className="font-bold text-sky-600">{bn(messaging?.activeThisWeek)} টি</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-base-300">
                <span className="text-gray-400">সাপোর্ট হেল্পডেস্কে নতুন বার্তা:</span>
                <span className="badge badge-xs badge-warning font-bold text-white">{bn(support?.newMessages)} টি</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-base-300">
            <span className="text-[10px] text-gray-400 font-semibold block mb-1">মেম্বারশিপ প্যাকেজ সাবস্ক্রিপশন:</span>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-purple-600">সক্রিয়: {bn(membership?.activeSubscriptions)} টি</span>
              <span className="text-gray-400">মেয়াদোত্তীর্ণ: {bn(membership?.expiredSubscriptions)} টি</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Social Login & OAuth Health Monitor ===== */}
      <div className="bg-base-100 rounded-3xl p-5 border border-gray-100 dark:border-base-300 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-base-300">
          <div>
            <h3 className="font-black text-base text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <ShieldAlert size={18} className="text-[#fd6969]" />
              নিরাপত্তা ও OAuth সোশ্যাল লগইন মনিটর
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Google / OAuth প্রমাণীকরণ অডিট ও ফেইল২ব্যান নিরাপত্তা হিস্ট্রি</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="select select-bordered select-xs bg-base-100 text-xs"
            >
              <option value="">সকল ইভেন্ট</option>
              {Object.entries(OAUTH_EVENT_META).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <button onClick={loadOauthEvents} className="btn btn-xs btn-outline gap-1">
              <RefreshCw size={11} className={oauthEventsLoading ? "animate-spin" : ""} /> রিফ্রেশ
            </button>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4 text-xs">
          <div className="bg-base-200/50 p-2.5 rounded-2xl">
            <span className="text-[10px] text-gray-400 font-bold uppercase">সফল লগইন</span>
            <p className="font-black text-green-600 text-base mt-0.5">
              {bn((oauth?.counts?.login_success || 0) + (oauth?.counts?.exchange_success || 0))}
            </p>
          </div>
          <div className="bg-base-200/50 p-2.5 rounded-2xl">
            <span className="text-[10px] text-gray-400 font-bold uppercase">ব্যর্থ এক্সচেঞ্জ</span>
            <p className="font-black text-red-500 text-base mt-0.5">{bn(oauth?.counts?.exchange_failed || 0)}</p>
          </div>
          <div className="bg-base-200/50 p-2.5 rounded-2xl">
            <span className="text-[10px] text-gray-400 font-bold uppercase">CSRF State ত্রুটি</span>
            <p className="font-black text-orange-500 text-base mt-0.5">{bn(oauth?.counts?.state_failed || 0)}</p>
          </div>
          <div className="bg-base-200/50 p-2.5 rounded-2xl">
            <span className="text-[10px] text-gray-400 font-bold uppercase">ফেইল২ব্যান ব্লক</span>
            <p className="font-black text-purple-600 text-base mt-0.5">{bn(oauth?.counts?.failure_blocked || 0)}</p>
          </div>
        </div>

        {/* OAuth Event Table */}
        {oauthEventsLoading ? (
          <div className="text-center py-6">
            <span className="loading loading-spinner loading-md text-[#fd6969]"></span>
          </div>
        ) : oauthEvents.length === 0 ? (
          <p className="text-center py-4 text-xs text-gray-400">কোনো সাম্প্রতিক OAuth ত্রুটি রেকর্ড নেই।</p>
        ) : (
          <div className="overflow-x-auto max-h-56 overflow-y-auto">
            <table className="table table-xs w-full">
              <thead className="bg-base-200/60 text-gray-500 font-bold">
                <tr>
                  <th>সময়</th>
                  <th>ইভেন্ট</th>
                  <th>প্রোভাইডার</th>
                  <th>IP ঠিকানা</th>
                  <th>বিবরণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-base-300">
                {oauthEvents.map((ev, i) => {
                  const m = OAUTH_EVENT_META[ev.event] || { label: ev.event, tone: "badge-ghost" };
                  return (
                    <tr key={i} className="hover:bg-base-200/20">
                      <td className="whitespace-nowrap font-medium text-gray-400">{timeBn(ev.at)}</td>
                      <td>
                        <span className={`badge badge-xs ${m.tone}`}>{m.label}</span>
                      </td>
                      <td className="font-bold text-[11px]">{ev.provider || "google"}</td>
                      <td className="font-mono text-[10px] text-gray-500">{ev.ip || "—"}</td>
                      <td className="text-gray-500 truncate max-w-[200px]">{ev.detail || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
