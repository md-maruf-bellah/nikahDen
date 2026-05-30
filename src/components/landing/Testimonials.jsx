"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const testimonials = [
  {
    id: 1,
    name: "মিস্টার এন্ড মিসেস",
    surname: "সরকার",
    text: "আমাদের ফেসবুক পেইজের মাধ্যমে গ্রাহক আমাদের সাথে সরাসরি যোগাযোগ করতে পারবেন। যেকোনো ধরনের সমস্যা অথবা যেকোনো ধরনের প্রশ্নের উত্তর আমরা দিয়ে থাকি। আমাদের ফেসবুক পেইজের মাধ্যমে গ্রাহক আমাদের সাথে সরাসরি যোগাযোগ করতে পারবেন। যেকোনো ধরনের সমস্যা অথবা যেকোনো ধরনের প্রশ্নের উত্তর আমরা দিয়ে থাকি।",
    image: "https://images.unsplash.com/photo-1529636798458-92182e662485",
  },
  {
    id: 2,
    name: "আরিফ এন্ড",
    surname: "ফারজানা",
    text: "খুবই চমৎকার অভিজ্ঞতা! আমরা যেমনটি আশা করেছিলাম তার চেয়েও ভালো সার্ভিস পেয়েছি। তাদের ব্যবহারের ধরণ এবং কাজের মান সত্যিই প্রশংসনীয়। ধন্যবাদ সবাইকে। খুবই চমৎকার অভিজ্ঞতা! আমরা যেমনটি আশা করেছিলাম তার চেয়েও ভালো সার্ভিস পেয়েছি। তাদের ব্যবহারের ধরণ এবং কাজের মান সত্যিই প্রশংসনীয়। ধন্যবাদ সবাইকে।",
    image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a",
  },
  {
    id: 3,
    name: "রাকিব এন্ড",
    surname: "আকিফা",
    text: "প্রফেশনাল সার্ভিস এবং সঠিক সময়ে কাজ ডেলিভারি দেওয়ার জন্য এই প্ল্যাটফর্মটি সেরা। আমরা আমাদের বিশেষ দিনটিকে স্মরণীয় করে রাখতে তাদের অনেক সহযোগিতা পেয়েছি। প্রফেশনাল সার্ভিস এবং সঠিক সময়ে কাজ डेलिभारি देओया जन्य एই प्ल्याटफर्मटि सेरा। आमरा आमदेर बिशेष दिनटिके स्मरणीय करे राखते तादेर अनेक सहयोगिता पेये छि।",
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

  const current = testimonials[currentIndex];

  return (
    <div className="w-full py-20 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6">
        {/* Heading Section */}
        <div className="text-center mb-16">
          <p className="text-[#ff6b6b] text-xs font-bold mb-1 tracking-wide">
            রিভিউ
          </p>
          <h2 className="text-2xl md:text-3xl font-bold ">
            বিবাহিত দম্পতিদের কথা
          </h2>
          <div className="flex justify-center items-center gap-1.5 mt-3">
            <span className="w-4 h-1 bg-[#ff6b6b] rounded-full"></span>
            <span className="w-10 h-1 bg-[#ff6b6b] rounded-full"></span>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center min-h-[380px]">
          {/* Image Column with Exact image_bbc8ba.png Border Framing */}
          <div className="md:col-span-5 flex justify-center items-center">
            <div className="relative w-full max-w-[320px] aspect-square">
              {/* 
                ফটো অনুযায়ী নিখুঁত বর্ডার ফ্রেম:
                - w-1/2 এবং right-0 এর মাধ্যমে পেছনের কন্টেনারটি ডান থেকে শুরু হয়ে ইমেজের ঠিক মাঝখানে আসবে।
                - border-t, border-b এবং border-r দেওয়ার কারণে লাইনগুলো ওপরে ও নিচে মাঝখান থেকে শুরু হয়ে ডানে মিশেছে।
              */}
              <div className="absolute -right-5 -top-5 -bottom-5 w-1/2 border-r-[10px] border-t-[10px] border-b-[10px] border-[#ff6b6b] z-0 pointer-events-none"></div>

              {/* মেইন ইমেজ কন্টেনার */}
              <div className="relative w-full h-full z-10 overflow-hidden bg-white shadow-md">
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
                    className="absolute inset-0"
                  >
                    <Image
                      src={current.image}
                      alt={`${current.name} ${current.surname}`}
                      fill
                      className="object-cover"
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
                  className="w-8 h-8 flex items-center justify-center border border-gray-400  hover:border-[#ff6b6b] hover:text-[#ff6b6b] transition-colors cursor-pointer rounded-sm bg-transparent"
                >
                  <ChevronLeft size={16} strokeWidth={2.5} />
                </button>
                <button
                  onClick={nextSlide}
                  className="w-8 h-8 flex items-center justify-center border border-gray-400  hover:border-[#ff6b6b] hover:text-[#ff6b6b] transition-colors cursor-pointer rounded-sm bg-transparent"
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
