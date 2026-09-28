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

const StatsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) return load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

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
    </div>
  );
};

export default StatsDashboard;
