"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, CreditCard } from "lucide-react";
import { membershipApi } from "@/lib/api";

const MemberShip = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [plan, setPlan] = useState(null);
  const [connects, setConnects] = useState(0);

  useEffect(() => {
    membershipApi
      .plans()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setPlan(arr.find((p) => p.isPopular) || arr[0] || null);
      })
      .catch(() => {});
    membershipApi
      .mine()
      .then((m) => setConnects(m?.connects?.balance ?? 0))
      .catch(() => {});
  }, []);

  const offers = [
    { text: "ফ্রি বায়োডাটা তৈরি", status: plan?.canCreateBiodata === false ? "cross" : "check" },
    { text: "বায়োডাটা পাঠাতে পারবেন", status: plan?.canSendBiodata === false ? "cross" : "check" },
    { text: "বায়োডাটা গ্রহণ করতে পারবেন", status: plan?.canReceiveBiodata === false ? "cross" : "check" },
    { text: "কানেক্ট সংখ্যা", value: plan?.connectCount ?? "—" },
    {
      text: "প্রস্তাব গ্রহণ করতে পারবেন",
      status:
        plan?.acceptProposalLimit === 0 ? "cross" : "check",
    },
  ];

  return (
    <div className="p-4  min-h-screen flex items-center justify-center ">
      <div className="w-full max-w-3xl  overflow-hidden ">
        {/* Table Header */}
        <div className="flex justify-between items-center mb-10 pb-4 border-b border-gray-100">
          <h2 className="text-xl md:text-xl font-bold ">অফার লিস্ট</h2>
          <h2 className="text-xl md:text-xl font-bold ">
            {plan?.nameBn || plan?.name || "প্যাকেজ"}
          </h2>
        </div>

        {/* Table Content */}
        <div className="space-y-8">
          {offers.map((offer, index) => (
            <div
              key={index}
              className="flex justify-between items-center group"
            >
              <span className="text-md group-hover: transition-colors">
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
                {offer.value !== undefined && (
                  <span className="text-xl font-bold ">{offer.value}</span>
                )}
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center gap-4 flex-wrap">
            <p className="text-sm text-gray-500">
              আপনার বর্তমান কানেক্ট ব্যালেন্স:{" "}
              <span className="font-bold text-red-500">{connects}</span>
            </p>
          </div>

          {/* Pricing Row */}
          <div
            onClick={() => plan && setIsModalOpen(true)}
            className="flex justify-between items-start p-4 border-none mt-4 cursor-pointer border hover:bg-[#e54843] bg-[#FE645F]  rounded-xl transition-all"
          >
            <span className="text-xl md:text-2xl font-bold text-white">
              প্যাকেজ প্রাইজ
            </span>
            <span className="text-xl md:text-2xl font-bold text-white">
              ৳{plan?.price ?? "—"}
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
            <h3 className="font-bold text-lg ">প্যাকেজটি ক্রয় করুন</h3>
          </div>

          <p className="text-gray-600 mb-6">
            আপনি কি নিশ্চিত যে আপনি এই{" "}
            <span className="font-bold text-red-500">
              {plan?.nameBn || plan?.name || "প্যাকেজ"}
            </span>{" "}
            <span className="font-bold text-red-500">৳{plan?.price}</span> এ
            সাবস্ক্রাইব করতে চান?
          </p>

          <div className=" lg:flex justify-between gap-1 ">
            <button
              className="btn btn-outline  w-full lg:w-55 font-bold  lg:my-0 my-3"
              onClick={() => setIsModalOpen(false)}
            >
              বাতিল করুন
            </button>
            <button
              className="btn  btn-error w-full lg:w-55 text-white font-bold "
              onClick={() => plan && router.push(`/checkout?planId=${plan.id}`)}
            >
              পেমেন্ট গেটওয়েতে যান
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