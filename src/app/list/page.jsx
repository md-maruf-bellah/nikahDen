"use client";

import Image from "next/image";
import { useState } from "react";
import photoImage from "./../../../assets/member/alem.png";

const profiles = Array(9).fill({
  name: "মোহাম্মদ আহমদ",
  info: "২৮ বছর • ঢাকা • ইঞ্জিনিয়ার",
  img: photoImage,
});

export default function BiodataGrid() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("grid"); // grid | table

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
        <div className="hidden md:block w-72 bg-base-100 p-5 shadow h-screen sticky top-0 overflow-y-auto">
          <h2 className="font-semibold mb-4">ফিল্টার করুন</h2>

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
            <option>লিঙ্গ</option>
          </select>

          <select className="select select-bordered w-full mb-3">
            <option>বৈবাহিক অবস্থা</option>
          </select>

          <select className="select select-bordered w-full mb-3">
            <option>বিভাগ</option>
          </select>

          <select className="select select-bordered w-full mb-3">
            <option>জেলা</option>
          </select>

          <input
            type="range"
            min={18}
            max={60}
            className="range range-primary range-xs mb-4"
          />

          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm flex-1">সার্চ</button>
            <button className="btn btn-outline btn-sm flex-1">রিসেট</button>
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
              <h2 className="font-semibold mb-4">ফিল্টার করুন</h2>

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
                <option>লিঙ্গ</option>
              </select>

              <select className="select select-bordered w-full mb-3">
                <option>বৈবাহিক অবস্থা</option>
              </select>

              <select className="select select-bordered w-full mb-3">
                <option>বিভাগ</option>
              </select>

              <select className="select select-bordered w-full mb-3">
                <option>জেলা</option>
              </select>

              <input
                type="range"
                min={18}
                max={60}
                className="range range-primary range-xs mb-4"
              />

              <div className="flex gap-2">
                <button className="btn btn-primary btn-sm flex-1">সার্চ</button>
                <button className="btn btn-outline btn-sm flex-1">রিসেট</button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
            {/* View Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setView("grid")}
                className={`btn btn-sm ${
                  view === "grid" ? "btn-primary" : "btn-outline"
                }`}
              >
                Grid
              </button>

              <button
                onClick={() => setView("table")}
                className={`btn btn-sm ${
                  view === "table" ? "btn-primary" : "btn-outline"
                }`}
              >
                Table
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {profiles.map((item, i) => (
                <div key={i} className="card bg-base-100">
                  <figure className="pt-4">
                    <Image
                      src={item.img}
                      width={140}
                      height={140}
                      alt="profile"
                      className="rounded"
                    />
                  </figure>

                  <div className="card-body items-center text-center p-4">
                    <h2 className="card-title text-sm">{item.name}</h2>
                    <p className="text-xs text-gray-500">{item.info}</p>

                    <button className="btn btn-sm btn-outline mt-2">
                      বিস্তারিত দেখুন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>ছবি</th>
                    <th>নাম</th>
                    <th>তথ্য</th>
                    <th>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((item, i) => (
                    <tr key={i}>
                      <td>
                        <Image
                          src={item.img}
                          width={50}
                          height={50}
                          alt="profile"
                          className="rounded"
                        />
                      </td>
                      <td>{item.name}</td>
                      <td className="text-sm text-gray-500">{item.info}</td>
                      <td>
                        <button className="btn btn-xs btn-outline">
                          দেখুন
                        </button>
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
