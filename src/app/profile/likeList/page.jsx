"use client";
import React, { useState } from "react";
import { Link2, Trash2 } from "lucide-react";

const LikeList = () => {
  const [selectedId, setSelectedId] = useState(null);

  const tableData = [
    {
      id: "০১",
      biodataNo: "বায়োডাটা নং",
      address: "১৩৭/ক, সদর-১২০০, সিরাজগঞ্জ, রাজশাহী, বাংলাদেশ",
    },
    {
      id: "০১",
      biodataNo: "বায়োডাটা নং",
      address: "১৩৭/ক, সদর-১২০০, সিরাজগঞ্জ, রাজশাহী, বাংলাদেশ",
    },
    {
      id: "০১",
      biodataNo: "বায়োডাটা নং",
      address: "১৩৭/ক, সদর-১২০০, সিরাজগঞ্জ, রাজশাহী, বাংলাদেশ",
    },
  ];

  return (
    <div className="p-4 md:p-10 bg-white min-h-screen">
      <div className="max-w-5xl mx-auto overflow-x-auto">
        <table className="table w-full border-separate border-spacing-y-2">
          {/* Table Head */}
          <thead>
            <tr className="text-[#111111] text-lg border-none">
              <th className="bg-transparent font-bold">#</th>
              <th className="bg-transparent font-bold">বায়োডাটা নং</th>
              <th className="bg-transparent font-bold">ঠিকানা</th>
              <th className="bg-transparent font-bold text-center">অপশন</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="text-gray-600">
            {tableData.map((item, index) => (
              <tr
                key={index}
                className={`${index % 2 === 0 ? "bg-[#FFF5F5]" : "bg-white"} border-none hover:bg-gray-100 transition-colors`}
              >
                <td className="rounded-l-lg font-medium">{item.id}</td>
                <td className="font-medium">{item.biodataNo}</td>
                <td className="max-w-xs md:max-w-none truncate md:whitespace-normal">
                  {item.address}
                </td>
                <td className="rounded-r-lg">
                  <div className="flex justify-center gap-4">
                    <button className="text-gray-500 hover:text-primary transition-colors">
                      <Link2 size={20} />
                    </button>
                    <button
                      onClick={() => setSelectedId(item.id)}
                      className="text-gray-500 hover:text-error transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Delete Confirmation Modal (DaisyUI) --- */}
      <input
        type="checkbox"
        id="delete_modal"
        className="modal-toggle"
        checked={!!selectedId}
        readOnly
      />
      <div className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white">
          <h3 className="font-bold text-xl text-error flex items-center gap-2">
            <Trash2 size={24} /> সতর্কবার্তা!
          </h3>
          <p className="py-4 text-gray-700 text-lg">
            আপনি কি নিশ্চিত যে আপনি এই বায়োডাটাটি ডিলিট করতে চান? এই কাজটি আর
            ফিরিয়ে আনা সম্ভব নয়।
          </p>
          <div className="modal-action">
            <button
              className="btn btn-ghost"
              onClick={() => setSelectedId(null)}
            >
              বাতিল করুন
            </button>
            <button
              className="btn btn-error text-white"
              onClick={() => setSelectedId(null)}
            >
              হ্যাঁ, ডিলিট করুন
            </button>
          </div>
        </div>
        <label className="modal-backdrop" onClick={() => setSelectedId(null)}>
          Close
        </label>
      </div>

      {/* Mobile view suggestion: স্ক্রিন খুব ছোট হলে টেবিলটি স্ক্রলযোগ্য হবে */}
    </div>
  );
};

export default LikeList;
