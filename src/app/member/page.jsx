import { Check, X } from "lucide-react";
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
    <div className="bg-white min-h-screen">
      {/* Header Section */}
      <div className="bg-[#ff6b6b] py-16 text-center text-white">
        <h1 className="text-3xl font-bold mb-2">মেম্বারশিপ প্ল্যান</h1>
        <p className="text-sm">হোম / মেম্বারশিপ প্ল্যান</p>
      </div>

      {/* Table Section */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="overflow-x-auto">
          <table className="table w-full border-separate border-spacing-y-2">
            {/* Table Head */}
            <thead>
              <tr className="text-gray-800 text-lg border-none">
                <th className="bg-transparent">অফার লিস্ট</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="text-center bg-transparent">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {features.map((feature, index) => (
                <tr
                  key={index}
                  className={
                    index % 2 === 0 ? "bg-[#FEF2F2]" : "bg-transparent"
                  }
                >
                  <td className="font-medium text-gray-700 py-4">
                    {feature.title}
                  </td>
                  {/* {feature.values.map((val, i) => (
                    <td key={i} className="text-center py-4">
                      {val === "check" ? (
                        <div className="text-green-500 text-xl text-center font-bold">
                          <Check />
                        </div>
                      ) : val === "cross" ? (
                        <div className="text-red-500 text-xl font-bold">✕</div>
                      ) : (
                        <span className="text-gray-600 font-semibold">
                          {val}
                        </span>
                      )}
                    </td>
                  ))} */}

                  {feature.values.map((val, i) => (
                    <td key={i} className="py-4">
                      {val === "check" ? (
                        <div className="flex justify-center items-center">
                          <span className="bg-green-100 text-green-600 p-2 rounded-full">
                            <Check size={18} />
                          </span>
                        </div>
                      ) : val === "cross" ? (
                        <div className="flex justify-center items-center">
                          <span className="bg-red-100 text-red-500  p-2 rounded-full font-bold">
                            <X size={18} />
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-center items-center font-semibold text-gray-600">
                          {val}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>

            {/* Footer Row (Prices & Buttons) */}
            <tfoot>
              <tr>
                <td className="text-2xl font-bold text-gray-800 py-8">
                  প্ল্যান সিলেক্ট করুন
                </td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center py-8">
                    <div className="text-2xl font-bold text-gray-800 mb-4">
                      {plan.price}
                    </div>
                    <button className="btn btn-outline btn-error hover:text-white rounded-md px-8">
                      এপ্লাই করুন
                    </button>
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
