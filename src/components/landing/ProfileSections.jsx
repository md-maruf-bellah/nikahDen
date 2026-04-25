"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Dummy profile data
const femaleProfiles = [
  {
    name: "আফরিন খানম",
    age: 24,
    location: "ঢাকা",
    profession: "শিক্ষার্থী",
    height: "৫'৪\"",
    color: "#f8c8b4",
  },
  {
    name: "সাবরিনা ইসলাম",
    age: 26,
    location: "চট্টগ্রাম",
    profession: "ডাক্তার",
    height: "৫'৩\"",
    color: "#d4a8c7",
  },
  {
    name: "নাফিসা রহমান",
    age: 23,
    location: "সিলেট",
    profession: "শিক্ষক",
    height: "৫'5\"",
    color: "#a8c4d4",
  },
  {
    name: "তাহমিনা বেগম",
    age: 27,
    location: "রাজশাহী",
    profession: "ইঞ্জিনিয়ার",
    height: "৫'৪\"",
    color: "#c4d4a8",
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
  },
  {
    name: "মোহাম্মদ রাফি",
    age: 30,
    location: "চট্টগ্রাম",
    profession: "ডাক্তার",
    height: "৫'১০\"",
    color: "#a8d4c4",
  },
  {
    name: "আরিফুল ইসলাম",
    age: 26,
    location: "খুলনা",
    profession: "ব্যবসায়ী",
    height: "৫'৯\"",
    color: "#d4c4a8",
  },
  {
    name: "শাহরিয়ার হোসেন",
    age: 29,
    location: "রংপুর",
    profession: "শিক্ষক",
    height: "৫'৭\"",
    color: "#c4a8d4",
  },
];

function AvatarSVG({ color, isFemale }) {
  return (
    <svg viewBox="0 0 120 140" className="w-full h-full">
      <rect width="120" height="140" rx="8" fill={color} />
      {isFemale ? (
        <>
          <circle cx="60" cy="48" r="22" fill="#f5c6a0" />
          <ellipse cx="60" cy="36" rx="26" ry="22" fill="#e05a5a" />
          <ellipse cx="60" cy="56" rx="28" ry="14" fill="#e05a5a" />
          <rect x="28" y="68" width="64" height="72" rx="10" fill="#e8a0a0" />
        </>
      ) : (
        <>
          <circle cx="60" cy="48" r="22" fill="#f5c6a0" />
          <rect x="30" y="70" width="60" height="70" rx="10" fill="#4a4a8a" />
          <rect x="28" y="76" width="18" height="50" rx="6" fill="#3a3a7a" />
          <rect x="74" y="76" width="18" height="50" rx="6" fill="#3a3a7a" />
        </>
      )}
    </svg>
  );
}

function ProfileCard({ profile, isFemale }) {
  return (
    <div className="card bg-base-100 shadow hover:shadow-lg transition-all">
      <figure className="h-48 bg-base-200">
        <AvatarSVG color={profile.color} isFemale={isFemale} />
      </figure>

      <div className="card-body items-center text-center p-4">
        <h2 className="font-bold text-sm">{profile.name}</h2>

        <p className="text-xs opacity-70">
          বয়স: {profile.age} | {profile.location}
        </p>

        <p className="text-xs opacity-70">
          {profile.profession} | উচ্চতা: {profile.height}
        </p>

        <button className="btn btn-primary btn-sm mt-3 w-full">
          বায়োডাটা দেখুন
        </button>
      </div>
    </div>
  );
}

function ProfileSection({ title, profiles, isFemale }) {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="divider"></div>
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>

        {/* Carousel-like Grid */}
        <div className="relative">
          {/* Left Button */}
          <button className="btn btn-circle btn-sm absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex">
            <ChevronLeft size={18} />
          </button>

          {/* Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {profiles.map((p, i) => (
              <ProfileCard key={i} profile={p} isFemale={isFemale} />
            ))}
          </div>

          {/* Right Button */}
          <button className="btn btn-circle btn-sm absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Footer Button */}
        <div className="text-center mt-6">
          <button className="btn btn-outline">আরো দেখুন</button>
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

      <div className="bg-base-200">
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
