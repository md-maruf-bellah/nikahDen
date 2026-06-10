"use client";

import Image from "next/image";
import { useState } from "react";
import man from "./../../../assets/member/alem1.png";
import Link from "next/link";
import { TfiLayoutGrid3Alt } from "react-icons/tfi";
import { MdTableRows } from "react-icons/md";
import { FcLikePlaceholder } from "react-icons/fc";
import { FcLike } from "react-icons/fc";

import muslimBoy from "./../../../assets/member/new/muslimBoy.png";
import muslimGirl from "./../../../assets/member/new/muslimGirl.png";
import hinduBoy from "./../../../assets/member/new/hinduBoy.png";
import hinduGirl from "./../../../assets/member/new/hinduGirl.png";
import christianBoy from "./../../../assets/member/new/christianBoy.png";
import christianGirl from "./../../../assets/member/new/christianGirl.png";
import buddhistBoy from "./../../../assets/member/new/buddhistBoy.png";
import buddhistGirl from "./../../../assets/member/new/buddhistGirl.png";

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

export default function BiodataGrid() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("grid"); // grid | table
  const [like, setLike] = useState(false);

  const handleLike = () => {
    setLike((prev) => !prev);
  };
  return (
    <div className="bg-base-200 min-h-screen">
      {/* Header */}
      <div className="bg-red-400 text-white text-center py-8 md:py-12">
        <h1 className="text-xl md:text-2xl font-bold">পাত্র-পাত্রী বায়োডাটা</h1>
        <p className="text-xs md:text-sm mt-2">সকল পাত্র-পাত্রী তালিকা</p>

        {/* Mobile Filter Button */}
        <button
          onClick={() => setOpen(true)}
          className="btn btn-sm btn-primary mt-3 md:hidden"
        >
          ফিল্টার
        </button>
      </div>

      <div className="max-w-7xl mx-auto flex gap-6 p-4 md:p-6">
        {/* Sidebar Desktop */}
        <div className="hidden md:block w-72 bg-base-100 p-5 shadow h-screen sticky top-0 overflow-y-auto card">
          <h2 className="font-semibold mb-4">আপনি কি খঁজতে চান?</h2>

          <div className="mb-3">
            <div className="flex gap-3 mb-2">
              <input type="checkbox" className="checkbox checkbox-sm" />
              <span>পাত্র</span>
            </div>
            <div className="flex gap-3">
              <input type="checkbox" className="checkbox checkbox-sm" />
              <span>পাত্রী</span>
            </div>
          </div>

          <select className="select select-bordered w-full mb-3">
            <option>গোত্র</option>
          </select>

          <select className="select select-bordered w-full mb-3">
            <option>বৈবাহিক অবস্থা</option>
          </select>

          <label className="text-sm font-medium  mb-1 block">বয়স</label>
          <input
            type="range"
            min={18}
            max={60}
            className="range  range-xs mb-4"
          />

          <select className="select select-bordered w-full mb-3">
            <option>উচ্চতা</option>
          </select>

          <select className="select select-bordered w-full mb-3">
            <option>গায়ের রং</option>
          </select>

          <select className="select select-bordered w-full mb-3">
            <option>জেলা শহর</option>
          </select>

          <select className="select select-bordered w-full mb-3">
            <option>শিক্ষাগত যোগ্যতা</option>
          </select>

          <select className="select select-bordered w-full mb-3">
            <option>পেশা</option>
          </select>

          <div className="flex gap-2">
            <button className="btn btn-outline btn-red-400 py-5 btn-sm flex-1">
              বায়োডাটা মুছুন{" "}
            </button>
            <button className="btn bg-[#ff6b6b] text-white py-5 btn-sm flex-1">
              বায়োডাটা খুজুন{" "}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {open && (
          <div className="fixed inset-0 bg-black/40 z-50">
            <div className="bg-white w-72 h-full p-5 overflow-y-auto">
              <button
                onClick={() => setOpen(false)}
                className="btn btn-sm btn-error mb-4"
              >
                বন্ধ
              </button>

              {/* same filters */}
              <h2 className="font-semibold mb-4">আপনি কি খঁজতে চান?</h2>

              <div className="mb-3">
                <div className="flex gap-3 mb-2">
                  <input type="checkbox" className="checkbox checkbox-sm" />
                  <span>পাত্র</span>
                </div>
                <div className="flex gap-3">
                  <input type="checkbox" className="checkbox checkbox-sm" />
                  <span>পাত্রী</span>
                </div>
              </div>

              <select className="select select-bordered w-full mb-3">
                <option>গোত্র</option>
              </select>

              <select className="select select-bordered w-full mb-3">
                <option>বৈবাহিক অবস্থা</option>
              </select>

              <label className="text-sm font-medium  mb-1 block">বয়স</label>
              <input
                type="range"
                min={18}
                max={60}
                className="range  range-xs mb-4"
              />

              <select className="select select-bordered w-full mb-3">
                <option>উচ্চতা</option>
              </select>

              <select className="select select-bordered w-full mb-3">
                <option>গায়ের রং</option>
              </select>

              <select className="select select-bordered w-full mb-3">
                <option>জেলা শহর</option>
              </select>

              <select className="select select-bordered w-full mb-3">
                <option>শিক্ষাগত যোগ্যতা</option>
              </select>

              <select className="select select-bordered w-full mb-3">
                <option>পেশা</option>
              </select>

              <div className="flex gap-2">
                <button className="btn btn-outline-red-500 btn-sm flex-1">
                  বায়োডাটা মুছুন{" "}
                </button>
                <button className="btn bg-[#ff6b6b] btn-sm flex-1">
                  বায়োডাটা খুজুন{" "}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 ">
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
            {/* View Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setView("grid")}
                className={`btn btn-sm ${
                  view === "grid" ? "btn-primary" : "btn-outline"
                } text-sm flex items-center gap-1`}
              >
                <TfiLayoutGrid3Alt size={13} />
                বক্স
              </button>

              <button
                onClick={() => setView("table")}
                className={`btn btn-sm ${
                  view === "table" ? "btn-primary" : "btn-outline"
                } text-sm  items-center gap-1 hidden lg:flex`}
              >
                <MdTableRows size={18} /> টেবিল
              </button>
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              <select className="select select-bordered select-sm">
                <option>সর্বশেষ</option>
                <option>বয়স অনুযায়ী</option>
              </select>

              <select className="select select-bordered select-sm">
                <option>Show 10</option>
                <option>Show 20</option>
              </select>
            </div>
          </div>

          {/* GRID VIEW */}
          {view === "grid" ? (
            <div className="grid grid-cols-2 cursor-pointer sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {maleProfiles.map((item, i) => (
                <div key={i} className="relative">
                  <div className="absolute right-2 top-2 z-5">
                    {like ? (
                      <FcLike
                        size={24}
                        className="cursor-pointer"
                        onClick={handleLike}
                      />
                    ) : (
                      <FcLikePlaceholder
                        size={24}
                        className="cursor-pointer"
                        onClick={handleLike}
                      />
                    )}
                  </div>
                  <div className="card border border-primary/30 bg-base-100 shadow hover:shadow-lg transition-all">
                    <Image
                      src={item.img}
                      alt={item.name}
                      className="w-full h-full border rounded-tl-xl rounded-tr-xl"
                    />

                    <div className="card-body items-center text-center p-4">
                      {/* <h2 className="font-bold text-lg">{item.name}</h2> */}

                      <div className="text-line-through ">
                        <div className="flex  justify-around items-center gap-3">
                          <p>বয়স - {item.age}</p>
                          <p>লোকেশান - {item.location} </p>
                        </div>
                        <div className="flex  justify-around items-center gap-3">
                          <p>উচ্চতা - {item.height} </p>
                          <p>গাত্রবর্ণ - {item.color}</p>
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
                </div>
              ))}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="w-full  overflow-x-auto rounded shadow-sm">
              <table className="table table-zebra  w-full">
                <thead className="">
                  <tr>
                    <th className="whitespace-nowrap">ছবি</th>
                    <th className="whitespace-nowrap">নাম</th>
                    <th className="whitespace-nowrap">বয়স</th>
                    <th className="whitespace-nowrap">লোকেশন</th>
                    <th className="whitespace-nowrap">উচ্চতা</th>
                    <th className="whitespace-nowrap">গাত্রবর্ণ</th>
                    <th className="whitespace-nowrap">অ্যাকশন</th>
                  </tr>
                </thead>

                <tbody>
                  {maleProfiles.map((item, i) => (
                    <tr
                      key={i}
                      className="hover:bg-base-300 cursor-pointer transition-colors duration-200"
                    >
                      <td>
                        <Image
                          src={item.img}
                          width={50}
                          height={50}
                          alt="profile"
                          className="rounded-md object-cover border"
                        />
                      </td>

                      <td className="whitespace-nowrap font-medium">
                        {item.name}
                      </td>

                      <td className="whitespace-nowrap text-sm">
                        {item.age} বছর
                      </td>

                      <td className="whitespace-nowrap">{item.location}</td>

                      <td className="whitespace-nowrap">{item.height}</td>

                      <td className="whitespace-nowrap">{item.color}</td>

                      <td className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div>
                            {like ? (
                              <FcLike
                                size={18}
                                className="cursor-pointer"
                                onClick={handleLike}
                              />
                            ) : (
                              <FcLikePlaceholder
                                size={18}
                                className="cursor-pointer"
                                onClick={handleLike}
                              />
                            )}
                          </div>

                          <Link
                            href="/details"
                            className="btn btn-outline btn-xs"
                          >
                            দেখুন
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-center mt-6 md:mt-8">
            <div className="join">
              <button className="join-item btn btn-sm">«</button>
              <button className="join-item btn btn-sm btn-active">1</button>
              <button className="join-item btn btn-sm">2</button>
              <button className="join-item btn btn-sm">3</button>
              <button className="join-item btn btn-sm">»</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
