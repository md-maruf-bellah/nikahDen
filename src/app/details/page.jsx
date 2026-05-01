"use client";

import Image from "next/image";
import photoImage from "./../../../assets/member/alem.png";
import { Check } from "lucide-react";
import Link from "next/link";

const similarProfiles = Array(4).fill({
  name: "মোহাম্মদ আহমদ",
  info: "ঢাকা • ২৮ বছর",
  img: photoImage,
});

const data = ["শিক্ষাগত যোগ্যতা", "পেশা", "ইনকাম", "ঠিকানা"];

export default function BiodataDetails() {
  return (
    <div className="bg-base-200 min-h-screen">
      {/* Header */}
      <div className="bg-[#f25f5c] text-white text-center py-10">
        <h1 className="text-lg font-semibold">বায়োডাটা</h1>
        <p className="text-xs mt-1">পাত্র-পাত্রী বিস্তারিত তথ্য</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-32">
        {/* Top Info */}
        <div className="flex flex-col lg:flex-row gap-4 items-center mb-6">
          <Image
            src={photoImage}
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
            <p className="text-sm text-gray-600">ঢাকা • ২৮ বছর • ইঞ্জিনিয়ার</p>
          </div>
        </div>

        {/* About */}
        <div>
          <h1 className="text-xl lg:text-2xl font-bold mb-2">
            নিজের সম্পর্কে কিছু কথা
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
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
              ["বয়স", "২৮ বছর"],
              ["উচ্চতা", "৫'৮\""],
              ["ওজন", "৬৫ কেজি"],
              ["বৈবাহিক অবস্থা", "অবিবাহিত"],
            ],
          },
          {
            title: "শিক্ষাগত যোগ্যতা",
            data: [
              ["ডিগ্রি", "BSc in Engineering"],
              ["প্রতিষ্ঠান", "ঢাকা বিশ্ববিদ্যালয়"],
              ["বিভাগ", "CSE"],
              ["ডিগ্রি", "BSc in Engineering"],
              ["প্রতিষ্ঠান", "ঢাকা বিশ্ববিদ্যালয়"],
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
              ["পেশা", "ইঞ্জিনিয়ার"],
              ["কর্মস্থল", "ABC Ltd"],
              ["মাসিক আয়", "৫০,০০০ টাকা"],
              ["পেশা", "ইঞ্জিনিয়ার"],
              ["কর্মস্থল", "ABC Ltd"],
              ["মাসিক আয়", "৫০,০০০ টাকা"],
            ],
          },
        ].map((section, i) => (
          <div key={i} className="mb-6 mt-6">
            {/* Title */}
            <h2 className="text-lg lg:text-xl font-bold text-gray-700 relative pb-1">
              {section.title}
              <span className="absolute left-0 bottom-0 w-10 h-[2px] bg-red-500"></span>
            </h2>

            {/* Data */}
            <div className="mt-3 space-y-1 text-sm">
              {section.data.map((row, idx) => (
                <div key={idx} className="flex flex-col lg:flex-row lg:gap-2">
                  <span className="lg:w-60 font-semibold">{row[0]} :</span>
                  <span>{row[1]}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Similar */}
        <div className="mt-10">
          <h3 className="text-center text-sm font-semibold mb-4">
            অনুরূপ বায়োডাটা সমূহ
          </h3>

          <div className="flex items-center gap-2">
            <button className="btn btn-xs">❮</button>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 flex-1">
              {similarProfiles.map((item, i) => (
                <div
                  key={i}
                  className="bg-white border rounded p-2 text-center"
                >
                  <Image
                    src={item.img}
                    width={140}
                    height={140}
                    alt="profile"
                    className="mx-auto rounded"
                  />

                  <p className="text-xs mt-1">{item.name}</p>
                  <p className="text-[10px] text-gray-500">{item.info}</p>

                  <Link href={"/profile"} className="btn btn-xs mt-1">
                    বিস্তারিত
                  </Link>
                </div>
              ))}
            </div>

            <button className="btn btn-xs">❯</button>
          </div>
        </div>
      </div>
    </div>
  );
}
