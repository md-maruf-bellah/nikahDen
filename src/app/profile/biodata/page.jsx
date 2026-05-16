"use client";
import React, { useState } from "react";
import { Pencil } from "lucide-react";

const ProfileData = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");

  const profileSections = [
    {
      title: "ব্যক্তিগত তথ্য",
      data: [
        { label: "পূর্ণনাম:", value: "মেরাজ আকন্দ" },
        { label: "জন্ম তারিখ:", value: "ফেব্রুয়ারি ২৮, ১৯৮৭ ইং" },
        { label: "লিঙ্গ:", value: "ছেলে" },
        { label: "রক্তের গ্রুপ:", value: "এ (+) পজিটিভ" },
        { label: "উচ্চতা:", value: "৫ ফুট ৭ ইঞ্চি" },
        { label: "ওজন:", value: "৬৫ কেজি" },
        { label: "জাতীয়তা:", value: "বাংলাদেশী" },
        { label: "এনআইডি নম্বর:", value: "১৯৮৭২৩৫২৭৬৩৪৩৭৮৪৬৩" },
      ],
    },
    {
      title: "শিক্ষাগত যোগ্যতা",
      data: [
        { label: "সর্বশেষ ডিগ্রী:", value: "মাস্টার্স ইন কেমিস্ট্রি" },
        {
          label: "কলেজ/ইউনিভার্সিটি:",
          value: "কবি নজরুল বিশ্ববিদ্যালয়, ময়মনসিংহ",
        },
        { label: "সিজিপিএ (৪-গ্রেড):", value: "৩.৮" },
        { label: "পাশের সন:", value: "২০১৬ ইং" },
      ],
    },
    {
      title: "পেশাগত তথ্য",
      data: [
        { label: "জব পজিশন", value: "ম্যানেজার" },
        { label: "কোম্পানির নাম:", value: "এবিসি প্রাঃ লিঃ" },
        { label: "জবের পোস্টিং:", value: "মতিঝিল শিল্প এলাকা, ঢাকা" },
        { label: "জবের সময়কাল", value: "২ বছর ৩ মাস" },
      ],
    },
    {
      title: "পারিবারিক তথ্য",
      data: [
        { label: "পিতা:", value: "সোহরাব আকন্দ" },
        { label: "পিতার পেশা:", value: "ব্যবসায়ী" },
        { label: "মাতা:", value: "মৃত আমেনা বেগম" },
        { label: "মাতার পেশা:", value: "গৃহিণী" },
      ],
    },
    {
      title: "যোগাযোগের তথ্য",
      data: [
        { label: "নিজ মোবাইল নম্বর:", value: "+৮৮০ ১৭১২ xxx xxx" },
        { label: "পিতার মোবাইল নম্বর:", value: "+৮৮০ ১৭১২ xxx xxx" },
        { label: "ই-মেইল:", value: "maraj@example.com" },
        {
          label: "স্থায়ী ঠিকানা:",
          value:
            "বাসা নং - ১২/বি, রোড নং - ১৪, থানা - মতিঝিল, পোস্ট কোড - ১২০১, বিভাগ - ঢাকা",
        },
        { label: "বর্তমান ঠিকানা:", value: "ঐ" },
      ],
    },
  ];

  const openEditModal = (title) => {
    setModalTitle(title);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen ">
      <div className="max-w-3xl mx-auto  p-6 md:p-12 space-y-12 relative">
        {profileSections.map((section, index) => (
          <div key={index} className="relative group">
            {/* Section Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="relative">
                <h3 className="text-xl font-bold ">{section.title}</h3>
                <div className="w-10 h-1 bg-red-500 mt-1 rounded-full"></div>
              </div>
              <button
                onClick={() => openEditModal(section.title)}
                className=" hover:text-primary transition-colors p-2"
              >
                <Pencil size={18} />
              </button>
            </div>

            {/* Section Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              {section.data.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:justify-start gap-1 sm:gap-4"
                >
                  <span className=" font-medium sm:w-40 shrink-0">
                    {item.label}
                  </span>
                  <span className="">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Footer Declaration */}
        <div className="pt-10 border-t border-gray-100 relative">
          <button className="absolute right-0 top-10  hover:text-primary p-2">
            <Pencil size={18} />
          </button>
          <p className="text-sm  leading-relaxed max-w-2xl">
            নিকাহ্ কুইন ওয়েবসাইটে প্রদানকৃত সকল তথ্য ১০০ ভাগ সত্য ও সঠিক, এর
            একটি তথ্য মিথ্যা প্রমাণিত হইলে আমার মেম্বারশিপ বাতিল করিতে পারিবেন।
          </p>
        </div>
      </div>

      {/* --- Edit Modal (DaisyUI) --- */}
      <input
        type="checkbox"
        id="edit_modal"
        className="modal-toggle"
        checked={isModalOpen}
        onChange={() => setIsModalOpen(!isModalOpen)}
      />
      <div className="modal modal-bottom sm:modal-middle" role="dialog">
        <div className="modal-box bg-white">
          <h3 className="font-bold text-lg border-b pb-2 mb-4 text-primary">
            সম্পাদনা করুন: {modalTitle}
          </h3>

          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">তথ্য পরিবর্তন করুন</span>
              </label>
              <input
                type="text"
                placeholder="এখানে লিখুন..."
                className="input input-bordered w-full"
              />
            </div>
          </div>

          <div className="modal-action">
            <button
              className="btn btn-ghost"
              onClick={() => setIsModalOpen(false)}
            >
              বাতিল
            </button>
            <button
              className="btn btn-primary text-white"
              onClick={() => setIsModalOpen(false)}
            >
              সংরক্ষণ করুন
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

export default ProfileData;
