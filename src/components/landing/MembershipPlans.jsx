"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import SearchBar from "./SearchBar";
import { Check, X } from "lucide-react";
import { membershipApi } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";

function PlanFeatures({ plan, language }) {
  const isEn = language === "en";
  const isAr = language === "ar";

  const rows = [
    plan.canCreateBiodata !== false && {
      text: isEn ? "Create Free Biodata" : isAr ? "إنشاء سيرة ذاتية مجاناً" : "ফ্রি বায়োডাটা তৈরি করতে পারবেন",
      ok: true,
    },
    plan.canSendBiodata !== false && {
      text: isEn ? "Send Biodata Proposals" : isAr ? "إرسال طلبات السيرة الذاتية" : "বায়োডাটা পাঠাতে পারবেন",
      ok: true,
    },
    plan.canReceiveBiodata !== false && {
      text: isEn ? "Receive Proposals" : isAr ? "استلام عروض الزواج" : "বায়োডাটা গ্রহণ করতে পারবেন",
      ok: true,
    },
    plan.connectCount > 0 && {
      text: isEn ? "Direct Contact Connects" : isAr ? "نقاط التواصل المباشر" : "কানেক্ট সংখ্যা",
      value: plan.connectCount,
    },
    plan.acceptProposalLimit != null &&
      (plan.acceptProposalLimit === -1
        ? {
            text: isEn ? "Direct Proposal Acceptance" : isAr ? "قبول العروض غير محدود" : "সরাসরি প্রস্তাব গ্রহণ করতে পারবেন",
            ok: true,
          }
        : {
            text: isEn ? "Proposal Accept Limit" : isAr ? "حد قبول العروض" : "সরাসরি প্রস্তাব গ্রহণ (সীমা)",
            value: plan.acceptProposalLimit,
          }),
  ].filter(Boolean);

  return (
    <ul className="space-y-3">
      {rows.map((row, i) => (
        <li key={i} className="flex gap-1.5 items-center">
          {row.ok ? (
            <Check size={19} className="text-[#fd6969] shrink-0" />
          ) : row.value !== undefined ? (
            <span className="font-bold text-[#fd6969]">{row.value}</span>
          ) : (
            <X size={19} className="text-gray-400 shrink-0" />
          )}{" "}
          <span className="text-sm">{row.text}</span>
        </li>
      ))}
    </ul>
  );
}

function PricingSection() {
  const { t, language } = useLanguage();
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    membershipApi
      .plans()
      .then((list) => setPlans(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, []);

  const featured = plans.find((p) => p.isPopular) || plans[1];
  const rest = plans.filter((p) => p.id !== featured?.id);

  const formatPrice = (p) => {
    if (language === "bn") return `৳${Number(p).toLocaleString("bn-BD")}`;
    if (language === "ar") return `${Number(p).toLocaleString("ar-EG")} تاكا`;
    return `BDT ${Number(p).toLocaleString("en-US")}`;
  };

  const getPlanName = (p) => {
    if (!p) return "";
    if (language === "bn") return p.nameBn || p.name;
    return p.name || p.nameBn;
  };

  return (
    <div className="w-full bg-[#f45f5f] py-32 px-4 text-white">
      <div className="pt-12 pb-32 text-center">
        <p className="text-xl font-semibold text-white/90 mb-4">{t("plans.badge", "কার্যপদ্ধতি")}</p>
        <h2 className="text-4xl font-bold">{t("plans.title", "মেম্বারশিপ প্লান")}</h2>
      </div>
      <div className="max-w-7xl px-0 md:px-10 mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-0 items-center">
        {plans.length === 0 && (
          <p className="text-white/80 md:col-span-3 text-center">{t("common.loading", "মেম্বারশিপ প্লান লোড হচ্ছে...")}</p>
        )}

        {/* LEFT CARD */}
        {rest[0] && (
          <div className="bg-base-100 text-base-content p-8 text-left card shadow-lg">
            <h3 className="text-[#f45f5f] text-xl font-semibold mb-2">{getPlanName(rest[0])}</h3>
            <p className="text-2xl font-bold mb-4">{formatPrice(rest[0].price)}</p>
            <PlanFeatures plan={rest[0]} language={language} />
            <Link
              href={`/checkout?planId=${rest[0].id}`}
              className="btn mt-6 bg-[#f45f5f] text-white w-full py-3 shadow-none border-none hover:bg-[#e05858]"
            >
              {t("plans.choosePlan", "এগিয়ে যান")}
            </Link>
          </div>
        )}

        {/* MIDDLE (FEATURED) */}
        {featured && (
          <div className="relative bg-[#555555] text-white p-8 scale-100 md:scale-110 shadow-2xl card z-10 border-2 border-white/20">
            <div className="absolute top-5 left-0 mb-10 bg-base-100 text-base-content w-full py-2 text-lg font-medium text-center">
              {t("plans.popular", "পপুলার প্লান")} -{" "}
              <span className="text-[#f45f5f] font-bold text-2xl">
                {featured.discountPercent ? `${featured.discountPercent}%` : "★"}{" "}
                {language === "en" ? "OFF" : language === "ar" ? "خصم" : "ছাড়"}
              </span>
            </div>

            <h3 className="text-xl font-semibold mb-2 mt-16 text-white">{getPlanName(featured)}</h3>
            <div className="flex gap-3 items-center">
              {featured.discountPercent > 0 && (
                <p className="text-lg line-through text-gray-300">
                  {formatPrice(Math.round((featured.price * 100) / (100 - featured.discountPercent)))}
                </p>
              )}
              <p className="text-2xl font-bold mb-4 text-white">{formatPrice(featured.price)}</p>
            </div>

            <PlanFeatures plan={featured} language={language} />

            <Link
              href={`/checkout?planId=${featured.id}`}
              className="btn mt-6 bg-[#fd6969] text-white hover:bg-white hover:text-[#fd6969] w-full py-3 shadow-none border-none"
            >
              {t("plans.choosePlan", "এগিয়ে যান")}
            </Link>
          </div>
        )}

        {/* RIGHT CARD */}
        {rest[1] && (
          <div className="bg-base-100 text-base-content p-8 text-left card shadow-lg">
            <h3 className="text-[#f45f5f] text-xl font-semibold mb-2">{getPlanName(rest[1])}</h3>
            <p className="text-2xl font-bold mb-4">{formatPrice(rest[1].price)}</p>
            <PlanFeatures plan={rest[1]} language={language} />
            <Link
              href={`/checkout?planId=${rest[1].id}`}
              className="btn mt-6 bg-[#f45f5f] text-white w-full py-3 shadow-none border-none hover:bg-[#e05858]"
            >
              {t("plans.choosePlan", "এগিয়ে যান")}
            </Link>
          </div>
        )}
      </div>

      <div className="text-center mt-32">
        <Link href="/member" className="btn btn-outline text-white border-white text-lg hover:bg-white hover:text-[#f45f5f]">
          {t("common.viewAll", "আরও প্লান দেখুন")}
        </Link>
      </div>
    </div>
  );
}

export default function ExportBoth() {
  return (
    <div className="relative">
      <div className="relative z-10">
        <SearchBar />
      </div>
      <div className="-mt-24 md:-mt-18 relative z-0">
        <PricingSection />
      </div>
    </div>
  );
}