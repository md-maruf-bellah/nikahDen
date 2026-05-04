"use client";
import React, { useRef, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Heart,
  Users,
  CreditCard,
  Bell,
  MessageSquare,
  LogOut,
  Edit3,
  Menu,
  X,
  Search,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  User,
  Settings,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import profile from "./../../../assets/member/alem.png";
import MembershipDashboard from "../profile/memberAndPackage/page";
import ProfileData from "../profile/biodata/page";
import LikeList from "../profile/likeList/page";
import MemberShip from "../profile/memberShip/page";
import NotificationList from "../profile/notification/page";
import LogoutForm from "../profile/logout/page";
import MessagingPage from "../message/page";

// Components ইমপোর্ট (আপনার আগের মতোই)

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("ড্যাশবোর্ড");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // মোবাইলের জন্য
  const [isCollapsed, setIsCollapsed] = useState(false); // ডেস্কটপের জন্য
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: "ড্যাশবোর্ড" },
    { icon: <FileText size={20} />, label: "বায়োডাটা" },
    { icon: <Heart size={20} />, label: "পছন্দের তালিকা" },
    { icon: <Users size={20} />, label: "আপনাকে যারা পছন্দ করেছেন" },
    { icon: <CreditCard size={20} />, label: "মেম্বারশিপ" },
    { icon: <Bell size={20} />, label: "নোটিফিকেশন" },
    { icon: <MessageSquare size={20} />, label: "মেসেজিং" },
    { icon: <LogOut size={20} />, label: "লগ আউট" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "ড্যাশবোর্ড":
        return <MembershipDashboard />;
      case "বায়োডাটা":
        return <ProfileData />;
      case "পছন্দের তালিকা":
        return <LikeList />;
      case "আপনাকে যারা পছন্দ করেছেন":
        return <LikeList />;
      case "মেম্বারশিপ":
        return <MemberShip />;
      case "নোটিফিকেশন":
        return <NotificationList />;
      case "মেসেজিং":
        return <MessagingPage />;
      case "লগ আউট":
        return <LogoutForm />;
      default:
        return <MembershipDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* --- Sidebar --- */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-gray-200 
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "lg:w-20" : "lg:w-72 w-72"}
        `}
      >
        <div className="h-full flex flex-col relative">
          {/* Collapse Toggle Button (Only Desktop) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-20 bg-red-500 text-white rounded-full p-1 border-2 border-white shadow-md z-50"
          >
            {isCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>

          {/* Sidebar Logo */}
          <div
            className={`p-6 flex items-center border-b border-gray-100 ${isCollapsed ? "justify-center" : "justify-between"}`}
          >
            {!isCollapsed && (
              <h1 className="text-xl font-bold text-red-500 uppercase">
                Biye Sadi
              </h1>
            )}
            {isCollapsed && (
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                BS
              </div>
            )}
            <button
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Profile Section */}
          {/* <div
            className={`p-6 text-center border-b border-gray-100 overflow-hidden ${isCollapsed ? "px-2" : ""}`}
          >
            <div className="relative inline-block">
              <Image
                src={profile}
                alt="Profile"
                className={`${isCollapsed ? "w-10 h-10" : "w-20 h-20"} rounded-full border-2 border-red-100 transition-all duration-300 mx-auto object-cover`}
              />
            </div>
            {!isCollapsed && (
              <div className="mt-3 whitespace-nowrap">
                <h3 className="font-bold text-gray-800">মেরাজ আকন্দ</h3>
                <p className="text-xs text-gray-400 uppercase">এডমিন</p>
              </div>
            )}
          </div> */}

          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
            {menuItems.map((item, index) => (
              <div key={index} className="group relative">
                <button
                  onClick={() => {
                    setActiveTab(item.label);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center transition-all duration-200
                    ${isCollapsed ? "justify-center px-0 py-4" : "px-6 py-3.5 gap-3"}
                    ${
                      activeTab === item.label
                        ? "bg-red-50 text-red-500 border-r-4 border-red-500"
                        : "text-gray-500 hover:bg-gray-50 hover:text-red-500"
                    }
                  `}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="text-[15px] font-medium whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </button>

                {/* Tooltip for Collapsed State */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[100] whitespace-nowrap shadow-xl">
                    {item.label}
                    {/* Tooltip Arrow */}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* --- Main Area --- */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-gray-600"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-gray-700">{activeTab}</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="সার্চ..."
                className="pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm w-64 focus:outline-none focus:ring-1 focus:ring-red-400"
              />
            </div>
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            {/* User Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-1 pr-3 hover:bg-slate-50 rounded-full transition-all border border-transparent hover:border-slate-100"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-red-50">
                  <Image
                    src={profile}
                    alt="Admin"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-bold text-slate-800 leading-none">
                    মেরাজ আকন্দ
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 uppercase font-medium">
                    Developer
                  </p>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 py-2 z-50 animate-in fade-in zoom-in duration-200">
                  <div className="px-4 py-3 border-b border-slate-50 mb-1">
                    <p className="text-xs text-slate-400">Signed in as</p>
                    <p className="text-sm font-bold text-slate-700 truncate">
                      meraj@ramoit.com
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("বায়োডাটা");
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <User size={16} /> প্রোফাইল দেখুন
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                    <Settings size={16} /> সেটিংস
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors border-b border-slate-50">
                    <ShieldCheck size={16} /> নিরাপত্তা
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("লগ আউট");
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors mt-1"
                  >
                    <LogOut size={16} /> লগ আউট
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 min-h-[80vh]">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #e5e7eb;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
