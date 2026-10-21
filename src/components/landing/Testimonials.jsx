"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/language-context";

const testimonials = [
  {
    id: 1,
    name: "আরিফুল ইসলাম ও",
    surname: "ফাতেমা আক্তার",
    text: "আলহামদুলিল্লাহ, নিকাহ্ দ্বীন প্ল্যাটফর্মের মাধ্যমে আমি আমার মনের মতো পর্দাশীল ও দ্বীনদার জীবনসঙ্গী খুঁজে পেয়েছি। পুরো প্রক্রিয়াটি অভিভাবকের তত্ত্বাবধানে হওয়ায় কোনো ধরণের দ্বিধা ছিল না। আল্লাহ এই প্ল্যাটফর্মের সাথে সংশ্লিষ্ট সকলকে উত্তম প্রতিদান দিন।",
    image: "https://images.unsplash.com/photo-1529636798458-92182e662485",
  },
  {
    id: 2,
    name: "ইঞ্জিনিয়ার মাহমুদ ও",
    surname: "ডা. তানিয়া",
    text: "ইসলামিক মূল্যবোধ বজায় রেখে এত সুন্দর আধুনিক একটি প্ল্যাটফর্ম সত্যিই প্রশংসনীয়। পাত্র-পাত্রীর দ্বীনি তথ্য ও শিক্ষাগত তথ্যের স্বচ্ছতা আমাদের খুব দ্রুত সিদ্ধান্ত নিতে সাহায্য করেছে। আলহামদুলিল্লাহ আমাদের বিবাহ সফলভাবে সম্পন্ন হয়েছে।",
    image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a",
  },
  {
    id: 3,
    name: "হাফেজ নোমান ও",
    surname: "সালমা খাতুন",
    text: "নিকাহ্ দ্বীন-এর মাধ্যমে উভয় পরিবারের যোগাযোগ ও অভিভাবকের মধ্যস্থতায় খুব সহজেই আমাদের বিয়ে সম্পন্ন হয়। আল্লাহ আমাদের জীবনে বরকত দান করুন। অবিবাহিত দ্বীনদার ভাই-বোনদের জন্য এটি বর্তমান সময়ের সেরা ইসলামিক মাধ্যম।",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc",
  },
];

export default function TestimonialSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) =>
      prev === testimonials.length - 1 ? 0 : prev + 1,
    );
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1,
    );
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 40 : -40,
      opacity: 0,
    }),
  };

  const { t, isRTL } = useLanguage();
  const current = testimonials[currentIndex];

  return (
    <div className="w-full py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Heading Section */}
        <div className="text-center mb-16">
          <p className="text-[#ff6b6b] text-xs font-bold mb-1 tracking-wide">
            {t("testimonials.badge", "রিভিউ")}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold">
            {t("testimonials.title", "বিবাহিত দম্পতিদের কথা")}
          </h2>
          <div className="flex justify-center items-center gap-1.5 mt-3">
            <span className="w-4 h-1 bg-[#ff6b6b] rounded-full"></span>
            <span className="w-10 h-1 bg-[#ff6b6b] rounded-full"></span>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-center min-h-[380px]">
          {/* Image Column with Exact image_bbc8ba.png Border Framing */}
          <div className="md:col-span-5 flex justify-center items-center">
            <div className="relative w-full max-w-[368px] aspect-square">
              {/* 
                ফটো অনুযায়ী নিখুঁত বর্ডার ফ্রেম:
                - w-1/2 এবং right-0 এর মাধ্যমে পেছনের কন্টেনারটি ডান থেকে শুরু হয়ে ইমেজের ঠিক মাঝখানে আসবে।
                - border-t, border-b এবং border-r দেওয়ার কারণে লাইনগুলো ওপরে ও নিচে মাঝখান থেকে শুরু হয়ে ডানে মিশেছে।
              */}
              <div className="card absolute -right-5 -top-5 -bottom-5 w-1/2 border-r-[10px] border-t-[10px] border-b-[10px] border-[#ff6b6b] z-0 pointer-events-none"></div>

              {/* মেইন ইমেজ কন্টেনার */}
              <div className="card relative w-full h-full z-10 overflow-hidden bg-white shadow-md">
                <AnimatePresence initial={false} custom={direction}>
                  <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 350, damping: 35 },
                      opacity: { duration: 0.3 },
                    }}
                    className="absolute inset-0 "
                  >
                    <Image
                      src={current.image}
                      alt={`${current.name} ${current.surname}`}
                      fill
                      className="object-cover "
                      sizes="(max-width: 768px) 100vw, 320px"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Text & Navigation Column */}
          <div className="md:col-span-7 flex flex-col justify-between h-full py-4 pl-0 md:pl-4">
            {/* Review Description */}
            <div className="min-h-[120px] flex items-center mb-8">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-lg  leading-relaxed text-left font-medium"
                >
                  {current.text}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Controls & Name Section */}
            <div className="flex items-center justify-between pt-6">
              {/* Box Outline Navigation Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={prevSlide}
                  className="btn btn-square  hover:border-[#ff6b6b] hover:text-[#ff6b6b]  cursor-pointer"
                >
                  <ChevronLeft size={16} strokeWidth={2.5} />
                </button>
                <button
                  onClick={nextSlide}
                  className="btn btn-square  hover:border-[#ff6b6b] hover:text-[#ff6b6b]  cursor-pointer"
                >
                  <ChevronRight size={16} strokeWidth={2.5} />
                </button>
              </div>

              {/* Author Title and Divider Line */}
              <div className="flex items-center gap-4">
                <span className="w-12 h-[1px] bg-gray-400"></span>
                <div className="text-right">
                  <p className="font-bold text-xs  tracking-wide">
                    {current.name}
                  </p>
                  <p className="font-bold text-xs  tracking-wide mt-0.5">
                    {current.surname}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
