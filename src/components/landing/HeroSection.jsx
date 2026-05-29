"use client";

import React, { useState } from "react";
// আপনার ইমেজের পাথগুলো (প্রজেক্ট অনুযায়ী প্রয়োজনে চেঞ্জ করে নিতে পারেন)
import muslim from "./../../../assets/banner/new/hero.png";
import hindu from "./../../../assets/banner/new/hindu.png";
import cristian from "./../../../assets/banner/new/cristian.png";
import buddha from "./../../../assets/banner/new/buddha.png";

// Swiper Slider Components and Styles
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import Image from "next/image";

export default function HeroSection() {
  const contentData = [
    {
      tag: "ইসলামিক ম্যাট্রিমনি",
      titlePrefix: "মুসলিম",
      titleSuffix: "খুঁজুন এখন খুবই সহজে",
      description:
        "হাদীস থেকে বর্ণিত, যিনি বিয়ে করলেন, তিনি তার অর্ধেক দ্বীন পূর্ণ করলেন এবং বাকী অর্ধেকের জন্য তিনি যেন আল্লাহকে ভয় করেন। আপনার অর্ধেক দ্বীন পূর্ণ করতে মুসলিম পাত্র-পাত্রী খুঁজুন এখন খুবই সহজে।",
      btnText: "মুসলিম পাত্র-পাত্রী খুঁজুন",
      image: muslim,
      alt: "Muslim Matrimony",
    },
    {
      tag: "সনাতন ম্যাট্রিমনি",
      titlePrefix: "হিন্দু",
      titleSuffix: "পছন্দ করুন আপনার জীবনসঙ্গী",
      description:
        "পবিত্র বেদ ও শাস্ত্র মতে, বিবাহ হলো দুটি আত্মার মিলন এবং একটি পবিত্র ধর্মীয় বন্ধন। আপনার জীবনের এই সুন্দর যাত্রাকে সার্থক করতে আদেশ হিন্দু জীবনসঙ্গী খুঁজে নিন আমাদের মাধ্যমে।",
      btnText: "হিন্দু পাত্র-পাত্রী খুঁজুন",
      image: hindu,
      alt: "Hindu Matrimony",
    },
    {
      tag: "খ্রিস্টান ম্যাট্রিমনি",
      titlePrefix: "খ্রিস্টান",
      titleSuffix: "গড়ে তুলুন সুখী পরিবার",
      description:
        "পবিত্র বাইবেলের শিক্ষা অনুযায়ী, বিবাহ হলো ঈশ্বর কর্তৃক নির্ধারিত এক পবিত্র ও আজীবন চুক্তি। ঈশ্বরের আশীর্বাদে আপনার বিশ্বাসের সাথে মিল রেখে উপযুক্ত খ্রিস্টান পাত্র-পাত্রী খুঁজে নিন।",
      btnText: "খ্রিস্টান পাত্র-পাত্রী খুঁজুন",
      image: cristian,
      alt: "Christian Matrimony",
    },
    {
      tag: "বৌদ্ধ ম্যাট্রিমনি",
      titlePrefix: "বৌদ্ধ",
      titleSuffix: "খুঁজুন আপনার উপযুক্ত সঙ্গী",
      description:
        "ত্রিপিটকের অহিংসা ও শান্তির বাণীকে ধারণ করে জীবনের নতুন অধ্যায় শুরু করুন। পারস্পরিক শ্রদ্ধা ও সমতা ভিত্তিক সুখী দাম্পত্য জীবনের জন্য আপনার উপযুক্ত বৌদ্ধ জীবনসঙ্গী খুঁজে নিন।",
      btnText: "বৌদ্ধ পাত্র-পাত্রী খুঁজুন",
      image: buddha,
      alt: "Buddha Matrimony",
    },
  ];

  // ডিফল্ট ০ ইনডেক্স (মুসলিম) সেট করা আছে
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="bg-gradient-to-b from-base-100 to-base-200/50 py-12 md:py-20 px-4 md:px-10 overflow-hidden relative">
      {/* গ্লোবাল CSS ইনজেকশন (সুইপার ডট এবং অ্যানিমেশনের জন্য) */}
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

      {/* ব্যাকগ্রাউন্ড ডেকোরেটিভ গ্লো */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#fd6969]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto grid md:grid-cols-2 items-center justify-between gap-8 md:gap-16 relative z-10">
        {/* DYNAMIC TEXT SECTION */}
        {/* key={activeIndex} দেওয়ার কারণে স্লাইড পরিবর্তনের সাথে সাথে টেক্সট অ্যানিমেট হবে */}
        <div
          key={activeIndex}
          className="order-2 md:order-1 text-center md:text-left animate-text-fade"
        >
          {/* ধর্মভিত্তিক ট্যাগ */}
          <span className="inline-block text-[#fd6969] bg-[#fd6969]/10 font-bold text-xs md:text-sm tracking-wide px-4 py-1.5 rounded-full mb-5 border border-[#fd6969]/20 shadow-sm">
            {contentData[activeIndex].tag}
          </span>

          {/* ডায়নামিক শিরোনাম */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight my-4 text-base-content/95 tracking-tight">
            <span className="text-[#fd6969] relative inline-block">
              {contentData[activeIndex].titlePrefix}
            </span>{" "}
            পাত্র-পাত্রী <br className="hidden sm:inline" />
            {contentData[activeIndex].titleSuffix}
          </h1>

          {/* বিবরণী */}
          <p className="text-base-content/70 text-base md:text-lg leading-relaxed mb-8 max-w-xl mx-auto md:mx-0 min-h-[100px] md:min-h-[auto]">
            {contentData[activeIndex].description}
          </p>

          {/* বাটনসমূহ */}
          <div className="flex flex-col sm:flex-row justify-center md:justify-start items-center gap-4">
            <button className="btn bg-[#fd6969] hover:bg-[#e05858] hover:scale-105 active:scale-95 border-none text-base md:text-lg px-8 text-white w-full sm:w-auto rounded-xl shadow-lg shadow-[#fd6969]/20 transition-all duration-300">
              {contentData[activeIndex].btnText}
            </button>
            <button className="btn btn-link text-[#fd6969] font-semibold text-base md:text-lg no-underline hover:underline transition-all duration-300">
              রেজিস্ট্রেশন করুন
            </button>
          </div>
        </div>

        {/* IMAGE SLIDER SECTION */}
        <div className="order-1 md:order-2 flex justify-center md:justify-end w-full">
          <div className="w-full max-w-[320px] sm:max-w-[420px] md:max-w-[520px] lg:max-w-[600px] relative group">
            {/* ইমেজের ব্যাকগ্রাউন্ড সফট গ্লো */}
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
                  {/* রেগুলার JSX রেস্পনসিভ ইমেজ কন্টেইনার */}
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
