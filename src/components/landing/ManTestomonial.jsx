"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { FcLikePlaceholder, FcLike } from "react-icons/fc";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import alema from "./../../../assets/member/alema1.png";
import alem from "./../../../assets/member/alem1.png";

import "swiper/css";
import "swiper/css/navigation";

// Dummy data
const femaleProfiles = [
  {
    name: "আফরিন খানম",
    age: 24,
    location: "ঢাকা",
    profession: "শিক্ষার্থী",
    height: "৫'৪\"",
    color: "উজ্জ্বল ফর্সা",
    img: alema,
  },
  {
    name: "সাবরিনা ইসলাম",
    age: 26,
    location: "চট্টগ্রাম",
    profession: "ডাক্তার",
    height: "৫'৩\"",
    color: "উজ্জ্বল শ্যামলা",
    img: alema,
  },
  {
    name: "নাফিসা রহমান",
    age: 23,
    location: "সিলেট",
    profession: "শিক্ষক",
    height: "৫'5\"",
    color: "ফর্সা",
    img: alema,
  },
  {
    name: "তাহমিনা বেগম",
    age: 27,
    location: "রাজশাহী",
    profession: "ইঞ্জিনিয়ার",
    height: "৫'৪\"",
    color: "শ্যামলা",
    img: alema,
  },
  {
    name: "আফরিন খানম",
    age: 24,
    location: "ঢাকা",
    profession: "শিক্ষার্থী",
    height: "৫'৪\"",
    color: "উজ্জ্বল ফর্সা",
    img: alema,
  },
  {
    name: "সাবরিনা ইসলাম",
    age: 26,
    location: "চট্টগ্রাম",
    profession: "ডাক্তার",
    height: "৫'৩\"",
    color: "উজ্জ্বল শ্যামলা",
    img: alema,
  },
  {
    name: "নাফিসা রহমান",
    age: 23,
    location: "সিলেট",
    profession: "শিক্ষক",
    height: "৫'5\"",
    color: "ফর্সা",
    img: alema,
  },
  {
    name: "তাহমিনা বেগম",
    age: 27,
    location: "রাজশাহী",
    profession: "ইঞ্জিনিয়ার",
    height: "৫'৪\"",
    color: "শ্যামলা",
    img: alema,
  },
];

const maleProfiles = [
  {
    name: "আবদুল করিম",
    age: 28,
    location: "ঢাকা",
    profession: "ইঞ্জিনিয়ার",
    height: "৫'৮\"",
    color: "উজ্জ্বল ফর্সা",
    img: alem,
  },
  {
    name: "মোহাম্মদ রাফি",
    age: 30,
    location: "চট্টগ্রাম",
    profession: "ডাক্তার",
    height: "৫'১০\"",
    color: "উজ্জ্বল শ্যামলা",
    img: alem,
  },
  {
    name: "আরিফুল ইসলাম",
    age: 26,
    location: "খুলনা",
    profession: "ব্যবসায়ী",
    height: "৫'৯\"",
    color: "উজ্জ্বল ফর্সা",
    img: alem,
  },
  {
    name: "শাহরিয়ার হোসেন",
    age: 29,
    location: "রংপুর",
    profession: "শিক্ষক",
    height: "৫'৭\"",
    color: "উজ্জ্বল শ্যামলা",
    img: alem,
  },
  {
    name: "আবদুল করিম",
    age: 28,
    location: "ঢাকা",
    profession: "ইঞ্জিনিয়ার",
    height: "৫'৮\"",
    color: "উজ্জ্বল ফর্সা",
    img: alem,
  },
  {
    name: "মোহাম্মদ রাফি",
    age: 30,
    location: "চট্টগ্রাম",
    profession: "ডাক্তার",
    height: "৫'১০\"",
    color: "উজ্জ্বল শ্যামলা",
    img: alem,
  },
  {
    name: "আরিফুল ইসলাম",
    age: 26,
    location: "খুলনা",
    profession: "ব্যবসায়ী",
    height: "৫'৯\"",
    color: "উজ্জ্বল ফর্সা",
    img: alem,
  },
  {
    name: "শাহরিয়ার হোসেন",
    age: 29,
    location: "রংপুর",
    profession: "শিক্ষক",
    height: "৫'৭\"",
    color: "উজ্জ্বল শ্যামলা",
    img: alem,
  },
];

function ProfileCard({ profile }) {
  const [like, setLike] = useState(false);

  return (
    <div className="card relative border border-primary/30 bg-base-100 shadow hover:shadow-lg transition-all">
      {/* Like Button (same as before) */}
      <div className="absolute right-2 top-2 z-10 cursor-pointer">
        {like ? (
          <FcLike size={24} onClick={() => setLike(false)} />
        ) : (
          <FcLikePlaceholder size={24} onClick={() => setLike(true)} />
        )}
      </div>

      {/* Image (same) */}
      <Image
        src={profile.img}
        alt={profile.name}
        width={400}
        height={300}
        className="w-full h-full border rounded-tl-xl rounded-tr-xl"
      />

      {/* Body (UNCHANGED DESIGN) */}
      <div className="card-body items-center text-center p-4">
        <div className="text-line-through">
          <div className="flex justify-around items-center gap-3">
            <p>বয়স - {profile.age}</p>
            <p>লোকেশান - {profile.location}</p>
          </div>

          <div className="flex justify-around items-center gap-3">
            <p>উচ্চতা - {profile.height}</p>
            <p>গাত্রবর্ণ - {profile.color}</p>
          </div>
        </div>

        <Link
          href="/details"
          className="btn btn-outline text-xs md:text-lg w-5/6 p-4"
        >
          বায়োডাটা দেখুন
        </Link>
      </div>
    </div>
  );
}

function ProfileSection({ title, profiles }) {
  return (
    <section className="py-32 bg-base-300">
      <div className="max-w-7xl mx-auto px-4 lg:px-16">
        {/* Title SAME */}
        <div className="text-center mb-8">
          <h2 className="text-4xl  font-bold py-5">{title}</h2>
        </div>

        <div className="relative">
          {/* LEFT BUTTON (same style) */}
          <button className="prev-btn btn btn-square btn-md absolute bg-gray-700 text-white left-[-45px] top-1/2 -translate-y-1/2 z-10 hidden md:flex">
            <ChevronLeft size={18} />
          </button>

          {/* RIGHT BUTTON (same style) */}
          <button className="next-btn btn btn-square btn-md absolute bg-gray-700 text-white right-[-45px] top-1/2 -translate-y-1/2 z-10 hidden md:flex">
            <ChevronRight size={18} />
          </button>

          {/* ONLY GRID → SWIPER CHANGE */}
          <Swiper
            modules={[Navigation, Autoplay]}
            navigation={{
              prevEl: ".prev-btn",
              nextEl: ".next-btn",
            }}
            autoplay={{
              delay: 2000,
              disableOnInteraction: false,
            }}
            loop={profiles.length > 4}
            spaceBetween={16}
            breakpoints={{
              0: { slidesPerView: 2 }, // same feel as grid
              640: { slidesPerView: 3 },
              1024: { slidesPerView: 4 },
            }}
          >
            {profiles.map((p, i) => (
              <SwiperSlide key={i}>
                <ProfileCard profile={p} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Footer SAME */}
        <div className="text-center mt-10">
          <Link
            href="/list"
            className="btn bg-[#fd6969] text-lg px-7 text-white"
          >
            আরো দেখুন
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function ManTestomonial() {
  return (
    <>
      {/* <ProfileSection
        title="পাত্র-পাত্রীর বায়োডাটা"
        profiles={[...maleProfiles, ...femaleProfiles]}
      /> */}

      <ProfileSection title="পাত্রের বায়োডাটা" profiles={maleProfiles} />

      {/* <ProfileSection title="পাত্রীর বায়োডাটা" profiles={femaleProfiles} /> */}
    </>
  );
}
