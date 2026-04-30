"use client";

import {
  UserPlus,
  Search,
  MessageCircle,
  Heart,
  FileText,
  Users,
  CheckCircle,
  Star,
} from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "রেজিস্ট্রেশন করুন",
    desc: "বিনামূল্যে একাউন্ট খুলুন এবং আপনার প্রোফাইল তৈরি করুন",
  },
  {
    icon: FileText,
    title: "বায়োডাটা তৈরি করুন",
    desc: "আপনার সম্পূর্ণ বায়োডাটা ও পছন্দ যোগ করুন",
  },
  {
    icon: Search,
    title: "পাত্র-পাত্রী খুঁজুন",
    desc: "উন্নত ফিল্টার দিয়ে আপনার পছন্দমতো প্রোফাইল খুঁজুন",
  },
  {
    icon: MessageCircle,
    title: "যোগাযোগ করুন",
    desc: "পছন্দের প্রোফাইলে সরাসরি মেসেজ পাঠান",
  },
  {
    icon: Users,
    title: "পরিবারকে জানান",
    desc: "পরিবারের সাথে প্রোফাইল শেয়ার করুন",
  },
  {
    icon: CheckCircle,
    title: "সিদ্ধান্ত নিন",
    desc: "পারস্পরিক আলোচনার মাধ্যমে চূড়ান্ত সিদ্ধান্ত নিন",
  },
  {
    icon: Heart,
    title: "বিবাহ সম্পন্ন করুন",
    desc: "সুন্দর জীবন শুরু করুন আমাদের সাথে",
  },
  // {
  //   icon: Star,
  //   title: "রিভিউ দিন",
  //   desc: "আপনার সফল বিবাহের গল্প শেয়ার করুন",
  // },
];

export default function HowItWorks() {
  return (
    <section className="py-16 bg-[#f45f5f] text-[#fd6969]-content">
      <div className="max-w-7xl mx-auto px-4 lg:px-10">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-lg font-semibold text-white">প্রক্রিয়া</p>
          <h2 className="text-4xl font-bold mt-1">আমরা যেভাবে কাজ করি</h2>
          <p className="text-sm  mt-2 text-white">
            সহজ কয়েকটি ধাপে আপনার জীবনসঙ্গী খুঁজুন
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-2 sm:grid-cols-3 items-center md:grid-cols-4 gap-5">
          {steps.map((step, i) => {
            const Icon = step.icon;

            return (
              <div
                key={i}
                className="  hover:bg-white/20 transition-all backdrop-blur-sm"
              >
                <div className="card-body items-center text-center p-5">
                  <div className="w-16 h-16 rounded bg-white  flex items-center font-extrabold justify-center mb-3">
                    <Icon size={32} />
                  </div>

                  <h4 className="font-bold text-sm lg:text-xl text-white">
                    {step.title}
                  </h4>

                  <p className="text-sm lg:text-lg opacity-80 mt-1 leading-relaxed text-white">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
          <div>
            <button className="btn btn-outline text-white text-lg">
              রেজিস্ট্রেশন করুন
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
