"use client";
import { Search } from "lucide-react";

const selectFields = [
  { label: "আমি খুঁজছি", options: ["পাত্র", "পাত্রী"] },
  {
    label: "বৈবাহিক অবস্থা",
    options: [
      "যেকোনো",
      "ডাক্তার",
      "ইঞ্জিনিয়ার",
      "শিক্ষক",
      "ব্যবসায়ী",
      "অন্যান্য",
    ],
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
    <section className="bg-base-100 py-8 shadow px-4">
      {/* STATS */}
      <div className="w-full lg:max-w-3xl mx-auto my-10 grid grid-cols-2 md:grid-cols-4 gap-7">
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

      <div className="w-full lg:max-w-4xl mx-auto bg-base-200 py-6 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Top Labels (Hidden on mobile) */}
          <div className="hidden md:grid grid-cols-5 text-center mb-2 text-gray-600 font-medium text-lg">
            <p>আমি খুঁজছি</p>
            <p>বৈবাহিক অবস্থা</p>
            <p>বয়স</p>
            <p>জেলা</p>
            <p></p>
          </div>

          {/* Input Area */}
          <div className="bg-[#e8dfdf] rounded-md overflow-hidden">
            {/* Mobile Layout */}
            <div className="flex flex-col md:hidden divide-y divide-gray-300">
              {["পাত্র", "অবিবাহিত", "১৮ - ২১", "ঢাকা"].map((item, i) => (
                <div key={i} className="px-4 py-3">
                  <select className="w-full bg-transparent outline-none text-gray-700 appearance-none">
                    <option>{item}</option>
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
            <div className="hidden md:flex items-center h-[60px]">
              <div className="flex-1 px-4">
                <select className="w-full bg-transparent outline-none text-gray-700 appearance-none">
                  <option>পাত্র</option>
                  <option>পাত্র</option>
                  <option>পাত্র</option>
                  <option>পাত্র</option>
                </select>
              </div>

              <div className="w-px h-6 bg-gray-400"></div>

              <div className="flex-1 px-4">
                <select className="w-full bg-transparent outline-none text-gray-700 appearance-none">
                  <option>অবিবাহিত</option>
                  <option>অবিবাহিত</option>
                  <option>অবিবাহিত</option>
                  <option>অবিবাহিত</option>
                </select>
              </div>

              <div className="w-px h-6 bg-gray-400"></div>

              <div className="flex-1 px-4">
                <select className="w-full bg-transparent outline-none text-gray-700 appearance-none">
                  <option>১৮ - ২১</option>
                  <option>১৮ - ২১</option>
                  <option>১৮ - ২১</option>
                  <option>১৮ - ২১</option>
                </select>
              </div>

              <div className="w-px h-6 bg-gray-400"></div>

              <div className="flex-1 px-4">
                <select className="w-full bg-transparent outline-none text-gray-700 appearance-none">
                  <option>ঢাকা</option>
                  <option>ঢাকা</option>
                  <option>ঢাকা</option>
                  <option>ঢাকা</option>
                </select>
              </div>

              <button className="w-[70px] h-full bg-[#5a5a5a] flex items-center justify-center hover:bg-[#444] transition">
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
