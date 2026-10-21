"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2 } from "lucide-react";
import { membershipApi } from "@/lib/api";
import { connectCountOf } from "@/lib/connects.core.mjs";

/**
 * শুধু কানেক্ট কিনুন — the seeker-facing connect-pack shelf.
 *
 * Packs come from GET /membership/packs (active-only) and every "কিনুন"
 * hands off to /checkout?packId=… so connects are always bought through the
 * real order flow — the balance is the purchase-driven ledger, nothing seeded.
 */
export default function ConnectPackShop() {
  const router = useRouter();
  const [packs, setPacks] = useState(null); // null = loading

  useEffect(() => {
    membershipApi
      .packs()
      .then((p) => setPacks(Array.isArray(p) ? p : []))
      .catch(() => setPacks([]));
  }, []);

  return (
    <section className="pt-10 pb-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h2 className="text-xl font-bold">শুধু কানেক্ট কিনুন</h2>
        <p className="text-xs text-gray-500">
          চেকআউট করে পেমেন্ট সফল হলেই ব্যালেন্সে যোগ হবে — প্রতিটি পূর্ণ
          বায়োডাটা দেখতে ১টি কানেক্ট লাগে।
        </p>
      </div>

      {packs === null ? (
        <p className="text-sm text-gray-500 flex items-center gap-2 py-6">
          <Loader2 size={16} className="animate-spin" /> প্যাক লোড হচ্ছে...
        </p>
      ) : packs.length === 0 ? (
        <p className="text-sm text-gray-500 py-6">
          এখন কোনো সক্রিয় কানেক্ট প্যাক নেই।
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {packs.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-red-100 bg-[#fff5f5] p-5 flex flex-col gap-2 shadow-sm"
            >
              <div className="flex items-center gap-2 text-[#ff6b6b]">
                <CreditCard size={18} />
                <span className="font-bold text-sm">{p.nameBn || p.name}</span>
              </div>
              <p className="text-2xl font-black text-gray-800">
                ৳{(p.price || 0).toLocaleString("bn-BD")}
              </p>
              <p className="text-xs text-gray-500">
                {connectCountOf(p)} কানেক্ট
              </p>
              <button
                type="button"
                onClick={() => router.push(`/checkout?packId=${p.id}`)}
                className="btn btn-outline border-[#ff6b6b] text-[#ff6b6b] hover:bg-[#ff6b6b] hover:text-white text-xs normal-case mt-auto py-2 rounded-md shadow-sm bg-white"
              >
                কিনুন
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
