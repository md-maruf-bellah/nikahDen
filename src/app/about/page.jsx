import React from "react";
import Image from "next/image";
import about from "./../../../assets/hero/hero.png";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header Section */}
      <div className="bg-[#ff6b6b] py-10 text-center text-white mb-16">
        <h1 className="text-3xl font-bold mb-2 tracking-wide">
          আমাদের সম্পর্কে
        </h1>
        <p className="text-xs text-red-100 opacity-90">হোম / আমাদের সম্পর্কে</p>
      </div>

      {/* Main Content Container */}
      <div className="max-w-5xl mx-auto px-6">
        {/* About Us Section (Illustration + Content) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center mb-16">
          {/* Image Column */}
          <div className="md:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[340px] aspect-[4/5] overflow-hidden">
              <Image
                src={about}
                alt="About Us Illustration"
                fill
                sizes="(max-w-768px) 100vw, 350px"
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Text Column */}
          <div className="md:col-span-7">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 tracking-wide">
              আমাদের কথা
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed text-left">
              হাদীস থেকে বর্ণিত, যিনি বিয়ে করলেন, তিনি তার অর্ধেক দ্বীন পূর্ণ
              করলেন এবং বাকী অর্ধেকের জন্য তিনি যেন আল্লাহকে ভয় করেন। আপনার
              অর্ধেক দ্বীন পূর্ণ করতে মুসলিম পাত্র-পাত্রী খুঁজুন এখন খুবই সহজে।
              হাদীস থেকে বর্ণিত, যিনি বিয়ে করলেন, তিনি তার অর্ধেক দ্বীন পূর্ণ
              করলেন এবং বাকী অর্ধেকের জন্য তিনি যেন আল্লাহকে ভয় করেন। আপনার
              অর্ধেক দ্বীন পূর্ণ করতে মুসলিম পাত্র-পাত্রী খুঁজুন এখন খুবই সহজে।
            </p>
          </div>
        </div>

        {/* Mission and Vision (Objective & Goal) Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 pt-4">
          {/* Objective Block */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3 tracking-wide">
              উদ্দেশ্য
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed text-left">
              হাদীস থেকে বর্ণিত, যিনি বিয়ে করলেন, তিনি তার অর্ধেক দ্বীন পূর্ণ
              করলেন এবং বাকী অর্ধেকের জন্য তিনি যেন আল্লাহকে ভয় করেন। আপনার
              অর্ধেক দ্বীন পূর্ণ করতে মুসলিম পাত্র-পাত্রী খুঁজুন এখন খুবই সহজে।
              হাদীস থেকে বর্ণিত, যিনি বিয়ে করলেন, তিনি তার অর্ধেক দ্বীন পূর্ণ
              করলেন এবং বাকী অর্ধেকের জন্য তিনি যেন আল্লাহকে ভয় করেন। আপনার
              অর্ধেক দ্বীন পূর্ণ করতে মুসলিম পাত্র-পাত্রী খুঁজুন এখন খুবই সহজে।
            </p>
          </div>

          {/* Goal Block */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3 tracking-wide">
              লক্ষ্য
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed text-left">
              হাদীস থেকে বর্ণিত, যিনি বিয়ে করলেন, তিনি তার অর্ধেক দ্বীন পূর্ণ
              করলেন এবং বাকী অর্ধেকের জন্য তিনি যেন আল্লাহকে ভয় করেন। আপনার
              অর্ধেক দ্বীন পূর্ণ করতে মুসলিম পাত্র-পাত্রী খুঁজুন এখন খুবই সহজে।
              হাদীস থেকে বর্ণিত, যিনি বিয়ে করলেন, তিনি তার অর্ধেক দ্বীন পূর্ণ
              করলেন এবং বাকী অর্ধেকের জন্য তিনি যেন আল্লাহকে ভয় করেন। আপনার
              অর্ধেক দ্বীন পূর্ণ করতে মুসলিম পাত্র-পাত্রী খুঁজুন এখন খুবই সহজে।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
