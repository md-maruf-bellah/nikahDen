"use client";

import React from "react";
import Image from "next/image";
import about from "./../../../assets/hero/hero.png";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";

export default function AboutUs() {
  const { t, isRTL } = useLanguage();

  return (
    <div className="min-h-screen pb-24">
      {/* Header Section */}
      <div className="bg-[#ff6b6b] py-10 text-center mb-16 text-white">
        <h1 className="text-3xl font-bold mb-2 tracking-wide">
          {t("about.title", "আমাদের সম্পর্কে")}
        </h1>
        <p className="text-md text-red-100 opacity-90">
          <Link href="/" className="hover:underline">
            {t("nav.home", "হোম")}
          </Link>{" "}
          / {t("about.breadcrumb", "আমাদের সম্পর্কে")}
        </p>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-10">
        {/* About Us Section (Illustration + Content) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center mb-16">
          {/* Image Column */}
          <div className="md:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[340px] aspect-[4/5] overflow-hidden">
              <Image
                src={about}
                alt={t("about.title", "About Us Illustration")}
                fill
                sizes="(max-w-768px) 100vw, 350px"
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Text Column */}
          <div className="md:col-span-7">
            <h2 className={`text-2xl font-bold mb-4 tracking-wide ${isRTL ? "text-right" : "text-left"}`}>
              {t("about.ourStory", "আমাদের কথা")}
            </h2>
            <div className={`space-y-4 text-md leading-relaxed text-base-content/80 ${isRTL ? "text-right" : "text-left"}`}>
              <p>
                {t(
                  "about.storyParagraph1",
                  "হাদীস থেকে বর্ণিত, যিনি বিয়ে করলেন, তিনি তার অর্ধেক দ্বীন পূর্ণ করলেন এবং বাকী অর্ধেকের জন্য তিনি যেন আল্লাহকে ভয় করেন। আপনার অর্ধেক দ্বীন পূর্ণ করতে মুসলিম পাত্র-পাত্রী খুঁজুন এখন খুবই সহজে।"
                )}
              </p>
              <p>
                {t(
                  "about.storyParagraph2",
                  "নিকাহ্ দ্বীন প্রতিষ্ঠার মূল উদ্দেশ্য হলো সমাজে সুন্নাহসম্মত ও সহজ বিবাহের সংস্কৃতি ছড়িয়ে দেওয়া। শালীনতা, বিশ্বস্ততা ও শারঈ নীতিমালা বজায় রেখে পাত্র-পাত্রী ও তাদের অভিভাবকদের মধ্যে একটি নিরাপদ মাধ্যম হিসেবে কাজ করাই আমাদের লক্ষ্য।"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Mission and Vision (Objective & Goal) Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 pt-4">
          {/* Objective Block */}
          <div className={isRTL ? "text-right" : "text-left"}>
            <h3 className="text-xl font-bold mb-3 tracking-wide text-base-content">
              {t("about.objectiveTitle", "আমাদের উদ্দেশ্য")}
            </h3>
            <p className="text-md leading-relaxed text-base-content/80">
              {t(
                "about.objectiveDesc",
                "সুন্নাহসম্মত বিবাহকে সহজ ও উৎসাহিত করা এবং অভিভাবকদের অংশগ্রহণে একটি পবিত্র ও নিরাপদ পারিবারিক বন্ধন তৈরি করা।"
              )}
            </p>
          </div>

          {/* Goal Block */}
          <div className={isRTL ? "text-right" : "text-left"}>
            <h3 className="text-xl font-bold mb-3 tracking-wide text-base-content">
              {t("about.visionTitle", "আমাদের লক্ষ্য")}
            </h3>
            <p className="text-md leading-relaxed text-base-content/80">
              {t(
                "about.visionDesc",
                "বাংলাদেশের প্রতিটি মুসলিম পরিবারের জন্য একটি বিশ্বস্ত, সুরক্ষিত এবং সর্বোচ্চ নির্ভরযোগ্য ম্যাট্রিমনি সেবা নিশ্চিত করা।"
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
