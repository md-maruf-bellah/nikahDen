"use client";

import { Check } from "lucide-react";

const plans = [
  {
    name: "বেসিক",
    price: "৳৯৯৯",
    period: "বার্ষিক",
    highlight: false,
    features: [
      "সীমিত প্রোফাইল দেখার সুবিধা",
      "বায়োডাটা তৈরি",
      "ইমেইল সাপোর্ট",
      "প্রোফাইল লিস্টে থাকা",
    ],
    missing: ["সরাসরি যোগাযোগ", "প্রিমিয়াম ম্যাচিং"],
  },
  {
    name: "চ্যাম্পিয়ন",
    price: "৳২,৯৯৯",
    period: "বার্ষিক",
    highlight: true,
    badge: "জনপ্রিয় • ৩৩% ছাড়",
    features: [
      "সীমাহীন প্রোফাইল দেখার সুবিধা",
      "সরাসরি মেসেজ পাঠানো",
      "প্রিমিয়াম ম্যাচিং",
      "ফোন সাপোর্ট",
      "প্রোফাইল হাইলাইট",
      "এক্সক্লুসিভ বায়োডাটা টেমপ্লেট",
    ],
    missing: [],
  },
  {
    name: "প্রিমিয়াম",
    price: "৳৫,৯৯৯",
    period: "বার্ষিক",
    highlight: false,
    features: [
      "সীমাহীন প্রোফাইল দেখার সুবিধা",
      "সরাসরি মেসেজ পাঠানো",
      "প্রিমিয়াম ম্যাচিং",
      "ডেডিকেটেড রিলেশনশিপ ম্যানেজার",
      "প্রোফাইল টপ পজিশন",
      "ব্যক্তিগত কাউন্সেলিং",
    ],
    missing: [],
  },
];

export default function MembershipPlans() {
  return (
    <section className="py-16 bg-base-200">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="divider"></div>
          <p className="text-sm text-primary font-semibold">সদস্যপদ</p>
          <h2 className="text-2xl font-bold mt-1">চ্যাম্পিয়ন প্ল্যান</h2>
          <p className="text-sm opacity-70 mt-1">
            সাশ্রয়ী মূল্যে সেরা সেবা উপভোগ করুন
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`card shadow transition-all hover:-translate-y-1 ${
                plan.highlight
                  ? "bg-neutral text-neutral-content scale-105"
                  : "bg-base-100"
              }`}
            >
              <div className="card-body relative">
                {/* Badge */}
                {plan.badge && (
                  <div className="badge badge-primary absolute -top-3 left-1/2 -translate-x-1/2">
                    {plan.badge}
                  </div>
                )}

                {/* Title */}
                <h3 className="text-lg font-bold text-center">{plan.name}</h3>

                {/* Price */}
                <div className="text-3xl font-extrabold text-center text-primary">
                  {plan.price}
                </div>

                <p className="text-xs text-center opacity-60">{plan.period}</p>

                {/* Features */}
                <ul className="mt-4 space-y-2 text-sm">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <Check size={16} className="text-primary mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}

                  {plan.missing.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 opacity-40">
                      <span className="mt-0.5">✕</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <div className="mt-6">
                  <button
                    className={`btn w-full ${
                      plan.highlight ? "btn-primary" : "btn-outline"
                    }`}
                  >
                    এখনই শুরু করুন
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <button className="btn btn-outline">সকল প্ল্যান দেখুন</button>
        </div>
      </div>
    </section>
  );
}
