"use client";
import React, { Suspense, useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Heart,
  Users,
  SlidersHorizontal,
  CreditCard,
  Bell,
  MessageSquare,
  LogOut,
  Edit3,
  ShieldCheck,
  Menu,
  X,
  Ban,
  Eye,
  HeartHandshake,
} from "lucide-react";
import Image from "next/image";
import profile from "./../../../assets/member/alem.png";
import MessagingPage from "./message/MessagingPage";
import PreferencesPage from "./preferences/page";
import ProfileData from "./biodata/page";
import LikeList from "./likeList/page";
import ProfileViews from "./views/page";
import MemberShip from "./memberShip/page";
import MarriagePage from "./marriage/page";
import NotificationList from "./notification/page";
import MembershipDashboard from "./memberAndPackage/page";
import BlockedList from "./blocked/page";
import PrivacySettingsPage from "./privacy/page";
// Navbar এখন root layout-এর SiteChrome থেকে আসে
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { tokenStore } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

const Dashboard = () => {
  const { t, isRTL, language } = useLanguage();
  const [activeTabKey, setActiveTabKey] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Role-based routing: স্টাফ এখানে এলে অ্যাডমিন ড্যাশবোর্ডে পাঠাই — মেম্বার এলাকা মেম্বারদের জন্য।
  useEffect(() => {
    if (loading) return;
    if (!tokenStore.getAccess()) {
      router.replace("/login");
      return;
    }
    const role = user?.role;
    if (role && role !== "USER" && tokenStore.getAccess()) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  const menuItems = [
    { key: "dashboard", icon: <LayoutDashboard size={18} />, label: t("profile.dashboard", "ড্যাশবোর্ড") },
    { key: "biodata", icon: <FileText size={18} />, label: t("profile.biodata", "বায়োডাটা") },
    { key: "favorites", icon: <Heart size={18} />, label: t("profile.favorites", "পছন্দের তালিকা") },
    { key: "whoLikedYou", icon: <Users size={18} />, label: t("profile.whoLikedYou", "আপনাকে যারা পছন্দ করেছেন") },
    { key: "profileViews", icon: <Eye size={18} />, label: t("profile.profileViews", "কারা দেখেছেন") },
    { key: "marriage", icon: <HeartHandshake size={18} />, label: t("profile.marriage", "বিবাহ ও আইডি হাইড") },
    { key: "preferences", icon: <SlidersHorizontal size={18} />, label: t("profile.preferences", "প্রেফারেন্স ও ম্যাচ") },
    { key: "membership", icon: <CreditCard size={18} />, label: t("profile.membership", "মেম্বারশিপ") },
    { key: "notification", icon: <Bell size={18} />, label: t("profile.notifications", "নোটিফিকেশন") },
    { key: "message", icon: <MessageSquare size={18} />, label: t("profile.messaging", "মেসেজিং") },
    { key: "blocked", icon: <Ban size={18} />, label: t("profile.blockedList", "ব্লক তালিকা") },
    { key: "privacy", icon: <ShieldCheck size={18} />, label: t("profile.privacy", "প্রাইভেসি") },
    { key: "logout", icon: <LogOut size={18} />, label: t("profile.logout", "লগ আউট") },
  ];

  // মেনু আইটেম → কনটেন্ট ম্যাপিং; লগ আউট আলাদাভাবে হ্যান্ডেল হয়
  const renderContent = () => {
    switch (activeTabKey) {
      case "dashboard":
        return <MembershipDashboard />;
      case "biodata":
        return (
          <div className="border border-primary/15 rounded-lg overflow-hidden">
            <ProfileData />
          </div>
        );
      case "favorites":
        return (
          <div className="border border-primary/15 rounded-lg overflow-hidden">
            <LikeList />
          </div>
        );
      case "whoLikedYou":
        return (
          <div className="border border-primary/15 rounded-lg overflow-hidden">
            <LikeList received />
          </div>
        );
      case "profileViews":
        return (
          <div className="border border-primary/15 rounded-lg overflow-hidden">
            <ProfileViews />
          </div>
        );
      case "marriage":
        return (
          <div className="border border-primary/15 rounded-lg overflow-hidden">
            <MarriagePage />
          </div>
        );
      case "preferences":
        return (
          <div className="border border-primary/15 rounded-lg overflow-hidden">
            <PreferencesPage />
          </div>
        );
      case "membership":
        return (
          <div className="border border-primary/15 rounded-lg overflow-hidden">
            <MemberShip />
          </div>
        );
      case "notification":
        return (
          <div className="border border-primary/15 rounded-lg overflow-hidden">
            <NotificationList />
          </div>
        );
      case "message":
        return (
          <div className="">
            <MessagingPage />
          </div>
        );
      case "blocked":
        return (
          <div className="border border-primary/15 rounded-lg overflow-hidden">
            <BlockedList />
          </div>
        );
      case "privacy":
        return (
          <div className="border border-primary/15 rounded-lg overflow-hidden">
            <PrivacySettingsPage />
          </div>
        );
      default:
        return null;
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // ড্যাশবোর্ডের কমপ্লিশন-কার্ড থেকে বায়োডাটা ট্যাবে যাওয়ার ইভেন্ট
  useEffect(() => {
    const openBiodata = () => setActiveTabKey("biodata");
    window.addEventListener("open-biodata-tab", openBiodata);
    return () => window.removeEventListener("open-biodata-tab", openBiodata);
  }, []);

  // ?tab= query — notification bell-এর "সব দেখুন" গভীর-লিংক
  useEffect(() => {
    const tab = searchParams?.get("tab");
    if (tab) {
      const normalized = tab.toLowerCase();
      const target = menuItems.find(
        (m) =>
          m.key.toLowerCase() === normalized ||
          m.label?.toLowerCase() === normalized ||
          (m.key === "notification" && (tab === "নোটিফিকেশন" || normalized === "notifications")) ||
          (m.key === "profileViews" && (tab === "কারা দেখেছেন" || normalized === "views")) ||
          (m.key === "whoLikedYou" && tab === "আপনাকে যারা পছন্দ করেছেন") ||
          (m.key === "marriage" && (tab === "বিবাহ" || normalized === "marriage" || tab === "বিবাহ ও আইডি হাইড"))
      );
      if (target) {
        let cancelled = false;
        Promise.resolve().then(() => {
          if (!cancelled) setActiveTabKey(target.key);
        });
        return () => {
          cancelled = true;
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div>
      <div className="min-h-screen p-4 md:p-8">
        {/* Mobile Toggle Button */}
        <div className="lg:hidden flex justify-between items-center mb-4 p-3 rounded-lg border border-red-200">
          <h2 className="font-bold text-red-500">
            {menuItems.find((m) => m.key === activeTabKey)?.label || t("profile.dashboard", "ড্যাশবোর্ড")}
          </h2>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-red-50 text-red-500 rounded-md"
            aria-label="Toggle Menu"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
          {/* Sidebar */}
          <div
            className={`
          lg:col-span-3 bg-base-100 rounded-lg border border-primary/15 overflow-hidden h-fit 
          fixed lg:relative z-50 lg:z-0 top-0 ${isRTL ? "right-0" : "left-0"} w-64 lg:w-full h-full lg:h-auto
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : isRTL ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
          >
            <div className="p-6 text-center border-b border-gray-100 relative">
              <div className="relative inline-block">
                <Image
                  src={user?.avatar || profile}
                  alt="Profile"
                  className="w-24 h-24 rounded-full border-2 border-gray-200 mx-auto"
                  width={96}
                  height={96}
                />
                <button className="absolute bottom-0 right-0 p-1 rounded-full shadow-md border border-gray-100" aria-label="Edit Profile">
                  <Edit3 size={14} />
                </button>
              </div>
              <h3 className="mt-4 font-bold text-lg">
                {user?.firstName || user?.name || t("profile.welcome", "সদস্য")}
              </h3>
              <p className="text-xs">
                {user?.email || "—"}
              </p>
            </div>

            <nav className="py-4">
              <h4 className="px-6 text-sm font-bold mb-4 uppercase tracking-wider">
                {t("profile.dashboard", "ড্যাশবোর্ড")}
              </h4>
              {menuItems.map((item, index) =>
                item.key === "logout" ? (
                  <button
                    key={index}
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors hover:bg-base-200 hover:text-red-500 cursor-pointer"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ) : (
                  <button
                    key={index}
                    onClick={() => {
                      setActiveTabKey(item.key);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                      activeTabKey === item.key
                        ? "bg-base-200 text-red-500 border-r-4 border-red-500 font-bold"
                        : "hover:bg-base-200 hover:text-red-500 cursor-pointer"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                )
              )}
            </nav>
          </div>

          {/* Overlay for Mobile Sidebar */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/20 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            ></div>
          )}

          {/* Main Content Area */}
          <div className="lg:col-span-9">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

// useSearchParams()-এর জন্য Suspense boundary দরকার (?tab= deep-link)
export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <Dashboard />
    </Suspense>
  );
}