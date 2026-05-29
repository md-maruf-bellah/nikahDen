import { Check, X } from "lucide-react";
import Link from "next/link";
import React from "react";

const MembershipPlan = () => {
  const plans = [
    { name: "মান্থলি", price: "৬৯৯/=", id: 1 },
    { name: "দ্বিমাসিক", price: "৮৯৯/=", id: 2 },
    { name: "ত্রৈমাসিক", price: "১,০৯৯/=", id: 3 },
    { name: "ষাণ্মাসিক", price: "১,২৯৯/=", id: 4 },
  ];

  const features = [
    {
      title: "ফ্রি বায়োডাটা তৈরি",
      values: ["check", "check", "check", "check"],
    },
    {
      title: "বায়োডাটা পাঠাতে পারবেন",
      values: ["check", "check", "check", "check"],
    },
    {
      title: "বায়োডাটা গ্রহণ করতে পারবেন",
      values: ["check", "check", "check", "check"],
    },
    { title: "কানেক্ট সংখ্যা", values: ["১০", "১৫", "২৫", "৫০"] },
    {
      title: "প্রস্তাব গ্রহণ করতে পারবেন",
      values: ["cross", "১৫টি", "২৫টি", "অসংখ্য"],
    },
  ];

  return (
    <div className="min-h-screen  pb-20">
      {/* Header Section */}
      <div className="bg-[#ff6b6b] py-10 text-center text-white mb-12">
        <h1 className="text-3xl font-bold mb-2 tracking-wide">
          মেম্বারশিপ প্ল্যান
        </h1>
        <p className="text-xs text-red-100 opacity-90">
          হোম / মেম্বারশিপ প্ল্যান
        </p>
      </div>

      {/* Table Section */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Table Head */}
            <thead>
              <tr className="text-sm text-gray-800 border-none">
                <th className="text-left font-bold pb-6 pl-4 w-1/3">
                  অফার লিস্ট
                </th>
                {plans.map((plan) => (
                  <th key={plan.id} className="text-center font-bold pb-6 px-4">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {features.map((feature, index) => {
                // Alternating background rows based on image_c811c7.png
                const isEvenRow = index % 2 === 0;
                return (
                  <tr
                    key={index}
                    className={`${
                      isEvenRow ? "bg-[#fff4f4]" : "bg-white"
                    } text-gray-700 text-sm transition-colors`}
                  >
                    <td className="font-medium py-4 pl-4 rounded-l-md">
                      {feature.title}
                    </td>

                    {feature.values.map((val, i) => (
                      <td
                        key={i}
                        className={`py-5 text-center ${
                          i === feature.values.length - 1 ? "rounded-r-md" : ""
                        }`}
                      >
                        {val === "check" ? (
                          <div className="flex justify-center items-center text-green-500">
                            <Check size={18} strokeWidth={2.5} />
                          </div>
                        ) : val === "cross" ? (
                          <div className="flex justify-center items-center text-red-400">
                            <X size={16} strokeWidth={2.5} />
                          </div>
                        ) : (
                          <div className="flex justify-center items-center font-medium text-gray-600">
                            {val}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>

            {/* Footer Section (Prices & Actions) */}
            <tfoot>
              <tr>
                <td className="text-xl font-bold text-gray-800 pt-14 pl-4 align-middle">
                  প্ল্যান সিলেক্ট করুন
                </td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center pt-14 px-2">
                    {/* Price Tweak matching bold look */}
                    <div className="text-xl font-black text-gray-800 mb-3 tracking-tight">
                      {plan.price}
                    </div>
                    <Link
                      href="/checkout"
                      className="inline-block w-full text-center border border-[#ff6b6b] text-[#ff6b6b] hover:bg-[#ff6b6b] hover:text-white transition-colors py-2 rounded-md text-xs font-medium cursor-pointer shadow-sm bg-white"
                    >
                      এপ্লাই করুন
                    </Link>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MembershipPlan;
