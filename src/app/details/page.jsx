"use client";

import Image from "next/image";
import photoImage from "./../../../assets/member/alem.png";

const similarProfiles = Array(5).fill({
  name: "মোহাম্মদ আহমদ",
  info: "ঢাকা • ২৮ বছর",
  img: photoImage,
});

export default function BiodataDetails() {
  return (
    <div className="max-w-7xl bg-[#f5f5f5] min-h-screen">
      {/* Header */}
      <div className="bg-[#f25f5c] text-white text-center py-10">
        <h1 className="text-lg font-semibold">বায়োডাটা</h1>
        <p className="text-xs mt-1">পাত্র-পাত্রী বিস্তারিত তথ্য</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Top Info */}
        <div className="flex gap-4 items-center mb-6">
          <Image
            src={photoImage}
            width={180}
            height={180}
            alt="profile"
            className="rounded"
          />

          <div>
            <h2 className="font-semibold text-3xl mb-3 ">মোহাম্মদ আহমদ</h2>
            <p className="text-md  mb-2">সফটওয়্যার ইঞ্জিনিয়ার</p>

            <p className="text-md ">ঢাকা • ২৮ বছর • ইঞ্জিনিয়ার</p>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold">নিজের সম্পর্কে কিছু কথা</h1>
          <p>
            হাদীস থেকে বর্ণিত, যিনি বিয়ে করলেন, তিনি তার অর্ধেক দ্বীন পূর্ণ
            করলেন এবং বাকী অর্ধেকের জন্য তিনি যেন আল্লাহকে ভয় করেন। আপনার অর্ধেক
            দ্বীন পূর্ণ করতে মুসলিম পাত্র-পাত্রী খুঁজুন এখন খুবই সহজে। হাদীস
            থেকে বর্ণিত, যিনি বিয়ে করলেন, তিনি তার অর্ধেক দ্বীন পূর্ণ করলেন এবং
            বাকী অর্ধেকের জন্য তিনি যেন আল্লাহকে ভয় করেন। আপনার অর্ধেক দ্বীন
            পূর্ণ করতে মুসলিম পাত্র-পাত্রী খুঁজুন এখন খুবই সহজে।{" "}
          </p>
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
              ["নাম", "মোহাম্মদ আহমদ"],
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
          <div key={i} className="mb-6">
            {/* Section Title */}

            <h2 className="text-xl font-bold text-gray-700 py-2 my-6 relative">
              {section.title}
              <span className="absolute left-0 -bottom-[2px] w-12 h-[3px] bg-red-500"></span>
            </h2>

            {/* Data */}
            <div className="space-y-1 text-sm">
              {section.data.map((row, idx) => (
                <div key={idx} className="flex text-lg">
                  <span className="w-30 lg:w-70 font-semibold  ">
                    {row[0]} :{" "}
                  </span>
                  <span className="">{row[1]}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Similar Section */}
        <div className="mt-10">
          <h3 className="text-center text-sm font-semibold mb-4">
            অনুরূপ বায়োডাটা সমূহ
          </h3>

          <div className="flex items-center gap-3">
            {/* Left Arrow */}
            <button className="btn btn-xs">❮</button>

            {/* Profiles */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 flex-1">
              {similarProfiles.map((item, i) => (
                <div
                  key={i}
                  className="bg-white border rounded p-2 text-center"
                >
                  <Image
                    src={item.img}
                    width={160}
                    height={160}
                    alt="profile"
                    className="mx-auto rounded"
                  />

                  <p className="text-xs mt-1">{item.name}</p>
                  <p className="text-[10px] text-gray-500">{item.info}</p>

                  <button className="btn btn-xs mt-1">বিস্তারিত</button>
                </div>
              ))}
            </div>

            {/* Right Arrow */}
            <button className="btn btn-xs">❯</button>
          </div>
        </div>
      </div>
    </div>
  );
}
