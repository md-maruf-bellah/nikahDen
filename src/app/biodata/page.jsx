"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { biodataApi, tokenStore } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const validationSchema = yup.object().shape({
  // স্টেপ ১: ব্যক্তিগত তথ্য

  clothingStyle: yup.string().when("$activeStep", {
    is: 1,
    then: (schema) => schema.required("পোশাকের ধরন লিখুন"),
  }),

  healthCondition: yup.string().when("$activeStep", {
    is: 1,
    then: (schema) => schema.required("শারীরিক বা মানসিক অবস্থা লিখুন"),
  }),

  entertainmentHabit: yup.string().when("$activeStep", {
    is: 1,
    then: (schema) => schema.required("বিনোদন সম্পর্কিত তথ্য লিখুন"),
  }),

  politicalView: yup.string().when("$activeStep", {
    is: 1,
    then: (schema) => schema.required("রাজনৈতিক দর্শন লিখুন"),
  }),

  favoriteBooksPeople: yup.string().when("$activeStep", {
    is: 1,
    then: (schema) => schema.required("পছন্দের বই ও ব্যক্তিত্বের নাম লিখুন"),
  }),

  aboutYourself: yup.string().when("$activeStep", {
    is: 1,
    then: (schema) =>
      schema.required("নিজের সম্পর্কে লিখুন").min(20, "কমপক্ষে ২০ অক্ষর লিখুন"),
  }),

  phoneNumber: yup.string().when("$activeStep", {
    is: 1,
    then: (schema) =>
      schema
        .required("মোবাইল নম্বর লিখুন")
        .matches(/^(\+8801|01)[3-9]\d{8}$/, "সঠিক মোবাইল নম্বর লিখুন"),
  }),

  specialCategories: yup.string().when("$activeStep", {
    is: 1,
    then: (schema) => schema.required("ক্যাটাগরি নির্বাচন করুন"),
  }),

  // স্টেপ ২: ধর্মীয় তথ্য

  religion: yup.string().when("$activeStep", {
    is: 2,
    then: (schema) => schema.required("ধর্ম নির্বাচন করুন"),
  }),

  sectOrDenomination: yup.string().when("$activeStep", {
    is: 2,
    then: (schema) => schema.required("মাজহাব / সম্প্রদায় লিখুন"),
  }),

  religiousPracticeLevel: yup.string().when("$activeStep", {
    is: 2,
    then: (schema) => schema.required("ধর্মীয় চর্চার স্তর নির্বাচন করুন"),
  }),

  placeOfWorshipAttendance: yup.string().when("$activeStep", {
    is: 2,
    then: (schema) => schema.required("উপাসনালয়ে যাতায়াতের তথ্য লিখুন"),
  }),

  holyBookReading: yup.string().when("$activeStep", {
    is: 2,
    then: (schema) => schema.required("ধর্মগ্রন্থ পাঠ সম্পর্কে লিখুন"),
  }),

  religiousEducation: yup.string().when("$activeStep", {
    is: 2,
    then: (schema) => schema.required("ধর্মীয় শিক্ষা লিখুন"),
  }),

  religiousDressPreference: yup.string().when("$activeStep", {
    is: 2,
    then: (schema) => schema.required("ধর্মীয় পোশাক অনুসরণ লিখুন"),
  }),

  charityActivity: yup.string().when("$activeStep", {
    is: 2,
    then: (schema) => schema.required("দান/সামাজিক কাজ সম্পর্কে লিখুন"),
  }),

  religiousOrganization: yup.string().when("$activeStep", {
    is: 2,
    then: (schema) => schema.required("ধর্মীয় সংগঠন সম্পর্কে লিখুন"),
  }),

  dietaryPractice: yup.string().when("$activeStep", {
    is: 2,
    then: (schema) => schema.required("খাদ্যনীতি অনুসরণ সম্পর্কে লিখুন"),
  }),

  futureReligiousGoal: yup.string().when("$activeStep", {
    is: 2,
    then: (schema) =>
      schema
        .required("ভবিষ্যৎ পরিকল্পনা লিখুন")
        .min(20, "কমপক্ষে ২০ অক্ষর লিখুন"),
  }),

  partnerReligiousExpectation: yup.string().when("$activeStep", {
    is: 2,
    then: (schema) =>
      schema
        .required("জীবনসঙ্গীর ধর্মীয় প্রত্যাশা লিখুন")
        .min(20, "কমপক্ষে ২০ অক্ষর লিখুন"),
  }),

  // স্টেপ ৩: শিক্ষাগত যোগ্যতা
  education: yup.mixed().when("$activeStep", {
    is: 3,
    then: (schema) =>
      schema.test(
        "education-filled",
        "শিক্ষাগত যোগ্যতা আবশ্যক",
        (v) =>
          v == null ||
          (Array.isArray(v)
            ? v.some((x) => String(x || "").trim() !== "")
            : String(v).trim() !== "")
      ),
  }),

  // স্টেপ ৪: পেশাগত তথ্য
  occupation: yup.mixed().when("$activeStep", {
    is: 4,
    then: (schema) =>
      schema.test(
        "occupation-filled",
        "আপনার পেশা লিখুন",
        (v) =>
          v == null ||
          (Array.isArray(v)
            ? v.some((x) => String(x || "").trim() !== "")
            : String(v).trim() !== "")
      ),
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
});

// স্টেপ ৮ এ যোগ হওয়া সাধারণ তথ্য (পাত্র/পাত্রী, বয়স, বিভাগ, বৈবাহিক অবস্থা)
function GeneralFields({ register, errors }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="form-control w-full">
        <label className="label">আপনি কি খুঁজছেন / আপনার পরিচয়</label>
        <select
          {...register("gender")}
          className={`select select-bordered w-full ${
            errors.gender ? "border-red-500" : ""
          }`}
        >
          <option value="">নির্বাচন করুন</option>
          <option value="MALE">পাত্র</option>
          <option value="FEMALE">পাত্রী</option>
        </select>
        {errors.gender && (
          <span className="text-red-500 text-xs mt-1">
            {errors.gender.message}
          </span>
        )}
      </div>

      <div className="form-control w-full">
        <label className="label">বৈবাহিক অবস্থা</label>
        <select
          {...register("maritalStatus")}
          className={`select select-bordered w-full ${
            errors.maritalStatus ? "border-red-500" : ""
          }`}
        >
          <option value="">নির্বাচন করুন</option>
          <option value="UNMARRIED">অবিবাহিত</option>
          <option value="DIVORCED">তালাকপ্রাপ্ত</option>
          <option value="WIDOWED">বিধবা/বিপত্নীক</option>
          <option value="OTHER">অন্যান্য</option>
        </select>
        {errors.maritalStatus && (
          <span className="text-red-500 text-xs mt-1">
            {errors.maritalStatus.message}
          </span>
        )}
      </div>

      <div className="form-control w-full">
        <label className="label">জন্মসাল (বয়স হিসাব করা হবে)</label>
        <input
          type="number"
          min={1950}
          max={2008}
          {...register("birthYear")}
          placeholder="১৯৯৮"
          className={`input input-bordered w-full ${
            errors.birthYear ? "border-red-500" : ""
          }`}
        />
        {errors.birthYear && (
          <span className="text-red-500 text-xs mt-1">
            {errors.birthYear.message}
          </span>
        )}
      </div>

      <div className="form-control w-full">
        <label className="label">বিভাগ</label>
        <select
          {...register("division")}
          className={`select select-bordered w-full ${
            errors.division ? "border-red-500" : ""
          }`}
        >
          <option value="">নির্বাচন করুন</option>
          <option value="ঢাকা">ঢাকা</option>
          <option value="চট্টগ্রাম">চট্টগ্রাম</option>
          <option value="খুলনা">খুলনা</option>
          <option value="রাজশাহী">রাজশাহী</option>
          <option value="সিলেট">সিলেট</option>
          <option value="বরিশাল">বরিশাল</option>
          <option value="রংপুর">রংপুর</option>
          <option value="ময়মনসিংহ">ময়মনসিংহ</option>
        </select>
        {errors.division && (
          <span className="text-red-500 text-xs mt-1">
            {errors.division.message}
          </span>
        )}
      </div>

      <div className="form-control w-full md:col-span-2">
        <label className="label">জেলা</label>
        <input
          {...register("district")}
          placeholder="যেমন: ঢাকা"
          className={`input input-bordered w-full ${
            errors.district ? "border-red-500" : ""
          }`}
        />
        {errors.district && (
          <span className="text-red-500 text-xs mt-1">
            {errors.district.message}
          </span>
        )}
      </div>
    </div>
  );
}

function FormContent() {
  const [activeStep, setActiveStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { formData, updateFormData } = useFormData();
  const { user } = useAuth();
  const router = useRouter();

  const steps = [
    "ব্যক্তিগত তথ্য",
    "ধর্মীয় তথ্য",
    "শিক্ষাগত তথ্য",
    "পেশাগত তথ্য",
    "পারিবারিক তথ্য",
    "যোগাযোগ তথ্য",
    "অঙ্গীকার",
    "সাধারণ তথ্য",
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: formData,
    context: { activeStep: activeStep },
    mode: "onChange",
  });

  const onNext = async (data) => {
    setSubmitError("");
    // ১. প্রথমে গ্লোবাল কনটেক্সট আপডেট করুন
    updateFormData(data);

    if (activeStep < steps.length) {
      setActiveStep((prev) => prev + 1);
      window.scrollTo(0, 0);
      return;
    }

    // শেষ ধাপ — বাস্তব ব্যাকএন্ডে জমা দিন
    if (!tokenStore.getAccess()) {
      setSubmitError("বায়োডাটা জমা দিতে আগে লগইন করুন।");
      router.push("/login");
      return;
    }

    const all = { ...formData, ...data };
    if (!all.gender || !all.maritalStatus || !all.birthYear || !all.division) {
      setSubmitError("পাত্র/পাত্রী, বৈবাহিক অবস্থা, জন্মসাল ও বিভাগ নির্বাচন করুন।");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        gender: all.gender,
        maritalStatus: all.maritalStatus,
        birthYear: Number(all.birthYear),
        division: all.division,
        district: all.district || "",
        religion: all.religion || undefined,
        sectOrDenomination: all.sectOrDenomination || undefined,
        religiousPracticeLevel: all.religiousPracticeLevel || undefined,
        placeOfWorshipAttendance: all.placeOfWorshipAttendance || undefined,
        holyBookReading: all.holyBookReading || undefined,
        religiousEducation: all.religiousEducation || undefined,
        religiousDressPreference: all.religiousDressPreference || undefined,
        charityActivity: all.charityActivity || undefined,
        religiousOrganization: all.religiousOrganization || undefined,
        dietaryPractice: all.dietaryPractice || undefined,
        futureReligiousGoal: all.futureReligiousGoal || undefined,
        partnerReligiousExpectation: all.partnerReligiousExpectation || undefined,
        clothingStyle: all.clothingStyle || undefined,
        healthCondition: all.healthCondition || undefined,
        entertainmentHabit: all.entertainmentHabit || undefined,
        politicalView: all.politicalView || undefined,
        favoriteBooksPeople: all.favoriteBooksPeople || undefined,
        aboutYourself: all.aboutYourself || undefined,
        specialCategories: all.specialCategories || undefined,
        education:
          (Array.isArray(all.education)
            ? all.education.find((x) => String(x || "").trim())
            : all.education) || undefined,
        occupation:
          (Array.isArray(all.occupation)
            ? all.occupation.find((x) => String(x || "").trim())
            : all.occupation) || undefined,
        mobile: all.mobile || all.phoneNumber || undefined,
        phoneNumber: all.phoneNumber || all.mobile || undefined,
        presentAddress: all.presentAddress || undefined,
        permanentAddress: all.permanentAddress || undefined,
        agreed: Boolean(all.agreed),
      };

      await biodataApi.create(payload);
      // অনুমোদনের জন্য জমা দিন
      await biodataApi.submit().catch(() => {});
      router.push("/profile");
    } catch (err) {
      setSubmitError(err.message || "বায়োডাটা জমা দেওয়া যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  const onError = (errors) => {
    console.log("Validation Errors:", errors);
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-red-400 text-white text-center py-8 md:py-10">
        <h1 className="text-xl md:text-2xl font-bold">বায়োডাটা তৈরি করুন </h1>
        <p className="text-xs md:text-sm mt-2">সকল পাত্র-পাত্রী তালিকা</p>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                  <div
                    key={index}
                    className="relative  mb-14 flex items-center"
                  >
                    <div className="flex-1 text-right pr-6">
                      <p
                        className={`text-xl font-semibold transition-all  ${isLast && isActive ? "text-red-500 font-bold" : isDone ? "text-green-600" : ""}`}
                      >
                        {item}
                      </p>
                    </div>
                    <div
                      className={`card rounded-full absolute right-[-18px] translate-x-1/2 z-10 w-8 h-8 flex items-center justify-center  text-white  shadow-md transition-all duration-500 ${isDone ? "bg-green-500 scale-105" : isActive ? "bg-red-500 " : "bg-gray-400"}`}
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
            {submitError && (
              <div className="alert alert-error text-sm mb-4 shadow-none">
                <span>{submitError}</span>
              </div>
            )}
            <form onSubmit={handleSubmit(onNext, onError)}>
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 border-b-3  border-red-500 inline-block uppercase tracking-wide">
                  {steps[activeStep - 1]}
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
                    <>
                      <GeneralInfo register={register} errors={errors} />
                      <div className="mt-4">
                        <GeneralFields register={register} errors={errors} />
                      </div>
                    </>
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
                  disabled={submitting}
                  className=" btn px-6 py-2 border bg-red-500 hover:bg-red-600 text-white transition font-medium shadow-none"
                >
                  {submitting
                    ? "জমা হচ্ছে..."
                    : activeStep === steps.length
                      ? "সাবমিট করুন"
                      : "পরবর্তী ধাপ"}
                </button>
              </div>
            </form>
          </div>
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