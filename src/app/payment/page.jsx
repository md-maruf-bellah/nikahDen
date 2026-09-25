"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { orderApi } from "@/lib/api";

function PaymentBody() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId");

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [method, setMethod] = useState("CARD");

  useEffect(() => {
    if (!orderId) return;
    orderApi
      .get(orderId)
      .then((o) => setOrder(o))
      .catch((err) => setError(err.message || "অর্ডার পাওয়া যায়নি"));
  }, [orderId]);

  const placeOrder = async () => {
    if (!order || placing) return;
    setPlacing(true);
    setError("");
    try {
      const paid = await orderApi.pay(order.id, {
        paymentMethod: method,
        transactionRef: `dev-${Date.now()}`,
      });
      router.push(`/success?orderId=${paid.id}`);
    } catch (err) {
      setError(err.message || "পেমেন্ট সম্পন্ন করা যায়নি");
    } finally {
      setPlacing(false);
    }
  };

  const total = order?.total ?? order?.item?.unitPrice ?? 0;

  return (
    <div className="min-h-screen  pb-20">
      {/* Header Section from image_c8e877.png */}
      <div className="bg-[#ff6b6b] py-10 text-center text-white mb-12">
        <h1 className="text-3xl font-bold mb-1">Payment</h1>
        <p className="text-xs tracking-wide text-red-100">Home / Payment</p>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        {/* Billing Address Section */}
        <div className="py-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Billing Address</h2>
            <Link
              href={`/checkout?planId=${order?.item?.refId || ""}`}
              className="border border-red-300 text-red-400 hover:bg-red-50 hover:text-red-500 text-xs rounded px-4 py-1.5 transition-colors cursor-pointer"
            >
              পুর্বে ফিরে যান
            </Link>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label pb-1.5 pt-0 cursor-pointer">
                  <span className="text-xs text-gray-700 font-medium">
                    First Name
                  </span>
                </label>
                <input
                  type="text"
                  defaultValue={order?.billing?.firstName || ""}
                  className="w-full text-gray-500 h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:border-red-400 text-sm"
                />
              </div>
              <div className="form-control">
                <label className="label pb-1.5 pt-0 cursor-pointer">
                  <span className="text-xs text-gray-700 font-medium">
                    Last Name
                  </span>
                </label>
                <input
                  type="text"
                  defaultValue={order?.billing?.lastName || ""}
                  className="w-full text-gray-500 h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:border-red-400 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label pb-1.5 pt-0 cursor-pointer">
                  <span className="text-xs text-gray-700 font-medium">
                    Phone
                  </span>
                </label>
                <input
                  type="text"
                  defaultValue={order?.billing?.phone || ""}
                  className="w-full text-gray-500 h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:border-red-400 text-sm"
                />
              </div>
              <div className="form-control">
                <label className="label pb-1.5 pt-0 cursor-pointer">
                  <span className="text-xs text-gray-700 font-medium">
                    E-mail
                  </span>
                </label>
                <input
                  type="email"
                  defaultValue={order?.billing?.email || ""}
                  className="w-full h-10 px-3 text-gray-500 rounded-md border border-gray-300 focus:outline-none focus:border-red-400 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Section */}
        <div className="mt-14">
          <h2 className="text-xl font-bold  mb-6">Payment Methods</h2>

          {error && (
            <div className="alert alert-error text-sm mb-4 shadow-none">
              <span>{error}</span>
            </div>
          )}

          <div className="mb-6">
            <p className=" font-bold text-sm mb-0.5">সর্বমোট</p>
            <p className="text-xl font-bold ">
              ৳ {total.toLocaleString("bn-BD")}
            </p>
            {order && (
              <p className="text-xs text-gray-400">
                অর্ডার নং {order.orderNo} • {order.item?.titleBn || order.item?.title}
              </p>
            )}
          </div>

          <div className="space-y-5">
            {/* Credit Card Option */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="CARD"
                  checked={method === "CARD"}
                  onChange={() => setMethod("CARD")}
                  className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500 cursor-pointer"
                />
                <span className="text-sm font-semibold text-gray-700">
                  Credit Card
                </span>
              </label>
            </div>

            {/* bKash / Mobile Banking Option (demo) */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="BKASH"
                  checked={method === "BKASH"}
                  onChange={() => setMethod("BKASH")}
                  className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500 cursor-pointer"
                />
                <span className="text-sm font-semibold text-gray-700">
                  bKash / মোবাইল ব্যাংকিং (ডেমো)
                </span>
              </label>
            </div>

            {/* Terms Checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500 accent-red-500 cursor-pointer"
                />
                <span className="text-gray-500 text-xs">
                  By placing an order, I agree to Nikah Deen terms of sale
                </span>
              </label>
            </div>
          </div>

          {/* Place Order Button */}
          <button
            onClick={placeOrder}
            disabled={!order || placing}
            className="block w-full bg-[#ff6b6b] hover:bg-red-600 text-white font-medium py-3 rounded-md mt-8 text-center text-sm transition-colors shadow-sm cursor-pointer disabled:opacity-60"
          >
            {placing ? "পেমেন্ট প্রসেস হচ্ছে..." : "Place an Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={null}>
      <PaymentBody />
    </Suspense>
  );
}