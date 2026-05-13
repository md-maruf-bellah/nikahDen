import Link from "next/link";
import SearchBar from "./SearchBar";

function PricingSection() {
  return (
    <div className=" w-full  bg-[#f45f5f] py-32 px-4  ">
      <div className="pt-12 pb-32 text-center">
        <p className="text-xl font-semibold text-white mb-4">কার্যপদ্ধতি</p>
        <h1 className="text-4xl font-bold">মেম্বারশিপ প্লান</h1>
      </div>
      <div className="max-w-7xl px-0 lg:px-10 mx-auto grid grid-cols-1 md:grid-cols-3  gap-4 lg:gap-0 items-center">
        {/* LEFT CARD */}
        <div className="bg-[#efefef] p-8 text-left rounded-sm">
          <h3 className="text-[#f45f5f] text-xl font-semibold mb-2">মাসিক</h3>
          <p className="text-2xl font-bold mb-4">৳৯৯৯</p>

          <ul className="space-y-3 text-gray-600">
            <li>✔ ফ্রি বায়োডাটা তৈরি করতে পারবেন</li>
            <li>✔ অসংখ্য বায়োডাটা পাঠাতে পারবেন</li>
            <li>✔ অসংখ্য প্রোফাইল দেখতে পারবেন</li>
            <li>✔ সরাসরি চ্যাট প্রস্তাব পাঠাতে পারবেন</li>
            <li className="text-gray-400">
              ✖ সরাসরি চ্যাট প্রস্তাব গ্রহণ করতে পারবেন
            </li>
          </ul>

          <button className="mt-6 bg-[#f45f5f] text-white w-full py-3 rounded">
            এগিয়ে করুন
          </button>
        </div>

        {/* MIDDLE (FEATURED) */}
        <div className=" bg-[#555555] text-white p-8 rounded-sm scale-100 md:scale-110 shadow-lg">
          {/* Badge */}
          <div className=" bg-[#efefef] text-gray-700 w-full py-2 text-lg font-medium text-center">
            পপুলার প্লান -{" "}
            <span className="text-[#f45f5f] font-bold text-2xl">২০% </span> ছাড়
          </div>

          <h3 className="text-xl font-semibold mb-2 mt-4">ত্রৈমাসিক</h3>
          <div className="flex gap-3">
            <p className="text-lg line-through text-gray-300">৳১,২৫০</p>
            <p className="text-2xl font-bold mb-4">৳৯৯৯</p>
          </div>

          <ul className="space-y-3 text-gray-200">
            <li>✔ ফ্রি বায়োডাটা তৈরি করতে পারবেন</li>
            <li>✔ অসংখ্য বায়োডাটা পাঠাতে পারবেন</li>
            <li>✔ অসংখ্য প্রোফাইল দেখতে পারবেন</li>
            <li>✔ সরাসরি ১৫টি প্রস্তাব পাঠাতে পারবেন</li>
            <li>✔ সরাসরি ১৫টি প্রস্তাব গ্রহণ করতে পারবেন</li>
          </ul>

          <button className="mt-6 bg-[#efefef] text-gray-800 w-full py-3 rounded">
            এগিয়ে করুন
          </button>
        </div>

        {/* RIGHT CARD */}
        <div className="bg-[#efefef] p-8 text-left rounded-sm">
          <h3 className="text-[#f45f5f] text-xl font-semibold mb-2">
            ষান্মাসিক
          </h3>
          <p className="text-2xl font-bold mb-4">৳৪,২০০</p>

          <ul className="space-y-3 text-gray-600">
            <li>✔ ফ্রি বায়োডাটা তৈরি করতে পারবেন</li>
            <li>✔ অসংখ্য বায়োডাটা পাঠাতে পারবেন</li>
            <li>✔ অসংখ্য প্রোফাইল দেখতে পারবেন</li>
            <li>✔ অসংখ্য প্রস্তাব পাঠাতে পারবেন</li>
            <li>✔ অসংখ্য প্রস্তাব গ্রহণ করতে পারবেন</li>
          </ul>

          <button className="mt-6 bg-[#f45f5f] text-white w-full py-3 rounded">
            এগিয়ে করুন
          </button>
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
