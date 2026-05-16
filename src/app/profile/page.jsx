"use client";
import React, { useState } from "react";
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
} from "lucide-react";
import Image from "next/image";
import profile from "./../../../assets/member/alem1.png";
import MessagingPage from "./message/MessagingPage";
import ProfileData from "./biodata/page";
import LikeList from "./likeList/page";
import MemberShip from "./memberShip/page";
import NotificationList from "./notification/page";
import MembershipDashboard from "./memberAndPackage/page";
import LogoutForm from "./logout/page";
import Navbar from "@/components/landing/Navabar";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("ড্যাশবোর্ড");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { icon: <LayoutDashboard size={18} />, label: "ড্যাশবোর্ড" },
    { icon: <FileText size={18} />, label: "বায়োডাটা" },
    { icon: <Heart size={18} />, label: "পছন্দের তালিকা" },
    { icon: <Users size={18} />, label: "আপনাকে যারা পছন্দ করেছেন" },
    { icon: <CreditCard size={18} />, label: "মেম্বারশিপ" },
    { icon: <Bell size={18} />, label: "নোটিফিকেশন" },
    { icon: <MessageSquare size={18} />, label: "মেসেজিং" },
    { icon: <LogOut size={18} />, label: "লগ আউট" },
  ];

  // আলাদা আলাদা কম্পোনেন্ট রেন্ডার করার ফাংশন
  const renderContent = () => {
    switch (activeTab) {
      case "ড্যাশবোর্ড":
        return <MembershipDashboard />;
      case "বায়োডাটা":
        return (
          <div className="border border-primary/15 rounded-lg overflow-hidden">
            <ProfileData />
          </div>
        );
      case "পছন্দের তালিকা":
        return (
          <div className="border border-rose-200 rounded-lg">
            <LikeList />
          </div>
        );
      case "আপনাকে যারা পছন্দ করেছেন":
        return (
          <div className="border border-rose-200 rounded-lg">
            <LikeList />
          </div>
        );
      case "মেম্বারশিপ":
        return (
          <div className="border border-rose-200 rounded-lg">
            <MemberShip />
          </div>
        );
      case "নোটিফিকেশন":
        return (
          <div className="border border-rose-200 rounded-lg">
            <NotificationList />
          </div>
        );

      case "মেসেজিং":
        return (
          <div className="">
            <MessagingPage />
          </div>
        );
      default:
        return (
          <div>
            <LogoutForm />
          </div>
        );
    }
  };

  return (
    <div>
      <Navbar />
      <div className="min-h-screen p-4 md:p-8">
        {/* Mobile Toggle Button */}
        <div className="lg:hidden flex justify-between items-center mb-4  p-3 rounded-lg border border-red-200">
          <h2 className="font-bold text-red-500">{activeTab}</h2>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-red-50 text-red-500 rounded-md"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
          {/* Sidebar */}
          <div
            className={`
          lg:col-span-3 bg-base-100 rounded-lg border  border-primary/15 overflow-hidden h-fit 
          fixed lg:relative z-50 lg:z-0 top-0 left-0 w-64 lg:w-full h-full lg:h-auto
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
          >
            <div className="p-6 text-center border-b border-gray-100 relative">
              <div className="relative inline-block">
                <Image
                  src={profile}
                  alt="Profile"
                  className="w-24 h-24 rounded-full border-2 border-gray-200 mx-auto"
                />
                <button className="absolute bottom-0 right-0  p-1 rounded-full shadow-md border border-gray-100">
                  <Edit3 size={14} className="" />
                </button>
              </div>
              <h3 className="mt-4 font-bold text-lg">মেরাজ আকন্দ</h3>
              <p className="text-xs ">ঢাকা, বাংলাদেশ</p>
            </div>

            <nav className="py-4">
              <h4 className="px-6 text-sm font-bold mb-4 uppercase tracking-wider">
                ড্যাশবোর্ড
              </h4>
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setActiveTab(item.label);
                    setIsSidebarOpen(false); // মোবাইল মেনু বন্ধ করার জন্য
                  }}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                    activeTab === item.label
                      ? "bg-red-50 text-red-500 border-r-4 border-red-500 font-bold"
                      : " hover:bg-gray-50 hover:text-red-500 cursor-pointer"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
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

export default Dashboard;
