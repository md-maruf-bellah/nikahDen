"use client";

import { useState } from "react";

export default function BiodataForm() {
  const [activeStep, setActiveStep] = useState(2);

  const steps = [
    "ব্যক্তিগত তথ্য",
    "ধর্মীয় তথ্য",
    "শিক্ষাগত যোগ্যতা",
    "পেশাগত তথ্য",
    "পারিবারিক তথ্য",
    "যোগাযোগ ও ঠিকানা",
    "অঙ্গীকারনামা",
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-[#f15b5b] text-white text-center py-10">
        <h1 className="text-2xl font-semibold">বায়োডাটা তৈরি করুন</h1>
        <p className="text-sm mt-1 opacity-90">হোম / বায়োডাটা তৈরি করুন</p>
      </div>

      {/* MAIN GRID */}
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* ================= LEFT STEPPER ================= */}
        <div className="md:col-span-1">
          {/* ================= MOBILE (Horizontal) ================= */}
          <div className="md:hidden overflow-x-auto pb-4">
            <div className="flex items-center min-w-max px-2">
              {steps.map((item, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === activeStep;
                const isDone = stepNumber < activeStep;

                return (
                  <div key={index} className="flex items-center">
                    {/* Circle */}
                    <div
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-white text-xs
              ${
                isDone
                  ? "bg-green-500"
                  : isActive
                    ? "bg-red-500"
                    : "bg-gray-400"
              }`}
                    >
                      {stepNumber}
                    </div>

                    {/* Line */}
                    {index !== steps.length - 1 && (
                      <div className="w-10 h-[2px] bg-gray-300"></div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Labels */}
            <div className="flex justify-between mt-2 text-xs px-1 min-w-max">
              {steps.map((item, index) => (
                <span key={index} className="w-16 text-center text-gray-600">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* ================= DESKTOP (Vertical) ================= */}
          <div className="hidden md:block relative pr-8">
            {/* Vertical Line */}
            <div className="absolute right-3 top-0 h-full w-[2px] bg-gray-300"></div>

            {steps.map((item, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === activeStep;
              const isDone = stepNumber < activeStep;

              return (
                <div key={index} className="relative mb-14 flex items-center">
                  {/* TEXT */}
                  <div className="flex-1 text-right pr-6">
                    <p
                      className={`text-lg ${
                        isActive ? "text-red-500 font-medium" : "text-gray-700"
                      }`}
                    >
                      {item}
                    </p>
                  </div>

                  {/* CIRCLE */}
                  <div
                    className={`absolute right-[-18] translate-x-1/2 w-7 h-7 flex items-center justify-center rounded-full text-white text-xs shadow
            ${
              isDone ? "bg-green-500" : isActive ? "bg-red-500" : "bg-gray-400"
            }`}
                  >
                    {stepNumber}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= RIGHT FORM ================= */}
        <div className="md:col-span-2 bg-white p-6 md:p-8 rounded-md ">
          {/* TITLE */}
          <h2 className="text-lg font-semibold text-gray-700 pb-2 mb-6 relative">
            ধর্মীয় তথ্য
            <span className="absolute left-0 -bottom-[2px] w-12 h-[3px] bg-red-500"></span>
          </h2>

          {/* FORM */}
          <div>
            {/* NAME */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm text-gray-600">
                  নামের প্রথম অংশ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full mt-1 h-10 rounded-sm"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">
                  নামের শেষ অংশ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full mt-1 h-10 rounded-sm"
                />
              </div>
            </div>

            {/* 4 GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-5">
              <div>
                <label className="text-sm text-gray-600">
                  জন্ম সাল <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full mt-1 h-10 rounded-sm"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">
                  জন্ম মাস <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full mt-1 h-10 rounded-sm"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">
                  উচ্চতা <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full mt-1 h-10 rounded-sm"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">
                  ওজন <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full mt-1 h-10 rounded-sm"
                />
              </div>
            </div>

            {/* ADDRESS */}
            <div className="mt-5">
              <label className="text-sm text-gray-600">
                ঠিকানা <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full mt-1 h-10 rounded-sm"
              />
            </div>

            {/* PROFESSION */}
            <div className="mt-5">
              <label className="text-sm text-gray-600">
                বর্তমান পেশা <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full mt-1 h-10 rounded-sm"
              />
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex justify-between mt-8">
            <button className="bg-red-500 text-white px-6 py-2 rounded-sm text-sm hover:bg-red-600 transition">
              পূর্বে ফিরে যান
            </button>

            <button className="bg-red-500 text-white px-6 py-2 rounded-sm text-sm hover:bg-red-600 transition">
              পরবর্তী ধাপে যান
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
