"use client";

import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube } from "react-icons/fa";
import { Heart, Mail, Phone, MapPin, ChevronRight } from "lucide-react";
import Image from "next/image";
import logo from "./../../../assets/navbar/logo.png"; // আপনার লোগো পাথ ঠিক করে নিন

const footerLinks = {
  "মূল পেজস্": [
    "আমাদের গল্প",
    "কিছু জিজ্ঞাসা",
    "পাত্র-পাত্রীর বায়োডাটা",
    "প্রোফাইল",
    "মেম্বারশিপ প্লান",
  ],
  "এডমিন পেজস্": [
    "যোগাযোগ",
    "গোপনীয়তা পলিসিস্",
    "রিফান্ড পলিসিস্",
    "প্রাইভেসি পলিসিস্",
    "টামস্ এন্ড কন্ডিশন",
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#4a4a4a] text-white ">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* GRID SECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand/About Section */}
          <aside className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="bg-[#fd6969] p-2 rounded-full">
                <Heart size={24} fill="white" className="text-white" />
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
                    <a className="flex items-center gap-2 text-sm hover:text-[#fd6969] transition-colors cursor-pointer group">
                      <ChevronRight
                        size={16}
                        className="text-[#fd6969]"
                        strokeWidth={3}
                      />
                      {link}
                    </a>
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

      {/* --- DaisyUI Modal --- */}
      <dialog id="contact_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white text-gray-800">
          <h3 className="font-bold text-lg border-b pb-2">যোগাযোগ করুন</h3>
          <div className="py-4 space-y-3">
            <input
              type="text"
              placeholder="আপনার নাম"
              className="input input-bordered w-full"
            />
            <input
              type="email"
              placeholder="ইমেইল"
              className="input input-bordered w-full"
            />
            <textarea
              className="textarea textarea-bordered w-full h-24"
              placeholder="আপনার বার্তা..."
            ></textarea>
          </div>
          <div className="modal-action">
            <form method="dialog" className="flex gap-2">
              <button className="btn btn-ghost">বন্ধ করুন</button>
              <button className="btn bg-[#fd6969] text-white border-none">
                পাঠিয়ে দিন
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </footer>
  );
}
