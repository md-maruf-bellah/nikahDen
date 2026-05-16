"use client";
import React, { useState } from "react";
import { ChevronDown, CreditCard, Zap } from "lucide-react";

const MembershipDashboard = () => {
  const [activeModal, setActiveModal] = useState(null);

  const stats = [
    { label: "বায়োডাটা ভিজিট সংখ্যা", value: "১০" },
    { label: "আপনার পছন্দকৃত বায়োডাটা সংখ্যা", value: "৫" },
    { label: "আপনার বায়োডাটা যত জন পছন্দ করেছেন", value: "৫" },
  ];

  return (
    <div className="min-h-screenp-4 ">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* --- Membership & Package Section --- */}
        <section>
          <h2 className="text-xl font-bold  mb-4">মেম্বারশীপ এবং প্যাকেজ</h2>
          <div className="rounded border  border-primary/15 overflow-hidden">
            {/* Current Package */}
            <div className="p-6 border-b border-red-50">
              <p className=" mb-2">বর্তমান প্যাকেজ</p>
              <p className="text-red-500 font-bold text-lg mb-4">মান্থলি</p>
              <button
                onClick={() => setActiveModal("package")}
                className="btn btn-outline btn-error btn-sm rounded-md px-6 normal-case"
              >
                প্যাকেজ পরিবর্তন করুন
              </button>
            </div>

            {/* Connection Status */}
            <div className="p-6">
              <p className=" mb-2">কানেক্ট অবশিষ্ট রয়েছে</p>
              <p className="text-red-500 font-bold text-2xl mb-4">১০০</p>
              <p className="text-sm mb-6 leading-relaxed">
                প্রতিটি বায়োডাটা দেখতে ১ টি করে কানেক্টে ব্যবহার হবে।
                <span className="text-red-400 cursor-pointer hover:underline ml-1">
                  বিস্তারিত দেখুন
                </span>
                ।
              </p>
              <button
                onClick={() => setActiveModal("connect")}
                className="btn btn-outline btn-error btn-sm rounded-md px-6 normal-case"
              >
                কানেক্ট কিনুন
              </button>
            </div>
          </div>
        </section>

        {/* --- Biodata Stats Section --- */}
        <section>
          <h2 className="text-xl font-bold  mb-4">বায়োডাটা স্টেট্</h2>
          <div className="rounded border  border-primary/15 overflow-hidden divide-y divide-gray-400">
            {stats.map((item, index) => (
              <div key={index} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <p className=" font-medium max-w-[60%]">{item.label}</p>
                  <div className="dropdown dropdown-end">
                    <label
                      tabIndex={0}
                      className="btn btn-ghost btn-xs border border-red-200 text-red-400 hover:bg-red-50 rounded-md font-normal px-2"
                    >
                      সর্বশেষ ৭ দিন <ChevronDown size={14} className="ml-1" />
                    </label>
                  </div>
                </div>
                <p className="text-red-500 font-bold text-2xl">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* --- DaisyUI Modals --- */}

      {/* Package Change Modal */}
      <input
        type="checkbox"
        className="modal-toggle"
        checked={activeModal === "package"}
        readOnly
      />
      <div className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Zap className="text-red-500" /> প্যাকেজ পরিবর্তন করুন
          </h3>
          <p className="py-4 ">
            আপনি কি আপনার বর্তমান 'মান্থলি' প্যাকেজটি পরিবর্তন করে অন্য কোনো
            প্যাকেজ নিতে চান?
          </p>
          <div className="modal-action">
            <button
              className="btn btn-ghost"
              onClick={() => setActiveModal(null)}
            >
              বাতিল
            </button>
            <button
              className="btn btn-error text-white"
              onClick={() => setActiveModal(null)}
            >
              প্যাকেজ দেখুন
            </button>
          </div>
        </div>
        <label className="modal-backdrop" onClick={() => setActiveModal(null)}>
          Close
        </label>
      </div>

      {/* Buy Connect Modal */}
      <input
        type="checkbox"
        className="modal-toggle"
        checked={activeModal === "connect"}
        readOnly
      />
      <div className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <CreditCard className="text-red-500" /> নতুন কানেক্ট কিনুন
          </h3>
          <p className="py-4 ">
            আপনার একাউন্টে নতুন কানেক্ট যোগ করতে নিচের বাটনে ক্লিক করুন।
          </p>
          <div className="modal-action">
            <button
              className="btn btn-ghost"
              onClick={() => setActiveModal(null)}
            >
              বাতিল
            </button>
            <button
              className="btn btn-error text-white"
              onClick={() => setActiveModal(null)}
            >
              কিনুন
            </button>
          </div>
        </div>
        <label className="modal-backdrop" onClick={() => setActiveModal(null)}>
          Close
        </label>
      </div>
    </div>
  );
};

export default MembershipDashboard;
