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
} from "./AllComponent";
import { Check } from "lucide-react";
import { biodataApi, tokenStore } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// উইজার্ডে সংগৃহীত সব ফিল্ড → ব্যাকএন্ড biodataSchema-এর ফিল্ডে ম্যাপিং।
// ফাঁকা মানগুলো undefined করা হয় যাতে ব্যাকএন্ড ডিফল্ট প্রয়োগ করতে পারে।
function buildPayload(all, user) {
  const num = (v) => (v !== "" && v != null && Number.isFinite(Number(v)) ? Number(v) : undefined);
  const str = (v) => (v ? v : undefined);
  return {
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    // সাধারণ তথ্য (স্টেপ ৮)
    gender: all.gender,
    maritalStatus: all.maritalStatus,
    birthYear: num(all.birthYear),
    division: all.division,
    district: str(all.district),
    // স্টেপ ১ — ব্যক্তিগত
    clothingStyle: str(all.clothingStyle),
    healthCondition: str(all.healthCondition),
    entertainmentHabit: str(all.entertainmentHabit),
    politicalView: str(all.politicalView),
    favoriteBooksPeople: str(all.favoriteBooksPeople),
    aboutYourself: str(all.aboutYourself),
    specialCategories: str(all.specialCategories),
    phoneNumber: str(all.phoneNumber),
    // স্টেপ ২ — ধর্মীয়
    religion: all.religion || undefined,
    sectOrDenomination: str(all.sectOrDenomination),
    religiousPracticeLevel: all.religiousPracticeLevel || undefined,
    placeOfWorshipAttendance: str(all.placeOfWorshipAttendance),
    holyBookReading: str(all.holyBookReading),
    religiousEducation: str(all.religiousEducation),
    religiousDressPreference: str(all.religiousDressPreference),
    charityActivity: str(all.charityActivity),
    religiousOrganization: str(all.religiousOrganization),
    dietaryPractice: str(all.dietaryPractice),
    futureReligiousGoal: str(all.futureReligiousGoal),
    partnerReligiousExpectation: str(all.partnerReligiousExpectation),
    // স্টেপ ৩ — শিক্ষাগত
    education: str(all.education),
    degree: str(all.degree),
    institution: str(all.institution),
    board: str(all.board),
    subject: str(all.subject),
    result: str(all.result),
    passingYear: str(all.passingYear),
    deeniEducation: str(all.deeniEducation),
    // স্টেপ ৪ — পেশাগত
    occupation: str(all.occupation),
    occupationDetails: str(all.occupationDetails),
    monthlyIncome: num(all.monthlyIncome),
    company: str(all.company),
    experienceYears: str(all.experienceYears),
    // স্টেপ ৫ — পারিবারিক
    fatherName: str(all.fatherName),
    fatherOccupation: str(all.fatherOccupation),
    motherName: str(all.motherName),
    motherOccupation: str(all.motherOccupation),
    siblings: str(all.siblings),
    // স্টেপ ৬ — যোগাযোগ
    mobile: str(all.mobile || all.phoneNumber),
    presentAddress: str(all.presentAddress),
    permanentAddress: str(all.permanentAddress),
    // স্টেপ ৭ — অঙ্গীকার
    agreed: Boolean(all.agreed),
  };
}

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

  // স্টেপ ৩: শিক্ষাগত যোগ্যতা — education ঘরটি আবশ্যক, বাকি ঘরগুলো ঐচ্ছিক
  education: yup.string().when("$activeStep", {
    is: 3,
    then: (schema) => schema.trim().required("আপনার শিক্ষা মাধ্যম লিখুন"),
    otherwise: (schema) => schema.notRequired(),
  }),

  // স্টেপ ৪: পেশাগত তথ্য — occupation আবশ্যক, মাসিক আয় ঐচ্ছিক সংখ্যা
  occupation: yup.string().when("$activeStep", {
    is: 4,
    then: (schema) => schema.trim().required("আপনার পেশা লিখুন"),
    otherwise: (schema) => schema.notRequired(),
  }),

  monthlyIncome: yup
    .mixed()
    .test(
      "income-number",
      "সঠিক সংখ্যায় মাসিক আয় লিখুন",
      (v) => v === "" || v == null || Number.isFinite(Number(v))
    ),

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

// স্টেপ কনফিগ — শিরোনাম + রেন্ডারার এক জায়গায়; নতুন স্টেপ যোগ করতে
// শুধু এখানে এন্ট্রি যোগ করলেই হবে (স্টেপার UI এই অ্যারে থেকেই আঁকা হয়)।
const STEP_COMPONENTS = {
  1: { title: "ব্যক্তিগত তথ্য", render: ({ register, errors }) => <PersonalInfo register={register} errors={errors} /> },
  2: { title: "ধর্মীয় তথ্য", render: ({ register, errors }) => <ReligiousInfo register={register} errors={errors} /> },
  3: { title: "শিক্ষাগত তথ্য", render: ({ register, errors }) => <EducationalInfo register={register} errors={errors} /> },
  4: { title: "পেশাগত তথ্য", render: ({ register, errors }) => <ProfessionalInfo register={register} errors={errors} /> },
  5: { title: "পারিবারিক তথ্য", render: ({ register, errors }) => <FamilyInfo register={register} errors={errors} /> },
  6: { title: "যোগাযোগ তথ্য", render: ({ register, errors }) => <ContactInfo register={register} errors={errors} /> },
  7: { title: "অঙ্গীকার", render: ({ register, errors }) => <AgreementInfo register={register} errors={errors} /> },
  8: { title: "সাধারণ তথ্য", render: ({ register, errors }) => <GeneralFields register={register} errors={errors} /> },
};
const TOTAL_STEPS = Object.keys(STEP_COMPONENTS).length;

function FormContent() {
  const [activeStep, setActiveStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { formData, updateFormData } = useFormData();
  const { user } = useAuth();
  const router = useRouter();

  const steps = Object.values(STEP_COMPONENTS).map((s) => s.title);

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

  const goToStep = (next) => {
    setActiveStep(next);
    window.scrollTo(0, 0);
  };

  // ভুল থাকা প্রথম ফিল্ডে ফোকাস করাই স্ক্রল করে দেখায় — ইউজার বুঝতে পারে কোথায় সমস্যা।
  const onError = (formErrors) => {
    const firstKey = Object.keys(formErrors)[0];
    if (firstKey) {
      const el = document.querySelector(`[name="${firstKey}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus?.({ preventScroll: true });
    }
  };

  const onNext = async (data) => {
    setSubmitError("");
    // ১. প্রথমে গ্লোবাল কনটেক্সট আপডেট করুন
    updateFormData(data);

    if (activeStep < TOTAL_STEPS) {
      goToStep(activeStep + 1);
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
      await biodataApi.create(buildPayload(all, user));
      // অনুমোদনের জন্য জমা দিন
      await biodataApi.submit().catch(() => {});
      router.push("/profile");
    } catch (err) {
      setSubmitError(err.message || "বায়োডাটা জমা দেওয়া যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
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
                  {STEP_COMPONENTS[activeStep].title}
                </h2>

                <div className="mt-2">
                  {STEP_COMPONENTS[activeStep].render({ register, errors })}
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
                    : activeStep === TOTAL_STEPS
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