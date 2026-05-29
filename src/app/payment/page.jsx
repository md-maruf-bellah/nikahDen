import React from "react";
import Link from "next/link";

const PaymentPage = () => {
  return (
    <div className="min-h-screen  pb-20">
      {/* Header Section from image_c8e877.png */}
      <div className="bg-[#ff6b6b] py-10 text-center text-white mb-12">
        <h1 className="text-3xl font-bold mb-1">Payment</h1>
        <p className="text-xs tracking-wide text-red-100">Home / Payment</p>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        {/* Billing Address Section */}
        <div className="py-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Billing Address</h2>
            <button className="border border-red-300 text-red-400 hover:bg-red-50 hover:text-red-500 text-xs rounded px-4 py-1.5 transition-colors cursor-pointer">
              পুর্বে ফিরে যান
            </button>
          </div>

          <form className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label pb-1.5 pt-0 cursor-pointer">
                  <span className="text-xs text-gray-700 font-medium">
                    First Name
                  </span>
                </label>
                <input
                  type="text"
                  className="w-full text-gray-500 h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:border-red-400 text-sm"
                />
              </div>
              <div className="form-control">
                <label className="label pb-1.5 pt-0 cursor-pointer">
                  <span className="text-xs text-gray-700 font-medium">
                    Last Name
                  </span>
                </label>
                <input
                  type="text"
                  className="w-full text-gray-500 h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:border-red-400 text-sm"
                />
              </div>
            </div>

            {/* Contact Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label pb-1.5 pt-0 cursor-pointer">
                  <span className="text-xs text-gray-700 font-medium">
                    Phone
                  </span>
                </label>
                <input
                  type="text"
                  className="w-full text-gray-500 h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:border-red-400 text-sm"
                />
              </div>
              <div className="form-control">
                <label className="label pb-1.5 pt-0 cursor-pointer">
                  <span className="text-xs text-gray-700 font-medium">
                    E-mail
                  </span>
                </label>
                <input
                  type="email"
                  className="w-full h-10 px-3 text-gray-500 rounded-md border border-gray-300 focus:outline-none focus:border-red-400 text-sm"
                />
              </div>
            </div>

            {/* Address Field */}
            <div className="form-control">
              <label className="label pb-1.5 pt-0 cursor-pointer">
                <span className="text-xs text-gray-700 font-medium">
                  Address
                </span>
              </label>
              <input
                type="text"
                className="w-full h-10 px-3 text-gray-500 rounded-md border border-gray-300 focus:outline-none focus:border-red-400 text-sm"
              />
            </div>

            {/* City, State, Zip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="form-control">
                <label className="label pb-1.5 pt-0 cursor-pointer">
                  <span className="text-xs text-gray-700 font-medium">
                    Town / City
                  </span>
                </label>
                <input
                  type="text"
                  className="w-full h-10 px-3 text-gray-500 rounded-md border border-gray-300 focus:outline-none focus:border-red-400 text-sm"
                />
              </div>
              <div className="form-control">
                <label className="label pb-1.5 pt-0 cursor-pointer">
                  <span className="text-xs text-gray-700 font-medium">
                    State
                  </span>
                </label>
                <input
                  type="text"
                  className="w-full h-10 px-3 text-gray-500 rounded-md border border-gray-300 focus:outline-none focus:border-red-400 text-sm"
                />
              </div>
              <div className="form-control">
                <label className="label pb-1.5 pt-0 cursor-pointer">
                  <span className="text-xs text-gray-700 font-medium">
                    Zip Code
                  </span>
                </label>
                <input
                  type="text"
                  className="w-full h-10 px-3 text-gray-500 rounded-md border border-gray-300 focus:outline-none focus:border-red-400 text-sm"
                />
              </div>
            </div>

            {/* Order Notes */}
            <div className="form-control pt-2">
              <textarea
                className="w-full h-28 p-3 rounded-md border border-gray-300 focus:outline-none focus:border-red-400 text-xs text-gray-500 placeholder-gray-300 resize-none"
                placeholder="Order notes (optional)"
              ></textarea>
            </div>
          </form>
        </div>

        {/* Payment Methods Section */}
        <div className="mt-14">
          <h2 className="text-xl font-bold  mb-6">Payment Methods</h2>

          <div className="mb-6">
            <p className=" font-bold text-sm mb-0.5">সর্বমোট</p>
            <p className="text-xl font-bold ">৳ ৬৯৯</p>
          </div>

          <div className="space-y-5">
            {/* Credit Card Option */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500 cursor-pointer"
                />
                <span className="text-sm font-semibold text-gray-700">
                  Credit Card
                </span>
              </label>

              {/* Card Icons */}
              <div className="flex gap-1.5 mt-2 ml-7">
                <img
                  src="https://img.icons8.com/color/48/mastercard.png"
                  alt="Mastercard"
                  className="h-7 w-auto object-contain border rounded p-0.5"
                />
                <img
                  src="https://img.icons8.com/color/48/visa.png"
                  alt="Visa"
                  className="h-7 w-auto object-contain border rounded p-0.5"
                />
                <img
                  src="https://img.icons8.com/color/48/amex.png"
                  alt="Amex"
                  className="h-7 w-auto object-contain border rounded p-0.5"
                />
                <img
                  src="https://img.icons8.com/color/48/discover.png"
                  alt="Discover"
                  className="h-7 w-auto object-contain border rounded p-0.5"
                />
                <img
                  src="https://img.icons8.com/color/48/diners-club.png"
                  alt="Diners"
                  className="h-7 w-auto object-contain border rounded p-0.5"
                />
                <img
                  src="https://img.icons8.com/color/48/unionpay.png"
                  alt="UnionPay"
                  className="h-7 w-auto object-contain border rounded p-0.5"
                />
                <img
                  src="https://img.icons8.com/color/48/jcb.png"
                  alt="JCB"
                  className="h-7 w-auto object-contain border rounded p-0.5"
                />
              </div>
            </div>

            {/* PayPal Option */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  defaultChecked
                  className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500 cursor-pointer"
                />
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg"
                  alt="PayPal"
                  className="h-4 ml-0.5"
                />
              </label>
            </div>

            {/* Terms Checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500 accent-red-500 cursor-pointer"
                />
                <span className="text-gray-500 text-xs">
                  By placing an order, I agree to Gunob terms of sale
                </span>
              </label>
            </div>
          </div>

          {/* Place Order Button */}
          <Link
            href="/success"
            className="block w-full bg-[#ff6b6b] hover:bg-red-600 text-white font-medium py-3 rounded-md mt-8 text-center text-sm transition-colors shadow-sm cursor-pointer"
          >
            Place an Order
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
