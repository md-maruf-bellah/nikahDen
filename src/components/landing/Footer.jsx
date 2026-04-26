"use client";

import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube } from "react-icons/fa";

import { Heart, Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  "দ্রুত লিংক": [
    "হোম",
    "পাত্র খুঁজুন",
    "পাত্রী খুঁজুন",
    "সদস্যপদ",
    "সফলতার গল্প",
  ],
  সাহায্য: [
    "সাধারণ প্রশ্ন",
    "গোপনীয়তা নীতি",
    "ব্যবহারের শর্ত",
    "রিফান্ড নীতি",
  ],
  "আমাদের সেবা": [
    "বায়োডাটা তৈরি",
    "ম্যাচমেকিং",
    "কাউন্সেলিং",
    "পরিচয়পত্র যাচাই",
  ],
};

export default function Footer() {
  return (
    <footer className="bg-neutral text-neutral-content">
      <div className="max-w-7xl mx-auto px-6 py-32">
        {/* GRID SECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand */}
          <aside className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-1 mb-3">
              <Heart className="text-[#fd6969] fill-primary" size={22} />
              <span className="text-xl font-bold text-white">বিবাহ</span>
              <span className="text-xl font-bold text-[#fd6969]">ডিল</span>
            </div>

            <p className="text-sm opacity-70 leading-relaxed">
              বাংলাদেশের সবচেয়ে বিশ্বস্ত মুসলিম ম্যাট্রিমনি প্ল্যাটফর্ম।
              লক্ষাধিক মুসলিম পরিবারের বিশ্বাসের ঠিকানা।
            </p>

            {/* Social */}
            <div className="flex gap-3 mt-5">
              {[FaFacebookF, FaTwitter, FaInstagram, FaYoutube].map(
                (Icon, i) => (
                  <a key={i} className="btn btn-circle btn-sm btn-ghost">
                    <Icon size={16} />
                  </a>
                ),
              )}
            </div>
          </aside>

          {/* Links */}
          {Object.entries(footerLinks).map(([heading, links], i) => (
            <nav key={i} className="flex flex-col gap-2">
              <h6 className="footer-title text-white">{heading}</h6>

              {links.map((link, j) => (
                <a key={j} className="link link-hover text-sm opacity-70">
                  {link}
                </a>
              ))}
            </nav>
          ))}

          {/* Contact */}
          <nav>
            <h6 className="footer-title text-white">যোগাযোগ</h6>

            <div className="flex items-center gap-2 text-sm opacity-70 mb-2">
              <Phone size={14} className="text-[#fd6969]" />
              <span>+880 1700-000000</span>
            </div>

            <div className="flex items-center gap-2 text-sm opacity-70 mb-2">
              <Mail size={14} className="text-[#fd6969]" />
              <span>info@bibahdeal.com</span>
            </div>

            <div className="flex items-center gap-2 text-sm opacity-70">
              <MapPin size={14} className="text-[#fd6969]" />
              <span>ঢাকা, বাংলাদেশ</span>
            </div>
          </nav>
        </div>

        {/* BOTTOM BAR */}
        <div className="divider  opacity-20"></div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-center md:text-left">
          <p className="text-xs opacity-60">
            © ২০২৪ বিবাহডিল। সর্বস্বত্ব সংরক্ষিত।
          </p>

          <p className="text-xs opacity-50">
            Built with ❤️ for Muslim community
          </p>
        </div>
      </div>
    </footer>
  );
}
