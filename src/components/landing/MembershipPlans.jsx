import Link from "next/link";
import SearchBar from "./SearchBar";
import { Check, X } from "lucide-react";

function PricingSection() {
  return (
    <div className=" w-full  bg-[#f45f5f] py-32 px-4  ">
      <div className="pt-12 pb-32 text-center">
        <p className="text-xl font-semibold text-white mb-4">কার্যপদ্ধতি</p>
        <h1 className="text-4xl font-bold">মেম্বারশিপ প্লান</h1>
      </div>
      <div className="max-w-7xl px-0 md:px-10 mx-auto grid grid-cols-1 md:grid-cols-3  gap-4 lg:gap-0 items-center">
        {/* LEFT CARD */}
        <div className="bg-base-200 p-8 text-left card">
          <h3 className="text-[#f45f5f] text-xl font-semibold mb-2">মাসিক</h3>
          <p className="text-2xl font-bold mb-4">৳৯৯৯</p>

          <ul className="space-y-3 ">
            <li className="flex gap-1.5">
              {" "}
              <Check size={19} /> ফ্রি বায়োডাটা তৈরি করতে পারবেন
            </li>
            <li className="flex gap-1.5">
              {" "}
              <Check size={19} /> অসংখ্য বায়োডাটা পাঠাতে পারবেন
            </li>
            <li className="flex gap-1.5">
              {" "}
              <Check size={19} /> অসংখ্য প্রোফাইল দেখতে পারবেন
            </li>
            <li className="flex gap-1.5">
              {" "}
              <Check size={19} /> সরাসরি চ্যাট প্রস্তাব পাঠাতে পারবেন
            </li>
            <li className="text-gray-400 flex gap-1.5">
              <X size={19} /> সরাসরি চ্যাট প্রস্তাব গ্রহণ করতে পারবেন
            </li>
          </ul>

          <Link
            href={"/checkout"}
            className="btn mt-6 bg-[#f45f5f] text-white w-full py-3 shadow-none border-none"
          >
            এগিয়ে করুন
          </Link>
        </div>

        {/* MIDDLE (FEATURED) */}
        <div className="relative bg-[#555555]  p-8  scale-100 md:scale-110 shadow-lg card z-10">
          {/* Badge */}
          <div className="absolute top-5 left-0 mb-10 bg-base-100  w-full py-2 text-lg font-medium text-center">
            পপুলার প্লান -{" "}
            <span className="text-[#f45f5f] font-bold text-2xl">২০% </span> ছাড়
          </div>

          <h3 className="text-xl font-semibold mb-2 mt-16 text-white">
            ত্রৈমাসিক
          </h3>
          <div className="flex gap-3">
            <p className="text-lg line-through text-gray-300">৳১,২৫০</p>
            <p className="text-2xl font-bold mb-4 text-white">৳৯৯৯</p>
          </div>

          <ul className="space-y-3 text-gray-200">
            <li className="flex gap-1.5">
              <Check size={19} /> ফ্রি বায়োডাটা তৈরি করতে পারবেন
            </li>
            <li className="flex gap-1">
              {" "}
              <Check size={19} /> অসংখ্য বায়োডাটা পাঠাতে পারবেন
            </li>
            <li className="flex gap-1">
              {" "}
              <Check size={19} /> অসংখ্য প্রোফাইল দেখতে পারবেন
            </li>
            <li className="flex gap-1">
              {" "}
              <Check size={19} /> সরাসরি ১৫টি প্রস্তাব পাঠাতে পারবেন
            </li>
            <li className="flex gap-1">
              {" "}
              <Check size={19} /> সরাসরি ১৫টি প্রস্তাব গ্রহণ করতে পারবেন
            </li>
          </ul>

          <Link
            href={"/checkout"}
            className="btn mt-6 bg-base-100 w-full py-3 shadow-none border-none"
          >
            এগিয়ে করুন
          </Link>
        </div>

        {/* RIGHT CARD */}
        <div className="bg-base-200 p-8 text-left card">
          <h3 className="text-[#f45f5f] text-xl font-semibold mb-2">
            ষান্মাসিক
          </h3>
          <p className="text-2xl font-bold mb-4">৳৪,২০০</p>

          <ul className="space-y-3">
            <li className="flex gap-1.5">
              {" "}
              <Check size={19} /> ফ্রি বায়োডাটা তৈরি করতে পারবেন
            </li>
            <li className="flex gap-1.5">
              {" "}
              <Check size={19} /> অসংখ্য বায়োডাটা পাঠাতে পারবেন
            </li>
            <li className="flex gap-1.5">
              {" "}
              <Check size={19} /> অসংখ্য প্রোফাইল দেখতে পারবেন
            </li>
            <li className="flex gap-1.5">
              {" "}
              <Check size={19} /> অসংখ্য প্রস্তাব পাঠাতে পারবেন
            </li>
            <li className="flex gap-1.5">
              {" "}
              <Check size={19} /> অসংখ্য প্রস্তাব গ্রহণ করতে পারবেন
            </li>
          </ul>

          <Link
            href={"/checkout"}
            className="btn mt-6 bg-[#f45f5f] text-white w-full py-3 shadow-none border-none"
          >
            এগিয়ে করুন
          </Link>
        </div>
      </div>

      <div className="text-center mt-32">
        <Link href={"/member"} className="btn btn-outline btn-gray-100 text-lg">
          আরও প্লান দেখুন
        </Link>
      </div>
    </div>
  );
}

export default function ExportBoth() {
  return (
    <div className="relative">
      {/* SearchBar (top) */}
      <div className="relative z-10">
        <SearchBar />
      </div>

      {/* Pricing (overlap) */}
      <div className="-mt-24 md:-mt-18 relative z-0">
        <PricingSection />
      </div>
    </div>
  );
}
