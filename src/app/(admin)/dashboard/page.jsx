"use client";
import React, { useRef, useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Heart,
  Users,
  CreditCard,
  Bell,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Settings,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import profile from "./../../../../assets/member/alem1.png";
import MembershipDashboard from "../../profile/memberAndPackage/page";
import ProfileData from "../../profile/biodata/page";
import LikeList from "../../profile/likeList/page";
import MemberShip from "../../profile/memberShip/page";
import NotificationList from "../../profile/notification/page";
import LogoutForm from "../../profile/logout/page";
import MessagingPage from "../../message/page";
import UserManagement from "./table/page";
import Commnent from "./comment/page";
import Invoice from "./invoice/page";
import Support from "./support/page";
import UserPage from "./user/page";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("ড্যাশবোর্ড");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: "ড্যাশবোর্ড" },
    { icon: <CreditCard size={20} />, label: "User" },
    { icon: <FileText size={20} />, label: "Commnent" },
    { icon: <Heart size={20} />, label: "Invoice" },
    { icon: <Users size={20} />, label: "Support" },
    { icon: <Bell size={20} />, label: "নোটিফিকেশন" },
    { icon: <MessageSquare size={20} />, label: "মেসেজিং" },
    { icon: <LogOut size={20} />, label: "লগ আউট" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "ড্যাশবোর্ড":
        return <UserManagement />;
      case "Commnent":
        return <Commnent />;
      case "Invoice":
        return <Invoice />;
      case "Support":
        return <Support />;
      case "User":
        return <UserPage />;

      default:
        return <UserManagement />;
    }
  };

  return (
    // h-screen and overflow-hidden ensures the main page doesn't scroll
    <div className="h-screen w-full  flex overflow-hidden">
      {/* --- Fixed Sidebar --- */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 border-r border-gray-50 
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "lg:w-20" : "lg:w-64 w-64"}
        `}
      >
        <div className="h-full flex flex-col relative">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-10 bg-red-500 text-white rounded-full p-1 border-2 border-white shadow-md z-50 cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>

          <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
            {!isCollapsed ? (
              <h1 className="text-xl font-bold text-red-500 uppercase">
                Biye Sadi
              </h1>
            ) : (
              <div className="w-10 h-10 px-5 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold mx-auto">
                NKD
              </div>
            )}
            <button
              className="lg:hidden ml-auto"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

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
                    ${activeTab === item.label ? "bg-red-50 text-red-500 border-r-4 border-red-500" : "text-gray-500 hover:bg-gray-50 hover:text-red-500 cursor-pointer"}
                  `}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="text-[15px] font-medium whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </button>
                {isCollapsed && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2  text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[100] whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* --- Main Content Wrapper --- */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300
          ${isCollapsed ? "lg:ml-20" : "lg:ml-64"}
        `}
      >
        {/* --- Fixed Navbar (Header) --- */}
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shrink-0">
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

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-1 hover:bg-gray-50 rounded-full transition-all"
              >
                <div className="w-9 h-9 cursor-pointer rounded-full overflow-hidden ring-2 ring-red-50">
                  <Image
                    src={profile}
                    alt="Admin"
                    className="w-full h-full object-cover"
                  />
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute bg-base-200 right-0 mt-3 w-56 rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-50 mb-1">
                    <p className="text-sm font-bold text-gray-700">
                      মেরাজ আকন্দ
                    </p>
                    <p className="text-xs text-gray-400">meraj@ramoit.com</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("লগ আউট");
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 cursor-pointer"
                  >
                    <LogOut size={16} /> লগ আউট
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* --- Scrollable Content Area --- */}
        <main className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="w-full mx-auto  border border-gray-200 rounded min-h-full cursor-pointer">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
