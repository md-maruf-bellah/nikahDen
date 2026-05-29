"use client";
import React, { useState } from "react";
import { Check, X, CreditCard } from "lucide-react";

const MemberShip = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const offers = [
    { text: "ফ্রি বায়োডাটা তৈরি", status: "check" },
    { text: "বায়োডাটা পাঠাতে পারবেন", status: "check" },
    { text: "বায়োডাটা গ্রহণ করতে পারবেন", status: "check" },
    { text: "কানেক্ট সংখ্যা", value: "১০" },
    { text: "প্রস্তাব গ্রহণ করতে পারবেন", status: "cross" },
  ];

  return (
    <div className="p-4  min-h-screen flex items-center justify-center ">
      <div className="w-full max-w-3xl  overflow-hidden ">
        {/* Table Header */}
        <div className="flex justify-between items-center mb-10 pb-4 border-b border-gray-100">
          <h2 className="text-xl md:text-xl font-bold text-[#111111]">
            অফার লিস্ট
          </h2>
          <h2 className="text-xl md:text-xl font-bold text-[#111111]">
            মান্থলি প্যাকেজ
          </h2>
        </div>

        {/* Table Content */}
        <div className="space-y-8">
          {offers.map((offer, index) => (
            <div
              key={index}
              className="flex justify-between items-center group"
            >
              <span className="text-md text-[#4B5563] group-hover:text-[#111111] transition-colors">
                {offer.text}
              </span>
              <div className="flex justify-end min-w-[100px]">
                {offer.status === "check" && (
                  <div className="flex justify-center items-center">
                    <span className="bg-green-100 font-thin text-green-600 p-2 rounded-full">
                      <Check size={18} />
                    </span>
                  </div>
                )}
                {offer.status === "cross" && (
                  <div className="flex justify-center items-center">
                    <span className="bg-red-100 text-red-500  p-2 rounded-full font-bold">
                      <X size={18} />
                    </span>
                  </div>
                )}
                {offer.value && (
                  <span className="text-xl font-bold text-[#4B5563]">
                    {offer.value}
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Pricing Row */}
          <div
            onClick={() => setIsModalOpen(true)}
            className="flex justify-between items-start p-4 border-t border-gray-100 mt-4 cursor-pointer border hover:bg-[#e54843] bg-[#FE645F]  rounded-xl transition-all"
          >
            <span className="text-xl md:text-2xl font-bold text-white">
              প্যাকেজ প্রাইজ
            </span>
            <span className="text-xl md:text-2xl font-bold text-white">
              $15
            </span>
          </div>
        </div>
      </div>

      {/* --- DaisyUI Modal --- */}
      <input
        type="checkbox"
        id="purchase_modal"
        className="modal-toggle"
        checked={isModalOpen}
        onChange={() => setIsModalOpen(!isModalOpen)}
      />
      <div className="modal modal-bottom sm:modal-middle" role="dialog">
        <div className="modal-box bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 p-2 rounded-full">
              <CreditCard className="text-red-500" />
            </div>
            <h3 className="font-bold text-lg text-[#111111]">
              প্যাকেজটি ক্রয় করুন
            </h3>
          </div>

          <p className="text-gray-600 mb-6">
            আপনি কি নিশ্চিত যে আপনি এই মান্থলি প্যাকেজটি{" "}
            <span className="font-bold text-red-500">$15</span> এ সাবস্ক্রাইব
            করতে চান?
          </p>

          <div className="space-y-3">
            <button className="btn btn-primary w-full text-white font-bold h-14 rounded-xl">
              পেমেন্ট গেটওয়েতে যান
            </button>
            <button
              className="btn btn-ghost w-full font-bold h-14"
              onClick={() => setIsModalOpen(false)}
            >
              বাতিল করুন
            </button>
          </div>
        </div>
        <label className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          Close
        </label>
      </div>
    </div>
  );
};

export default MemberShip;
