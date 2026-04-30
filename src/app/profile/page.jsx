"use client";

import Image from "next/image";
import { useState } from "react";
import photoImage from "./../../../assets/member/alem.png";

export default function DashboardPage() {
  const [open, setOpen] = useState(false);

  const openInNewTab = (url) => {
    window.open(url, "_blank");
  };

  const MenuItems = () => (
    <div className="text-sm">
      <div className="bg-red-100 text-red-500 px-3 py-2 rounded mb-1">
        ড্যাশবোর্ড
      </div>

      {[
        { name: "বায়োডাটা", link: "/biodata" },
        { name: "পছন্দের তালিকা", link: "/favorites" },
        { name: "আপনার সাথে যোগাযোগ করেছে", link: "/contacted" },
        { name: "মেসেজ", link: "/messages" },
        { name: "নোটিফিকেশন", link: "/notifications" },
        { name: "সেটিংস", link: "/settings" },
        { name: "লগ আউট", link: "/logout" },
      ].map((item, i) => (
        <div
          key={i}
          onClick={() => openInNewTab(item.link)}
          className="px-3 py-2 rounded cursor-pointer hover:bg-gray-100"
        >
          {item.name}
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-[#f3f3f3] min-h-screen py-4 md:py-6">
      {/* 🔴 Mobile Top Bar */}
      <div className="flex items-center justify-between px-4 mb-4 md:hidden">
        <h2 className="font-semibold">ড্যাশবোর্ড</h2>

        <button
          onClick={() => setOpen(true)}
          className="btn btn-sm btn-outline"
        >
          ☰
        </button>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 px-4">
        {/* 🔴 Sidebar Desktop */}
        <div className="hidden md:block w-[300px] bg-white border border-red-200 rounded-md p-4 h-fit">
          {/* Profile */}
          <div className="flex gap-3 items-center border-b border-red-100 pb-3 mb-3">
            <Image
              src={photoImage}
              width={55}
              height={55}
              alt="profile"
              className="rounded-full"
            />

            <div className="text-xs">
              <p className="font-semibold">মেহেদী আহমেদ</p>
              <p className="text-gray-500">
                ঢাকা, বাংলাদেশ <br />
                মেম্বার আইডি: ১২৩৪৫
              </p>
            </div>
          </div>

          <MenuItems />
        </div>

        {/* 🔴 Mobile Drawer */}
        {open && (
          <div className="fixed inset-0 bg-black/40 z-50">
            <div className="bg-white w-72 h-full p-4">
              <button
                onClick={() => setOpen(false)}
                className="btn btn-sm btn-error mb-4"
              >
                বন্ধ
              </button>

              {/* Profile */}
              <div className="flex gap-3 items-center border-b pb-3 mb-3">
                <Image
                  src={photoImage}
                  width={55}
                  height={55}
                  alt="profile"
                  className="rounded-full"
                />

                <div className="text-xs">
                  <p className="font-semibold">মেহেদী আহমেদ</p>
                  <p className="text-gray-500">ঢাকা, বাংলাদেশ</p>
                </div>
              </div>

              <MenuItems />
            </div>
          </div>
        )}

        {/* 🔴 Main Content */}
        <div className="flex-1 space-y-4 md:space-y-6">
          {/* Membership */}
          <div className="bg-white border border-red-200 rounded-md p-4 md:p-5">
            <h2 className="text-sm font-semibold mb-3">
              মেম্বারশিপ এবং প্যাকেজ
            </h2>

            <div className="border border-red-200 rounded-md p-3 md:p-4 mb-4">
              <p className="text-xs text-gray-500">বর্তমান প্যাকেজ</p>
              <p className="text-red-500 text-sm mt-1">ফ্রি</p>

              <button
                onClick={() => openInNewTab("/upgrade")}
                className="mt-3 px-3 py-1 text-xs border border-red-400 text-red-500 rounded"
              >
                আপগ্রেড প্যাকেজ করুন
              </button>
            </div>

            <div className="border border-red-200 rounded-md p-3 md:p-4">
              <p className="text-xs text-gray-500">কন্টাক্ট অবশিষ্ট রয়েছে</p>

              <p className="text-red-500 text-lg mt-1">১০</p>

              <p className="text-xs text-gray-500 mt-2">
                প্রতিটি বায়োডাটা দেখতে ১ টি কন্টাক্ট ব্যবহার হবে।
              </p>

              <button
                onClick={() => openInNewTab("/buy-contact")}
                className="mt-3 px-3 py-1 text-xs border border-red-400 text-red-500 rounded"
              >
                কন্টাক্ট কিনুন
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white border border-red-200 rounded-md p-4 md:p-5">
            <h2 className="text-sm font-semibold mb-3">বায়োডাটা স্ট্যাটাস</h2>

            {[
              {
                title: "বায়োডাটা ভিজিট সংখ্যা",
                value: "১০",
                link: "/visits",
              },
              {
                title: "আপনার পছন্দকৃত বায়োডাটা সংখ্যা",
                value: "৫",
                link: "/favorites",
              },
              {
                title: "আপনার বায়োডাটা কত জন পছন্দ করেছে",
                value: "৫",
                link: "/liked-you",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="border border-red-200 rounded-md p-3 md:p-4 mb-3 flex flex-col md:flex-row md:justify-between md:items-center gap-2"
              >
                <div>
                  <p className="text-xs text-gray-500">{item.title}</p>
                  <p className="text-red-500 mt-1">{item.value}</p>
                </div>

                <button
                  onClick={() => openInNewTab(item.link)}
                  className="text-xs border border-red-400 text-red-500 px-3 py-1 rounded w-fit"
                >
                  বিস্তারিত দেখুন
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
