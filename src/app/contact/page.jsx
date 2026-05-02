"use client";

import Image from "next/image";
import coupleImg from "./../../../assets/contact/img.png";
import { Smartphone, Mail, MapPin } from "lucide-react";

export default function ContactSection() {
  return (
    <div className="bg-white min-h-screen ">
      {/* Top Header Section */}
      <div className="bg-[#ff6b6b] text-white text-center py-20 px-4">
        <h2 className="text-3xl font-bold mb-2">যোগাযোগ করুন</h2>
        <p className="text-sm opacity-90 flex justify-center gap-2 items-center">
          হোম <span className="opacity-60">/</span> যোগাযোগ
        </p>
      </div>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 -mt-10 mb-20">
        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 pt-20">
          <div className="flex flex-col items-center text-center group">
            <div className="mb-4 p-3 rounded-full group-hover:bg-red-50 transition-colors">
              <Smartphone className="text-[#ff6b6b] w-10 h-10 stroke-1" />
            </div>
            <p className="text-gray-700 font-medium text-lg">
              +৮৮০ ১৭ XXXX XXXX
            </p>
          </div>

          <div className="flex flex-col items-center text-center group">
            <div className="mb-4 p-3 rounded-full group-hover:bg-red-50 transition-colors">
              <Mail className="text-[#ff6b6b] w-10 h-10 stroke-1" />
            </div>
            <p className="text-gray-700 font-medium text-lg">xxx@example.com</p>
          </div>

          <div className="flex flex-col items-center text-center group">
            <div className="mb-4 p-3 rounded-full group-hover:bg-red-50 transition-colors">
              <MapPin className="text-[#ff6b6b] w-10 h-10 stroke-1" />
            </div>
            <p className="text-gray-700 font-medium text-lg leading-relaxed">
              ২৬/০২, বনানী-১২১৩,
              <br /> ঢাকা, বাংলাদেশ
            </p>
          </div>
        </div>

        {/* Form and Image Section */}
        <div className="bg-white rounded-lg shadow-[0_10px_50px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Image Section */}
            <div className="relative h-[400px] md:h-[600px] w-full">
              <Image
                src={coupleImg}
                alt="couple"
                fill
                className="object-cover"
              />
            </div>

            {/* Form Section */}
            <div className="p-8 md:p-12 flex flex-col justify-center bg-[#fcfcfc]">
              <form className="space-y-6">
                {/* Name Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text text-gray-500 text-xs">
                        নামের প্রথম অংশ
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="Mr. XXXXX"
                      className="input input-bordered w-full bg-white focus:border-[#ff6b6b] outline-none"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text text-gray-500 text-xs">
                        নামের শেষ অংশ
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="XXXXX"
                      className="input input-bordered w-full bg-white focus:border-[#ff6b6b] outline-none"
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-gray-500 text-xs">
                      ফোন
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="+৮৮০ ১৭ XXXX XXXX"
                      className="input input-bordered w-full pl-12 bg-white focus:border-[#ff6b6b] outline-none"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
                      <span className="text-xl">🇧🇩</span>
                    </div>
                  </div>
                </div>

                {/* Email Field */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-gray-500 text-xs">
                      ই-মেইল
                    </span>
                  </label>
                  <input
                    type="email"
                    placeholder="xxx@example.com"
                    className="input input-bordered w-full bg-white focus:border-[#ff6b6b] outline-none"
                  />
                </div>

                {/* Message Field */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-gray-500 text-xs">
                      আপনার বার্তা
                    </span>
                  </label>
                  <br />
                  <textarea
                    className="textarea w-full textarea-bordered h-32 bg-white focus:border-[#ff6b6b] outline-none"
                    placeholder="বার্তা লিখুন..."
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button className="btn bg-[#f2504d] hover:bg-[#d43f3c] text-white border-none w-full text-lg font-bold rounded-md h-12 mt-4">
                  সাবমিট করুন
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
