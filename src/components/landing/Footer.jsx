"use client";

import { useRef, useState } from "react";
import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube } from "react-icons/fa";
import { Heart, Mail, Phone, MapPin, ChevronRight, Loader2, CircleCheck, AlertCircle } from "lucide-react";
import Link from "next/link";
import logo from "./../../../assets/navbar/logo.png"; // আপনার লোগো পাথ ঠিক করে নিন
import Image from "next/image";
import { contactApi } from "@/lib/api";

const footerLinks = {
  "মূল পেজস্": [
    { label: "আমাদের গল্প", href: "/about" },
    { label: "পাত্র-পাত্রীর বায়োডাটা", href: "/list" },
    { label: "প্রোফাইল", href: "/profile" },
    { label: "মেম্বারশিপ প্লান", href: "/member" },
    { label: "যোগাযোগ", href: "/contact" },
  ],
  "পলিসি ও শর্তাবলী": [
    { label: "প্রাইভেসি পলিসি", href: "/privacy" },
    { label: "শর্তাবলী", href: "/terms" },
    { label: "রিফান্ড পলিসি", href: "/refund" },
  ],
};

export default function Footer() {
  const [msg, setMsg] = useState({ firstName: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState("");
  const [err, setErr] = useState("");
  // স্প্যাম প্রতিরোধ — মোডাল ফর্মেও honeypot + টাইম-ট্র্যাপ
  const modalOpenedAt = useRef(Date.now());
  const [honeypot, setHoneypot] = useState("");

  const sendModalMsg = async (e) => {
    e.preventDefault();
    setSent("");
    setErr("");
    if (!msg.firstName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msg.email) || msg.message.trim().length < 10) {
      setErr("নাম, সঠিক ইমেইল ও কমপক্ষে ১০ অক্ষরের বার্তা লিখুন।");
      return;
    }
    setSending(true);
    try {
      const res = await contactApi.send({
        firstName: msg.firstName.trim(),
        email: msg.email.trim(),
        message: msg.message.trim(),
        formElapsedMs: Date.now() - modalOpenedAt.current,
        website: honeypot,
      });
      setSent(res?.duplicate ? "আপনার আগের বার্তা পর্যালোচনাধীন আছে।" : "বার্তা পাঠানো হয়েছে!");
      setMsg({ firstName: "", email: "", message: "" });
    } catch (ex) {
      setErr(ex.message || "পাঠানো যায়নি।");
    } finally {
      setSending(false);
    }
  };
  return (
    <footer className="bg-[#4a4a4a] text-white ">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* GRID SECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand/About Section */}
          <aside className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="">
                {/* <Heart size={24} fill="white" className="text-white" /> */}
                <Image src={logo} />
              </div>
              <h2 className="text-2xl font-bold">নিকাহ্ দ্বীন</h2>
            </div>
            <p className="text-sm leading-relaxed opacity-90 max-w-xs">
              The proper Footer on proper time can preserve you protection. We
              assist you make sure every body forward. preserve you protection.
              We assist you make sure every body forward.
            </p>
            {/* Social Icons */}
            <div className="flex gap-4">
              {[FaFacebookF, FaTwitter, FaInstagram, FaYoutube].map(
                (Icon, i) => (
                  <a
                    key={i}
                    className="bg-white p-3 rounded-full text-gray-700 hover:bg-[#fd6969] hover:text-white transition-all cursor-pointer"
                  >
                    <Icon size={16} />
                  </a>
                ),
              )}
            </div>
          </aside>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([heading, links], i) => (
            <nav key={i} className="flex flex-col gap-4">
              <div>
                <h6 className="text-xl font-bold mb-1">{heading}</h6>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-[#fd6969] text-xs">
                      ~
                    </span>
                  ))}
                </div>
              </div>
              <ul className="space-y-3">
                {links.map((link, j) => (
                  <li key={j}>
                    <Link href={link.href} className="flex items-center gap-2 text-sm hover:text-[#fd6969] transition-colors cursor-pointer group">
                      <ChevronRight
                        size={16}
                        className="text-[#fd6969]"
                        strokeWidth={3}
                      />
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
              <h6 className="text-xl font-bold mb-1">জরুরী যোগাযোগ</h6>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-[#fd6969] text-xs">
                    ~
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Phone size={18} className="text-white" />
                <span>(123)456-78-90</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail size={18} className="text-white" />
                <span>nikahdeen@gmail.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={18} className="text-white" />
                <span>Dhaka, Bangladesh</span>
              </div>

              {/* Modal Trigger Button */}
              <button
                className="btn btn-sm bg-[#fd6969] border-none text-white hover:bg-white hover:text-[#fd6969] mt-2"
                onClick={() =>
                  document.getElementById("contact_modal").showModal()
                }
              >
                সরাসরি মেসেজ দিন
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Copyright Bottom Bar */}
      <div className="bg-[#3a3a3a] py-6 border-t border-gray-600">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm">
          <p>
            স্বত্ব © ২০২৩{" "}
            <span className="text-[#fd6969] font-bold">নিকাহ্ দ্বীন</span>{" "}
            কর্তৃক সর্বস্বত্ব সংরক্ষিত
          </p>
        </div>
      </div>

      {/* --- DaisyUI Modal — সরাসরি মেসেজ (contact API ব্যবহার করে) --- */}
      <dialog id="contact_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white text-gray-800">
          <h3 className="font-bold text-lg border-b pb-2">যোগাযোগ করুন</h3>
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
            {/* Honeypot — স্ক্রিন-রিডার ও ট্যাব থেকে লুকানো */}
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
              placeholder="আপনার নাম *"
              className="input input-bordered w-full"
            />
            <input
              type="email"
              value={msg.email}
              onChange={(e) => setMsg((m) => ({ ...m, email: e.target.value }))}
              placeholder="ইমেইল *"
              className="input input-bordered w-full"
            />
            <textarea
              value={msg.message}
              onChange={(e) => setMsg((m) => ({ ...m, message: e.target.value }))}
              className="textarea textarea-bordered w-full h-24"
              placeholder="আপনার বার্তা (কমপক্ষে ১০ অক্ষর)..."
            />
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => document.getElementById("contact_modal").close()}
              >
                বন্ধ করুন
              </button>
              <button type="submit" disabled={sending} className="btn bg-[#fd6969] text-white border-none">
                {sending && <Loader2 size={14} className="animate-spin" />} পাঠিয়ে দিন
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </footer>
  );
}
