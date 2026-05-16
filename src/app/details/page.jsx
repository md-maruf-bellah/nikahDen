"use client";

import Image from "next/image";
import man from "./../../../assets/member/alem1.png";
import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { FcLikePlaceholder } from "react-icons/fc";
import { FcLike } from "react-icons/fc";
import SimilarBiodataSlider from "./SimilarBiodataSlider";

const data = ["শিক্ষাগত যোগ্যতা", "পেশা", "ইনকাম", "ঠিকানা"];

const maleProfiles = [
  {
    name: "আবদুল করিম",
    age: 28,
    location: "ঢাকা",
    profession: "ইঞ্জিনিয়ার",
    height: "৫'৮\"",
    color: "উজ্জ্বল শ্যামলা",
    img: man,
  },
  {
    name: "মোহাম্মদ রাফি",
    age: 30,
    location: "চট্টগ্রাম",
    profession: "ডাক্তার",
    height: "৫'১০\"",
    color: "ফর্সা",
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
  {
    name: "আবদুল করিম",
    age: 28,
    location: "ঢাকা",
    profession: "ইঞ্জিনিয়ার",
    height: "৫'৮\"",
    color: "উজ্জ্বল শ্যামলা",
    img: man,
  },
  {
    name: "মোহাম্মদ রাফি",
    age: 30,
    location: "চট্টগ্রাম",
    profession: "ডাক্তার",
    height: "৫'১০\"",
    color: "ফর্সা",
    img: man,
  },
  {
    name: "আরিফুল ইসলাম",
    age: 26,
    location: "খুলনা",
    profession: "ব্যবসায়ী",
    height: "৫'৯\"",
    color: "উজ্জ্বল শ্যামলা",
    img: man,
  },
  {
    name: "শাহরিয়ার হোসেন",
    age: 29,
    location: "রংপুর",
    profession: "শিক্ষক",
    height: "৫'৭\"",
    color: "ফর্সা",
    img: man,
  },
  {
    name: "শাহরিয়ার হোসেন",
    age: 29,
    location: "রংপুর",
    profession: "শিক্ষক",
    height: "৫'৭\"",
    color: "শ্যামলা",
    img: man,
  },
];

export default function BiodataDetails() {
  const [like, setLike] = useState(false);

  const handleLike = () => {
    setLike((prev) => !prev);
  };
  return (
    <div className="bg-base-200 min-h-screen">
      {/* Header */}
      <div className="bg-[#f25f5c] text-white text-center py-10">
        <h1 className="text-lg font-semibold">বায়োডাটা</h1>
        <p className="text-xs mt-1">পাত্র-পাত্রী বিস্তারিত তথ্য</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 px-10">
        {/* Top Info */}
        <div className="flex flex-col lg:flex-row gap-4 items-center mb-6">
          <Image
            src={man}
            width={180}
            height={180}
            alt="profile"
            className="rounded"
          />

          <div className="text-center lg:text-left">
            <h2 className="font-semibold text-2xl lg:text-3xl mb-2">
              মোহাম্মদ আহমদ
            </h2>
            <p className="text-md mb-1">সফটওয়্যার ইঞ্জিনিয়ার</p>
            <p className="text-sm hidden lg:block">
              ঢাকা • ২৮ বছর • ইঞ্জিনিয়ার
            </p>
          </div>
        </div>

        {/* About */}
        <div>
          <h1 className="text-xl lg:text-2xl font-bold mb-2">
            নিজের সম্পর্কে কিছু কথা
          </h1>
          <p className="text-sm  leading-relaxed">
            হাদীস থেকে বর্ণিত, যিনি বিয়ে করলেন, তিনি তার অর্ধেক দ্বীন পূর্ণ
            করলেন এবং বাকী অর্ধেকের জন্য তিনি যেন আল্লাহকে ভয় করেন। আপনার অর্ধেক
            দ্বীন পূর্ণ করতে মুসলিম পাত্র-পাত্রী খুঁজুন এখন খুবই সহজে। হাদীস
            থেকে বর্ণিত, যিনি বিয়ে করলেন, তিনি তার অর্ধেক দ্বীন পূর্ণ করলেন এবং
            বাকী অর্ধেকের জন্য তিনি যেন আল্লাহকে ভয় করেন। আপনার অর্ধেক দ্বীন
            পূর্ণ করতে মুসলিম পাত্র-পাত্রী খুঁজুন এখন খুবই সহজে। হাদীস থেকে
            বর্ণিত, যিনি বিয়ে করলেন, তিনি তার অর্ধেক দ্বীন পূর্ণ করলেন এবং বাকী
            অর্ধেকের জন্য তিনি যেন আল্লাহকে ভয় করেন। আপনার অর্ধেক দ্বীন পূর্ণ
            করতে মুসলিম পাত্র-পাত্রী খুঁজুন এখন খুবই সহজে।
          </p>
        </div>

        {/* Match */}
        <div className="mt-6">
          <p className="text-lg font-bold mb-3">আপনার কিছু মিল</p>

          <div className="flex flex-wrap gap-4 lg:gap-20 items-center">
            {data.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Check className="text-error w-4 h-4" />
                <span className="text-md">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="divider my-10"></div>

        {/* Sections */}
        {[
          {
            title: "ব্যক্তিগত তথ্য",
            data: [
              ["নাম", "মোহাম্মদ আহমদ"],
              ["বয়স", "২৮ বছর"],
              ["উচ্চতা", "৫'৮\""],
              ["ওজন", "৬৫ কেজি"],
              ["বৈবাহিক অবস্থা", "অবিবাহিত"],
              ["ধর্ম", "ইসলাম"],
              ["জাতীয়তা", "বাংলাদেশী"],
              ["রক্তের গ্রুপ", "O+"],
              ["ঠিকানা", "ঢাকা"],
              ["ইমেইল", "mohammad.ahmad@example.com"],
              ["ফোন", "01712345678"],
              ["এনআইডি নম্বর:", "123456789"],
              ["শারিরীক অবস্থা:", "স্বাস্থ্যবান"],
            ],
          },
          {
            title: "শিক্ষাগত যোগ্যতা",
            data: [
              ["ডিগ্রি", "BSc in Engineering"],
              ["প্রতিষ্ঠান", "ঢাকা বিশ্ববিদ্যালয়"],
              ["বিভাগ", "CSE"],
              ["ডিগ্রি", "BSc in Engineering"],
              ["প্রতিষ্ঠান", "ঢাকা বিশ্ববিদ্যালয়"],
              ["সিজিপিএ", "৩.৮/৪.০"],
              ["বিভাগ", "CSE"],
            ],
          },
          {
            title: "পারিবারিক তথ্য",
            data: [
              ["পিতা", "ব্যবসায়ী"],
              ["মাতা", "গৃহিণী"],
              ["ভাই-বোন", "২ জন"],
              ["পিতা", "ব্যবসায়ী"],
              ["মাতা", "গৃহিণী"],
              ["ভাই-বোন", "২ জন"],
            ],
          },
          {
            title: "পেশাগত তথ্য",
            data: [
              ["পেশা", "সফটওয়্যার ইঞ্জিনিয়ার"],
              ["কোম্পানি", "টেক কোম্পানি"],
              ["অভিজ্ঞতা", "৫ বছর"],
              ["বেতন", "৮০,০০০ টাকা/মাস"],
              ["পেশা", "সফটওয়্যার ইঞ্জিনিয়ার"],
              ["কোম্পানি", "টেক কোম্পানি"],
              ["অভিজ্ঞতা", "৫ বছর"],
              ["বেতন", "৮০,০০০ টাকা/মাস"],
            ],
          },
          {
            title: "অতিরিক্ত তথ্য",
            data: [
              ["শখ", "ভ্রমণ, রান্না, বই পড়া"],
              ["ভাষা", "বাংলা, ইংরেজি"],
              ["ব্যক্তিত্ব", "বন্ধুত্বপূর্ণ, দায়িত্বশীল"],
              ["শখ", "ভ্রমণ, রান্না, বই পড়া"],
              ["ভাষা", "বাংলা, ইংরেজি"],
              ["ব্যক্তিত্ব", "বন্ধুত্বপূর্ণ, দায়িত্বশীল"],
            ],
          },
          {
            title: "যোগাযোগের তথ্য",
            data: [
              ["ইমেইল", "mohammad.ahmad@example.com"],
              ["ফোন", "01712345678"],
              ["ঠিকানা", "ঢাকা"],
              ["পিতার মোবাইল নম্বর:", "01712345678"],
              ["স্থায়ী ঠিকানা:", "ঢাকা"],
              ["বর্তমান ঠিকানা:", "ঢাকা"],
            ],
          },
        ].map((section, i) => (
          <div key={i} className="mb-6 mt-6 ">
            <div>
              <h2 className="text-lg lg:text-xl font-bold lg:block relative pb-1">
                {section.title}
                <span className="absolute left-0 bottom-0 w-10 h-[2px] bg-red-500"></span>
              </h2>

              {/* Data */}
              <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3 text-sm">
                {section.data.map((row, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:gap-2">
                    <span className="font-semibold sm:min-w-[180px]">
                      {row[0]} :
                    </span>
                    <span className="">{row[1]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div className="divider my-10"></div>

        {/* Similar */}
        <div className="mt-10">
          <SimilarBiodataSlider profiles={maleProfiles} />
        </div>
      </div>
    </div>
  );
}
