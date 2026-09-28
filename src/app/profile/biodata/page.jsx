"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Trash2, Star, Upload, Loader2, AlertCircle, Pencil, Send, CheckCircle2 } from "lucide-react";
import { biodataApi } from "@/lib/api";
import CompletionCard from "./CompletionCard";

const SECTIONS = [
  {
    key: "basic",
    label: "মৌলিক তথ্য",
    fields: [
      ["firstName", "নাম (প্রথম অংশ)"],
      ["lastName", "নাম (শেষ অংশ)"],
      ["gender", "লিঙ্গ"],
      ["maritalStatus", "বৈবাহিক অবস্থা"],
      ["birthYear", "জন্মসাল"],
      ["religion", "ধর্ম"],
      ["sectOrDenomination", "মাজহাব / সম্প্রদায়"],
      ["division", "বিভাগ"],
      ["district", "জেলা"],
      ["heightText", "উচ্চতা"],
      ["skinColor", "গায়ের রং"],
      ["bloodGroup", "রক্তের গ্রুপ"],
    ],
  },
  {
    key: "personal",
    label: "ব্যক্তিগত তথ্য",
    fields: [
      ["clothingStyle", "পোষাক"],
      ["healthCondition", "স্বাস্থ্য"],
      ["entertainmentHabit", "বিনোদন"],
      ["politicalView", "রাজনৈতিক দর্শন"],
      ["favoriteBooksPeople", "পছন্দের বই ও ব্যক্তিত্ব"],
      ["aboutYourself", "নিজের সম্পর্কে"],
      ["specialCategories", "প্রযোজ্য ক্যাটাগরি"],
    ],
  },
  {
    key: "religious",
    label: "ধর্মীয় তথ্য",
    fields: [
      ["religiousPracticeLevel", "ধর্মীয় চর্চার স্তর"],
      ["placeOfWorshipAttendance", "উপাসনালয়ে যাতায়াত"],
      ["holyBookReading", "ধর্মগ্রন্থ পাঠ"],
      ["religiousEducation", "ধর্মীয় শিক্ষা"],
      ["religiousDressPreference", "ধর্মীয় পোশাক"],
      ["charityActivity", "দান / সামাজিক কাজ"],
      ["religiousOrganization", "ধর্মীয় সংগঠন"],
      ["dietaryPractice", "খাদ্যনীতি"],
      ["futureReligiousGoal", "ভবিষ্যৎ পরিকল্পনা"],
      ["partnerReligiousExpectation", "জীবনসঙ্গীর প্রত্যাশা"],
    ],
  },
  {
    key: "education",
    label: "শিক্ষাগত তথ্য",
    fields: [
      ["education", "শিক্ষা মাধ্যম"],
      ["degree", "সর্বোচ্চ যোগ্যতা"],
      ["institution", "প্রতিষ্ঠান"],
      ["board", "বোর্ড"],
      ["subject", "বিষয়"],
      ["result", "ফলাফল"],
      ["passingYear", "পাসের সন / বিস্তারিত"],
      ["deeniEducation", "দ্বীনি শিক্ষা"],
    ],
  },
  {
    key: "profession",
    label: "পেশাগত তথ্য",
    fields: [
      ["occupation", "পেশা"],
      ["occupationDetails", "পেশার বিবরণ"],
      ["monthlyIncome", "মাসিক আয়"],
      ["company", "প্রতিষ্ঠানের নাম"],
      ["experienceYears", "অভিজ্ঞতা (বছর)"],
    ],
  },
  {
    key: "family",
    label: "পারিবারিক তথ্য",
    fields: [
      ["fatherName", "বাবার নাম"],
      ["fatherOccupation", "বাবার পেশা"],
      ["motherName", "মায়ের নাম"],
      ["motherOccupation", "মায়ের পেশা"],
      ["siblings", "ভাই-বোন"],
    ],
  },
  {
    key: "contact",
    label: "যোগাযোগ তথ্য",
    fields: [
      ["phoneNumber", "মোবাইল নম্বর"],
      ["mobile", "মোবাইল (বিকল্প)"],
      ["presentAddress", "বর্তমান ঠিকানা"],
      ["permanentAddress", "স্থায়ী ঠিকানা"],
    ],
  },
];

const STATUS_LABELS = {
  DRAFT: { text: "খসড়া", cls: "badge-ghost" },
  PENDING: { text: "পর্যালোচনাধীন", cls: "badge-warning" },
  APPROVED: { text: "অনুমোদিত", cls: "badge-success" },
  REJECTED: { text: "প্রত্যাখ্যাত", cls: "badge-error" },
  ARCHIVED: { text: "সংরক্ষিত", cls: "badge-ghost" },
};

const LONG_FIELDS = new Set([
  "aboutYourself",
  "specialCategories",
  "futureReligiousGoal",
  "partnerReligiousExpectation",
  "occupationDetails",
  "passingYear",
  "presentAddress",
  "permanentAddress",
]);

export default function ProfileData() {
  const [biodata, setBiodata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editSection, setEditSection] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionError, setActionError] = useState("");
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await biodataApi.mine();
      setBiodata(data);
    } catch (err) {
      setError(err.message || "বায়োডাটা লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (section) => {
    const values = {};
    for (const [key] of section.fields) values[key] = biodata?.[key] ?? "";
    setEditValues(values);
    setEditSection(section.key);
    setActionError("");
  };

  const saveEdit = async () => {
    setSaving(true);
    setActionError("");
    try {
      const payload = { ...editValues };
      // খালি স্ট্রিং → undefined (ব্যাকএন্ড ডিফল্ট); সংখ্যা ফিল্ড রূপান্তর
      for (const k of Object.keys(payload)) {
        if (payload[k] === "") payload[k] = undefined;
      }
      if (payload.monthlyIncome !== undefined) {
        payload.monthlyIncome =
          payload.monthlyIncome === null ? null : Number(payload.monthlyIncome);
      }
      if (payload.birthYear !== undefined && payload.birthYear !== null) {
        payload.birthYear = Number(payload.birthYear);
      }
      const updated = await biodataApi.update(payload);
      setBiodata(updated);
      setEditSection(null);
    } catch (err) {
      setActionError(err.message || "সংরক্ষণ করা যায়নি।");
    } finally {
      setSaving(false);
    }
  };

  const submitForReview = async () => {
    setSubmitting(true);
    setActionError("");
    try {
      const updated = await biodataApi.submit();
      setBiodata(updated);
    } catch (err) {
      setActionError(err.message || "জমা দেওয়া যায়নি।");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setActionError("");
    try {
      const res = await biodataApi.uploadPhoto(file);
      setBiodata(res?.biodata || res);
    } catch (err) {
      setActionError(err.message || "ছবি আপলোড করা যায়নি।");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const setAsMain = async (url) => {
    setActionError("");
    try {
      await biodataApi.setProfilePhoto(biodata.id, url);
      setBiodata((prev) => ({ ...prev, profileImage: url }));
    } catch (err) {
      setActionError(err.message || "প্রোফাইল ছবি পরিবর্তন করা যায়নি।");
    }
  };

  const deletePhoto = async (index) => {
    setActionError("");
    try {
      await biodataApi.deletePhoto(biodata.id, index);
      await load();
    } catch (err) {
      setActionError(err.message || "ছবি মুছে ফেলা যায়নি।");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 gap-2 text-gray-500">
        <Loader2 size={20} className="animate-spin" /> বায়োডাটা লোড হচ্ছে...
      </div>
    );
  }

  if (error || !biodata) {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertCircle className="mx-auto text-red-400" size={36} />
        <p className="text-gray-600">
          {error || "আপনার এখনো কোনো বায়োডাটা নেই।"}
        </p>
        <a href="/biodata" className="btn btn-sm bg-red-500 text-white hover:bg-red-600 border-none">
          বায়োডাটা তৈরি করুন
        </a>
      </div>
    );
  }

  const status = STATUS_LABELS[biodata.status] || STATUS_LABELS.DRAFT;
  const canSubmit = ["DRAFT", "REJECTED"].includes(biodata.status);

  // কমপ্লিশন-কার্ডের চিপ ক্লিক → সংশ্লিষ্ট গ্রুপের এডিটর খোলা
  const openEditByGroup = (groupKey) => {
    const section = SECTIONS.find((s) => s.key === groupKey);
    if (section) openEdit(section);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header: number, status, actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">
            {biodata.fullName || "বায়োডাটা"}{" "}
            <span className="text-sm font-normal text-gray-400">
              #{biodata.biodataNo || biodata.id?.slice(-6)}
            </span>
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge badge-sm ${status.cls}`}>{status.text}</span>
            {biodata.rejectionReason ? (
              <span className="text-xs text-red-500">
                কারণ: {biodata.rejectionReason}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          {canSubmit && (
            <button
              onClick={submitForReview}
              disabled={submitting}
              className="btn btn-sm bg-red-500 text-white hover:bg-red-600 border-none"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              পর্যালোচনার জন্য জমা দিন
            </button>
          )}
          {biodata.status === "APPROVED" && (
            <span className="btn btn-sm btn-ghost text-green-600 pointer-events-none">
              <CheckCircle2 size={14} /> লাইভ
            </span>
          )}
        </div>
      </div>

      {actionError && (
        <div className="alert alert-error text-sm">
          <AlertCircle size={16} /> <span>{actionError}</span>
        </div>
      )}

      {/* Photos */}
      <div className="card bg-base-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">ছবিসমূহ</h3>
          <label className="btn btn-sm btn-outline">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            ছবি আপলোড
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </label>
        </div>
        {biodata.photos?.length ? (
          <div className="flex flex-wrap gap-3">
            {biodata.photos.map((url, i) => (
              <div key={url} className="relative group">
                <Image
                  src={url}
                  alt={`ছবি ${i + 1}`}
                  width={88}
                  height={88}
                  unoptimized
                  className={`w-22 h-22 object-cover rounded-lg border-2 ${
                    biodata.profileImage === url ? "border-green-500" : "border-gray-200"
                  }`}
                />
                {biodata.profileImage === url ? (
                  <span className="absolute top-1 left-1 badge badge-success badge-xs">মূল</span>
                ) : (
                  <button
                    onClick={() => setAsMain(url)}
                    title="মূল ছবি করুন"
                    className="absolute top-1 left-1 p-1 bg-white/90 rounded-full shadow hover:bg-white"
                  >
                    <Star size={12} className="text-yellow-500" />
                  </button>
                )}
                <button
                  onClick={() => deletePhoto(i)}
                  title="মুছে ফেলুন"
                  className="absolute bottom-1 right-1 p-1 bg-white/90 rounded-full shadow hover:bg-red-50"
                >
                  <Trash2 size={12} className="text-red-500" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">কোনো ছবি আপলোড করা হয়নি।</p>
        )}
      </div>

      {/* Completion */}
      {biodata.completion && (
        <CompletionCard report={biodata.completion} onEditSection={openEditByGroup} />
      )}

      {/* Data sections */}
      {SECTIONS.map((section) => (
        <div key={section.key} className="card bg-base-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">{section.label}</h3>
            {editSection === section.key ? (
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="btn btn-xs bg-red-500 text-white hover:bg-red-600 border-none"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : "সংরক্ষণ"}
                </button>
                <button onClick={() => setEditSection(null)} className="btn btn-xs btn-ghost">
                  বাতিল
                </button>
              </div>
            ) : (
              <button onClick={() => openEdit(section)} className="btn btn-xs btn-ghost">
                <Pencil size={12} /> সম্পাদনা
              </button>
            )}
          </div>

          {editSection === section.key ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {section.fields.map(([key, label]) => (
                <div key={key} className={LONG_FIELDS.has(key) ? "md:col-span-2" : ""}>
                  <label className="text-xs text-gray-500">{label}</label>
                  {LONG_FIELDS.has(key) ? (
                    <textarea
                      value={editValues[key] ?? ""}
                      onChange={(e) => setEditValues((v) => ({ ...v, [key]: e.target.value }))}
                      className="textarea textarea-bordered w-full text-sm"
                      rows={3}
                    />
                  ) : (
                    <input
                      value={editValues[key] ?? ""}
                      onChange={(e) => setEditValues((v) => ({ ...v, [key]: e.target.value }))}
                      className="input input-bordered w-full text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {section.fields.map(([key, label]) => (
                <div key={key} className="flex gap-2 border-b border-base-300/60 py-1">
                  <dt className="text-gray-500 min-w-[45%]">{label}</dt>
                  <dd className="font-medium break-words">
                    {biodata[key] ?? biodata[key] === 0
                      ? String(biodata[key])
                      : "—"}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      ))}
    </div>
  );
}
