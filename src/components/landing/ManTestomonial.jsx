"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { FcLikePlaceholder, FcLike } from "react-icons/fc";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import muslimBoy from "./../../../assets/member/new/muslimBoy.png";
import muslimGirl from "./../../../assets/member/new/muslimGirl.png";
import hinduBoy from "./../../../assets/member/new/hinduBoy.png";
import hinduGirl from "./../../../assets/member/new/hinduGirl.png";
import christianBoy from "./../../../assets/member/new/christianBoy.png";
import christianGirl from "./../../../assets/member/new/christianGirl.png";
import buddhistBoy from "./../../../assets/member/new/buddhistBoy.png";
import buddhistGirl from "./../../../assets/member/new/buddhistGirl.png";

import "swiper/css";
import "swiper/css/navigation";

// Dummy data

export const maleProfiles = [
  // Muslim
  {
    name: "আবদুল করিম",
    religion: "ইসলাম",
    age: 28,
    location: "ঢাকা",
    profession: "সফটওয়্যার ইঞ্জিনিয়ার",
    height: `৫'৮"`,
    color: "উজ্জ্বল ফর্সা",
    img: muslimBoy,
  },
  {
    name: "মোহাম্মদ রাফি",
    religion: "ইসলাম",
    age: 30,
    location: "চট্টগ্রাম",
    profession: "ডাক্তার",
    height: `৫'১০"`,
    color: "উজ্জ্বল শ্যামলা",
    img: muslimBoy,
  },
  {
    name: "আরিফুল ইসলাম",
    religion: "ইসলাম",
    age: 26,
    location: "খুলনা",
    profession: "ব্যবসায়ী",
    height: `৫'৯"`,
    color: "শ্যামলা",
    img: muslimBoy,
  },

  // Hindu
  {
    name: "অরিন্দম চক্রবর্তী",
    religion: "হিন্দু",
    age: 29,
    location: "রাজশাহী",
    profession: "ব্যাংকার",
    height: `৫'৮"`,
    color: "ফর্সা",
    img: hinduBoy,
  },
  {
    name: "সৌরভ দাস",
    religion: "হিন্দু",
    age: 27,
    location: "যশোর",
    profession: "শিক্ষক",
    height: `৫'৭"`,
    color: "উজ্জ্বল শ্যামলা",
    img: hinduBoy,
  },
  {
    name: "রাহুল রায়",
    religion: "হিন্দু",
    age: 31,
    location: "বরিশাল",
    profession: "চার্টার্ড অ্যাকাউন্ট্যান্ট",
    height: `৫'৯"`,
    color: "ফর্সা",
    img: hinduBoy,
  },

  // Christian
  {
    name: "জন পিটার",
    religion: "খ্রিস্টান",
    age: 28,
    location: "ঢাকা",
    profession: "আইটি অফিসার",
    height: `৫'৯"`,
    color: "উজ্জ্বল ফর্সা",
    img: christianBoy,
  },
  {
    name: "মাইকেল গোমেজ",
    religion: "খ্রিস্টান",
    age: 32,
    location: "খুলনা",
    profession: "ব্যবসায়ী",
    height: `৫'১০"`,
    color: "শ্যামলা",
    img: christianBoy,
  },
  {
    name: "ডেভিড কস্তা",
    religion: "খ্রিস্টান",
    age: 27,
    location: "চট্টগ্রাম",
    profession: "গ্রাফিক ডিজাইনার",
    height: `৫'৮"`,
    color: "ফর্সা",
    img: christianBoy,
  },

  // Buddhist
  {
    name: "সঞ্জয় বড়ুয়া",
    religion: "বৌদ্ধ",
    age: 29,
    location: "কক্সবাজার",
    profession: "সরকারি চাকরি",
    height: `৫'৮"`,
    color: "উজ্জ্বল শ্যামলা",
    img: buddhistBoy,
  },
  {
    name: "অমিত বড়ুয়া",
    religion: "বৌদ্ধ",
    age: 26,
    location: "রাঙ্গামাটি",
    profession: "ইঞ্জিনিয়ার",
    height: `৫'৭"`,
    color: "ফর্সা",
    img: buddhistBoy,
  },
  {
    name: "সুমন চাকমা",
    religion: "বৌদ্ধ",
    age: 30,
    location: "বান্দরবান",
    profession: "ব্যবসায়ী",
    height: `৫'৯"`,
    color: "শ্যামলা",
    img: buddhistBoy,
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
