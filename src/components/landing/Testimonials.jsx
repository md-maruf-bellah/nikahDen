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
    text: "আমাদের ফেসবুক পেইজের মাধ্যমে গ্রাহক আমাদের সাথে সরাসরি যোগাযোগ করতে পারবেন। যেকোনো ধরনের সমস্যা অথবা যেকোনো ধরনের প্রশ্নের উত্তর আমরা দিয়ে থাকি। আমাদের সার্ভিস নিয়ে আমরা খুবই সন্তুষ্ট।",
    image: "https://images.unsplash.com/photo-1529636798458-92182e662485",
  },
  {
    id: 2,
    name: "আরিফ এন্ড",
    surname: "ফারজানা",
    text: "খুবই চমৎকার অভিজ্ঞতা! আমরা যেমনটি আশা করেছিলাম তার চেয়েও ভালো সার্ভিস পেয়েছি। তাদের ব্যবহারের ধরণ এবং কাজের মান সত্যিই প্রশংসনীয়। ধন্যবাদ সবাইকে।",
    image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a",
  },
  {
    id: 3,
    name: "রাকিব এন্ড",
    surname: "আকিফা",
    text: "প্রফেশনাল সার্ভিস এবং সঠিক সময়ে কাজ ডেলিভারি দেওয়ার জন্য এই প্ল্যাটফর্মটি সেরা। আমরা আমাদের বিশেষ দিনটিকে স্মরণীয় করে রাখতে তাদের অনেক সহযোগিতা পেয়েছি।",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc",
  },
  {
    id: 4,
    name: "জাহিদ এন্ড",
    surname: "মালিহা",
    text: "তাদের সাপোর্ট সিস্টেম অসাধারণ। যেকোনো প্রয়োজনে নক করলেই দ্রুত সমাধান পাওয়া যায়। ভবিষ্যতে আমাদের পরিচিতদেরও আমরা এখানে আসার পরামর্শ দেবো।",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552",
  },
  {
    id: 5,
    name: "তানভীর এন্ড",
    surname: "আফরিন",
    text: "অল্প সময়ে এত সুন্দর আয়োজন তারা করে দেবে ভাবিনি। প্রতিটি খুঁটিনাটি বিষয়ের দিকে তারা খুব গুরুত্ব দেয়। তাদের টিমের সবাইকে অনেক ধন্যবাদ জানাই।",
    image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a",
  },
  {
    id: 6,
    name: "সজীব এন্ড",
    surname: "রিমি",
    text: "তাদের ফটোগ্রাফি এবং ইভেন্ট ম্যানেজমেন্ট এক কথায় দারুণ। আমাদের বিয়ের অনুষ্ঠানটি তাদের জন্য আরও প্রাণবন্ত হয়ে উঠেছিল। আমরা সবাই খুবই খুশি।",
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b",
  },
  {
    id: 7,
    name: "মাহমুদ এন্ড",
    surname: "শায়লা",
    text: "খুবই বিশ্বস্ত একটি প্রতিষ্ঠান। তারা আমাদের কথা শুনেছে এবং আমাদের বাজেট অনুযায়ী সেরা অপশনগুলো দিয়ে সহযোগিতা করেছে। তাদের প্রতি শুভকামনা রইল।",
    image: "https://images.unsplash.com/photo-1520854221256-17451cc331bf",
  },
  {
    id: 8,
    name: "ইমন এন্ড",
    surname: "সুমাইয়া",
    text: "তাদের ব্যবহারের মাধুর্য আমাদের মুগ্ধ করেছে। প্রফেশনালিজম এবং আন্তরিকতার এক অনন্য উদাহরণ এই প্ল্যাটফর্মটি। যেকোনো বিয়ে বা অনুষ্ঠানের জন্য সেরা চয়েস।",
    image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8",
  },
  {
    id: 9,
    name: "ফয়সাল এন্ড",
    surname: "তাসনিম",
    text: "অনলাইনে অর্ডার দিয়ে সার্ভিস পাওয়া নিয়ে একটু চিন্তিত ছিলাম, কিন্তু তারা আমাদের ভুল প্রমাণ করেছে। সার্ভিস কোয়ালিটি টপ নচ। ধন্যবাদ আপনাদের।",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
  },
  {
    id: 10,
    name: "কামরুল এন্ড",
    surname: "নাদিয়া",
    text: "পরিকল্পনা থেকে বাস্তবায়ন—প্রতিটি ধাপে তাদের দক্ষতা প্রকাশ পেয়েছে। সুন্দর একটি স্মৃতি উপহার দেওয়ার জন্য আপনাদের কাছে আমরা কৃতজ্ঞ।",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
  },
];
export default function TestimonialSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // স্লাইডিং ডিরেকশন ট্র্যাক করার জন্য

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
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  const current = testimonials[currentIndex];

  return (
    <div className="w-full py-32  overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-16">
          <p className="text-[#f45f5f] font-medium mb-2">রিভিউ</p>
          <h2 className="text-3xl md:text-4xl font-bold">
            বিবাহিত দম্পতিদের কথা
          </h2>
          <div className="flex justify-center items-center gap-3 mt-4">
            <span className="w-6 h-2 bg-[#f45f5f] rounded-full"></span>
            <span className="w-16 h-2 bg-[#f45f5f] rounded-full"></span>
          </div>
        </div>

        {/* Content Container */}
        <div className="grid md:grid-cols-2 gap-10 items-center min-h-[450px]">
          {/* Image Section with Animation */}
          <div className="relative w-full max-w-md mx-auto aspect-square md:aspect-auto md:h-[400px]">
            <div className="absolute -top-4 -left-4 w-full h-full border-l-[10px] border-t-[10px] border-[#f45f5f] z-0"></div>

            <div className="relative w-full h-full z-10 overflow-hidden shadow">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.4 },
                  }}
                  className="absolute inset-0"
                >
                  <Image
                    src={current.image}
                    alt={current.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 500px"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Text Section with Animation */}
          <div className="flex flex-col justify-center space-y-8 relative">
            <div className="min-h-[200px] flex items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <p className="text-lg leading-relaxed italic">
                    "{current.text}"
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Controls & Name Container */}
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center gap-8 pt-6 border-t border-gray-100">
              {/* বাটন সেকশন */}
              <div className="flex items-center justify-center gap-4 w-full sm:w-auto">
                <button
                  onClick={prevSlide}
                  className="p-2 btn btn-square btn-md  bg-gray-700 text-white hover:bg-[#f45f5f] hover:text-white transition-all duration-300 shadow-sm"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  onClick={nextSlide}
                  className="p-2 btn btn-square btn-md  bg-gray-700 text-white hover:bg-[#f45f5f] hover:text-white transition-all duration-300 shadow-sm"
                >
                  <ChevronRight size={22} />
                </button>
              </div>

              {/* নাম এবং পরিচয় সেকশন */}
              <div className="flex items-center justify-center gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-4">
                  {/* মোবাইলে এই দাগটি চাইলে লুকিয়ে রাখতে পারেন (hidden sm:block), নাহলে এভাবেই থাকবে */}
                  <span className="w-12 h-[2px] bg-gray-400"></span>
                  <div className="text-center sm:text-left">
                    <p className="font-bold text-2xl leading-tight">
                      {current.name}
                    </p>
                    <p className="">{current.surname}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
