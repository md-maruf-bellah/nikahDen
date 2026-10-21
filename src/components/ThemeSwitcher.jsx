"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Palette,
  Check,
  Lock,
  Crown,
  Star,
  Sparkles,
  ArrowRight,
  X,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { membershipApi } from "@/lib/api";
import {
  THEMES_CONFIG,
  resolveUserThemeTier,
  isThemeUnlocked,
} from "@/lib/themes.core.mjs";

export { THEMES_CONFIG, resolveUserThemeTier, isThemeUnlocked };

export default function ThemeSwitcher() {
  const { user } = useAuth();
  const [theme, setTheme] = useState("light");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | '0' | '1' | '2'
  const [membership, setMembership] = useState(null);
  const [lockedModalTheme, setLockedModalTheme] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch subscription tier on user change
  useEffect(() => {
    let mounted = true;
    if (user?.id) {
      membershipApi
        .mine()
        .then((m) => {
          if (mounted) setMembership(m);
        })
        .catch(() => {});
    } else {
      setMembership(null);
    }
    return () => {
      mounted = false;
    };
  }, [user]);

  // Calculate user's tier
  const userTier = useMemo(() => {
    const res = resolveUserThemeTier(user, membership);
    let icon = <Sparkles size={13} className="text-gray-500" />;
    if (res.level === 2) {
      icon =
        user?.role && ["ADMIN", "SUPER_ADMIN", "STAFF", "EDITOR"].includes(user.role) ? (
          <ShieldCheck size={13} className="text-purple-600" />
        ) : (
          <Crown size={13} className="text-amber-600" />
        );
    } else if (res.level === 1) {
      icon = <Star size={13} className="text-sky-600" />;
    }
    return { ...res, icon };
  }, [user, membership]);

  // Apply theme to document
  const applyTheme = (t) => {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem("theme", t);
      window.dispatchEvent(new CustomEvent("nikah-theme-change", { detail: t }));
    } catch (e) {}
  };

  // Sync theme from localStorage and custom event across instances
  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);
    setTheme(saved);

    const handleThemeChange = (e) => {
      if (e?.detail) {
        setTheme(e.detail);
      }
    };
    const handleStorage = (e) => {
      if (e.key === "theme" && e.newValue) {
        setTheme(e.newValue);
        document.documentElement.setAttribute("data-theme", e.newValue);
      }
    };

    window.addEventListener("nikah-theme-change", handleThemeChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("nikah-theme-change", handleThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle click on a theme item
  const handleSelectTheme = (tConfig) => {
    if (!isThemeUnlocked(tConfig.tier, userTier.level)) {
      // Locked! Open upgrade modal
      setLockedModalTheme(tConfig);
      setDropdownOpen(false);
    } else {
      applyTheme(tConfig.id);
      setDropdownOpen(false);
    }
  };

  // Filtered themes by tab
  const filteredThemes = useMemo(() => {
    if (activeTab === "all") return THEMES_CONFIG;
    const tierNum = parseInt(activeTab, 10);
    return THEMES_CONFIG.filter((t) => t.tier === tierNum);
  }, [activeTab]);

  const currentThemeObj = THEMES_CONFIG.find((t) => t.id === theme) || THEMES_CONFIG[0];

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* ===== Trigger Button ===== */}
      <button
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="btn btn-ghost btn-sm flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-base-300/60 hover:border-primary/40 hover:bg-base-200/60 transition-all duration-200"
        title="থিম পরিবর্তন করুন"
        aria-label="Theme selector"
      >
        <div className="relative flex items-center justify-center">
          <Palette size={16} className="text-primary transition-transform duration-300 group-hover:rotate-12" />
        </div>

        <div className="hidden sm:flex flex-col items-start text-left leading-none">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-base-content/60 uppercase tracking-wider">থিম:</span>
            <span className="text-xs font-black text-primary capitalize">{currentThemeObj.name.split(" ")[0]}</span>
          </div>
        </div>

        {/* Small Dual Swatch */}
        <div className="hidden md:grid grid-cols-2 gap-0.5 w-4 h-4 rounded-sm overflow-hidden border border-base-300 shadow-xs">
          <div className={`${currentThemeObj.primaryColor} w-full h-full`}></div>
          <div className={`${currentThemeObj.baseColor} w-full h-full`}></div>
        </div>
      </button>

      {/* ===== Dropdown Menu ===== */}
      {dropdownOpen && (
        <div
          className="absolute right-0 mt-2 z-[120] w-80 md:w-96 rounded-2xl bg-base-100 border border-base-300/80 shadow-2xl p-3 
                     animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
        >
          {/* Header & User Tier Badge */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-base-200">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-black tracking-wide text-base-content">
                <Palette size={14} className="text-primary" />
                <span>ওয়েবসাইট থিম পছন্দ করুন</span>
              </div>
              <p className="text-[10px] text-base-content/60 mt-0.5">{userTier.sub}</p>
            </div>

            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border shadow-xs ${userTier.badgeTone}`}
            >
              {userTier.icon}
              <span>{userTier.label}</span>
            </div>
          </div>

          {/* Tier Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-base-200/80 rounded-xl mb-3 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`py-1.5 rounded-lg transition-all text-center ${
                activeTab === "all"
                  ? "bg-base-100 text-primary shadow-xs font-black"
                  : "text-base-content/70 hover:text-base-content"
              }`}
            >
              সকল
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("0")}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeTab === "0"
                  ? "bg-base-100 text-emerald-600 shadow-xs font-black"
                  : "text-base-content/70 hover:text-base-content"
              }`}
            >
              <span>ফ্রি</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("1")}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeTab === "1"
                  ? "bg-base-100 text-sky-600 shadow-xs font-black"
                  : "text-base-content/70 hover:text-base-content"
              }`}
            >
              <Star size={11} />
              <span>সিলভার</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("2")}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeTab === "2"
                  ? "bg-base-100 text-amber-600 shadow-xs font-black"
                  : "text-base-content/70 hover:text-base-content"
              }`}
            >
              <Crown size={11} />
              <span>রয়্যাল</span>
            </button>
          </div>

          {/* Theme List Grid */}
          <div className="max-h-80 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-base-300">
            {filteredThemes.map((t) => {
              const isLocked = !isThemeUnlocked(t.tier, userTier.level);
              const isCurrent = theme === t.id;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTheme(t)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all duration-150 group border ${
                    isCurrent
                      ? "bg-primary/10 border-primary/40 shadow-xs"
                      : isLocked
                      ? "hover:bg-amber-500/5 border-transparent opacity-85 hover:opacity-100"
                      : "hover:bg-base-200/80 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Dual Swatch Box */}
                    <div className="relative shrink-0 grid grid-cols-2 gap-0.5 w-7 h-7 rounded-lg overflow-hidden border border-base-300 shadow-xs">
                      <div className={`${t.primaryColor} w-full h-full`}></div>
                      <div className={`${t.baseColor} w-full h-full`}></div>
                      {isLocked && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px] flex items-center justify-center text-amber-300">
                          <Lock size={12} />
                        </div>
                      )}
                    </div>

                    {/* Titles */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate text-base-content">{t.name}</span>
                        <span className="text-[10px] text-base-content/40 font-mono">({t.id})</span>
                      </div>
                      <p className="text-[10px] text-base-content/60 truncate">{t.desc}</p>
                    </div>
                  </div>

                  {/* Right Status / Badge */}
                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    {isLocked ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        <Lock size={10} />
                        <span>{t.tierName}</span>
                      </span>
                    ) : (
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${
                          t.tier === 0
                            ? "bg-base-200 text-base-content/60"
                            : t.tier === 1
                            ? "bg-sky-500/10 text-sky-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {t.tierName}
                      </span>
                    )}

                    {isCurrent && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-xs">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer Promo */}
          {userTier.level < 2 && (
            <div className="mt-3 pt-2.5 border-t border-base-200 flex items-center justify-between text-[11px]">
              <span className="text-base-content/70">আরও চমৎকার থিম চান?</span>
              <Link
                href="/member"
                onClick={() => setDropdownOpen(false)}
                className="text-primary font-bold hover:underline flex items-center gap-1"
              >
                প্যাকেজ দেখুন <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ===== Premium Locked Theme Upgrade Modal ===== */}
      {lockedModalTheme && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-base-100 rounded-3xl p-6 shadow-2xl border border-base-300 text-center animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setLockedModalTheme(null)}
              className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
            >
              <X size={18} />
            </button>

            {/* Icon & Swatch */}
            <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl grid grid-cols-2 gap-1 p-1 bg-base-200 border border-base-300 shadow-md">
                <div className={`${lockedModalTheme.primaryColor} rounded-l-xl w-full h-full`}></div>
                <div className={`${lockedModalTheme.baseColor} rounded-r-xl w-full h-full`}></div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg border-2 border-base-100">
                <Lock size={13} />
              </div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-700 border border-amber-500/20 mb-2">
              <Crown size={13} />
              <span>{lockedModalTheme.tierName} প্যাকেজ এক্সক্লুসিভ</span>
            </div>

            {/* Title */}
            <h3 className="text-xl font-black text-base-content">
              {lockedModalTheme.name} <span className="text-sm font-normal text-base-content/50">({lockedModalTheme.id})</span>
            </h3>

            <p className="text-xs text-base-content/70 mt-2 leading-relaxed px-4">
              এই বিশেষ প্রিমিয়াম থিমটি <strong>{lockedModalTheme.tierName}</strong> প্যাকেজের অন্তর্ভুক্ত। 
              প্যাকেজটি সাবস্ক্রাইব করে সব ধরনের এক্সক্লুসিভ থিম, আনলিমিটেড কানেক্ট ও বিশেষ প্রিভিলেজ সক্রিয় করুন!
            </p>

            {/* Features Mini Checklist */}
            <div className="mt-4 p-3 bg-base-200/60 rounded-2xl text-left space-y-1.5 text-xs text-base-content/80">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-primary shrink-0" />
                <span>সকল {lockedModalTheme.tierName} ও স্পেশাল থিম আনলক</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-primary shrink-0" />
                <span>সরাসরি অভিভাবকের নম্বর ও বায়োডাটা মেসেজিং</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-primary shrink-0" />
                <span>ম্যাট্রিমনি স্পেশাল অগ্রাধিকার সার্ভিস</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href="/member"
                onClick={() => setLockedModalTheme(null)}
                className="btn btn-primary w-full text-white font-bold gap-2 shadow-lg shadow-primary/25"
              >
                <span>প্যাকেজ দেখুন ও আপগ্রেড করুন</span>
                <ArrowRight size={16} />
              </Link>
              <button
                type="button"
                onClick={() => setLockedModalTheme(null)}
                className="btn btn-ghost btn-sm text-base-content/60"
              >
                পরে করব
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
