"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Image as ImageIcon, Phone, Save, Loader2, Globe } from "lucide-react";
import { privacyApi } from "@/lib/api";

const PHOTO_OPTIONS = [
  { value: "PUBLIC", label: "সবাই দেখতে পারবে", hint: "গেস্টসহ প্রতিটি কার্ড ও পেজে ছবি দেখা যাবে (ডিফল্ট)" },
  { value: "MEMBERS", label: "শুধু লগইন করা সদস্য", hint: "অপ-লগইন করা কেউ সাধারণ ছবি দেখতে পারবে না" },
  { value: "MATCHED", label: "শুধু পারস্পরিক ম্যাচ", hint: "মিউচুয়াল লাইক না হওয়া পর্যন্ত ছবি লক থাকবে" },
  { value: "UNLOCK", label: "পয়েন্ট দিয়ে আনলক", hint: "অন্য সদস্যকে পয়েন্ট খরচ করে ছবি খুলতে হবে (একবার)" },
];

const CONTACT_OPTIONS = [
  { value: "PAID", label: "কানেক্ট খরচে ফুল ভিউ", hint: "যোগাযোগের তথ্য কানেক্ট দিয়ে দেখা যাবে (ডিফল্ট)" },
  { value: "MATCHED", label: "ম্যাচদের জন্য ফ্রি", hint: "মিউচুয়াল ম্যাচ সদস্য ফ্রিতে দেখতে পারবে, বাকিদের আগের মতো" },
  { value: "PUBLIC", label: "সবার জন্য উন্মুক্ত", hint: "যেকোনো গেস্ট/সদস্য যোগাযোগের তথ্য দেখতে পারবেন" },
];

const CROSS_RELIGION_OPTIONS = [
  {
    value: false,
    label: "শুধুমাত্র স্বধর্মীয় পাত্র-পাত্রীদের জন্য সংরক্ষিত (ডিফল্ট)",
    hint: "আপনার নিজের ধর্মের পাত্র/পাত্রী ছাড়া অন্য কোনো ধর্মের সদস্য আপনার বায়োডাটা দেখতে, লাইক দিতে বা মেসেজ পাঠাতে পারবে না।",
  },
  {
    value: true,
    label: "ভিন্ন ধর্মের পাত্র-পাত্রীদের জন্যও উন্মুক্ত",
    hint: "অন্য ধর্মের সদস্যরাও পারস্পরিক ধর্মীয় আদব ও শিষ্টাচার রক্ষা করে আপনার বায়োডাটা দেখতে পারবে এবং প্রস্তাব বা মেসেজ পাঠাতে পারবে।",
  },
];

export default function PrivacySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoVisibility, setPhotoVisibility] = useState("PUBLIC");
  const [contactVisibility, setContactVisibility] = useState("PAID");
  const [allowCrossReligion, setAllowCrossReligion] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    privacyApi
      .mine()
      .then((data) => {
        if (cancelled) return;
        setPhotoVisibility(data?.photoVisibility || "PUBLIC");
        setContactVisibility(data?.contactVisibility || "PAID");
        setAllowCrossReligion(Boolean(data?.allowCrossReligion));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "প্রাইভেসি সেটিংস আনা যায়নি");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await privacyApi.save({ photoVisibility, contactVisibility, allowCrossReligion });
      setMessage("প্রাইভেসি সেটিংস সফলভাবে সংরক্ষিত হয়েছে।");
    } catch (err) {
      setError(err.message || "সংরক্ষণ করা যায়নি");
    } finally {
      setSaving(false);
    }
  };

  const selectedPhoto = PHOTO_OPTIONS.find((o) => o.value === photoVisibility);
  const selectedContact = CONTACT_OPTIONS.find((o) => o.value === contactVisibility);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm opacity-70">
        <Loader2 className="animate-spin mr-2" size={18} /> লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck size={22} className="text-primary" />
        <h2 className="text-xl font-bold">প্রাইভেসি ও দৃশ্যমানতা</h2>
      </div>
      <p className="text-sm opacity-70 mb-6">
        কে আপনার প্রোফাইলের ছবি ও যোগাযোগের তথ্য দেখতে পারবে তা নিয়ন্ত্রণ করুন। নিচের
        ডিফল্ট মানগুলো আগের আচরণের সমান।
      </p>

      {/* Photo visibility */}
      <div className="border border-primary/15 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 font-semibold mb-3">
          <ImageIcon size={18} /> প্রোফাইল ছবি কে দেখতে পারবে
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PHOTO_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`cursor-pointer border rounded-lg p-3 flex gap-2 items-start transition-colors ${
                photoVisibility === opt.value ? "border-primary bg-primary/5" : "border-base-300"
              }`}
            >
              <input
                type="radio"
                name="photoVisibility"
                value={opt.value}
                checked={photoVisibility === opt.value}
                onChange={() => setPhotoVisibility(opt.value)}
                className="mt-1 radio radio-primary radio-sm"
              />
              <span>
                <span className="block font-medium text-sm">{opt.label}</span>
                <span className="block text-xs opacity-70">{opt.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {selectedPhoto?.value === "UNLOCK" && (
          <p className="text-xs opacity-70 mt-3">
            টিপস: যে সদস্য ইতিমধ্যে আপনার ফুল বায়োডাটা ভিউ কেনেছে তাকে আবার ছবির জন্য
            পয়েন্ট দিতে হবে না — একই অ্যাকশনে দুইবার চার্জ হয় না।
          </p>
        )}
      </div>

      {/* Contact visibility */}
      <div className="border border-primary/15 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 font-semibold mb-3">
          <Phone size={18} /> যোগাযোগের তথ্য কে দেখতে পারবে
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CONTACT_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`cursor-pointer border rounded-lg p-3 flex gap-2 items-start transition-colors ${
                contactVisibility === opt.value ? "border-primary bg-primary/5" : "border-base-300"
              }`}
            >
              <input
                type="radio"
                name="contactVisibility"
                value={opt.value}
                checked={contactVisibility === opt.value}
                onChange={() => setContactVisibility(opt.value)}
                className="mt-1 radio radio-primary radio-sm"
              />
              <span>
                <span className="block font-medium text-sm">{opt.label}</span>
                <span className="block text-xs opacity-70">{opt.hint}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs opacity-70 mt-3">
          আপনার সঙ্গে block করা অ্যাকাউন্ট যেকোনো অবস্থায় ছবি ও যোগাযোগের তথ্য দেখতে পারবে না।
        </p>
      </div>

      {/* Cross-Religion Visibility */}
      <div className="border border-primary/15 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 font-semibold mb-2">
          <Globe size={18} className="text-primary" /> আন্তঃধর্মীয় দৃশ্যমানতা ও যোগাযোগের অনুমতি
        </div>
        <p className="text-xs opacity-75 mb-3 leading-relaxed">
          ডিফল্টভাবে আপনার বায়োডাটা ও যোগাযোগ শুধুমাত্র আপনার স্বধর্মীয় সদস্যদের মধ্যে সীমাবদ্ধ থাকে। আপনি অনুমতি দিলে অন্য ধর্মের পাত্র-পাত্রীরাও আপনার বায়োডাটা দেখতে ও ধর্মীয় শিষ্টাচার বজায় রেখে প্রস্তাব পাঠাতে পারবে।
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CROSS_RELIGION_OPTIONS.map((opt) => (
            <label
              key={String(opt.value)}
              className={`cursor-pointer border rounded-lg p-3 flex gap-2 items-start transition-colors ${
                allowCrossReligion === opt.value ? "border-primary bg-primary/5" : "border-base-300"
              }`}
            >
              <input
                type="radio"
                name="allowCrossReligion"
                value={String(opt.value)}
                checked={allowCrossReligion === opt.value}
                onChange={() => setAllowCrossReligion(opt.value)}
                className="mt-1 radio radio-primary radio-sm"
              />
              <span>
                <span className="block font-medium text-sm">{opt.label}</span>
                <span className="block text-xs opacity-70 mt-0.5">{opt.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {message && <div className="alert alert-success text-sm py-2 mb-3">{message}</div>}
      {error && <div className="alert alert-error text-sm py-2 mb-3">{error}</div>}

      <button onClick={handleSave} disabled={saving} className="btn btn-primary gap-2">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        সংরক্ষণ করুন
      </button>
    </div>
  );
}
