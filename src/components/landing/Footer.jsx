"use client";

import { useState } from "react";
import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube } from "react-icons/fa";
import { Heart, Mail, Phone, MapPin, ChevronRight, Loader2, CircleCheck, AlertCircle } from "lucide-react";
import Link from "next/link";
import logo from "./../../../assets/navbar/logo.png";
import Image from "next/image";
import { contactApi } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";

export default function Footer() {
  const { t, isRTL } = useLanguage();
  const [msg, setMsg] = useState({ firstName: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState("");
  const [err, setErr] = useState("");
  const [modalOpenedAt] = useState(() => Date.now());
  const [honeypot, setHoneypot] = useState("");

  const footerLinks = {
    [t("footer.mainPages", "মূল পেজস্")]: [
      { label: t("footer.story", "আমাদের গল্প"), href: "/about" },
      { label: t("footer.biodataList", "পাত্র-পাত্রীর বায়োডাটা"), href: "/list" },
      { label: t("footer.profile", "প্রোফাইল"), href: "/profile" },
      { label: t("footer.membership", "মেম্বারশিপ প্লান"), href: "/member" },
      { label: t("footer.contact", "যোগাযোগ"), href: "/contact" },
    ],
    [t("footer.policies", "পলিসি ও শর্তাবলী")]: [
      { label: t("footer.privacy", "প্রাইভেসি পলিসি"), href: "/privacy" },
      { label: t("footer.terms", "শর্তাবলী"), href: "/terms" },
      { label: t("footer.refund", "রিফান্ড পলিসি"), href: "/refund" },
    ],
  };

  const sendModalMsg = async (e) => {
    e.preventDefault();
    setSent("");
    setErr("");
    if (!msg.firstName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msg.email) || msg.message.trim().length < 10) {
      setErr(t("contact.validationErr", "নাম, সঠিক ইমেইল ও কমপক্ষে ১০ অক্ষরের বার্তা লিখুন।"));
      return;
    }
    setSending(true);
    try {
      const res = await contactApi.send({
        firstName: msg.firstName.trim(),
        email: msg.email.trim(),
        message: msg.message.trim(),
        formElapsedMs: Date.now() - modalOpenedAt,
        website: honeypot,
      });
      setSent(res?.duplicate ? t("contact.pendingMsg", "আপনার আগের বার্তা পর্যালোচনাধীন আছে।") : t("contact.sentMsg", "বার্তা পাঠানো হয়েছে!"));
      setMsg({ firstName: "", email: "", message: "" });
    } catch (ex) {
      setErr(ex.message || t("common.error", "পাঠানো যায়নি।"));
    } finally {
      setSending(false);
    }
  };

  return (
    <footer className="bg-[#2b2b2b] text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src={logo} alt="Logo" width={40} height={40} className="w-10 h-10 object-contain" />
              <span className="text-2xl font-bold tracking-wide">
                {t("common.siteName", "নিকাহ্")} <span className="text-[#fd6969]">{t("common.siteNameHighlight", "দ্বীন")}</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t("footer.aboutText", "নিকাহ্ দ্বীন একটি বিশ্বস্ত ইসলামিক ম্যাট্রিমনি প্ল্যাটফর্ম। এখানে শারঈ পর্দা ও অভিভাবকের মধ্যস্থতায় দ্বীনদার পাত্র-পাত্রীর মিলন সহজ করা হয়।")}
            </p>
            {/* Social Icons */}
            <div className="flex gap-3 pt-2">
              <a href="#" aria-label="Facebook" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#fd6969] flex items-center justify-center transition-colors">
                <FaFacebookF size={14} />
              </a>
              <a href="#" aria-label="Twitter" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#fd6969] flex items-center justify-center transition-colors">
                <FaTwitter size={14} />
              </a>
              <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#fd6969] flex items-center justify-center transition-colors">
                <FaInstagram size={14} />
              </a>
              <a href="#" aria-label="YouTube" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#fd6969] flex items-center justify-center transition-colors">
                <FaYoutube size={14} />
              </a>
            </div>
          </div>

          {/* Dynamic Link Columns */}
          {Object.entries(footerLinks).map(([category, links], i) => (
            <nav key={i} className="flex flex-col gap-4">
              <div>
                <h6 className="text-xl font-bold mb-1">{category}</h6>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, idx) => (
                    <span key={idx} className="text-[#fd6969] text-xs">
                      ~
                    </span>
                  ))}
                </div>
              </div>
              <ul className="space-y-3">
                {links.map((link, j) => (
                  <li key={j}>
                    <Link href={link.href} className="flex items-center gap-2 text-sm hover:text-[#fd6969] transition-colors cursor-pointer group">
                      <ChevronRight size={16} className={`text-[#fd6969] ${isRTL ? "rotate-180" : ""}`} strokeWidth={3} />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Contact Section */}
          <nav className="flex flex-col gap-4">
            <div>
              <h6 className="text-xl font-bold mb-1">{t("footer.contactUs", "জরুরী যোগাযোগ")}</h6>
              <div className="flex gap-1">
                {[...Array(5)].map((_, idx) => (
                  <span key={idx} className="text-[#fd6969] text-xs">
                    ~
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Phone size={18} className="text-[#fd6969]" />
                <span dir="ltr">{t("footer.phone", "+৮৮০ ১৭০০০০০০০০")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail size={18} className="text-[#fd6969]" />
                <span>{t("footer.email", "support@nikahdeen.com")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={18} className="text-[#fd6969]" />
                <span>{t("footer.address", "ঢাকা, বাংলাদেশ")}</span>
              </div>

              {/* Modal Trigger Button */}
              <button
                className="btn btn-sm bg-[#fd6969] border-none text-white hover:bg-white hover:text-[#fd6969] mt-2"
                onClick={() => document.getElementById("contact_modal").showModal()}
              >
                {t("footer.sendBtn", "সরাসরি মেসেজ দিন")}
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Copyright Bottom Bar */}
      <div className="bg-[#3a3a3a] py-6 border-t border-gray-600">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm">
          <p>
            {t("footer.copyright", "সর্বস্বত্ব সংরক্ষিত।")} © {new Date().getFullYear()}{" "}
            <span className="text-[#fd6969] font-bold">
              {t("common.siteName", "নিকাহ্")} {t("common.siteNameHighlight", "দ্বীন")}
            </span>
          </p>
        </div>
      </div>

      {/* --- DaisyUI Modal — সরাসরি মেসেজ --- */}
      <dialog id="contact_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white text-gray-800">
          <h3 className="font-bold text-lg border-b pb-2">{t("contact.formTitle", "যোগাযোগ করুন")}</h3>
          {sent && (
            <div className="alert alert-success text-sm py-2 mt-3">
              <CircleCheck size={15} /> <span>{sent}</span>
            </div>
          )}
          {err && (
            <div className="alert alert-error text-sm py-2 mt-3">
              <AlertCircle size={15} /> <span>{err}</span>
            </div>
          )}
          <form onSubmit={sendModalMsg} className="py-4 space-y-3">
            <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
              <label htmlFor="footer-website">Website</label>
              <input
                id="footer-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>
            <input
              type="text"
              value={msg.firstName}
              onChange={(e) => setMsg((m) => ({ ...m, firstName: e.target.value }))}
              placeholder={t("footer.namePlaceholder", "আপনার নাম *")}
              className="input input-bordered w-full"
            />
            <input
              type="email"
              value={msg.email}
              onChange={(e) => setMsg((m) => ({ ...m, email: e.target.value }))}
              placeholder={t("footer.emailPlaceholder", "ইমেইল *")}
              className="input input-bordered w-full"
            />
            <textarea
              value={msg.message}
              onChange={(e) => setMsg((m) => ({ ...m, message: e.target.value }))}
              className="textarea textarea-bordered w-full h-24"
              placeholder={t("footer.messagePlaceholder", "আপনার বার্তা লিখুন *")}
            />
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => document.getElementById("contact_modal").close()}
              >
                {t("common.close", "বন্ধ করুন")}
              </button>
              <button type="submit" disabled={sending} className="btn bg-[#fd6969] text-white border-none">
                {sending && <Loader2 size={14} className="animate-spin" />}{" "}
                {sending ? t("footer.sending", "পাঠানো হচ্ছে...") : t("footer.sendBtn", "বার্তা পাঠান")}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </footer>
  );
}
