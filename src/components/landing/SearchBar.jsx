"use client";
import { Search } from "lucide-react";

const selectFields = [
  { label: "পাত্র/পাত্রী", options: ["পাত্র", "পাত্রী"] },
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
  { label: "বয়স", options: ["১৮-২২", "২৩-২৭", "২৮-৩২", "৩৩-৩৭", "38+"] },
  {
    label: "পেশা",
    options: [
      "যেকোনো",
      "ডাক্তার",
      "ইঞ্জিনিয়ার",
      "শিক্ষক",
      "ব্যবসায়ী",
      "অন্যান্য",
    ],
  },
];

export default function SearchBar() {
  return (
    <section className="bg-base-100 py-8 shadow">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          {selectFields.map((field, i) => (
            <div key={i} className="form-control">
              <label className="label">
                <span className="label-text text-xs opacity-70">
                  {field.label}
                </span>
              </label>

              <select className="select select-bordered select-sm w-full">
                {field.options.map((opt, j) => (
                  <option key={j}>{opt}</option>
                ))}
              </select>
            </div>
          ))}

          <button className="btn btn-primary flex items-center gap-2 md:mt-6">
            <Search size={16} />
            <span>খুঁজুন</span>
          </button>
        </div>
      </div>
    </section>
  );
}
