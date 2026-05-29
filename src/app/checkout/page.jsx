import Link from "next/link";
import React from "react";

const CheckoutPage = () => {
  return (
    <div className="min-h-screen  pb-20">
      {/* Header Section */}
      <div className="bg-[#ff6b6b] py-10 text-center text-white mb-12">
        <h1 className="text-3xl font-bold mb-1 tracking-wide">Check Out</h1>
        <p className="text-xs text-red-100 opacity-90">Home / Check out</p>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Plan Details */}
          <div className="lg:col-span-2">
            <div className="bg-[#fff5f5] rounded-md p-8 border border-red-50/50 shadow-sm">
              {/* Table Header */}
              <div className="flex justify-between pb-3 mb-6">
                <span className="text-[#ff6b6b] font-bold text-sm">প্লান</span>
                <span className="text-[#ff6b6b] font-bold text-sm mr-24">
                  মূল্য
                </span>
              </div>

              {/* Item Row */}
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-800 font-bold text-sm">
                  মাসিক প্লান
                </span>
                <div className="flex items-center gap-24">
                  <span className="text-gray-800 font-bold text-sm">৳ ৬৯৯</span>
                  <button className="text-gray-400 hover:text-red-500 transition-colors text-xs font-semibold cursor-pointer">
                    ✕
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between mt-16">
                <button className="border border-red-200 text-red-400 hover:bg-red-50 text-xs rounded px-4 py-1.5 transition-colors cursor-pointer bg-white">
                  পূর্বে ফিরে যান
                </button>
                <button className="border border-red-200 text-red-400 hover:bg-red-50 text-xs rounded px-4 py-1.5 transition-colors cursor-pointer bg-white">
                  আপডেট করুন
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#fff5f5] rounded-md p-6 border border-red-50/50 shadow-sm">
              <h2 className="text-sm font-bold text-gray-800 mb-5 pb-3 border-b border-red-100/60">
                অর্ডার বিবরণ
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between text-gray-600 text-xs font-medium">
                  <span>মাসিক</span>
                  <span>৳ ৬৯৯</span>
                </div>
                <div className="flex justify-between text-gray-600 text-xs font-medium pb-1 border-b border-red-100/60">
                  <span>ভ্যাট</span>
                  <span>৳ ০.০</span>
                </div>

                <p className="text-[10px] text-gray-400 italic">
                  Taxes and Shipping are calculated.
                </p>

                {/* Coupon Input */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="কুপন কোড"
                    className="w-full bg-white/70 border border-red-100/50 rounded px-3 py-2 text-xs focus:outline-none focus:border-red-300 placeholder-gray-300"
                  />
                  <button className="bg-red-100/70 hover:bg-red-200/80 text-red-400 font-bold text-xs px-4 rounded transition-colors cursor-pointer whitespace-nowrap">
                    এপ্লাই
                  </button>
                </div>

                <div className="flex justify-between font-bold text-gray-800 border-t border-red-100/60 pt-4 text-xs">
                  <span>সর্বমোট</span>
                  <span>৳ ৬৯৯</span>
                </div>

                <Link
                  href="/payment"
                  className="block w-full text-center bg-[#ff6b6b] hover:bg-red-500 text-white font-medium py-2.5 rounded-md mt-6 text-xs transition-colors shadow-sm cursor-pointer"
                >
                  Process To Checkout
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
