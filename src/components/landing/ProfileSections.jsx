"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import man from "./../../../assets/member/alem1.png";
import womane from "./../../../assets/member/alema1.png";
import { FcLikePlaceholder } from "react-icons/fc";
import { FcLike } from "react-icons/fc";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// Dummy profile data
const femaleProfiles = [
  {
    name: "আফরিন খানম",
    age: 24,
    location: "ঢাকা",
    profession: "শিক্ষার্থী",
    height: "৫'৪\"",
    color: "উজ্জ্বল ফর্সা",
    img: womane,
  },
  {
    name: "সাবরিনা ইসলাম",
    age: 26,
    location: "চট্টগ্রাম",
    profession: "ডাক্তার",
    height: "৫'৩\"",
    color: "উজ্জ্বল শ্যামলা",
    img: womane,
  },
  {
    name: "নাফিসা রহমান",
    age: 23,
    location: "সিলেট",
    profession: "শিক্ষক",
    height: "৫'5\"",
    color: "ফর্সা",
    img: womane,
  },
  {
    name: "তাহমিনা বেগম",
    age: 27,
    location: "রাজশাহী",
    profession: "ইঞ্জিনিয়ার",
    height: "৫'৪\"",
    color: "শ্যামলা",
    img: womane,
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
    img: man,
  },
  {
    name: "মোহাম্মদ রাফি",
    age: 30,
    location: "চট্টগ্রাম",
    profession: "ডাক্তার",
    height: "৫'১০\"",
    color: "উজ্জ্বল শ্যামলা",
    img: man,
  },
  {
    name: "আরিফুল ইসলাম",
    age: 26,
    location: "খুলনা",
    profession: "ব্যবসায়ী",
    height: "৫'৯\"",
    color: "উজ্জ্বল ফর্সা",
    img: man,
  },
  {
    name: "শাহরিয়ার হোসেন",
    age: 29,
    location: "রংপুর",
    profession: "শিক্ষক",
    height: "৫'৭\"",
    color: "উজ্জ্বল শ্যামলা",
    img: man,
  },
];

function ProfileCard({ profile, isFemale }) {
  const [like, setLike] = useState(false);

  const handleLike = () => {
    setLike((prev) => !prev);
  };

  return (
    <div className="card relative border border-primary/30 bg-base-100 shadow hover:shadow-lg transition-all">
      <div className="absolute right-2 top-2 z-5">
        {like ? (
          <FcLike size={24} className="cursor-pointer" onClick={handleLike} />
        ) : (
          <FcLikePlaceholder
            size={24}
            className="cursor-pointer"
            onClick={handleLike}
          />
        )}
      </div>
      <Image src={profile.img} alt={profile.name} className="w-full border " />

      <div className="card-body items-center text-center p-4">
        {/* <h2 className="font-bold text-lg">{profile.name}</h2> */}
        <div className="text-line-through ">
          <div className="flex  justify-around items-center gap-3">
            <p>বয়স - {profile.age}</p>
            <p>লোকেশান - {profile.location} </p>
          </div>
          <div className="flex  justify-around items-center gap-3">
            <p>উচ্চতা - {profile.height} </p>
            <p>গাত্রবর্ণ - {profile.color}</p>
          </div>
        </div>

        <Link
          href={"/details"}
          className="btn btn-outline text-xs md:text-lg w-5/6 p-4"
        >
          বায়োডাটা দেখুন
        </Link>
      </div>
    </div>
  );
}

function ProfileSection({ title, profiles, isFemale }) {
  return (
    <section className="py-32">
      <div className="max-w-7xl mx-auto px-4 lg:px-16">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-4xl text-gray-400 font-bold py-5">{title}</h2>
        </div>

        {/* Carousel-like Grid */}
        <div className="relative">
          {/* Left Button */}
          <button className="btn btn-square btn-md absolute bg-gray-700 text-white left-[-45] top-1/2 -translate-y-1/2 z-10 hidden md:flex">
            <ChevronLeft size={18} />
          </button>

          {/* Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {profiles.map((p, i) => (
              <ProfileCard key={i} profile={p} isFemale={isFemale} />
            ))}
          </div>

          {/* Right Button */}
          <button className="btn btn-square btn-md absolute  bg-gray-700 text-white right-0 lg:right-[-45] top-1/2 -translate-y-1/2 z-10 hidden md:flex">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Footer Button */}
        <div className="text-center mt-10">
          <Link
            href={"/list"}
            className="btn bg-[#fd6969] text-lg px-7 text-white"
          >
            আরো দেখুন
          </Link>

          {/* <button className="btn bg-[#fd6969] text-lg px-7 text-white">
            পাত্র-পাত্রী খুঁজুন
          </button> */}
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
        profiles={[...maleProfiles.slice(0, 2), ...femaleProfiles.slice(0, 2)]}
        isFemale={false}
      />

      <div className="bg-[#FCF3F3]">
        <ProfileSection
          title="পাত্রের বায়োডাটা"
          profiles={maleProfiles}
          isFemale={false}
        />
      </div>

      <ProfileSection
        title="পাত্রীর বায়োডাটা"
        profiles={femaleProfiles}
        isFemale={true}
      />
    </>
  );
}
