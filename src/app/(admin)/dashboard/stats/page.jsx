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
  Hourglass,
  ShieldAlert,
  ShieldCheck,
  Ban,
  KeyRound,
  LogIn,
  X,
  Ban as BanIcon,
} from "lucide-react";
import { adminApi } from "@/lib/api";

const bn = (n) => Number(n ?? 0).toLocaleString("bn-BD");
const taka = (n) => `৳ ${Number(n ?? 0).toLocaleString("bn-BD")}`;

function StatCard({ icon, label, value, tone = "text-red-500", sub }) {
  return (
    <div className="card bg-base-100 border border-gray-100 shadow-sm hover:shadow-md transition-all p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            {label}
          </p>
          <p className="text-2xl font-black mt-1">{value}</p>
          {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`rounded-xl p-2.5 bg-base-200 ${tone}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-lg font-black tracking-tight mt-2 mb-3">{children}</h3>
  );
}

// স্টাফ ইনবক্স টেবিলের তারিখ-স্টাইলের মতো করে ইভেন্ট-টাইম ফরম্যাট
const timeBn = (iso) => {
  try {
    return new Date(iso).toLocaleString("bn-BD", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

// OAuth ইভেন্ট-নাম → বাংলা লেবেল + টোন (কার্ড ও টেবিল দুজায়গায় ব্যবহৃত)
const OAUTH_EVENT_META = {
  start: { label: "কনসেন্ট শুরু", tone: "text-sky-600" },
  start_failed: { label: "শুরু ব্যর্থ", tone: "text-red-600" },
  provider_denied: { label: "অনুমতি ফিরিয়ে দেওয়া", tone: "text-orange-500" },
  state_failed: { label: "CSRF state ব্যর্থ", tone: "text-red-600" },
  exchange_failed: { label: "কোড এক্সচেঞ্জ ব্যর্থ", tone: "text-red-600" },
  exchange_success: { label: "এক্সচেঞ্জ সফল", tone: "text-green-600" },
  login_success: { label: "সফল লগইন", tone: "text-green-600" },
  rate_limited: { label: "রেট-লিমিট (429)", tone: "text-amber-600" },
  failure_blocked: { label: "ফেইল২ব্যান ব্লক", tone: "text-red-700" },
};

function OAuthMonitorSection({ stats, events, eventsLoading, eventsError, reload, eventFilter, setEventFilter, ipFilter, setIpFilter }) {
  const counts = stats?.oauth?.counts || {};
  const totalFailed = stats?.oauth?.totalFailed || 0;
  const totalAttempts = Object.values(counts).reduce((a, b) => a + Number(b || 0), 0);
  const failureRate = totalAttempts ? Math.round((totalFailed / totalAttempts) * 100) : 0;

  const cards = [
    { icon: <LogIn size={20} />, label: "সফল লগইন (OAuth)", value: bn(counts.login_success + counts.exchange_success), tone: "text-green-600", sub: "login_success + exchange_success" },
    { icon: <KeyRound size={20} />, label: "ব্যর্থ এক্সচেঞ্জ", value: bn(counts.exchange_failed), tone: "text-red-600", sub: "ভুয়া/পুরনো/রিপ্লে কোড" },
    { icon: <ShieldAlert size={20} />, label: "State ব্যর্থ (CSRF)", value: bn(counts.state_failed), tone: "text-red-600", sub: "tamper/expired/replay" },
    { icon: <BanIcon size={20} />, label: "ফেইল২ব্যান ব্লক", value: bn(counts.failure_blocked), tone: "text-red-700", sub: "ব্লকড IP-এর চেষ্টা" },
    { icon: <ShieldCheck size={20} />, label: "মোট ব্যর্থতা", value: bn(totalFailed), tone: "text-orange-500", sub: `চেষ্টার ${failureRate}% (এই রানে)` },
  ];

  return (
    <div className="mt-8">
      <SectionTitle>OAuth মনিটর (সোশ্যাল লগইন স্বাস্থ্য)</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* পারসিস্টেড রিসেন্ট ইভেন্ট (Mongo capped collection — রিস্টার্ট-সহনশীল) */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-base-200/60">
          <p className="text-xs font-bold text-gray-500 mr-auto">
            রিসেন্ট ইভেন্ট — সার্ভার রিস্টার্টের পরেও থাকে (সর্বশেষ ২০)
          </p>
          {/* ফিল্টার: ইভেন্ট-ধরন + IP — পরিবর্তনেই সার্ভারে নতুন কুয়েরি যায় */}
          <select
            className="select select-xs text-xs"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            aria-label="ইভেন্ট ফিল্টার"
          >
            <option value="">সব ইভেন্ট</option>
            {Object.entries(OAUTH_EVENT_META).map(([value, meta]) => (
              <option key={value} value={value}>{meta.label}</option>
            ))}
          </select>
          <input
            type="text"
            className="input input-xs w-32 font-mono text-xs"
            placeholder="IP ফিল্টার…"
            value={ipFilter}
            onChange={(e) => setIpFilter(e.target.value)}
            aria-label="IP ফিল্টার"
          />
          {(eventFilter || ipFilter) && (
            <button
              className="btn btn-ghost btn-xs text-gray-400"
              onClick={() => { setEventFilter(""); setIpFilter(""); }}
            >
              <X size={12} /> মুছুন
            </button>
          )}
          <button onClick={reload} className="btn btn-ghost btn-xs gap-1">
            <RefreshCw size={12} /> রিফ্রেশ
          </button>
        </div>
        <table className="table table-sm">
          <thead>
            <tr className="text-[11px] text-gray-400">
              <th>সময়</th><th>ইভেন্ট</th><th>IP</th><th>প্রোভাইডার</th><th>এরর কোড</th>
            </tr>
          </thead>
          <tbody>
            {eventsLoading && (
              <tr><td colSpan={5} className="text-center py-6"><span className="loading loading-spinner loading-sm text-red-400" /></td></tr>
            )}
            {!eventsLoading && eventsError && (
              <tr><td colSpan={5} className="text-center py-6 text-xs text-red-500">{eventsError}</td></tr>
            )}
            {!eventsLoading && !eventsError && events.length === 0 && (
              <tr><td colSpan={5} className="text-center py-6 text-xs text-gray-400">এখনো কোনো OAuth ইভেন্ট নেই</td></tr>
            )}
            {!eventsLoading && !eventsError && events.map((ev, i) => {
              const meta = OAUTH_EVENT_META[ev.event] || { label: ev.event, tone: "text-gray-500" };
              return (
                <tr key={`${ev.at}-${i}`} className="text-xs">
                  <td className="whitespace-nowrap text-gray-400">{timeBn(ev.at)}</td>
                  <td className={`font-bold ${meta.tone}`}>{meta.label}</td>
                  <td className="font-mono text-[11px]">{ev.ip || "—"}</td>
                  <td>{ev.provider || "—"}</td>
                  <td className="font-mono text-[11px] text-gray-400">{ev.errorCode || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Contact spam-drop ইভেন্ট — পারসিস্টেড টেবিল (OAuth মনিটরের নিচে)
function ContactSpamSection({ events, loading, error, reload }) {
  const reasonMeta = {
    honeypot: { label: "Honeypot ফিল্ড", tone: "text-red-600" },
    time_trap: { label: "অসম্ভব দ্রুত সাবমিট", tone: "text-orange-500" },
  };
  return (
    <div className="mt-8">
      <SectionTitle>Contact স্প্যাম ডিফেন্স</SectionTitle>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <div className="flex items-center justify-between px-4 py-2 bg-base-200/60">
          <p className="text-xs font-bold text-gray-500">
            স্প্যাম-ড্রপ ইভেন্ট — রিস্টার্টের পরেও থাকে (সর্বশেষ ২০)
          </p>
          <button onClick={reload} className="btn btn-ghost btn-xs gap-1">
            <RefreshCw size={12} /> রিফ্রেশ
          </button>
        </div>
        <table className="table table-sm">
          <thead>
            <tr className="text-[11px] text-gray-400">
              <th>সময়</th><th>কারণ</th><th>IP</th><th>বিস্তারিত</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={4} className="text-center py-6"><span className="loading loading-spinner loading-sm text-red-400" /></td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={4} className="text-center py-6 text-xs text-red-500">{error}</td></tr>
            )}
            {!loading && !error && events.length === 0 && (
              <tr><td colSpan={4} className="text-center py-6 text-xs text-gray-400">এখনো কোনো স্প্যাম ধরা পড়েনি</td></tr>
            )}
            {!loading && !error && events.map((ev, i) => {
              const meta = reasonMeta[ev.reason] || { label: ev.reason || "—", tone: "text-gray-500" };
              return (
                <tr key={`${ev.at}-${i}`} className="text-xs">
                  <td className="whitespace-nowrap text-gray-400">{timeBn(ev.at)}</td>
                  <td className={`font-bold ${meta.tone}`}>{meta.label}</td>
                  <td className="font-mono text-[11px]">{ev.ip || "—"}</td>
                  <td className="font-mono text-[11px] text-gray-400">{ev.detail || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const StatsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // OAuth ইভেন্ট-হিস্ট্রি (capped collection) — আলাদা লোড, আলাদা রিফ্রেশ + ফিল্টার
  const [oauthEvents, setOauthEvents] = useState([]);
  const [oauthEventsLoading, setOauthEventsLoading] = useState(true);
  const [oauthEventsError, setOauthEventsError] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [ipFilter, setIpFilter] = useState("");
  const [ipFilterDebounced, setIpFilterDebounced] = useState("");
  // Contact spam-drop ইভেন্ট — আলাদা লোড
  const [contactEvents, setContactEvents] = useState([]);
  const [contactEventsLoading, setContactEventsLoading] = useState(true);
  const [contactEventsError, setContactEventsError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.stats();
      setStats(data);
    } catch (err) {
      setError(err.message || "স্ট্যাটিসটিক্স লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOauthEvents = useCallback(async () => {
    setOauthEventsLoading(true);
    setOauthEventsError("");
    try {
      const data = await adminApi.oauthEvents({
        limit: 20,
        event: eventFilter || undefined,
        ip: ipFilterDebounced.trim() || undefined,
      });
      setOauthEvents(data?.items || []);
    } catch (err) {
      setOauthEventsError(err.message || "OAuth ইভেন্ট লোড করা যায়নি।");
    } finally {
      setOauthEventsLoading(false);
    }
  }, [eventFilter, ipFilterDebounced]);

  // IP ফিল্টার টাইপিং-এ প্রতি কীপ্রেসে রিকোয়েস্ট না যায় — ৪০০ms ডিবাউন্স
  useEffect(() => {
    const t = setTimeout(() => setIpFilterDebounced(ipFilter), 400);
    return () => clearTimeout(t);
  }, [ipFilter]);

  const loadContactEvents = useCallback(async () => {
    setContactEventsLoading(true);
    setContactEventsError("");
    try {
      const data = await adminApi.contactEvents({ limit: 20 });
      setContactEvents(data?.items || []);
    } catch (err) {
      setContactEventsError(err.message || "স্প্যাম ইভেন্ট লোড করা যায়নি।");
    } finally {
      setContactEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) return load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) return loadOauthEvents();
    });
    return () => {
      cancelled = true;
    };
  }, [loadOauthEvents]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) return loadContactEvents();
    });
    return () => {
      cancelled = true;
    };
  }, [loadContactEvents]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <span className="loading loading-spinner loading-lg text-red-400"></span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 text-center">
        <div className="alert alert-error text-sm inline-flex">
          <span>{error || "ডেটা পাওয়া যায়নি"}</span>
        </div>
        <button onClick={load} className="btn btn-sm btn-outline mt-4 gap-2">
          <RefreshCw size={14} /> আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  // Every aggregate field returned by GET /admin/stats, grouped into sections.
  // Values come straight from the response — no client-side fabrication.
  const sections = [
    {
      title: "ব্যবহারকারী",
      cards: [
        { icon: <Users size={20} />, label: "মোট ইউজার", value: bn(stats?.users?.total) },
        { icon: <UserCheck size={20} />, label: "সক্রিয়", value: bn(stats?.users?.active), tone: "text-green-600" },
        { icon: <Users size={20} />, label: "অপেক্ষমান", value: bn(stats?.users?.pending), tone: "text-orange-500" },
        { icon: <Users size={20} />, label: "নিষ্ক্রিয়", value: bn(stats?.users?.inactive), tone: "text-gray-500" },
        { icon: <Crown size={20} />, label: "স্টাফ অ্যাকাউন্ট", value: bn(stats?.users?.staff), tone: "text-purple-600" },
        { icon: <CalendarDays size={20} />, label: "আজকের নতুন", value: bn(stats?.users?.newToday), tone: "text-sky-600" },
        { icon: <UserPlus size={20} />, label: "নতুন (৭ দিন)", value: bn(stats?.users?.newThisWeek), tone: "text-sky-600" },
        { icon: <UserPlus size={20} />, label: "নতুন (৩০ দিন)", value: bn(stats?.users?.newThisMonth), tone: "text-indigo-600" },
      ],
    },
    {
      title: "বায়োডাটা",
      cards: [
        { icon: <FileText size={20} />, label: "মোট প্রোফাইল", value: bn(stats?.biodatas?.total) },
        { icon: <CheckCircle2 size={20} />, label: "অনুমোদিত", value: bn(stats?.biodatas?.approved), tone: "text-green-600" },
        { icon: <Clock size={20} />, label: "অপেক্ষমান রিভিউ", value: bn(stats?.biodatas?.pending), tone: "text-orange-500" },
        { icon: <FileText size={20} />, label: "বাতিল", value: bn(stats?.biodatas?.rejected), tone: "text-red-600" },
        { icon: <EyeOff size={20} />, label: "লুকানো", value: bn(stats?.biodatas?.hidden), tone: "text-gray-500" },
        { icon: <Users size={20} />, label: "পাত্র", value: bn(stats?.biodatas?.grooms), tone: "text-blue-600" },
        { icon: <Users size={20} />, label: "পাত্রী", value: bn(stats?.biodatas?.brides), tone: "text-pink-600" },
        { icon: <Eye size={20} />, label: "মোট প্রোফাইল ভিউ", value: bn(stats?.biodatas?.totalViews), tone: "text-cyan-600" },
        { icon: <FileText size={20} />, label: "নতুন প্রোফাইল (৭ দিন)", value: bn(stats?.biodatas?.newThisWeek), tone: "text-pink-600" },
      ],
    },
    {
      title: "আগ্রহ ও ম্যাচ",
      cards: [
        { icon: <Heart size={20} />, label: "পাঠানো আগ্রহ", value: bn(stats?.interests?.sent), tone: "text-red-500", sub: "মোট লাইক" },
        { icon: <HeartHandshake size={20} />, label: "মিউচুয়াল ম্যাচ", value: bn(stats?.interests?.accepted), tone: "text-green-600", sub: "দুই পক্ষের আগ্রহ" },
        { icon: <TrendingUp size={20} />, label: "নতুন আগ্রহ (৭ দিন)", value: bn(stats?.interests?.newThisWeek), tone: "text-sky-600" },
      ],
    },
    {
      title: "মেসেজিং",
      cards: [
        { icon: <MessageSquare size={20} />, label: "মোট কথোপকথন", value: bn(stats?.messaging?.conversations), tone: "text-purple-600" },
        { icon: <MessageCircle size={20} />, label: "সক্রিয় কথোপকথন (৭ দিন)", value: bn(stats?.messaging?.activeThisWeek), tone: "text-green-600" },
        { icon: <Mail size={20} />, label: "অপঠিত বার্তা", value: bn(stats?.messaging?.unreadMessages), tone: "text-orange-500" },
      ],
    },
    {
      title: "আয় ও মেম্বারশিপ",
      cards: [
        { icon: <Wallet size={20} />, label: "মোট আয়", value: taka(stats?.revenue?.revenueBdt), tone: "text-green-700" },
        { icon: <Wallet size={20} />, label: "আজকের আয়", value: taka(stats?.revenue?.todayBdt), tone: "text-emerald-600" },
        { icon: <Wallet size={20} />, label: "এই সপ্তাহের আয়", value: taka(stats?.revenue?.thisWeekBdt), tone: "text-emerald-600" },
        { icon: <Wallet size={20} />, label: "এই মাসের আয়", value: taka(stats?.revenue?.thisMonthBdt), tone: "text-green-600" },
        { icon: <CreditCard size={20} />, label: "পরিশোধিত অর্ডার", value: bn(stats?.revenue?.totalPaidOrders), tone: "text-sky-600" },
        { icon: <Crown size={20} />, label: "সক্রিয় সাবস্ক্রিপশন", value: bn(stats?.membership?.activeSubscriptions), tone: "text-purple-600" },
        { icon: <Hourglass size={20} />, label: "মেয়াদোত্তীর্ণ সাবস্ক্রিপশন", value: bn(stats?.membership?.expiredSubscriptions), tone: "text-gray-500" },
      ],
    },
    {
      title: "পেমেন্ট",
      cards: [
        { icon: <Clock size={20} />, label: "পেন্ডিং পেমেন্ট", value: bn(stats?.payments?.pendingOrders), tone: "text-orange-500", sub: "অর্ডার অপেক্ষমান" },
        { icon: <AlertTriangle size={20} />, label: "ব্যর্থ পেমেন্ট", value: bn(stats?.payments?.failedOrders), tone: "text-red-600", sub: "অর্ডার ব্যর্থ" },
      ],
    },
    {
      title: "সাপোর্ট",
      cards: [
        {
          icon: <MessageSquare size={20} />,
          label: "নতুন বার্তা",
          value: bn(stats?.support?.newMessages),
          tone: "text-orange-500",
          sub: "কন্টাক্ট ফর্ম ইনবক্স",
        },
      ],
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black tracking-tighter">
            ড্যাশবোর্ড ওভারভিউ
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            সব সংখ্যা লাইভ ডেটাবেস থেকে আসছে
          </p>
        </div>
        <button onClick={load} className="btn btn-sm btn-outline gap-2">
          <RefreshCw size={14} /> রিফ্রেশ
        </button>
      </div>

      {sections.map((section) => (
        <React.Fragment key={section.title}>
          <SectionTitle>{section.title}</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {section.cards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>
        </React.Fragment>
      ))}

      {/* OAuth সোশ্যাল লগইনের স্বাস্থ্য — কাউন্টার + পারসিস্টেড রিসেন্ট ইভেন্ট */}
      <OAuthMonitorSection
        stats={stats}
        events={oauthEvents}
        eventsLoading={oauthEventsLoading}
        eventsError={oauthEventsError}
        reload={loadOauthEvents}
        eventFilter={eventFilter}
        setEventFilter={setEventFilter}
        ipFilter={ipFilter}
        setIpFilter={setIpFilter}
      />

      {/* Contact ফর্মের স্প্যাম-ড্রপ হিস্ট্রি (capped collection — রিস্টার্ট-সহনশীল) */}
      <ContactSpamSection
        events={contactEvents}
        loading={contactEventsLoading}
        error={contactEventsError}
        reload={loadContactEvents}
      />
    </div>
  );
};

export default StatsDashboard;
