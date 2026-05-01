"use client";

import Image from "next/image";
import coupleImg from "./../../../assets/contact/img.png"; // তোমার image path adjust করো
import { Phone, Mail, MapPin } from "lucide-react";

export default function ContactSection() {
  return (
    <div className="bg-base-200 min-h-screen">
      {/* Top Header */}
      <div className="bg-[#f25f5c] text-white text-center py-16">
        <h2 className="text-xl font-semibold">যোগাযোগ করুন</h2>
        <p className="text-sm mt-1 opacity-90">প্রশ্ন / যোগাযোগ</p>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Contact Info */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-10 text-center mb-10">
          <div className="flex flex-col items-center gap-2">
            <Phone className="text-error w-6 h-6" />
            <p className="text-sm">+880 1X XXXX XXXX</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Mail className="text-error w-6 h-6" />
            <p className="text-sm">xxx@example.com</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <MapPin className="text-error w-6 h-6" />
            <p className="text-sm">
              ২৫/৩, কাজী নজরুল ইসলাম রোড,
              <br />
              ঢাকা, বাংলাদেশ
            </p>
          </div>
        </div>

        {/* Main Section */}
        <div className="grid md:grid-cols-2 gap-0 items-center">
          {/* Image */}
          <div className="w-full h-[350px] md:h-[420px]">
            <Image
              src={coupleImg}
              alt="couple"
              className="rounded shadow-md w-full h-full object-cover"
            />
          </div>

          {/* Form */}
          <div className="bg-white p-5 md:p-6 rounded shadow-md h-[350px] md:h-[420px] flex flex-col">
            <form className="space-y-3 flex flex-col h-full">
              {/* Name */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="আপনার নাম"
                  className="input input-bordered w-full input-sm md:input-md"
                />
                <input
                  type="text"
                  placeholder="আপনার নাম"
                  className="input input-bordered w-full input-sm md:input-md"
                />
              </div>

              {/* Phone */}
              <input
                type="text"
                placeholder="+880 1X XXXX XXXX"
                className="input input-bordered w-full input-sm md:input-md"
              />

              {/* Email */}
              <input
                type="email"
                placeholder="example@gmail.com"
                className="input input-bordered w-full input-sm md:input-md"
              />

              {/* Message */}
              <textarea
                placeholder="আপনার বার্তা লিখুন..."
                className="textarea textarea-bordered w-full flex-1 text-sm"
              ></textarea>

              {/* Button */}
              <button className="btn bg-[#f25f5c] text-white w-full border-none hover:bg-[#e14b48] btn-sm md:btn-md">
                বার্তা পাঠান
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
