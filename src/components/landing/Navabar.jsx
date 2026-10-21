"use client";

import { useState } from "react";
import { Menu, X, ArrowRight, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FaArrowRightToBracket } from "react-icons/fa6";
import LanguageSelect from "../LanguageSelect";
import logoImage from "./../../../assets/navbar/logo.png";
import ThemeSwitcher from "../ThemeSwitcher";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import NotificationBell from "../NotificationBell";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isLoggedIn, user, logout } = useAuth();
  const { t, isRTL } = useLanguage();

  const navLinks = [
    { name: t("nav.findPartner", "পাত্র-পাত্রী খুঁজুন"), href: "/list" },
    { name: t("nav.about", "আমাদের গল্প"), href: "/about" },
    { name: t("nav.contact", "যোগাযোগ"), href: "/contact" },
  ];

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 bg-base-100 shadow-none px-4 lg:px-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-20">
            {/* ===== Logo ===== */}
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-90 transition"
            >
              <Image src={logoImage} alt="logo" width={40} height={40} />
              <h1 className="text-2xl font-extrabold tracking-tight">
                {t("common.siteName", "নিকাহ্")}<span className="text-[#FD6969]">{t("common.siteNameHighlight", "দ্বীন")}</span>
              </h1>
            </Link>

            {/* ===== Desktop Menu ===== */}
            <nav className="hidden md:flex items-center gap-8 text-base font-semibold">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative cursor-pointer hover:text-[#fd6969] transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* ===== Right Actions ===== */}
            <div className="hidden md:flex items-center gap-4">
              <ThemeSwitcher />
              <LanguageSelect />

              {isLoggedIn && <NotificationBell />}

              {isLoggedIn ? (
                <>
                  <Link
                    href="/profile"
                    className="btn btn-outline border-[#fd6969] text-[#fd6969] hover:bg-[#fd6969] hover:text-white hover:border-[#fd6969] text-sm px-6 transition-all duration-300"
                  >
                    {user?.firstName || t("nav.profile", "প্রোফাইল")}
                  </Link>
                  <button
                    onClick={logout}
                    className="btn btn-ghost btn-sm text-gray-500 hover:text-[#fd6969]"
                    title={t("nav.logout", "লগ আউট")}
                  >
                    <LogOut size={18} />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="btn btn-ghost text-gray-600 hover:text-[#fd6969] text-sm px-4 transition-all duration-300"
                  >
                    {t("nav.login", "লগইন")}
                  </Link>
                  <Link
                    href="/register"
                    className="btn btn-outline border-[#fd6969] text-[#fd6969] hover:bg-[#fd6969] hover:text-white hover:border-[#fd6969] text-sm px-6 transition-all duration-300"
                  >
                    {t("nav.register", "রেজিস্ট্রেশন")} <FaArrowRightToBracket className={isRTL ? "mr-1" : "ml-1"} />
                  </Link>
                </>
              )}
            </div>

            {/* ===== Mobile Menu Toggle ===== */}
            <button
              onClick={() => setOpen(true)}
              className="md:hidden btn btn-ghost btn-circle text-gray-700"
              aria-label={t("nav.menu", "Open Menu")}
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
        className={`fixed top-0 ${isRTL ? "left-0" : "right-0"} h-full w-[80%] max-w-[320px] bg-base-100 z-[70] shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : isRTL ? "-translate-x-full" : "translate-x-full"
        }`}
      >
        {/* Mobile Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <Image src={logoImage} alt="logo" width={32} height={32} />
            <span className="text-xl font-bold">
              {t("common.siteName", "নিকাহ্")}{" "}
              <span className="text-[#FD6969]">{t("common.siteNameHighlight", "দ্বীন")}</span>
            </span>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label={t("common.close", "Close")}
          >
            <X size={24} />
          </button>
        </div>

        {/* Mobile Links */}
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-4 border-b border-base-200">
            <span className="text-sm font-semibold text-base-content/70">
              {t("common.tagline", "থিম ও ভাষা")}
            </span>
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <LanguageSelect />
            </div>
          </div>

          <nav className="flex flex-col gap-3 font-semibold text-lg">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-2 hover:text-[#fd6969] transition"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-3 pt-4 border-t border-base-200">
            {isLoggedIn ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="btn bg-[#fd6969] border-none text-white hover:bg-[#e85a5a] shadow-lg shadow-red-200 flex items-center justify-center gap-2 rounded py-4"
                >
                  {user?.firstName || t("nav.profile", "প্রোফাইল")} <ArrowRight size={18} />
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="btn btn-outline border-[#fd6969] text-[#fd6969] flex items-center justify-center gap-2 rounded py-4"
                >
                  {t("nav.logout", "লগ আউট")} <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="btn btn-ghost text-gray-700 flex items-center justify-center gap-2 rounded py-3"
                >
                  {t("nav.login", "লগইন")}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="btn bg-[#fd6969] border-none text-white hover:bg-[#e85a5a] shadow-lg shadow-red-200 flex items-center justify-center gap-2 rounded py-4"
                >
                  {t("nav.register", "রেজিস্ট্রেশন করুন")} <ArrowRight size={18} />
                </Link>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
