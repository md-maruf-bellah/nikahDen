"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { membershipApi, orderApi, tokenStore } from "@/lib/api";

function CheckoutBody() {
  const router = useRouter();
  const params = useSearchParams();
  const planIdParam = params.get("planId");

  const [plans, setPlans] = useState([]);
  const [plan, setPlan] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    membershipApi
      .plans()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setPlans(arr);
        const selected = arr.find((p) => p.id === planIdParam) || arr[0] || null;
        setPlan(selected);
      })
      .catch(() => setError("মেম্বারশিপ প্লান লোড করা যায়নি"))
      .finally(() => setLoading(false));
  }, [planIdParam]);

  if (!tokenStore.getAccess() && !loading) {
    router.replace("/login");
  }

  const applyCoupon = async () => {
    setCouponMsg("");
    if (!couponCode.trim()) return;
    try {
      const c = await orderApi.validateCoupon(couponCode.trim());
      setCoupon(c);
      setCouponMsg("কুপন প্রয়োগ হয়েছে");
    } catch (err) {
      setCoupon(null);
      setCouponMsg(err.message || "কুপনটি সঠিক নয়");
    }
  };

  const discount = coupon && plan ? Math.floor((plan.price * coupon.discountPercent) / 100) : 0;
  const total = plan ? plan.price - discount : 0;

  const placeOrder = async () => {
    if (!plan || placing) return;
    setPlacing(true);
    setError("");
    try {
      const order = await orderApi.create({
        kind: "PLAN",
        planId: plan.id,
        couponCode: coupon ? coupon.code : null,
      });
      router.push(`/payment?orderId=${order.id}`);
    } catch (err) {
      setError(err.message || "অর্ডার তৈরি করা যায়নি। লগইন করা আছে কি না দেখুন।");
      if (err.status === 401) router.replace("/login");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen  pb-20">
      {/* Header Section */}
      <div className="bg-[#ff6b6b] py-10 text-center text-white mb-12">
        <h1 className="text-3xl font-bold mb-1 tracking-wide">Check Out</h1>
        <p className="text-xs text-red-100 opacity-90">Home / Check out</p>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Plan Details */}
          <div className="lg:col-span-2">
            <div className="bg-[#fff5f5] rounded-md p-8 border border-red-50/50 shadow-sm">
              {/* Table Header */}
              <div className="flex justify-between pb-3 mb-6">
                <span className="text-[#ff6b6b] font-bold text-sm">প্লান</span>
                <span className="text-[#ff6b6b] font-bold text-sm mr-24">
                  মূল্য
                </span>
              </div>

              {loading && (
                <p className="text-gray-400 text-sm">প্লান লোড হচ্ছে...</p>
              )}
              {!loading && plans.length > 0 && (
                <>
                  <select
                    value={plan?.id || ""}
                    onChange={(e) => {
                      setPlan(plans.find((p) => p.id === e.target.value));
                      setCoupon(null);
                    }}
                    className="select select-bordered w-full mb-4 text-sm"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nameBn || p.name} — ৳{p.price}
                      </option>
                    ))}
                  </select>

                  {/* Item Row */}
                  {plan && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-800 font-bold text-sm">
                        {plan.nameBn || plan.name}
                      </span>
                      <div className="flex items-center gap-24">
                        <span className="text-gray-800 font-bold text-sm">
                          ৳ {plan.price.toLocaleString("bn-BD")}
                        </span>
                        <button
                          onClick={() => setPlan(null)}
                          className="text-gray-400 hover:text-red-500 transition-colors text-xs font-semibold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {!loading && plans.length === 0 && (
                <p className="text-gray-400 text-sm">
                  কোনো সক্রিয় প্লান নেই।
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between mt-16">
                <Link
                  href="/member"
                  className="border border-red-200 text-red-400 hover:bg-red-50 text-xs rounded px-4 py-1.5 transition-colors cursor-pointer bg-white"
                >
                  পূর্বে ফিরে যান
                </Link>
                {plan && (
                  <button
                    onClick={() => setPlan(plans.find((p) => p.id === planIdParam) || plans[0])}
                    className="border border-red-200 text-red-400 hover:bg-red-50 text-xs rounded px-4 py-1.5 transition-colors cursor-pointer bg-white"
                  >
                    আপডেট করুন
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#fff5f5] rounded-md p-6 border border-red-50/50 shadow-sm">
              <h2 className="text-sm font-bold text-gray-800 mb-5 pb-3 border-b border-red-100/60">
                অর্ডার বিবরণ
              </h2>

              {error && (
                <div className="alert alert-error text-xs py-2 mb-3 shadow-none">
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between text-gray-600 text-xs font-medium">
                  <span>{plan?.nameBn || plan?.name || "—"}</span>
                  <span>৳ {(plan?.price || 0).toLocaleString("bn-BD")}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-xs font-medium pb-1 border-b border-red-100/60">
                  <span>ডিসকাউন্ট</span>
                  <span>৳ {discount.toLocaleString("bn-BD")}</span>
                </div>

                <p className="text-[10px] text-gray-400 italic">
                  Taxes and Shipping are calculated.
                </p>

                {/* Coupon Input */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="কুপন কোড"
                    className="w-full bg-white/70 border border-red-100/50 rounded px-3 py-2 text-xs focus:outline-none focus:border-red-300 placeholder-gray-300"
                  />
                  <button
                    onClick={applyCoupon}
                    className="bg-red-100/70 hover:bg-red-200/80 text-red-400 font-bold text-xs px-4 rounded transition-colors cursor-pointer whitespace-nowrap"
                  >
                    এপ্লাই
                  </button>
                </div>
                {couponMsg && (
                  <p className="text-[11px] text-gray-500">{couponMsg}</p>
                )}

                <div className="flex justify-between font-bold text-gray-800 border-t border-red-100/60 pt-4 text-xs">
                  <span>সর্বমোট</span>
                  <span>৳ {total.toLocaleString("bn-BD")}</span>
                </div>

                <button
                  onClick={placeOrder}
                  disabled={!plan || placing}
                  className="block w-full text-center bg-[#ff6b6b] hover:bg-red-500 text-white font-medium py-2.5 rounded-md mt-6 text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {placing ? "অর্ডার তৈরি হচ্ছে..." : "Process To Checkout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutBody />
    </Suspense>
  );
}