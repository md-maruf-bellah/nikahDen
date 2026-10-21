"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, CreditCard, History, Loader2, Zap } from "lucide-react";
import { membershipApi, biodataApi } from "@/lib/api";
import { ledgerEntry } from "@/lib/connects.core.mjs";
import CompletionCard from "../biodata/CompletionCard";

const MembershipDashboard = () => {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState(null);
  const [data, setData] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [packs, setPacks] = useState([]);
  const [ledger, setLedger] = useState(null); // null = not fetched yet
  const [ledgerLoading, setLedgerLoading] = useState(false);

  useEffect(() => {
    membershipApi
      .mine()
      .then(setData)
      .catch(() => {});
    // হালকা এন্ডপয়েন্ট — ড্যাশবোর্ডের কমপ্লিশন রিং
    biodataApi
      .completion()
      .then((d) => setCompletion(d.hasBiodata ? d : null))
      .catch(() => {});
    // কেনার প্যাক তালিকা — চেকআউটে পাঠানোর জন্য (সার্ভারেই সক্রিয় প্যাক ফিল্টার)
    membershipApi
      .packs()
      .then((p) => setPacks(Array.isArray(p) ? p : []))
      .catch(() => setPacks([]));
  }, []);

  // কানেক্ট হিস্ট্রি খোলা হলে একবার লোড — আসল লেজার (পে-করা ক্রেডিট/খরচ), সিড করা ডেটা নয়
  useEffect(() => {
    if (activeModal !== "ledger" || ledger !== null || ledgerLoading) return;
    setLedgerLoading(true);
    membershipApi
      .ledger({ limit: 15 })
      .then((res) => setLedger(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setLedger([]))
      .finally(() => setLedgerLoading(false));
  }, [activeModal, ledger, ledgerLoading]);

  const plan = data?.subscription?.plan;
  const isActive = data?.subscription?.isActive;
  const daysLeft = data?.subscription?.daysLeft ?? 0;
  const connects = data?.connects?.balance ?? 0;
  const stats = data?.stats || { biodataVisits: 0, likesReceived: 0, likesSent: 0 };

  const statRows = [
    { label: "বায়োডাটা ভিজিট সংখ্যা", value: stats.biodataVisits },
    { label: "আপনার পছন্দকৃত বায়োডাটা সংখ্যা", value: stats.likesSent },
    { label: "আপনার বায়োডাটা যত জন পছন্দ করেছেন", value: stats.likesReceived },
  ];

  return (
    <div className="min-h-screenp-4 ">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* --- Profile Completion --- */}
        {completion && (
          <section>
            <h2 className="text-xl font-bold mb-4">প্রোফাইল কমপ্লিশন</h2>
            <CompletionCard
              report={completion}
              compact
              onEditSection={() => {
                // ড্যাশবোর্ড ট্যাব স্টেট শেয়ার করে না; বায়োডাটা ট্যাবে পাঠাই
                window.dispatchEvent(new CustomEvent("open-biodata-tab"));
              }}
            />
          </section>
        )}

        {/* --- Membership & Package Section --- */}
        <section>
          <h2 className="text-xl font-bold  mb-4">মেম্বারশীপ এবং প্যাকেজ</h2>
          <div className="rounded border  border-primary/15 overflow-hidden">
            {/* Current Package */}
            <div className="p-6 border-b border-red-50">
              <p className=" mb-2">বর্তমান প্যাকেজ</p>
              <p className="text-red-500 font-bold text-lg mb-1">
                {plan?.nameBn || plan?.name || "কোনো প্যাকেজ নেই"}
              </p>
              {data?.subscription && (
                <p className="text-xs text-gray-500 mb-4">
                  {isActive ? `${daysLeft} দিন বাকি` : "মেয়াদ শেষ"} •{" "}
                  {new Date(data.subscription.expiresAt).toLocaleDateString("bn-BD")}
                </p>
              )}
              {!data?.subscription && (
                <p className="text-xs text-gray-500 mb-4">
                  মেম্বারশিপ কিনে কানেক্ট ও পূর্ণ সুবিধা নিন
                </p>
              )}
              <button
                onClick={() => setActiveModal("package")}
                className="btn btn-outline btn-error btn-sm  px-6 normal-case"
              >
                প্যাকেজ পরিবর্তন করুন
              </button>
            </div>

            {/* Connection Status */}
            <div className="p-6">
              <p className=" mb-2">কানেক্ট অবশিষ্ট রয়েছে</p>
              <p className="text-red-500 font-bold text-2xl mb-4">{connects}</p>
              <p className="text-sm mb-6 leading-relaxed">
                প্রতিটি বায়োডাটা দেখতে ১ টি করে কানেক্টে ব্যবহার হবে।
                <button
                  type="button"
                  onClick={() => setActiveModal("ledger")}
                  className="text-red-400 cursor-pointer hover:underline ml-1"
                >
                  বিস্তারিত দেখুন
                </button>
                ।
              </p>
              <button
                onClick={() => setActiveModal("connect")}
                className="btn btn-outline btn-error btn-sm  px-6 normal-case"
              >
                কানেক্ট কিনুন
              </button>
            </div>
          </div>
        </section>

        {/* --- Biodata Stats Section --- */}
        <section>
          <h2 className="text-xl font-bold  mb-4">বায়োডাটা স্টেট্</h2>
          <div className="rounded border  border-primary/15 overflow-hidden divide-y divide-gray-400">
            {statRows.map((item, index) => (
              <div key={index} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <p className=" font-medium max-w-[60%]">{item.label}</p>
                  <div className="dropdown dropdown-end">
                    <label
                      tabIndex={0}
                      className="btn btn-ghost btn-xs border border-red-200 text-red-400 hover:bg-red-50 rounded-md font-normal px-2"
                    >
                      সর্বশেষ ৭ দিন <ChevronDown size={14} className="ml-1" />
                    </label>
                  </div>
                </div>
                <p className="text-red-500 font-bold text-2xl">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* --- DaisyUI Modals --- */}

      {/* Package Change Modal */}
      <input
        type="checkbox"
        className="modal-toggle"
        checked={activeModal === "package"}
        readOnly
      />
      <div className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Zap className="text-red-500" /> প্যাকেজ পরিবর্তন করুন
          </h3>
          <p className="py-4 ">
            আপনি কি আপনার বর্তমান{' '}
            <span className="font-bold">
              {plan?.nameBn || plan?.name || "প্যাকেজ"}
            </span>{' '}
            পরিবর্তন করে অন্য কোনো প্যাকেজ নিতে চান?
          </p>
          <div className="modal-action">
            <button
              className="btn btn-ghost"
              onClick={() => setActiveModal(null)}
            >
              বাতিল
            </button>
            <button
              className="btn btn-error text-white"
              onClick={() => router.push("/member")}
            >
              প্যাকেজ দেখুন
            </button>
          </div>
        </div>
        <label className="modal-backdrop" onClick={() => setActiveModal(null)}>
          Close
        </label>
      </div>

      {/* Buy Connect Modal — সরাসরি প্যাক সিলেক্ট করে চেকআউটে যায় */}
      <input
        type="checkbox"
        className="modal-toggle"
        checked={activeModal === "connect"}
        readOnly
      />
      <div className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <CreditCard className="text-red-500" /> নতুন কানেক্ট কিনুন
          </h3>
          <p className="pt-3 pb-1 text-sm text-gray-600">
            আপনার বর্তমান ব্যালেন্স:{" "}
            <span className="font-bold text-red-500">{connects}</span> — কানেক্ট
            চেকআউট পে করে কেনা যায়; পেমেন্ট সফল হলেই ব্যালেন্সে যোগ হবে।
          </p>

          {packs.length > 0 ? (
            <ul className="mt-3 space-y-2 max-h-64 overflow-y-auto">
              {packs.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 border border-red-100 rounded-md px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold">{p.nameBn || p.name}</p>
                    <p className="text-xs text-gray-500">{p.connects} কানেক্ট</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-red-500">
                      ৳{(p.price || 0).toLocaleString("bn-BD")}
                    </span>
                    <button
                      className="btn btn-error btn-sm text-white normal-case px-4"
                      onClick={() => router.push(`/checkout?packId=${p.id}`)}
                    >
                      কিনুন
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-sm text-gray-500">
              এখন কোনো সক্রিয় কানেক্ট প্যাক নেই। চেকআউট থেকে দেখে আসতে পারেন।
            </p>
          )}

          <div className="modal-action">
            <button
              className="btn btn-ghost"
              onClick={() => setActiveModal(null)}
            >
              বাতিল
            </button>
            <button
              className="btn btn-outline btn-error text-red-500"
              onClick={() => router.push("/checkout?kind=PACK")}
            >
              চেকআউটে যান
            </button>
          </div>
        </div>
        <label className="modal-backdrop" onClick={() => setActiveModal(null)}>
          Close
        </label>
      </div>

      {/* Connect Ledger Modal — আসল লেনদেনের হিস্ট্রি */}
      <input
        type="checkbox"
        className="modal-toggle"
        checked={activeModal === "ledger"}
        readOnly
      />
      <div className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <History className="text-red-500" /> কানেক্ট হিস্ট্রি
          </h3>

          {ledgerLoading ? (
            <p className="py-5 text-sm text-gray-500 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" /> লোড হচ্ছে...
            </p>
          ) : ledger?.length ? (
            <ul className="mt-3 divide-y divide-red-50 max-h-72 overflow-y-auto">
              {ledger.map((row) => {
                const entry = ledgerEntry(row);
                return (
                  <li
                    key={entry.id}
                    className="py-2 flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{entry.label}</p>
                      <p className="text-xs text-gray-500">
                        {entry.createdAt
                          ? new Date(entry.createdAt).toLocaleDateString("bn-BD")
                          : ""}
                        {entry.reason ? ` • ${entry.reason}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-bold ${
                          entry.credited ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {entry.amount > 0 ? "+" : ""}
                        {entry.amount}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        ব্যালেন্স {entry.balanceAfter}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-5 text-sm text-gray-500">
              এখনো কোনো কানেক্ট লেনদেন নেই — প্যাক কিনে শুরু করুন।
            </p>
          )}

          <div className="modal-action">
            <button
              className="btn btn-ghost"
              onClick={() => setActiveModal(null)}
            >
              বাতিল
            </button>
            <button
              className="btn btn-error text-white"
              onClick={() => {
                setActiveModal(null);
                router.push("/checkout?kind=PACK");
              }}
            >
              কানেক্ট কিনুন
            </button>
          </div>
        </div>
        <label className="modal-backdrop" onClick={() => setActiveModal(null)}>
          Close
        </label>
      </div>
    </div>
  );
};

export default MembershipDashboard;