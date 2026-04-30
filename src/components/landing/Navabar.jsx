"use client";

import { useState } from "react";
import { Menu, X, Globe, ArrowRight, UserRound } from "lucide-react";
import Image from "next/image";
import { GrNotification } from "react-icons/gr";

import ThemeSwitcher from "../ThemeSwitcher";
import LanguageSelect from "../LanguageSelect";
import logoImage from "./../../../assets/navbar/logo.png";
import { FaArrowRightToBracket } from "react-icons/fa6";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const navLinks = ["আমাদের গল্প", "পাত্র-পাত্রীর বিজ্ঞাপন", "যোগাযোগ"];

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 bg-base-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-20">
            {/* ===== Logo ===== */}
            <div className="flex items-center gap-2">
              <Image src={logoImage} alt="logo" width={40} height={40} />
              <h1 className="text-2xl font-extrabold">
                নিকাহ্<span className="text-[#FD6969]">দ্বীন</span>
              </h1>
            </div>

            {/* ===== Desktop Menu ===== */}
            <nav className="hidden md:flex items-center gap-8 text-base font-medium">
              {navLinks.map((item) => (
                <a
                  key={item}
                  className="relative cursor-pointer hover:text-[#fd6969] transition"
                >
                  {item}
                </a>
              ))}
            </nav>

            {/* ===== Right Actions ===== */}
            <div className="hidden md:flex items-center gap-4">
              {/* <ThemeSwitcher /> */}

              <LanguageSelect />

              <button className="btn  btn-outline border-[#fd6969] text-[#fd6969] hover:bg-[#fd6969] hover:text-white text-sm px-5">
                রেজিস্ট্রেশন <FaArrowRightToBracket />
              </button>

              {/* <GrNotification size={20} className="cursor-pointer" />

              <UserRound className="cursor-pointer" /> */}
            </div>

            {/* ===== Mobile Button ===== */}
            <button
              onClick={() => setOpen(true)}
              className="md:hidden btn btn-ghost"
            >
              <Menu />
            </button>
          </div>
        </div>
      </header>

      {/* ================= BACKDROP ================= */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-black/40 z-40 transition ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* ================= MOBILE DRAWER ================= */}
      <aside
        className={`fixed top-0 right-0 h-full w-[85%] max-w-sm bg-base-100 z-50 shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <Image src={logoImage} alt="logo" width={36} height={36} />
            <span className="text-xl font-bold">
              নিকাহ্ <span className="text-[#FD6969]">দ্বীন</span>
            </span>
          </div>

          <button onClick={() => setOpen(false)} className="btn btn-ghost">
            <X />
          </button>
        </div>

        {/* Links */}
        <div className="p-5 space-y-4">
          {navLinks.map((item) => (
            <div
              key={item}
              className="text-lg font-medium cursor-pointer hover:text-[#fd6969] transition"
            >
              {item}
            </div>
          ))}
        </div>

        {/* Language */}
        <div className="px-5 flex items-center gap-2 text-sm opacity-80">
          <Globe size={16} />
          বাংলা
        </div>

        {/* CTA Button */}
        <div className="p-5">
          <button className="btn w-full bg-[#fd6969] text-white hover:bg-[#e85a5a] flex items-center justify-center gap-2">
            রেজিস্ট্রেশন করুন <ArrowRight size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
