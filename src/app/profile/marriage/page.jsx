"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  HeartHandshake,
  ShieldCheck,
  EyeOff,
  Eye,
  Calendar,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { marriageApi } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";

export default function MarriagePage() {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [myStatus, setMyStatus] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [unhiding, setUnhiding] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Form states
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [manualBiodataNo, setManualBiodataNo] = useState("");
  const [marriageDate, setMarriageDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [story, setStory] = useState("");
  const [hideMyBiodata, setHideMyBiodata] = useState(true);
  const [hidePartnerBiodata, setHidePartnerBiodata] = useState(true);
  const [isPublicSuccessStory, setIsPublicSuccessStory] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [mineRes, candRes] = await Promise.all([
        marriageApi.mine(),
        marriageApi.candidates().catch(() => []),
      ]);
      setMyStatus(mineRes || null);
      setCandidates(Array.isArray(candRes) ? candRes : []);
    } catch (err) {
      setError(err.message || "তথ্য লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeclare = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      await marriageApi.declare({
        partnerUserId: selectedPartnerId || undefined,
        partnerBiodataNo: manualBiodataNo || undefined,
        marriageDate,
        story,
        hideMyBiodata,
        hidePartnerBiodata,
        isPublicSuccessStory,
      });

      setMessage("আলহামদুলিল্লাহ! আপনার বিবাহ সফলভাবে নিবন্ধিত হয়েছে এবং বায়োডাটা হাইড করা হয়েছে।");
      await loadData();
    } catch (err) {
      setError(err.message || "বিবাহ নিবন্ধন সম্পন্ন করা যায়নি।");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnhide = async () => {
    if (!window.confirm("আপনি কি নিশ্চিত যে আপনার বায়োডাটা পুনরায় পাবলিক সার্চে প্রদর্শন করতে চান?")) {
      return;
    }
    setUnhiding(true);
    setMessage("");
    setError("");
    try {
      await marriageApi.unhide();
      setMessage("আপনার বায়োডাটা পুনরায় সক্রিয় এবং সার্চে উন্মুক্ত করা হয়েছে।");
      await loadData();
    } catch (err) {
      setError(err.message || "বায়োডাটা সক্রিয় করা যায়নি।");
    } finally {
      setUnhiding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
        <Loader2 className="animate-spin mb-2 text-[#fd6969]" size={28} />
        <p className="text-xs">তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  const isMarried = myStatus?.isMarried;
  const isHidden = myStatus?.biodata?.status === "HIDDEN";
  const marriage = myStatus?.marriage;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Messages */}
      {message && (
        <div className="alert alert-success text-sm py-3 mb-6 shadow-sm border border-green-200">
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="alert alert-error text-sm py-3 mb-6 shadow-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Case 1: Already Married / Hidden Profile */}
      {isMarried && (
        <div className="bg-gradient-to-br from-red-50/70 via-base-100 to-rose-50/40 dark:from-base-200 dark:to-base-100 border border-red-200/60 dark:border-base-300 rounded-3xl p-6 md:p-10 shadow-sm mb-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-red-200/20 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />
          
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#fd6969] to-rose-400 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200 dark:shadow-none">
            <HeartHandshake size={34} />
          </div>

          <span className="badge badge-lg bg-green-100 text-green-700 border-green-200 font-bold px-3 py-1 mb-2">
            ✓ বিবাহ নিবন্ধিত ও সুসম্পন্ন
          </span>

          <h2 className="text-2xl md:text-3xl font-black text-base-content mt-1">
            মাশাআল্লাহ! পবিত্র দাম্পত্য জীবনের মোবারকবাদ
          </h2>
          <p className="text-sm text-gray-500 max-w-lg mx-auto mt-2 leading-relaxed">
            নিকাহ্ দ্বীন প্ল্যাটফর্মের পক্ষ থেকে আপনাদের জন্য অফুরন্ত শুভকামনা।
            আল্লাহ তায়ালা আপনাদের বন্ধনে বরকত ও শান্তি দান করুন।
          </p>

          {/* Couple Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto my-6 text-left">
            <div className="p-4 rounded-2xl bg-base-100 dark:bg-base-200 border border-gray-100 dark:border-base-300">
              <p className="text-[11px] font-bold uppercase text-gray-400">বর (Groom)</p>
              <p className="font-bold text-base text-base-content mt-0.5">{marriage?.groomName || "—"}</p>
              {marriage?.groomBiodataNo && (
                <p className="text-xs font-mono text-[#fd6969] mt-0.5">{marriage.groomBiodataNo}</p>
              )}
            </div>
            <div className="p-4 rounded-2xl bg-base-100 dark:bg-base-200 border border-gray-100 dark:border-base-300">
              <p className="text-[11px] font-bold uppercase text-gray-400">কনে (Bride)</p>
              <p className="font-bold text-base text-base-content mt-0.5">{marriage?.brideName || "—"}</p>
              {marriage?.brideBiodataNo && (
                <p className="text-xs font-mono text-[#fd6969] mt-0.5">{marriage.brideBiodataNo}</p>
              )}
            </div>
          </div>

          {/* Visibility Banner */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-base-100 dark:bg-base-200 border border-gray-200 dark:border-base-300 text-xs text-gray-600 dark:text-gray-300 mb-6">
            <EyeOff size={16} className="text-[#fd6969]" />
            <span>
              আপনার বায়োডাটা বর্তমানে <strong className="text-base-content">পাবলিক সার্চ থেকে হাইড</strong> রয়েছে।
            </span>
          </div>

          {marriage?.story && (
            <div className="p-4 rounded-2xl bg-base-100/80 border border-dashed border-gray-200 max-w-xl mx-auto text-left mb-6">
              <p className="text-[11px] font-bold text-gray-400 mb-1">আমাদের অনুভূতি ও গল্প:</p>
              <p className="text-xs text-gray-600 italic">"{marriage.story}"</p>
            </div>
          )}

          <div>
            <button
              onClick={handleUnhide}
              disabled={unhiding}
              className="btn btn-sm btn-outline border-gray-300 hover:border-[#fd6969] hover:bg-[#fd6969] hover:text-white gap-2 font-medium"
            >
              {unhiding ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
              বায়োডাটা পুনরায় সক্রিয় করুন
            </button>
          </div>
        </div>
      )}

      {/* Case 2: Declaration Form */}
      {!isMarried && (
        <div className="bg-base-100 border border-gray-100 dark:border-base-300 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#fd6969] flex items-center justify-center shrink-0">
              <HeartHandshake size={26} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-base-content">
                বিবাহ ঠিক হয়েছে? আইডি হাইড করুন
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                আলহামদুলিল্লাহ! আপনার বা আপনার পরিবারের মধ্যস্থতায় বিবাহ চূড়ান্ত হলে প্রোফাইল হাইড করে নিন।
              </p>
            </div>
          </div>

          <form onSubmit={handleDeclare} className="mt-6 space-y-6">
            {/* Step 1: Partner Selection */}
            <div className="p-4 md:p-5 rounded-2xl bg-base-200/40 border border-gray-100 dark:border-base-300">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                ১. জীবনসঙ্গী নির্বাচন করুন (কার সাথে বিবাহ সম্পন্ন হচ্ছে?)
              </label>

              {candidates.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">
                    আপনার চ্যাট ও পছন্দের তালিকা থেকে সরাসরি পার্টনার বেছে নিতে পারেন:
                  </p>
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => {
                      setSelectedPartnerId(e.target.value);
                      if (e.target.value) setManualBiodataNo("");
                    }}
                    className="select select-bordered select-sm w-full bg-base-100"
                  >
                    <option value="">তালিকা থেকে পার্টনার নির্বাচন করুন...</option>
                    {candidates.map((c) => (
                      <option key={c.userId} value={c.userId}>
                        {c.name} ({c.biodataNo || "বায়োডাটা নম্বর নেই"}) — {c.occupation || "—"}, {c.district || "—"}
                      </option>
                    ))}
                  </select>

                  <div className="divider text-xs text-gray-400 my-1">অথবা বায়োডাটা নম্বর লিখুন</div>
                </div>
              ) : null}

              <div className="mt-2">
                <input
                  type="text"
                  placeholder="যেমন: NKD-2026-000001 (পার্টনারের বায়োডাটা নম্বর)"
                  value={manualBiodataNo}
                  onChange={(e) => {
                    setManualBiodataNo(e.target.value);
                    if (e.target.value) setSelectedPartnerId("");
                  }}
                  className="input input-bordered input-sm w-full bg-base-100"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  পার্টনারের বায়োডাটা নম্বর জানা থাকলে এখানে লিখুন (ঐচ্ছিক)।
                </span>
              </div>
            </div>

            {/* Step 2: Marriage Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  ২. বিবাহের বা চূড়ান্ত হওয়ার তারিখ
                </label>
                <input
                  type="date"
                  value={marriageDate}
                  onChange={(e) => setMarriageDate(e.target.value)}
                  className="input input-bordered input-sm w-full bg-base-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  ৩. যোগাযোগের মোবাইল নম্বর (যাচাইয়ের জন্য)
                </label>
                <input
                  type="text"
                  placeholder="০১৭১XXXXXXXX"
                  defaultValue={myStatus?.biodata?.mobile || ""}
                  className="input input-bordered input-sm w-full bg-base-100"
                />
              </div>
            </div>

            {/* Step 3: Story / Feedback */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                ৪. আপনাদের গল্প বা অনুভূতি (ঐচ্ছিক)
              </label>
              <textarea
                rows={3}
                placeholder="নিকাহ্ দ্বীনের মাধ্যমে কীভাবে আপনার জীবনসঙ্গীর সন্ধান পেলেন? ছোট করে লিখুন..."
                value={story}
                onChange={(e) => setStory(e.target.value)}
                className="textarea textarea-bordered w-full text-xs bg-base-100"
              />
            </div>

            {/* Step 4: Checkboxes */}
            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-base-300">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideMyBiodata}
                  onChange={(e) => setHideMyBiodata(e.target.checked)}
                  className="checkbox checkbox-sm checkbox-primary mt-0.5"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>আমার বায়োডাটা পাবলিক সার্চ থেকে অবিলম্বে হাইড করুন।</strong>
                  <span className="block text-[11px] text-gray-400">
                    অন্য কোনো সদস্য আর আপনার বায়োডাটা দেখতে বা প্রস্তাব পাঠাতে পারবেন না।
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hidePartnerBiodata}
                  onChange={(e) => setHidePartnerBiodata(e.target.checked)}
                  className="checkbox checkbox-sm checkbox-primary mt-0.5"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>পার্টনারের বায়োডাটাও একসাথে হাইড করার আবেদন করুন।</strong>
                  <span className="block text-[11px] text-gray-400">
                    পার্টনারের কাছে একটি মোবারকবাদ নোটিফিকেশন যাবে এবং তাদের প্রোফাইলও সুরক্ষিতভাবে হাইড হবে।
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublicSuccessStory}
                  onChange={(e) => setIsPublicSuccessStory(e.target.checked)}
                  className="checkbox checkbox-sm checkbox-primary mt-0.5"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  হোমপেজের <strong>"সফল বিবাহ / সাফল্যের গল্প"</strong> সেকশনে আমাদের গল্প প্রদর্শনে সম্মতি দিচ্ছি।
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-block bg-[#fd6969] hover:bg-[#e05858] text-white border-none gap-2 font-bold shadow-md shadow-red-200"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <HeartHandshake size={20} />
                )}
                বিবাহ নিশ্চিত করুন ও আইডি হাইড করুন
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
