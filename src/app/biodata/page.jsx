"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useFormData, FormProvider } from "./../../utility/FormDataContext";

import {
  PersonalInfo,
  ReligiousInfo,
  ProfessionalInfo,
  AgreementInfo,
  ContactInfo,
  EducationalInfo,
  FamilyInfo,
  GeneralInfo,
} from "./AllComponent";
import { Check } from "lucide-react";

const validationSchema = yup.object().shape({
  // স্টেপ ১: ব্যক্তিগত তথ্য
  name: yup.string().when("$activeStep", {
    is: 1,
    then: (schema) => schema.required("পুরো নাম আবশ্যক"),
  }),
  birthDate: yup.string().when("$activeStep", {
    is: 1,
    then: (schema) => schema.required("জন্ম তারিখ আবশ্যক"),
  }),
  gender: yup.string().when("$activeStep", {
    is: 1,
    then: (schema) => schema.required("লিঙ্গ নির্বাচন করুন"),
  }),

  // স্টেপ ২: ধর্মীয় তথ্য
  religion: yup.string().when("$activeStep", {
    is: 2,
    then: (schema) => schema.required("ধর্ম নির্বাচন করুন"),
  }),
  prayerStatus: yup.string().when("$activeStep", {
    is: 2,
    then: (schema) => schema.required("এটি জানানো আবশ্যক"),
  }),

  // স্টেপ ৩: শিক্ষাগত যোগ্যতা
  lastDegree: yup.string().when("$activeStep", {
    is: 3,
    then: (schema) => schema.required("শিক্ষাগত যোগ্যতা আবশ্যক"),
  }),

  // স্টেপ ৪: পেশাগত তথ্য
  occupation: yup.string().when("$activeStep", {
    is: 4,
    then: (schema) => schema.required("আপনার পেশা লিখুন"),
  }),

  // স্টেপ ৬: যোগাযোগ (স্টেপ ৫ স্কিপ করা হয়েছে বা অপশনাল রাখা যায়)
  mobile: yup.string().when("$activeStep", {
    is: 6,
    then: (schema) =>
      schema
        .required("মোবাইল নম্বর আবশ্যক")
        .matches(/^[0-9]+$/, "সঠিক নম্বর দিন"),
  }),

  // স্টেপ ৭: অঙ্গীকারনামা
  agreed: yup.boolean().when("$activeStep", {
    is: 7,
    then: (schema) => schema.oneOf([true], "আপনাকে অবশ্যই অঙ্গীকার করতে হবে"),
  }),

  mobile: yup.string().when("$activeStep", {
    is: 8,
    then: (schema) =>
      schema
        .required("মোবাইল নম্বর আবশ্যক")
        .matches(/^[0-9]+$/, "সঠিক নম্বর দিন"),
  }),
});

function FormContent() {
  const [activeStep, setActiveStep] = useState(1);
  const { formData, updateFormData } = useFormData();

  const steps = [
    "ব্যক্তিগত",
    "ধর্মীয়",
    "শিক্ষাগত",
    "পেশাগত",
    "পারিবারিক",
    "যোগাযোগ",
    "অঙ্গীকার",
    "সাধারণ",
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger, // এটি ব্যবহার করে আমরা ম্যানুয়ালি চেক করতে পারব
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: formData,
    context: { activeStep: activeStep }, // Yup এই activeStep ব্যবহার করবে
    mode: "onChange", // টাইপ করার সাথে সাথে এরর দেখাবে
  });

  const onNext = (data) => {
    // ১. প্রথমে গ্লোবাল কনটেক্সট আপডেট করুন
    updateFormData(data);

    // ২. বর্তমান ডাটা কনসোলে দেখুন
    console.log(`Step ${activeStep} Data:`, data);

    if (activeStep <= steps.length) {
      // ৩. পরবর্তী স্টেপে যান
      setActiveStep((prev) => prev + 1);
      // নেক্সট পেজে যাওয়ার পর স্ক্রল উপরে নিয়ে আসা
      window.scrollTo(0, 0);
    } else {
      // শেষ ধাপে ডাটা অ্যারে অফ অবজেক্ট হিসেবে কনভার্ট করা
      const finalArray = Object.entries({ ...formData, ...data }).map(
        ([key, value]) => ({
          field: key,
          value: value,
        }),
      );
      console.log("Final Submitted Data (Array Format):", finalArray);
      //   alert("বায়োডাটা সফলভাবে তৈরি হয়েছে!");
    }
  };

  // এরর হ্যান্ডলিং দেখার জন্য (যদি নেক্সট না কাজ করে কনসোলে এরর দেখাবে)
  const onError = (errors) => {
    console.log("Validation Errors:", errors);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:py-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Stepper (Left) */}
        {/* <div className="md:col-span-1 space-y-4">
          {steps.map((label, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs transition-colors duration-300 ${
                  activeStep > index + 1
                    ? "bg-green-500"
                    : activeStep === index + 1
                      ? "bg-red-500"
                      : "bg-gray-300"
                }`}
              >
                {activeStep > index + 1 ? "✓" : index + 1}
              </div>
              <span
                className={`text-sm ${
                  activeStep === index + 1
                    ? "font-bold text-red-500"
                    : "text-gray-500"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div> */}
        {/* LEFT STEPPER (Desktop & Mobile) */}
        <div className="md:col-span-1">
          {/* Desktop Vertical Stepper */}
          <div className="hidden md:block relative pr-8">
            <div className="absolute right-3 top-0 h-full w-[2px] bg-gray-300"></div>
            {steps.map((item, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === activeStep;
              const isDone = stepNumber < activeStep;
              const isLast = index === steps.length - 1;
              return (
                <div key={index} className="relative mb-14 flex items-center">
                  <div className="flex-1 text-right pr-6">
                    <p
                      className={`text-lg transition-all ${isLast && isActive ? "text-red-500 font-bold" : isDone ? "text-green-600" : ""}`}
                    >
                      {item}
                    </p>
                  </div>
                  <div
                    className={`card absolute right-[-18px] translate-x-1/2 z-10 w-8 h-8 flex items-center justify-center  text-white  shadow-md transition-all duration-500 ${isDone ? "bg-green-500 scale-105" : isActive ? "bg-red-500 " : "bg-gray-400"}`}
                  >
                    {isDone ? <Check size={18} /> : stepNumber}
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

        {/* Form Body (Right) */}
        <div className="card md:col-span-3  p-6 bg-base-200 min-h-[400px]">
          <form onSubmit={handleSubmit(onNext, onError)}>
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 border-b-2 border-red-500 inline-block uppercase tracking-wide">
                {steps[activeStep - 1]} তথ্য
              </h2>

              <div className="mt-2">
                {activeStep === 1 && (
                  <PersonalInfo register={register} errors={errors} />
                )}
                {activeStep === 2 && (
                  <ReligiousInfo register={register} errors={errors} />
                )}
                {activeStep === 3 && (
                  <EducationalInfo register={register} errors={errors} />
                )}
                {activeStep === 4 && (
                  <ProfessionalInfo register={register} errors={errors} />
                )}
                {activeStep === 5 && (
                  <FamilyInfo register={register} errors={errors} />
                )}
                {activeStep === 6 && (
                  <ContactInfo register={register} errors={errors} />
                )}
                {activeStep === 7 && (
                  <AgreementInfo register={register} errors={errors} />
                )}

                {activeStep === 8 && (
                  <GeneralInfo register={register} errors={errors} />
                )}
              </div>
            </div>

            <div className="flex justify-between border-t pt-4 mt-10">
              <button
                type="button"
                disabled={activeStep === 1}
                onClick={() => setActiveStep(activeStep - 1)}
                className="btn px-6 py-1 border hover:bg-gray-100 disabled:opacity-50 transition"
              >
                পিছনে
              </button>
              <button
                type="submit"
                className=" btn px-6 py-2 border bg-red-500 hover:bg-red-600 text-white transition font-medium shadow-none"
              >
                {activeStep === steps.length ? "সাবমিট করুন" : "পরবর্তী ধাপ"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function BiodataApp() {
  return (
    <FormProvider>
      <FormContent />
    </FormProvider>
  );
}
