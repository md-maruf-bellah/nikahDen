import React from "react";

const PaymentPage = () => {
  return (
    <div className="min-h-screen bg-[#f9fafb] pb-20">
      {/* Header Section */}
      <div className="bg-[#ff6b6b] py-20 text-center text-white">
        <h1 className="text-4xl font-bold mb-2">Payment</h1>
        <p className="text-sm tracking-wide">Home / Payment</p>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-12">
        {/* Billing Address Card */}
        <div className="py-10 bg-base-200">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-xl font-bold text-gray-800">Billing Address</h2>
            <button className="btn btn-outline btn-xs border-red-300 text-red-400 hover:bg-red-500 hover:border-red-500 rounded-sm px-4">
              পুর্বে ফিরে যান
            </button>
          </div>

          <form className="space-y-5">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-gray-700 font-medium">
                    First Name
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full h-10 rounded-md border-gray-300 focus:outline-red-400"
                />
              </div>
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-gray-700 font-medium">
                    Last Name
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full h-10 rounded-md border-gray-300 focus:outline-red-400"
                />
              </div>
            </div>

            {/* Contact Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-gray-700 font-medium">
                    Phone
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full h-10 rounded-md border-gray-300 focus:outline-red-400"
                />
              </div>
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-gray-700 font-medium">
                    E-mail
                  </span>
                </label>
                <input
                  type="email"
                  className="input input-bordered w-full h-10 rounded-md border-gray-300 focus:outline-red-400"
                />
              </div>
            </div>

            {/* Address Field */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-gray-700 font-medium">
                  Address
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full h-10 rounded-md border-gray-300 focus:outline-red-400"
              />
            </div>

            {/* City, State, Zip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-gray-700 font-medium">
                    Town / City
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full h-10 rounded-md border-gray-300 focus:outline-red-400"
                />
              </div>
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-gray-700 font-medium">
                    State
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full h-10 rounded-md border-gray-300 focus:outline-red-400"
                />
              </div>
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-gray-700 font-medium">
                    Zip Code
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full h-10 rounded-md border-gray-300 focus:outline-red-400"
                />
              </div>
            </div>

            {/* Order Notes */}
            <div className="form-control mt-4">
              <textarea
                className="textarea textarea-bordered w-full h-32 rounded-md border-gray-300 focus:outline-red-400"
                placeholder="Order notes (optional)"
              ></textarea>
            </div>
          </form>
        </div>

        {/* Payment Methods Section */}
        <div className="mt-12 px-2">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Payment Methods
          </h2>

          <div className="mb-8">
            <p className="text-gray-800 font-bold text-lg mb-1">সর্বমোট</p>
            <p className="text-3xl font-bold text-gray-800">৳ ৬৯৯</p>
          </div>

          <div className="space-y-6">
            {/* Credit Card Option */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="payment"
                  className="radio border-gray-400 checked:bg-red-500 checked:border-red-500"
                />
                <span className="font-bold text-gray-700">Credit Card</span>
              </label>
              <div className="flex gap-2 mt-3 ml-8 grayscale opacity-80">
                {/* কার্ডের আইকনগুলো এখানে বসবে */}
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg"
                  alt="Visa"
                  className="h-6 border p-1 rounded bg-white"
                />
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                  alt="Mastercard"
                  className="h-6 border p-1 rounded bg-white"
                />
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg"
                  alt="PayPal"
                  className="h-6 border p-1 rounded bg-white"
                />
              </div>
            </div>

            {/* PayPal Option */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="payment"
                className="radio border-gray-400 checked:bg-red-500 checked:border-red-500"
                defaultChecked
              />
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-700 italic">PayPal</span>
              </div>
            </label>

            {/* Terms Checkbox */}
            <div className="pt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-error rounded-sm h-5 w-5"
                />
                <span className="text-gray-600 text-sm font-medium">
                  By placing an order, I agree to Gunob terms of sale
                </span>
              </label>
            </div>
          </div>

          {/* Place Order Button */}
          <button className="btn w-full bg-[#ef4444] hover:bg-red-600 text-white border-none mt-10 rounded-md h-12 text-lg font-medium shadow-md">
            Place an Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
