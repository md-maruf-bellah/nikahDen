"use client";
import Image from "next/image";
import heroImage from "./../../../assets/hero/hero.png";

export default function HeroSection() {
  return (
    <section className="bg-base-100 pb-16 pt-5 px-4 ">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 items-center-safe justify-around gap-3">
        {/* TEXT SECTION */}
        <div>
          <p className="text-[#fd6969] font-bold text-lg mb-5">
            ইসলামিক ম্যাট্রিমনি{" "}
          </p>

          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight my-5 text-base-content/80">
            মুসলিম <span className="text-[#fd6969]">পাত্র-পাত্রী</span>
            <br />
            খুঁজুন <span className="text-[#fd6969]">এখন খুবই সহজে</span>
          </h1>

          <p className="text-base-content/70 text-lg leading-relaxed mb-6 max-w-md">
            হাদীস থেকে বর্ণিত, যিনি বিয়ে করলেন, তিনি তার অর্ধেক দ্বীন পূর্ণ
            করলেন এবং বাকী অর্ধেকের জন্য তিনি যেন আল্লাহকে ভয় করেন। আপনার অর্ধেক
            দ্বীন পূর্ণ করতে মুসলিম পাত্র-পাত্রী খুঁজুন এখন খুবই সহজে।
          </p>

          <div className="flex gap-4">
            <button className="btn bg-[#fd6969] text-lg px-7 text-white">
              পাত্র-পাত্রী খুঁজুন
            </button>
            <button className="btn btn-link text-[#fd6969] text-lg">
              রেজিস্ট্রেশন করুন
            </button>
          </div>
        </div>

        {/* IMAGE SECTION */}
        <div className="flex justify-end">
          <div className="relative w-full max-w-lg">
            <Image
              src={heroImage}
              alt="hero image"
              className="w-500 h-auto"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
