"use client";
import React, { useRef, useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  Bell,
  MessageSquare,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
  Crown,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import profile from "./../../../../assets/member/alem.png";
import { useAuth } from "@/lib/auth-context";
import { contactApi, adminNotificationApi } from "@/lib/api";
import UserManagement from "./table/page";
import Invoice from "./invoice/page";
import Support from "./support/page";
import BiodataModeration from "./user/page";
import StatsDashboard from "./stats/page";
import GuardiansReview from "./guardians/page";
import AdminMarriagesPage from "./marriages/page";
import AdminNotificationsPage from "./comment/page";
import AdminMessagePage from "./message/page";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import LanguageSelect from "@/components/LanguageSelect";
import { useLanguage } from "@/lib/language-context";

const bn = (n) => Number(n ?? 0).toLocaleString("bn-BD");

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { t } = useLanguage();
  const [activeTabKey, setActiveTabKey] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const isStaff = ["SUPERADMIN", "ADMIN", "EDITOR"].includes(user?.role);
  const [newMessages, setNewMessages] = useState(0);
  const [adminUnreadNotifs, setAdminUnreadNotifs] = useState(0);

  // লাইভ আনরিড নোটিফিকেশন কাউন্টার
  useEffect(() => {
    if (!isStaff) return undefined;
    let cancelled = false;
    let timer = null;
    const refreshNotifs = async () => {
      try {
        const res = await adminNotificationApi.list({ unreadOnly: "true", limit: 1 });
        if (!cancelled) {
          const count = Number(res?.pagination?.total ?? res?.data?.length ?? 0);
          setAdminUnreadNotifs(count);
        }
      } catch {
        /* নীরব */
      }
    };
    refreshNotifs();
    timer = setInterval(refreshNotifs, 30_000);
    const onFocus = () => refreshNotifs();
    window.addEventListener("focus", onFocus);
    window.addEventListener("admin:notifications:changed", refreshNotifs);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("admin:notifications:changed", refreshNotifs);
    };
  }, [isStaff]);

  // সাপোর্ট ইনবক্সে নতুন বার্তার লাইভ কাউন্টার
  useEffect(() => {
    if (!isStaff) return undefined;
    let cancelled = false;
    let timer = null;
    const refresh = async () => {
      try {
        const res = await contactApi.newCount();
        if (!cancelled) setNewMessages(Number(res?.count) || 0);
      } catch {
        /* নীরব */
      }
    };
    refresh();
    timer = setInterval(refresh, 30_000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("support:changed", refresh);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("support:changed", refresh);
    };
  }, [isStaff]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isStaff) router.replace(user ? "/profile" : "/login");
  }, [authLoading, isStaff, user, router]);

  if (authLoading || !isStaff) return null;

  const menuItems = [
    { key: "dashboard", icon: <LayoutDashboard size={19} />, label: t("dashboard.title", "ড্যাশবোর্ড") },
    { key: "users", icon: <Users size={19} />, label: t("dashboard.userManagement", "ইউজার ম্যানেজমেন্ট") },
    { key: "biodatas", icon: <FileText size={19} />, label: t("dashboard.biodataModeration", "বায়োডাটা মডারেশন") },
    { key: "marriages", icon: <HeartHandshake size={19} />, label: t("dashboard.marriages", "সফল বিবাহ ও জুটি") },
    { key: "guardians", icon: <ShieldCheck size={19} />, label: t("dashboard.guardiansReview", "গার্ডিয়ান রিভিউ") },
    { key: "invoices", icon: <CreditCard size={19} />, label: t("dashboard.invoices", "ইনভয়েস ও পেমেন্ট") },
    { key: "support", icon: <MessageSquare size={19} />, label: t("dashboard.support", "সাপোর্ট ইনবক্স"), badge: newMessages },
    { key: "notifications", icon: <Bell size={19} />, label: t("dashboard.notifications", "নোটিফিকেশন"), badge: adminUnreadNotifs },
    { key: "messages", icon: <MessageSquare size={19} />, label: t("dashboard.messaging", "মেসেজিং") },
  ];

  const renderContent = () => {
    switch (activeTabKey) {
      case "dashboard":
        return <StatsDashboard onNavigateTab={setActiveTabKey} />;
      case "users":
        return <UserManagement />;
      case "biodatas":
        return <BiodataModeration />;
      case "marriages":
        return <AdminMarriagesPage />;
      case "guardians":
        return <GuardiansReview />;
      case "invoices":
        return <Invoice />;
      case "support":
        return <Support />;
      case "notifications":
        return <AdminNotificationsPage onNavigateTab={setActiveTabKey} />;
      case "messages":
        return <AdminMessagePage />;
      default:
        return <StatsDashboard onNavigateTab={setActiveTabKey} />;
    }
  };

  const currentMenu = menuItems.find((m) => m.key === activeTabKey);

  return (
    <div className="h-screen w-full flex overflow-hidden bg-base-100 text-base-content">
      {/* ===== Fixed Sidebar ===== */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 bg-base-100 border-r border-base-200 dark:border-base-300
          transition-all duration-300 ease-in-out shadow-xs
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "lg:w-20" : "lg:w-64 w-64"}
        `}
      >
        <div className="h-full flex flex-col justify-between relative">
          {/* Collapse Toggle Arrow Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3.5 top-8 bg-base-100 hover:bg-[#fd6969] text-base-content/70 hover:text-white rounded-full p-1 border border-base-300 shadow-md z-50 transition-colors cursor-pointer"
            title={isCollapsed ? "মেনু বড় করুন" : "মেনু ছোট করুন"}
          >
            {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>

          <div>
            {/* Sidebar Brand Header */}
            <div className="h-16 flex items-center px-4 md:px-5 border-b border-base-200 dark:border-base-300 shrink-0">
              {!isCollapsed ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#fd6969] text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                    NKD
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-base font-black text-gray-800 dark:text-gray-100 tracking-tight leading-tight">
                      নিকাহ্ দ্বীন
                    </h1>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                      অ্যাডমিন প্যানেল
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#fd6969] text-white flex items-center justify-center font-black text-xs mx-auto shadow-sm">
                  NKD
                </div>
              )}

              <button
                className="lg:hidden ml-auto p-1.5 rounded-lg hover:bg-base-200 text-gray-500"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation Menu */}
            <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar">
              {menuItems.map((item) => {
                const isActive = activeTabKey === item.key;
                return (
                  <div key={item.key} className="group relative">
                    <button
                      onClick={() => {
                        setActiveTabKey(item.key);
                        if (window.innerWidth < 1024) setIsSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center transition-all duration-200 rounded-2xl
                        ${isCollapsed ? "justify-center p-3" : "px-3.5 py-2.5 gap-3"}
                        ${
                          isActive
                            ? "bg-[#fd6969]/10 text-[#fd6969] font-bold shadow-xs border border-[#fd6969]/20"
                            : "text-base-content/70 hover:bg-base-200/80 hover:text-base-content font-medium"
                        }
                      `}
                    >
                      <span className={`shrink-0 ${isActive ? "text-[#fd6969]" : "text-base-content/60 group-hover:text-[#fd6969]"}`}>
                        {item.icon}
                      </span>

                      {!isCollapsed && (
                        <span className="text-xs truncate">{item.label}</span>
                      )}

                      {/* Badge counter */}
                      {item.badge > 0 && (
                        <span
                          className={`inline-flex items-center justify-center min-w-[18px] h-4.5 px-1.5 rounded-full text-[10px] font-black leading-none ${
                            isCollapsed
                              ? "absolute top-1 right-1"
                              : "ml-auto"
                          } ${item.key === "support" ? "bg-amber-500 text-white" : "bg-[#fd6969] text-white"}`}
                        >
                          {item.badge > 99 ? "99+" : bn(item.badge)}
                        </span>
                      )}
                    </button>

                    {/* Tooltip on Collapsed */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs rounded-xl bg-gray-900 text-white shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[100] whitespace-nowrap font-bold">
                        {item.label}
                        {item.badge > 0 && (
                          <span className="ml-1.5 badge badge-xs bg-[#fd6969] text-white border-none">
                            {bn(item.badge)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Admin Profile & Logout */}
          <div className="p-3 border-t border-base-200 dark:border-base-300 shrink-0">
            {!isCollapsed ? (
              <div className="flex items-center justify-between p-2 rounded-2xl bg-base-200/50">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-base-200 shrink-0 border border-gray-200">
                    <Image src={profile} alt="Admin" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <span className="text-[10px] text-gray-400 font-mono block truncate">
                      {user?.role || "ADMIN"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="btn btn-xs btn-ghost text-red-500 hover:bg-red-50"
                  title="লগ আউট"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={logout}
                className="w-full flex items-center justify-center p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                title="লগ আউট"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ===== Main Content Area ===== */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {/* Header Navbar */}
        <header className="h-16 bg-base-100/90 backdrop-blur-md border-b border-base-200 dark:border-base-300 flex items-center justify-between px-4 md:px-6 shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-base-200 transition-colors"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Toggle Sidebar"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                <span>অ্যাডমিন</span>
                <span>/</span>
                <span className="text-[#fd6969] font-bold">{currentMenu?.label || "ড্যাশবোর্ড"}</span>
              </div>
              <h2 className="text-base font-black text-gray-800 dark:text-gray-100 leading-none">
                {currentMenu?.label || "ড্যাশবোর্ড"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Admin Notifications Bell */}
            <button
              onClick={() => setActiveTabKey("notifications")}
              className="relative p-2 rounded-xl hover:bg-base-200 transition-colors cursor-pointer text-gray-600 dark:text-gray-300"
              title="অ্যাডমিন নোটিফিকেশন"
            >
              <Bell size={19} className={adminUnreadNotifs > 0 ? "text-[#fd6969]" : ""} />
              {adminUnreadNotifs > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fd6969] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#fd6969]"></span>
                </span>
              )}
            </button>

            <ThemeSwitcher />
            <LanguageSelect />

            {/* Profile Menu Popup */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-base-200 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[#fd6969]/30">
                  <Image src={profile} alt="Admin" className="w-full h-full object-cover" />
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute bg-base-100 right-0 mt-3 w-56 rounded-2xl shadow-2xl border border-base-200 dark:border-base-300 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-base-200 dark:border-base-300 mb-1">
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-100">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono truncate">{user?.email}</p>
                    <span className="badge badge-xs bg-[#fd6969]/10 text-[#fd6969] border-none font-bold mt-1">
                      {user?.role || "ADMIN"}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut size={14} /> লগ আউট
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 custom-scrollbar">
          <div className="w-full mx-auto min-h-full">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}
