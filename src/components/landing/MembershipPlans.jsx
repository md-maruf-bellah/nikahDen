"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import SearchBar from "./SearchBar";
import { Check, X } from "lucide-react";
import { membershipApi } from "@/lib/api";

function PlanFeatures({ plan }) {
  const rows = [
    plan.canCreateBiodata !== false && { text: "ফ্রি বায়োডাটা তৈরি করতে পারবেন", ok: true },
    plan.canSendBiodata !== false && { text: "বায়োডাটা পাঠাতে পারবেন", ok: true },
    plan.canReceiveBiodata !== false && { text: "বায়োডাটা গ্রহণ করতে পারবেন", ok: true },
    plan.connectCount > 0 && { text: "কানেক্ট সংখ্যা", value: plan.connectCount },
    plan.acceptProposalLimit != null &&
      (plan.acceptProposalLimit === -1
        ? { text: "সরাসরি প্রস্তাব গ্রহণ করতে পারবেন", ok: true }
        : { text: "সরাসরি প্রস্তাব গ্রহণ (সীমা)", value: plan.acceptProposalLimit }),
  ].filter(Boolean);

  return (
    <ul className="space-y-3 ">
      {rows.map((row, i) => (
        <li key={i} className="flex gap-1.5">
          {row.ok ? (
            <Check size={19} />
          ) : row.value !== undefined ? (
            <span className="font-bold">{row.value}</span>
          ) : (
            <X size={19} className="text-gray-400" />
          )}{" "}
          <span>{row.text}</span>
        </li>
      ))}
    </ul>
  );
}

function PricingSection() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    membershipApi
      .plans()
      .then((list) => setPlans(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, []);

  const featured = plans.find((p) => p.isPopular) || plans[1];
  const rest = plans.filter((p) => p.id !== featured?.id);

  const cardClass = (i) =>
    i % 2 === 0 ? "bg-base-200" : "bg-base-200";

  return (
    <div className=" w-full  bg-[#f45f5f] py-32 px-4  ">
      <div className="pt-12 pb-32 text-center">
        <p className="text-xl font-semibold text-white mb-4">কার্যপদ্ধতি</p>
        <h1 className="text-4xl font-bold">মেম্বারশিপ প্লান</h1>
      </div>
      <div className="max-w-7xl px-0 md:px-10 mx-auto grid grid-cols-1 md:grid-cols-3  gap-4 lg:gap-0 items-center">
        {plans.length === 0 && (
          <p className="text-white/80 md:col-span-3 text-center">
            মেম্বারশিপ প্লান লোড হচ্ছে...
          </p>
        )}

        {/* LEFT CARD */}
        {rest[0] && (
          <div className={`${cardClass(0)} p-8 text-left card`}>
            <h3 className="text-[#f45f5f] text-xl font-semibold mb-2">
              {rest[0].nameBn || rest[0].name}
            </h3>
            <p className="text-2xl font-bold mb-4">
              ৳{rest[0].price.toLocaleString("bn-BD")}
            </p>
            <PlanFeatures plan={rest[0]} />
            <Link
              href={`/checkout?planId=${rest[0].id}`}
              className="btn mt-6 bg-[#f45f5f] text-white w-full py-3 shadow-none border-none"
            >
              এগিয়ে করুন
            </Link>
          </div>
        )}

        {/* MIDDLE (FEATURED) */}
        {featured && (
          <div className="relative bg-[#555555]  p-8  scale-100 md:scale-110 shadow-lg card z-10">
            <div className="absolute top-5 left-0 mb-10 bg-base-100  w-full py-2 text-lg font-medium text-center">
              পপুলার প্লান -{" "}
              <span className="text-[#f45f5f] font-bold text-2xl">
                {featured.discountPercent ? `${featured.discountPercent}%` : "প্রিয়"}{" "}
                ছাড়
              </span>
            </div>

            <h3 className="text-xl font-semibold mb-2 mt-16 text-white">
              {featured.nameBn || featured.name}
            </h3>
            <div className="flex gap-3">
              {featured.discountPercent > 0 && (
                <p className="text-lg line-through text-gray-300">
                  ৳
                  {Math.round(
                    (featured.price * 100) / (100 - featured.discountPercent)
                  ).toLocaleString("bn-BD")}
                </p>
              )}
              <p className="text-2xl font-bold mb-4 text-white">
                ৳{featured.price.toLocaleString("bn-BD")}
              </p>
            </div>

            <ul className="space-y-3 text-gray-200">
              <PlanFeatures plan={featured} />
            </ul>

            <Link
              href={`/checkout?planId=${featured.id}`}
              className="btn mt-6 bg-base-100 w-full py-3 shadow-none border-none"
            >
              এগিয়ে করুন
            </Link>
          </div>
        )}

        {/* RIGHT CARD */}
        {rest[1] && (
          <div className={`${cardClass(1)} p-8 text-left card`}>
            <h3 className="text-[#f45f5f] text-xl font-semibold mb-2">
              {rest[1].nameBn || rest[1].name}
            </h3>
            <p className="text-2xl font-bold mb-4">
              ৳{rest[1].price.toLocaleString("bn-BD")}
            </p>
            <PlanFeatures plan={rest[1]} />
            <Link
              href={`/checkout?planId=${rest[1].id}`}
              className="btn mt-6 bg-[#f45f5f] text-white w-full py-3 shadow-none border-none"
            >
              এগিয়ে করুন
            </Link>
          </div>
        )}
      </div>

      <div className="text-center mt-32">
        <Link href={"/member"} className="btn btn-outline btn-gray-100 text-lg">
          আরও প্লান দেখুন
        </Link>
      </div>
    </div>
  );
}

export default function ExportBoth() {
  return (
    <div className="relative">
      {/* SearchBar (top) */}
      <div className="relative z-10">
        <SearchBar />
      </div>

      {/* Pricing (overlap) */}
      <div className="-mt-24 md:-mt-18 relative z-0">
        <PricingSection />
      </div>
    </div>
  );
}