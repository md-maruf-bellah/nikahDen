"use client";

import { useState } from "react";
import { Menu, X, Globe, ArrowRight, UserRound } from "lucide-react";
import ThemeSwitcher from "../ThemeSwitcher";
import logoImage from "./../../../assets/navbar/logo.png";
import Image from "next/image";
import { GrNotification } from "react-icons/gr";

import LanguageSelect from "../LanguageSelect";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const navLinks = ["আমাদের গল্প", "পাত্র-পাত্রীর বিজ্ঞাপন", "যোগাযোগ"];

  return (
    <>
      {/* Navbar */}
      <div className="bg-base-100  shadow-sm w-full px-4 lg:px-22">
        <div className="max-w-7xl mx-auto  py-5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Image src={logoImage} />{" "}
              <p className="text-3xl font-extrabold">
                নিকাহ্ <span className="text-[#FD6969]">দ্বীন</span>
              </p>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8 text-lg">
              {navLinks.map((item) => (
                <a key={item} className="hover:text-[#fd6969] cursor-pointer">
                  {item}
                </a>
              ))}
            </div>

            {/* Right Side */}
            <div className="hidden md:flex items-center gap-4">
              <div>
                <ThemeSwitcher />
              </div>
              {/* Language */}
              <div className="flex items-center gap-1 cursor-pointer text-md">
                {/* <Globe size={16} /> */}

                <LanguageSelect />
              </div>
              <div>
                <GrNotification size={22} />
              </div>

              <div>
                <UserRound />
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden" onClick={() => setOpen(true)}>
              <Menu />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-50 bg-black/30 transition ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />

      <div
        className={`fixed top-0 right-0 h-full w-[85%] max-w-sm bg-base-100 z-50 transform transition ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 ">
          <div className="flex items-center gap-2">
            <Image src={logoImage} />{" "}
            <p className="text-3xl font-extrabold">
              নিকাহ্ <span className="text-[#FD6969]">দ্বীন</span>
            </p>
          </div>

          <button onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>

        {/* Menu Items */}
        <div className="px-4 py-2 space-y-2">
          {navLinks.map((item) => (
            <div
              key={item}
              className="py-3 text-xl cursor-pointer hover:text-[#fd6969]"
            >
              {item}
            </div>
          ))}
        </div>
        {/* Language */}
        <div className="">
          {/* <Globe size={16} />
          বাংলা */}

          <LanguageSelect />
        </div>

        {/* Button */}
        <div className="p-0">
          <button className="btn btn-link text-lg  text-[#fd6969]">
            রেজিস্ট্রেশন করুন <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </>
  );
}

// "use client";
// import { useState } from "react";
// import { Heart, Bell, User, Menu, X } from "lucide-react";
// import ThemeSwitcher from "../ThemeSwitcher";

// export default function Navbar() {
//   const [menuOpen, setMenuOpen] = useState(false);

//   return (
//     <nav className="navbar bg-base-100 shadow-sm sticky top-0 z-50">
//       <div className="max-w-7xl w-full mx-auto px-4 flex justify-between items-center">
//         {/* Left: Logo */}
//         <div className="flex items-center gap-1">
//           <Heart className="text-[#fd6969] fill-primary" size={22} />
//           <span className="text-xl font-bold text-[#fd6969]">বিবাহ</span>
//           <span className="text-xl font-bold text-base-content">ডিল</span>
//         </div>

//         {/* Center: Desktop Menu */}
//         <div className="hidden md:flex gap-6 text-sm font-medium">
//           <a className="link link-hover" href="#">
//             পাত্র-পাত্রী
//           </a>
//           <a className="link link-hover" href="#">
//             পরিচিতি বিজ্ঞাপন
//           </a>
//           <a className="link link-hover" href="#">
//             সদস্যপদ
//           </a>
//         </div>

//         {/* Right: Actions */}
//         <div className="hidden md:flex items-center gap-3">
//           <button className="btn btn-ghost btn-circle">
//             <Bell size={18} />
//           </button>

//           <button className="btn btn-ghost btn-circle">
//             <User size={18} />
//           </button>

//           <ThemeSwitcher />

//           <button className="btn btn-primary btn-sm">লগইন</button>
//           <button className="btn btn-outline btn-sm">রেজিস্ট্রেশন</button>
//         </div>

//         {/* Mobile Button */}
//         <button
//           className="btn btn-ghost md:hidden"
//           onClick={() => setMenuOpen(!menuOpen)}
//         >
//           {menuOpen ? <X size={22} /> : <Menu size={22} />}
//         </button>
//       </div>

//       {/* Mobile Menu */}
//       {menuOpen && (
//         <div className="md:hidden bg-base-100 border-t px-4 py-4 flex flex-col gap-3 text-sm">
//           <a className="link link-hover" href="#">
//             পাত্র-পাত্রী
//           </a>
//           <a className="link link-hover" href="#">
//             পরিচিতি বিজ্ঞাপন
//           </a>
//           <a className="link link-hover" href="#">
//             সদস্যপদ
//           </a>

//           <div className="flex gap-2 mt-2">
//             <button className="btn btn-primary btn-sm flex-1">লগইন</button>
//             <button className="btn btn-outline btn-sm flex-1">
//               রেজিস্ট্রেশন
//             </button>
//           </div>
//         </div>
//       )}
//     </nav>
//   );
// }
