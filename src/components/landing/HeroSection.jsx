"use client";

import React, { useState } from "react";
import muslim from "./../../../assets/banner/new/hero.png";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import Image from "next/image";
import { FaArrowRightToBracket } from "react-icons/fa6";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";

export default function HeroSection() {
  const { t, isRTL } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);

  const contentData = [
    {
      tag: t("hero.islamicMatrimony", "ইসলামিক ম্যাট্রিমনি"),
      titlePrefix: t("hero.titlePrefix", "মুসলিম"),
      titleSuffix: t("hero.titleSuffix", "খুঁজুন এখন খুবই সহজে"),
      description: t(
        "hero.hadithQuote",
        "হাদীস থেকে বর্ণিত, যিনি বিয়ে করলেন, তিনি তার অর্ধেক দ্বীন পূর্ণ করলেন এবং বাকী অর্ধেকের জন্য তিনি যেন আল্লাহকে ভয় করেন। আপনার অর্ধেক দ্বীন পূর্ণ করতে মুসলিম পাত্র-পাত্রী খুঁজুন এখন খুবই সহজে।"
      ),
      btnText: t("hero.findPartnerBtn", "মুসলিম পাত্র-পাত্রী খুঁজুন"),
      image: muslim,
      alt: t("hero.altText", "Muslim Matrimony"),
    },
  ];

  return (
    <section className="bg-gradient-to-b from-base-100 to-base-200/50 py-12 md:py-20 px-4 md:px-10 overflow-hidden relative">
      <style>{`
        .dynamic-swiper .swiper-pagination-bullet-active {
          background: #fd6969 !important;
          width: 24px !important;
          border-radius: 8px !important;
          transition: all 0.3s ease-in-out;
        }
        .dynamic-swiper .swiper-pagination-bullet {
          background: #fd6969;
          opacity: 0.4;
        }
        @keyframes customFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-text-fade {
          animation: customFadeIn 0.5s ease-out forwards;
        }
      `}</style>

      {/* Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#fd6969]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid md:grid-cols-2 items-center justify-between gap-8 md:gap-16 relative z-10">
        {/* TEXT SECTION */}
        <div
          key={activeIndex}
          className={`order-2 md:order-1 text-center ${
            isRTL ? "md:text-right pr-0 lg:pr-8" : "md:text-left pl-0 lg:pl-8"
          } animate-text-fade`}
        >
          <span className="inline-block text-[#fd6969] bg-[#fd6969]/10 font-bold text-xs md:text-sm tracking-wide px-4 py-1.5 rounded-full mb-5 border border-[#fd6969]/20 shadow-sm">
            {contentData[activeIndex].tag}
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight my-4 text-base-content/95 tracking-tight">
            <span className="text-[#fd6969] relative inline-block">
              {contentData[activeIndex].titlePrefix}
            </span>{" "}
            <br className="hidden sm:inline" />
            {contentData[activeIndex].titleSuffix}
          </h1>

          <p className="text-base-content/70 text-base md:text-lg leading-relaxed mb-8 max-w-xl mx-auto md:mx-0 min-h-[100px] md:min-h-[auto]">
            {contentData[activeIndex].description}
          </p>

          <div
            className={`flex flex-col sm:flex-row justify-center ${
              isRTL ? "md:justify-start" : "md:justify-start"
            } items-center gap-4`}
          >
            <Link
              href="/list"
              className="btn bg-[#fd6969] hover:bg-[#e05858] hover:scale-105 active:scale-95 border-none text-base md:text-lg px-8 text-white w-full sm:w-auto shadow-lg shadow-[#fd6969]/20 transition-all duration-300"
            >
              {contentData[activeIndex].btnText}
            </Link>
            <Link
              href="/register"
              className="btn btn-link text-[#fd6969] font-semibold text-base md:text-lg no-underline hover:underline transition-all duration-300 flex items-center gap-1.5"
            >
              <span>{t("auth.registerBtn", "রেজিস্ট্রেশন করুন")}</span>
              <FaArrowRightToBracket className={isRTL ? "rotate-180" : ""} />
            </Link>
          </div>
        </div>

        {/* IMAGE SLIDER SECTION */}
        <div className="order-1 md:order-2 flex justify-center md:justify-end w-full">
          <div className="w-full max-w-[320px] sm:max-w-[420px] md:max-w-[520px] lg:max-w-[600px] relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#fd6969]/10 to-transparent rounded-3xl blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />

            <Swiper
              modules={[Autoplay, EffectFade, Pagination]}
              effect={"fade"}
              fadeEffect={{ crossFade: true }}
              grabCursor={true}
              loop={true}
              autoplay={{
                delay: 4500,
                disableOnInteraction: false,
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
              className="w-full rounded-3xl overflow-hidden dynamic-swiper"
            >
              {contentData.map((data, index) => (
                <SwiperSlide
                  key={index}
                  className="flex justify-center items-center bg-transparent py-4"
                >
                  <div className="relative w-full aspect-square flex justify-center items-center min-h-[300px] sm:min-h-[400px]">
                    <Image
                      src={data.image}
                      alt={data.alt}
                      className="w-full h-full object-contain rounded-2xl drop-shadow-[0_10px_25px_rgba(0,0,0,0.08)]"
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
}
