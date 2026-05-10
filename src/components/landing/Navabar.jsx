"use client";

import { useState } from "react";
import { Menu, X, Globe, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FaArrowRightToBracket } from "react-icons/fa6";
import LanguageSelect from "../LanguageSelect";
import logoImage from "./../../../assets/navbar/logo.png";
import ThemeSwitcher from "../ThemeSwitcher";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  // নেভিগেশন লিঙ্কগুলোকে অবজেক্ট আকারে রাখা ভালো
  const navLinks = [
    { name: "আমাদের গল্প", href: "/about" }, // আপনার রুটের সাথে মিলিয়ে পরিবর্তন করুন
    { name: "পাত্র-পাত্রীর বিজ্ঞাপন", href: "/biodata" },
    { name: "যোগাযোগ", href: "/contact" },
  ];

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 bg-base-100 shadow-sm px-4 lg:px-2 ">
        <div className="max-w-7xl mx-auto ">
          <div className="flex items-center justify-between h-20">
            {/* ===== Logo ===== */}
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-90 transition"
            >
              <Image src={logoImage} alt="logo" width={40} height={40} />
              <h1 className="text-2xl font-extrabold tracking-tight">
                নিকাহ্<span className="text-[#FD6969]">দ্বীন</span>
              </h1>
            </Link>

            {/* ===== Desktop Menu ===== */}
            <nav className="hidden md:flex items-center gap-8 text-base font-semibold">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="relative cursor-pointer  hover:text-[#fd6969] transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* ===== Right Actions ===== */}
            <div className="hidden md:flex items-center gap-4">
              <ThemeSwitcher />
              <LanguageSelect />

              <Link
                href="/register"
                className="btn btn-outline border-[#fd6969] text-[#fd6969] hover:bg-[#fd6969] hover:text-white hover:border-[#fd6969] text-sm px-6 rounded-lg transition-all duration-300"
              >
                রেজিস্ট্রেশন <FaArrowRightToBracket className="ml-1" />
              </Link>
            </div>

            {/* ===== Mobile Menu Toggle ===== */}
            <button
              onClick={() => setOpen(true)}
              className="md:hidden btn btn-ghost btn-circle text-gray-700"
              aria-label="Open Menu"
            >
              <Menu size={28} />
            </button>
          </div>
        </div>
      </header>

      {/* ================= BACKDROP ================= */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* ================= MOBILE DRAWER ================= */}
      <aside
        className={`fixed top-0 right-0 h-full w-[80%] max-w-[320px] bg-base-100 z-[70] shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Mobile Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <Image src={logoImage} alt="logo" width={32} height={32} />
            <span className="text-xl font-bold">
              নিকাহ্ <span className="text-[#FD6969]">দ্বীন</span>
            </span>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X size={24} />
          </button>
        </div>

        {/* Mobile Links */}
        <div className="p-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-lg font-semibold  hover:text-[#fd6969] py-2 transition-colors border-b border-gray-50"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Mobile Extra Actions */}
        <div className="mt-auto p-6 space-y-6">
          <nav className="hidden md:flex items-center gap-8 text-base font-semibold">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="relative cursor-pointer  hover:text-[#fd6969] transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex gap-2">
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="btn w bg-[#fd6969] border-none text-white hover:bg-[#e85a5a] shadow-lg shadow-red-200 flex items-center justify-center gap-2 rounded py-4"
            >
              রেজিস্ট্রেশন করুন <ArrowRight size={18} />
            </Link>
            <LanguageSelect />
          </div>
        </div>
      </aside>
    </>
  );
}
