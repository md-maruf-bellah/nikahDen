"use client";

import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";

/**
 * পলিসি পেজের শেয়ার্ড লেআউট — /privacy, /terms, /refund তিনটিই এটা ব্যবহার করে।
 * /about-এর হেডার-স্টাইল (bg-[#ff6b6b] ব্যানার + ব্রেডক্রাম্ব) আর কনটেন্ট টাইপোগ্রাফি
 * হুবহু ধরে রাখা হয়েছে যাতে ডিজাইন সিস্টেম এক থাকে।
 *
 * sections: [{ title, body: [paragraph, ...], list?: [item, ...] }]
 */
export default function PolicyPage({ title, subtitle, updated, sections, policyNav }) {
  return (
    <div className="min-h-screen pb-24">
      {/* Header Banner — /about পেজের মতোই */}
      <div className="bg-[#ff6b6b] py-10 text-center mb-12">
        <h1 className="text-3xl font-bold mb-2 tracking-wide">{title}</h1>
        <p className="text-md text-red-100 opacity-90">
          <Link href="/">হোম</Link> / {title}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Content */}
          <article className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
            {subtitle && (
              <p className="text-gray-500 leading-relaxed mb-8">{subtitle}</p>
            )}

            {sections.map((sec) => (
              <section key={sec.title} className="mb-8 last:mb-0">
                <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3">
                  <span className="w-1.5 h-5 bg-[#fd6969] rounded-full inline-block" />
                  {sec.title}
                </h2>
                <div className="space-y-3 text-[15px] leading-relaxed text-gray-600">
                  {(sec.body || []).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  {sec.list && (
                    <ul className="space-y-2 mt-2">
                      {sec.list.map((li, i) => (
                        <li key={i} className="flex gap-2">
                          <ChevronRight
                            size={16}
                            className="text-[#fd6969] shrink-0 mt-0.5"
                            strokeWidth={3}
                          />
                          <span>{li}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}

            {updated && (
              <p className="text-xs text-gray-400 mt-10 pt-4 border-t border-gray-100">
                সর্বশেষ হালনাগাদ: {updated} — পলিসি সংক্রান্ত প্রশ্নে{" "}
                <Link href="/contact" className="text-[#fd6969] font-semibold hover:underline">
                  যোগাযোগ করুন
                </Link>
                ।
              </p>
            )}
          </article>

          {/* Sidebar — অন্যান্য পলিসি */}
          <aside className="lg:col-span-4">
            <div className="bg-base-200/60 rounded-2xl border border-gray-100 p-6 lg:sticky lg:top-24">
              <h3 className="flex items-center gap-2 font-bold text-gray-700 mb-4">
                <FileText size={16} className="text-[#fd6969]" />
                পলিসি সমূহ
              </h3>
              <ul className="space-y-1">
                {policyNav.map((p) => (
                  <li key={p.href}>
                    <Link
                      href={p.href}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        p.active
                          ? "bg-red-50 text-[#fd6969] font-bold"
                          : "text-gray-600 hover:bg-red-50/60 hover:text-[#fd6969]"
                      }`}
                    >
                      <ChevronRight size={14} className="text-[#fd6969]" strokeWidth={3} />
                      {p.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-400 leading-relaxed">
                  নিকাহ্ দ্বীন — মুসলিম পাত্র-পাত্রীর বিশ্বস্ত বায়োডাটা প্ল্যাটফর্ম। আপনার
                  তথ্যের নিরাপত্তা ও আস্থাই আমাদের অগ্রাধিকার।
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
