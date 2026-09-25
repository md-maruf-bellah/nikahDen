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
  RefreshCw,
  Crown,
  MessageSquare,
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

      {/* Users */}
      <SectionTitle>ব্যবহারকারী</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard icon={<Users size={20} />} label="মোট ইউজার" value={bn(stats.users.total)} />
        <StatCard icon={<UserCheck size={20} />} label="সক্রিয়" value={bn(stats.users.active)} tone="text-green-600" />
        <StatCard icon={<Users size={20} />} label="অপেক্ষমান" value={bn(stats.users.pending)} tone="text-orange-500" />
        <StatCard icon={<Users size={20} />} label="নিষ্ক্রিয়" value={bn(stats.users.inactive)} tone="text-gray-500" />
        <StatCard icon={<UserPlus size={20} />} label="নতুন (৭ দিন)" value={bn(stats.users.newThisWeek)} tone="text-sky-600" />
        <StatCard icon={<Crown size={20} />} label="স্টাফ অ্যাকাউন্ট" value={bn(stats.users.staff)} tone="text-purple-600" />
      </div>

      {/* Biodatas */}
      <SectionTitle>বায়োডাটা</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard icon={<FileText size={20} />} label="মোট প্রোফাইল" value={bn(stats.biodatas.total)} />
        <StatCard icon={<CheckCircle2 size={20} />} label="অনুমোদিত" value={bn(stats.biodatas.approved)} tone="text-green-600" />
        <StatCard icon={<Clock size={20} />} label="অপেক্ষমান রিভিউ" value={bn(stats.biodatas.pending)} tone="text-orange-500" />
        <StatCard icon={<FileText size={20} />} label="বাতিল" value={bn(stats.biodatas.rejected)} tone="text-red-600" />
        <StatCard icon={<Users size={20} />} label="পাত্র" value={bn(stats.biodatas.grooms)} tone="text-blue-600" />
        <StatCard icon={<Users size={20} />} label="পাত্রী" value={bn(stats.biodatas.brides)} tone="text-pink-600" />
      </div>

      {/* Revenue & membership */}
      <SectionTitle>আয় ও মেম্বারশিপ</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard icon={<Wallet size={20} />} label="মোট আয়" value={taka(stats.revenue.revenueBdt)} tone="text-green-700" />
        <StatCard icon={<Wallet size={20} />} label="এই মাসের আয়" value={taka(stats.revenue.thisMonthBdt)} tone="text-green-600" />
        <StatCard icon={<Wallet size={20} />} label="এই সপ্তাহের আয়" value={taka(stats.revenue.thisWeekBdt)} tone="text-emerald-600" />
        <StatCard icon={<CreditCard size={20} />} label="পরিশোধিত অর্ডার" value={bn(stats.revenue.totalPaidOrders)} tone="text-sky-600" />
        <StatCard icon={<Crown size={20} />} label="সক্রিয় সাবস্ক্রিপশন" value={bn(stats.membership.activeSubscriptions)} tone="text-purple-600" />
      </div>

      {/* Support */}
      <SectionTitle>সাপোর্ট</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<MessageSquare size={20} />}
          label="নতুন বার্তা"
          value={bn(stats.support.newMessages)}
          tone="text-orange-500"
          sub="কন্টাক্ট ফর্ম ইনবক্স"
        />
        <StatCard
          icon={<Heart size={20} />}
          label="নতুন প্রোফাইল (৭ দিন)"
          value={bn(stats.biodatas.newThisWeek)}
          tone="text-pink-600"
        />
      </div>
    </div>
  );
};

export default StatsDashboard;
