"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useFormData, FormProvider } from "../../utility/FormDataContext";

// Validation Schema
const schema = yup
  .object({
    firstName: yup.string().required("নামের প্রথম অংশ আবশ্যক"),
    lastName: yup.string().required("নামের শেষ অংশ আবশ্যক"),
    birthYear: yup.string().required("জন্ম সাল আবশ্যক"),
    birthMonth: yup.string().required("জন্ম মাস আবশ্যক"),
    height: yup.string().required("উচ্চতা আবশ্যক"),
    weight: yup.string().required("ওজন আবশ্যক"),
    address: yup.string().required("ঠিকানা আবশ্যক"),
    profession: yup.string().required("পেশা আবশ্যক"),
  })
  .required();

function FormContent() {
  const [activeStep, setActiveStep] = useState(2);
  const { formData, updateFormData } = useFormData();

  const steps = [
    "ব্যক্তিগত তথ্য",
    "ধর্মীয় তথ্য",
    "শিক্ষাগত যোগ্যতা",
    "পেশাগত তথ্য",
    "পারিবারিক তথ্য",
    "যোগাযোগ ও ঠিকানা",
    "অঙ্গীকারনামা",
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: formData, // আগের সেভ করা ডাটা দেখাবে
  });

  const onSubmit = (data) => {
    updateFormData(data); // Context-এ ডাটা সেভ হচ্ছে
    console.log("Current Global Data:", { ...formData, ...data });

    if (activeStep < steps.length) {
      setActiveStep(activeStep + 1); // পরের স্টেপে যাচ্ছে
      window.scrollTo(0, 0); // পেজের উপরে নিয়ে যাবে
    }
  };

  const goBack = () => {
    if (activeStep > 1) setActiveStep(activeStep - 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#f15b5b] text-white text-center py-10">
        <h1 className="text-2xl font-semibold">বায়োডাটা তৈরি করুন</h1>
        <p className="text-sm mt-1 opacity-90">হোম / {steps[activeStep - 1]}</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* LEFT STEPPER (Desktop & Mobile) */}
        <div className="md:col-span-1">
          {/* Desktop Vertical Stepper */}
          <div className="hidden md:block relative pr-8">
            <div className="absolute right-3 top-0 h-full w-[2px] bg-gray-300"></div>
            {steps.map((item, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === activeStep;
              const isDone = stepNumber < activeStep;
              return (
                <div key={index} className="relative mb-14 flex items-center">
                  <div className="flex-1 text-right pr-6">
                    <p
                      className={`text-lg transition-all ${isActive ? "text-red-500 font-bold" : isDone ? "text-green-600" : "text-gray-500"}`}
                    >
                      {item}
                    </p>
                  </div>
                  <div
                    className={`absolute right-[-18px] translate-x-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full text-white text-xs shadow-md transition-all duration-500 ${isDone ? "bg-green-500 scale-110" : isActive ? "bg-red-500" : "bg-gray-400"}`}
                  >
                    {isDone ? "✓" : stepNumber}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Mobile Horizontal Stepper */}
          <div className="md:hidden flex items-center justify-center space-x-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-full rounded-full ${index + 1 <= activeStep ? "bg-red-500" : "bg-gray-300"}`}
              ></div>
            ))}
          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="md:col-span-2 bg-white border border-gray-200 p-6 md:p-8 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 pb-2 mb-6 border-b-2 border-red-500 inline-block">
            {steps[activeStep - 1]}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  নামের প্রথম অংশ *
                </label>
                <input
                  {...register("firstName")}
                  className={`w-full border p-2 rounded mt-1 outline-none ${errors.firstName ? "border-red-500" : "focus:border-red-400"}`}
                />
                {errors.firstName && (
                  <span className="text-red-500 text-xs">
                    {errors.firstName.message}
                  </span>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  নামের শেষ অংশ *
                </label>
                <input
                  {...register("lastName")}
                  className={`w-full border p-2 rounded mt-1 outline-none ${errors.lastName ? "border-red-500" : "focus:border-red-400"}`}
                />
                {errors.lastName && (
                  <span className="text-red-500 text-xs">
                    {errors.lastName.message}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-700">
                  জন্ম সাল *
                </label>
                <input
                  {...register("birthYear")}
                  className="w-full border p-2 rounded mt-1"
                  placeholder="Ex: 1998"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">
                  জন্ম মাস *
                </label>
                <input
                  {...register("birthMonth")}
                  className="w-full border p-2 rounded mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">
                  উচ্চতা *
                </label>
                <input
                  {...register("height")}
                  className="w-full border p-2 rounded mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">
                  ওজন *
                </label>
                <input
                  {...register("weight")}
                  className="w-full border p-2 rounded mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                ঠিকানা *
              </label>
              <textarea
                {...register("address")}
                className="w-full border p-2 rounded mt-1 h-20"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                বর্তমান পেশা *
              </label>
              <input
                {...register("profession")}
                className="w-full border p-2 rounded mt-1"
              />
            </div>

            {/* BUTTONS */}
            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={goBack}
                className="bg-gray-100 text-gray-700 px-8 py-2 rounded font-medium hover:bg-gray-200 transition"
              >
                ব্যাকে যান
              </button>
              <button
                type="submit"
                className="bg-red-500 text-white px-8 py-2 rounded font-medium hover:bg-red-600 transition shadow-lg"
              >
                পরবর্তী ধাপ
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Export with Provider
export default function BiodataForm() {
  return (
    <FormProvider>
      <FormContent />
    </FormProvider>
  );
}

// const biodataSchema = new mongoose.Schema({
//   personal: {
//     firstName: String,
//     lastName: String,
//     birthYear: Number,
//     // ...অন্যান্য
//   },
//   religious: {
//     religion: String,
//     prayerStatus: String,
//   },
//   education: {
//     degree: String,
//     institution: String,
//   },
//   status: { type: String, enum: ['draft', 'published'], default: 'draft' }
// });
