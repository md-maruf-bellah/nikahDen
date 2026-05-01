import React from "react";

const CheckoutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-[#ff6b6b] py-16 text-center text-white">
        <h1 className="text-3xl font-bold mb-2">Check Out</h1>
        <p className="text-sm">Home / Check out</p>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Plan Details */}
          <div className="lg:col-span-2">
            <div className="bg-[#fff5f5] rounded-lg p-8 border border-red-100">
              {/* Table Header */}
              <div className="flex justify-between border-b border-red-200 pb-4 mb-6">
                <span className="text-red-500 font-bold text-lg">প্লান</span>
                <span className="text-red-500 font-bold text-lg">মূল্য</span>
              </div>

              {/* Item Row */}
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center gap-4">
                  <span className="text-gray-800 font-medium text-lg">
                    মাসিক প্লান
                  </span>
                </div>
                <div className="flex items-center gap-12">
                  <span className="text-gray-800 font-medium text-lg">
                    ৳ ৬৯৯
                  </span>
                  <button className="text-gray-500 hover:text-red-500 transition-colors">
                    <span className="text-xl">✕</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between mt-12 pt-6">
                <button className="btn btn-outline border-red-400 text-red-500 hover:bg-red-500 hover:border-red-500 rounded-md px-8">
                  পুর্বে ফিরে যান
                </button>
                <button className="btn bg-red-100 border-red-400 text-red-500 hover:bg-red-500 hover:text-white rounded-md px-8">
                  আপডেট করুন
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#fff5f5] rounded-lg p-6 border border-red-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6 border-b border-red-200 pb-2">
                অর্ডার বিবরণ
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>মাসিক</span>
                  <span>৳ ৬৯৯</span>
                </div>
                <div className="flex justify-between text-gray-600 text-sm pb-2">
                  <span>ভ্যাট</span>
                  <span>৳ ০.০</span>
                </div>

                <p className="text-[10px] text-gray-400 italic">
                  Taxes and Shipping are calculated.
                </p>

                {/* Coupon Input */}
                <div className="flex gap-2 mt-4">
                  <input
                    type="text"
                    placeholder="কুপন কোড"
                    className="input input-bordered w-full bg-white/50 focus:outline-none focus:border-red-400 h-10 text-sm"
                  />
                  <button className="btn bg-red-100 border-none text-red-500 hover:bg-red-200 btn-sm h-10 px-6">
                    এপ্লাই
                  </button>
                </div>

                <div className="flex justify-between font-bold text-gray-800 border-t border-red-200 pt-4 text-lg">
                  <span>সর্বমোট</span>
                  <span>৳ ৬৯৯</span>
                </div>

                <button className="btn w-full bg-[#ff6b6b] hover:bg-[#ee5b5b] text-white border-none mt-6 rounded-md uppercase tracking-wider">
                  Process To Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
