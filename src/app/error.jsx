"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * রুট-লেভেল error boundary — রেন্ডার-সময়ের অপ্রত্যাশিত ত্রুটি ধরে ফ্যালব্যাক দেখায়।
 * Next ১৬.২+ `unstable_retry` দিয়ে সেগমেন্ট আবার রেন্ডার/রিফেচ হয়; ত্রুটি কনসোলে লগ হয়।
 */
export default function Error({ error, unstable_retry }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-bold md:text-3xl">কিছু একটা ভুল হয়েছে</h1>
      <p className="mt-3 max-w-md text-gray-500">
        অপ্রত্যাশিত সমস্যা ঘটেছে। আবার চেষ্টা করুন, নইলে কিছুক্ষণ পরে ফিরে
        আসুন।
        {error?.digest ? ` (ত্রুটি কোড: ${error.digest})` : ""}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="btn bg-[#FD6969] hover:bg-[#e85a5a] border-none text-white"
        >
          আবার চেষ্টা করুন
        </button>
        <Link
          href="/"
          className="btn btn-outline border-[#FD6969] text-[#FD6969] hover:bg-[#FD6969] hover:border-[#FD6969] hover:text-white"
        >
          হোমে ফিরে যান
        </Link>
      </div>
    </main>
  );
}
