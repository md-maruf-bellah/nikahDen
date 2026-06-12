"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { FcLikePlaceholder, FcLike } from "react-icons/fc";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import ManTestomonial from "./ManTestomonial";

import boy from "./../../../assets/member/new/boy.png";
import girl from "./../../../assets/member/new/girl.png";
import hinduBoy from "./../../../assets/member/new/hinduBoy.png";
import hinduGirl from "./../../../assets/member/new/hinduGirl.png";
import christianBoy from "./../../../assets/member/new/christianBoy.png";
import christianGirl from "./../../../assets/member/new/christianGirl.png";
import buddhistBoy from "./../../../assets/member/new/buddhistBoy.png";
import buddhistGirl from "./../../../assets/member/new/buddhistGirl.png";

// ======================
// Male Profiles
// ======================

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
    img: boy,
  },
  {
    name: "মোহাম্মদ রাফি",
    religion: "ইসলাম",
    age: 30,
    location: "চট্টগ্রাম",
    profession: "ডাক্তার",
    height: `৫'১০"`,
    color: "উজ্জ্বল শ্যামলা",
    img: boy,
  },
  {
    name: "আরিফুল ইসলাম",
    religion: "ইসলাম",
    age: 26,
    location: "খুলনা",
    profession: "ব্যবসায়ী",
    height: `৫'৯"`,
    color: "শ্যামলা",
    img: boy,
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
    img: boy,
  },
  {
    name: "সৌরভ দাস",
    religion: "হিন্দু",
    age: 27,
    location: "যশোর",
    profession: "শিক্ষক",
    height: `৫'৭"`,
    color: "উজ্জ্বল শ্যামলা",
    img: boy,
  },
  {
    name: "রাহুল রায়",
    religion: "হিন্দু",
    age: 31,
    location: "বরিশাল",
    profession: "চার্টার্ড অ্যাকাউন্ট্যান্ট",
    height: `৫'৯"`,
    color: "ফর্সা",
    img: boy,
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
    img: boy,
  },
  {
    name: "মাইকেল গোমেজ",
    religion: "খ্রিস্টান",
    age: 32,
    location: "খুলনা",
    profession: "ব্যবসায়ী",
    height: `৫'১০"`,
    color: "শ্যামলা",
    img: boy,
  },
  {
    name: "ডেভিড কস্তা",
    religion: "খ্রিস্টান",
    age: 27,
    location: "চট্টগ্রাম",
    profession: "গ্রাফিক ডিজাইনার",
    height: `৫'৮"`,
    color: "ফর্সা",
    img: boy,
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
    img: boy,
  },
  {
    name: "অমিত বড়ুয়া",
    religion: "বৌদ্ধ",
    age: 26,
    location: "রাঙ্গামাটি",
    profession: "ইঞ্জিনিয়ার",
    height: `৫'৭"`,
    color: "ফর্সা",
    img: boy,
  },
  {
    name: "সুমন চাকমা",
    religion: "বৌদ্ধ",
    age: 30,
    location: "বান্দরবান",
    profession: "ব্যবসায়ী",
    height: `৫'৯"`,
    color: "শ্যামলা",
    img: boy,
  },
];

// ======================
// Female Profiles
// ======================

export const femaleProfiles = [
  // Muslim
  {
    name: "আফরিন খানম",
    religion: "ইসলাম",
    age: 24,
    location: "ঢাকা",
    profession: "শিক্ষার্থী",
    height: `৫'৪"`,
    color: "উজ্জ্বল ফর্সা",
    img: girl,
  },
  {
    name: "সাবরিনা ইসলাম",
    religion: "ইসলাম",
    age: 26,
    location: "চট্টগ্রাম",
    profession: "ডাক্তার",
    height: `৫'৩"`,
    color: "উজ্জ্বল শ্যামলা",
    img: girl,
  },
  {
    name: "নাফিসা রহমান",
    religion: "ইসলাম",
    age: 23,
    location: "সিলেট",
    profession: "শিক্ষক",
    height: `৫'৫"`,
    color: "ফর্সা",
    img: girl,
  },

  // Hindu
  {
    name: "প্রিয়া রায়",
    religion: "হিন্দু",
    age: 25,
    location: "খুলনা",
    profession: "ব্যাংকার",
    height: `৫'৩"`,
    color: "ফর্সা",
    img: girl,
  },
  {
    name: "স্নেহা দাস",
    religion: "হিন্দু",
    age: 27,
    location: "রাজশাহী",
    profession: "শিক্ষিকা",
    height: `৫'৪"`,
    color: "উজ্জ্বল শ্যামলা",
    img: girl,
  },
  {
    name: "অনন্যা চক্রবর্তী",
    religion: "হিন্দু",
    age: 24,
    location: "বরিশাল",
    profession: "সফটওয়্যার ইঞ্জিনিয়ার",
    height: `৫'৫"`,
    color: "ফর্সা",
    img: girl,
  },

  // Christian
  {
    name: "মারিয়া গোমেজ",
    religion: "খ্রিস্টান",
    age: 26,
    location: "ঢাকা",
    profession: "নার্স",
    height: `৫'৪"`,
    color: "উজ্জ্বল ফর্সা",
    img: girl,
  },
  {
    name: "ক্রিস্টিনা কস্তা",
    religion: "খ্রিস্টান",
    age: 28,
    location: "চট্টগ্রাম",
    profession: "শিক্ষিকা",
    height: `৫'৫"`,
    color: "শ্যামলা",
    img: girl,
  },
  {
    name: "অ্যাঞ্জেলা রোজারিও",
    religion: "খ্রিস্টান",
    age: 25,
    location: "খুলনা",
    profession: "গ্রাফিক ডিজাইনার",
    height: `৫'৩"`,
    color: "ফর্সা",
    img: girl,
  },

  // Buddhist
  {
    name: "সুচিত্রা বড়ুয়া",
    religion: "বৌদ্ধ",
    age: 24,
    location: "কক্সবাজার",
    profession: "শিক্ষার্থী",
    height: `৫'৪"`,
    color: "উজ্জ্বল শ্যামলা",
    img: girl,
  },
  {
    name: "মিতা চাকমা",
    religion: "বৌদ্ধ",
    age: 27,
    location: "রাঙ্গামাটি",
    profession: "ডাক্তার",
    height: `৫'৩"`,
    color: "ফর্সা",
    img: girl,
  },
  {
    name: "রুমা মারমা",
    religion: "বৌদ্ধ",
    age: 25,
    location: "বান্দরবান",
    profession: "শিক্ষিকা",
    height: `৫'৫"`,
    color: "শ্যামলা",
    img: girl,
  },
];

function ProfileCard({ profile }) {
  const [like, setLike] = useState(false);

  const religionBadge = {
    ইসলাম: "bg-emerald-600",
    হিন্দু: "bg-orange-600",
    খ্রিস্টান: "bg-sky-600",
    বৌদ্ধ: "bg-amber-500",
  };

  return (
    <div className="card  relative border border-primary/30 bg-base-100 shadow hover:shadow-lg transition-all">
      {/* Like Button (same as before) */}
      <div className="absolute left-2 top-2 z-10 cursor-pointer">
        {religionBadge[profile.religion] && (
          <span
            className={`badge badge-sm text-white ${religionBadge[profile.religion]}`}
          >
            {profile.religion}
          </span>
        )}
      </div>
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
        width={"100%"}
        height={350}
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
    <section className="py-32">
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

export default function ProfileSections() {
  return (
    <>
      <ProfileSection
        title="পাত্র-পাত্রীর বায়োডাটা"
        profiles={[...maleProfiles, ...femaleProfiles]}
      />

      {/* <ProfileSection title="পাত্রের বায়োডাটা" profiles={maleProfiles} /> */}
      <ManTestomonial />

      <ProfileSection title="পাত্রীর বায়োডাটা" profiles={femaleProfiles} />
    </>
  );
}
