"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import man from "./../../../assets/member/alem.png";
import womane from "./../../../assets/member/alema.png";

import Image from "next/image";

// Dummy profile data
const femaleProfiles = [
  {
    name: "আফরিন খানম",
    age: 24,
    location: "ঢাকা",
    profession: "শিক্ষার্থী",
    height: "৫'৪\"",
    color: "#f8c8b4",
    img: womane,
  },
  {
    name: "সাবরিনা ইসলাম",
    age: 26,
    location: "চট্টগ্রাম",
    profession: "ডাক্তার",
    height: "৫'৩\"",
    color: "#d4a8c7",
    img: womane,
  },
  {
    name: "নাফিসা রহমান",
    age: 23,
    location: "সিলেট",
    profession: "শিক্ষক",
    height: "৫'5\"",
    color: "#a8c4d4",
    img: womane,
  },
  {
    name: "তাহমিনা বেগম",
    age: 27,
    location: "রাজশাহী",
    profession: "ইঞ্জিনিয়ার",
    height: "৫'৪\"",
    color: "#c4d4a8",
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
    color: "#b4c8f8",
    img: man,
  },
  {
    name: "মোহাম্মদ রাফি",
    age: 30,
    location: "চট্টগ্রাম",
    profession: "ডাক্তার",
    height: "৫'১০\"",
    color: "#a8d4c4",
    img: man,
  },
  {
    name: "আরিফুল ইসলাম",
    age: 26,
    location: "খুলনা",
    profession: "ব্যবসায়ী",
    height: "৫'৯\"",
    color: "#d4c4a8",
    img: man,
  },
  {
    name: "শাহরিয়ার হোসেন",
    age: 29,
    location: "রংপুর",
    profession: "শিক্ষক",
    height: "৫'৭\"",
    color: "#c4a8d4",
    img: man,
  },
];

function ProfileCard({ profile, isFemale }) {
  return (
    <div className="card bg-base-100 shadow hover:shadow-lg transition-all">
      <Image src={profile.img} alt={profile.name} className="w-full " />

      <div className="card-body items-center text-center p-4">
        <h2 className="font-bold text-lg">{profile.name}</h2>
        {/* 
        <p className="text-xs opacity-70">
          বয়স: {profile.age} | {profile.location}
        </p>

        <p className="text-xs opacity-70">
          {profile.profession} | উচ্চতা: {profile.height}
        </p> */}
        <p className="text-sm md:text-md">
          খুব সহজেই বিনামূল্যে দ্বীনি বিয়ে বায়োডাটা তৈরি করতে পারবেন।
        </p>

        <button className="btn btn-outline text-xs md:text-lg w-5/6 p-4">
          বায়োডাটা দেখুন
        </button>
      </div>
    </div>
  );
}

function ProfileSection({ title, profiles, isFemale }) {
  return (
    <section className="py-32">
      <div className="max-w-7xl mx-auto px-4 lg:px-22">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold py-5">{title}</h2>
        </div>

        {/* Carousel-like Grid */}
        <div className="relative">
          {/* Left Button */}
          <button className="btn btn-square btn-md absolute bg-gray-700 text-white left-[-45] top-1/3 -translate-y-1/2 z-10 hidden md:flex">
            <ChevronLeft size={18} />
          </button>

          {/* Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {profiles.map((p, i) => (
              <ProfileCard key={i} profile={p} isFemale={isFemale} />
            ))}
          </div>

          {/* Right Button */}
          <button className="btn btn-square btn-md absolute  bg-gray-700 text-white right-0 lg:right-[-45] top-1/3 -translate-y-1/2 z-10 hidden md:flex">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Footer Button */}
        <div className="text-center mt-10">
          <button className="btn btn-outline text-xl">আরো দেখুন</button>
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
