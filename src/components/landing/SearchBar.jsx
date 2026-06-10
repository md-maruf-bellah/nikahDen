"use client";
import { Search } from "lucide-react";

const selectFields = [
  {
    label: "কোন ধর্ম থেকে খুঁজছি",
    options: ["ইসলাম", "হিন্দু", "খ্রিস্টান", "বৌদ্ধ", "অন্যান্য"],
  },
  { label: "আমি খুঁজছি", options: ["পাত্র", "পাত্রী"] },
  {
    label: "বৈবাহিক অবস্থা",
    options: ["অবিবাহিত", "তালাকপ্রাপ্ত", "বিধবা/বিপত্নীক", "অন্যান্য"],
  },
  { label: "বয়স", options: ["১৮-২২", "২৩-২৭", "২৮-৩২", "৩৩-৩৭", "38+"] },
  {
    label: "বিভাগ",
    options: [
      "ঢাকা",
      "চট্টগ্রাম",
      "রাজশাহী",
      "সিলেট",
      "বরিশাল",
      "খুলনা",
      "রংপুর",
      "ময়মনসিংহ",
    ],
  },
];

export default function SearchBar() {
  return (
    <section className=" p-4">
      {/* STATS */}
      <div className="w-full lg:max-w-3xl mx-auto my-10 grid grid-cols-2 md:grid-cols-4 gap-7 ">
        {[
          { num: "১২৫", label: "একাউন্ট" },
          { num: "২৬", label: "পাত্রের বায়োডাটা" },
          { num: "৩২", label: "পাত্রীর বায়োডাটা" },
          { num: "৫০", label: "বিবাহ সম্পন্ন হয়েছে" },
        ].map((stat, i) => (
          <div key={i} className="card bg-[#fd6969] text-white shadow-md">
            <div className="card-body p-4 text-center">
              <div className="text-5xl font-extrabold">{stat.num}</div>
              <div className="text-lg opacity-90">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className=" w-full lg:max-w-5xl  border border-primary/0 mx-auto bg-base-200 py-6 px-4 card block md:flex-row items-center gap-4">
        <div className="max-w-6xl mx-auto">
          {/* Top Labels (Hidden on mobile) */}
          <div className="hidden md:grid grid-cols-5  mb-2 font-medium text-lg text-start">
            <p>কোন ধর্ম থেকে খুঁজছি</p>
            <p>আমি খুঁজছি</p>
            <p>বৈবাহিক অবস্থা</p>
            <p>বয়স</p>
            <p>বিভাগ</p>
            <p></p>
          </div>

          {/* Input Area */}
          <div className="bg-[#e8dfdf] card overflow-hidden">
            {/* Mobile Layout */}
            <div className="flex flex-col md:hidden divide-y divide-gray-300">
              {selectFields?.map((item, i) => (
                <div key={i} className="px-4 py-3">
                  <select
                    className="select select-ghost w-full bg-[#e8dfdf] border-none outline-none focus:outline-none focus:border-none text-gray-700 focus:bg-[#e8dfdf]"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      {item.label}
                    </option>
                    {item.options.map((option, j) => (
                      <option key={j} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Button */}
              <button className="w-full bg-[#5a5a5a] py-3 flex items-center justify-center hover:bg-[#444] transition">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35m1.6-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex items-center h-[60px] ">
              <div className="flex-1 px-4">
                <select
                  className="select select-ghost w-full bg-[#e8dfdf] border-none outline-none focus:outline-none focus:border-none text-gray-700 focus:bg-[#e8dfdf] cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>
                    ধর্ম নির্বাচন করুন
                  </option>
                  <option value="islam">ইসলাম</option>
                  <option value="hinduism">হিন্দু</option>
                  <option value="christianity">খ্রিস্টান</option>
                  <option value="buddhism">বৌদ্ধ</option>
                  <option value="other">অন্যান্য</option>
                </select>
              </div>

              <div className="w-px h-6 bg-gray-400"></div>

              <div className="flex-1 px-4">
                <select
                  className="select select-ghost w-full bg-[#e8dfdf] border-none outline-none focus:outline-none focus:border-none text-gray-700 focus:bg-[#e8dfdf] cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>
                    পাত্র নির্বাচন করুন
                  </option>
                  <option value="patro">পাত্র</option>
                  <option value="patri">পাত্রী</option>
                </select>
              </div>

              <div className="w-px h-6 bg-gray-400"></div>

              <div className="flex-1 px-4">
                <select
                  className="select select-ghost w-full bg-[#e8dfdf] border-none outline-none focus:outline-none focus:border-none text-gray-700 focus:bg-[#e8dfdf] cursor-pointer"
                  defaultValue=""
                >
                  {" "}
                  <option value="" disabled>
                    নির্বাচন করুন
                  </option>
                  <option value="unmarried">অবিবাহিত</option>
                  <option value="divorced">তালাকপ্রাপ্ত</option>
                  <option value="widow">বিধবা/বিপত্নীক</option>
                </select>
              </div>

              <div className="w-px h-6 bg-gray-400"></div>

              <div className="flex-1 px-4">
                <select
                  className="select select-ghost w-full bg-[#e8dfdf] border-none outline-none focus:outline-none focus:border-none text-gray-700 focus:bg-[#e8dfdf] cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>
                    বয়স নির্বাচন করুন
                  </option>
                  <option value="18-21">১৮ - ২১</option>
                  <option value="22-25">২২ - ২৫</option>
                  <option value="26-30">২৬ - ৩০</option>
                </select>
              </div>

              <div className="w-px h-6 bg-gray-400"></div>

              <div className="flex-1 px-4">
                <select
                  className="select select-ghost w-full bg-[#e8dfdf] border-none outline-none focus:outline-none focus:border-none text-gray-700 focus:bg-[#e8dfdf] cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>
                    স্থান নির্বাচন করুন
                  </option>
                  <option value="dhaka">ঢাকা</option>
                  <option value="chittagong">চট্টগ্রাম</option>
                  <option value="khulna">খুলনা</option>
                  <option value="rajshahi">রাজশাহী</option>
                  <option value="sylhet">সিলেট</option>
                  <option value="barishal">বরিশাল</option>
                  <option value="rangpur">রংপুর</option>
                  <option value="mymensingh">ময়মনসিংহ</option>
                </select>
              </div>

              <button className="w-[70px] h-full bg-[#5a5a5a] flex items-center justify-center hover:bg-[#444] transition cursor-pointer">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35m1.6-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
