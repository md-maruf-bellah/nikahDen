"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { orderApi } from "@/lib/api";

function SuccessBody() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;
    orderApi
      .get(orderId)
      .then((o) => setOrder(o))
      .catch((err) => setError(err.message || "অর্ডার পাওয়া যায়নি"));
  }, [orderId]);

  const paid = order?.status === "PAID";

  return (
    <div className="min-h-screen  pb-20">
      {/* Header Banner Section */}
      <div className="bg-[#ff6b6b] py-10 text-center text-white mb-24">
        <h1 className="text-3xl font-bold mb-1">Thank You</h1>
        <p className="text-xs tracking-wide text-red-100">
          Home / <span className="font-semibold text-white">Thank You</span>
        </p>
      </div>

      {/* Success Content Area */}
      <div className="flex flex-col items-center justify-center text-center px-4">
        {/* Animated/Styled Red Success Checkmark */}
        <div className="mb-6 text-[#ff6b6b]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.8"
            stroke="currentColor"
            className="w-16 h-16"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>

        {/* Success Message Headlines */}
        <h2 className="text-2xl font-bold  mb-2 tracking-wide">
          {paid ? "Payment Successfully Completed" : error ? "অর্ডার পাওয়া যায়নি" : "Payment Successfully Completed"}
        </h2>
        <p className="text-sm text-gray-500 font-medium">
          {order
            ? `অর্ডার নং ${order.orderNo} • ${order.item?.titleBn || order.item?.title} • ৳${order.total.toLocaleString("bn-BD")}`
            : "Thanks for the upgrade membership"}
        </p>

        <div className="flex gap-4 mt-8">
          <Link href="/profile" className="btn bg-[#ff6b6b] border-none text-white">
            প্রোফাইলে যান
          </Link>
          <Link href="/list" className="btn btn-outline">
            বায়োডাটা দেখুন
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={null}>
      <SuccessBody />
    </Suspense>
  );
}