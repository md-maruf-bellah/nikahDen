"use client";

import Image from "next/image";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TfiLayoutGrid3Alt } from "react-icons/tfi";
import { MdTableRows } from "react-icons/md";
import { FcLikePlaceholder } from "react-icons/fc";
import { FcLike } from "react-icons/fc";
import { defaultAvatarFor } from "@/lib/avatar";
import { biodataApi, tokenStore } from "@/lib/api";
import StartChatButton from "@/components/StartChatButton";
import { ProfileCard } from "@/components/landing/ProfileSections";
import { getReligionMeta } from "@/lib/religiousAdab";

function FilterSelect({ value, onChange, children, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`select select-bordered ${className}`}
    >
      {children}
    </select>
  );
}

function BiodataGridBody() {
  const router = useRouter();
  const params = useSearchParams();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState("grid"); // grid | table
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef(null);

  // Search mode tabs: "biodataNo" | "all"
  const [searchTab, setSearchTab] = useState(params.get("biodataNo") ? "biodataNo" : "all");

  // filters (initialized from landing SearchBar query params)
  const [biodataNo, setBiodataNo] = useState(params.get("biodataNo") || "");
  const [gender, setGender] = useState(params.get("gender") || "");
  const [religion, setReligion] = useState(params.get("religion") || "");
  const [maritalStatus, setMaritalStatus] = useState(params.get("maritalStatus") || "");
  const [ageMin, setAgeMin] = useState(params.get("ageMin") || "");
  const [ageMax, setAgeMax] = useState(params.get("ageMax") || "");
  const [district, setDistrict] = useState(params.get("district") || "");
  const [education, setEducation] = useState(params.get("education") || "");
  const [occupation, setOccupation] = useState(params.get("occupation") || "");
  const [skinColor, setSkinColor] = useState(params.get("skinColor") || "");
  const [search, setSearch] = useState(params.get("search") || "");
  const [sortBy, setSortBy] = useState(params.get("sortBy") || "createdAt");
  const [sortOrder, setSortOrder] = useState(params.get("sortOrder") || "desc");
  const limit = 12;

  const fetchBiodatas = useCallback(async (pageNum = 1) => {
    if (pageNum === 1) {
      setLoading(true);
      setError("");
    } else {
      setLoadingMore(true);
    }
    try {
      const { data, pagination: pg } = await biodataApi.list({
        page: pageNum,
        limit,
        biodataNo: biodataNo || undefined,
        gender: gender || undefined,
        religion: religion || undefined,
        maritalStatus: maritalStatus || undefined,
        ageMin: ageMin || undefined,
        ageMax: ageMax || undefined,
        district: district || undefined,
        education: education || undefined,
        occupation: occupation || undefined,
        skinColor: skinColor || undefined,
        search: search || undefined,
        sortBy,
        sortOrder,
      });

      setItems((prev) => {
        if (pageNum === 1) return data || [];
        const seen = new Set(prev.map((i) => i.id));
        const added = (data || []).filter((i) => !seen.has(i.id));
        return [...prev, ...added];
      });
      setPagination(pg || { page: pageNum, limit, total: 0, totalPages: 0 });
    } catch (err) {
      if (pageNum === 1) {
        setError(err.message || "বায়োডাটা লোড করা যায়নি।");
        setItems([]);
      }
    } finally {
      if (pageNum === 1) setLoading(false);
      else setLoadingMore(false);
    }
  }, [limit, biodataNo, gender, religion, maritalStatus, ageMin, ageMax, district, education, occupation, skinColor, search, sortBy, sortOrder]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) fetchBiodatas(1);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchBiodatas]);

  const hasMore = pagination.page < pagination.totalPages;

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    fetchBiodatas(pagination.page + 1);
  }, [fetchBiodatas, hasMore, loading, loadingMore, pagination.page]);

  // YouTube-style auto-fetch on scroll near bottom
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "250px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadMore]);

  const applyFilters = () => {
    fetchBiodatas(1);
  };

  const resetFilters = () => {
    setBiodataNo("");
    setGender("");
    setReligion("");
    setMaritalStatus("");
    setAgeMin("");
    setAgeMax("");
    setDistrict("");
    setEducation("");
    setOccupation("");
    setSkinColor("");
    setSearch("");
  };

  const toggleLike = async (item) => {
    if (!tokenStore.getAccess()) {
      router.push("/login");
      return;
    }
    try {
      if (item.likedByMe) {
        await biodataApi.unlike(item.id);
        setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, likedByMe: false } : p)));
      } else {
        await biodataApi.like(item.id);
        setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, likedByMe: true } : p)));
      }
    } catch {
      /* keep state */
    }
  };

  const religionBadge = {
    Islam: "bg-emerald-600",
    Hinduism: "bg-orange-600",
    Christianity: "bg-sky-600",
    Buddhism: "bg-amber-600",
  };

  return (
    <div className="bg-base-200 min-h-screen">
      {/* Header */}
      <div className="bg-red-400 text-white text-center py-8 md:py-12">
        <h1 className="text-xl md:text-2xl font-bold">পাত্র-পাত্রী বায়োডাটা</h1>
        <p className="text-xs md:text-sm mt-2">সকল পাত্র-পাত্রী তালিকা</p>

        {/* Mobile Filter Button */}
        <button
          onClick={() => setOpen(true)}
          className="btn btn-sm btn-primary mt-3 md:hidden"
        >
          ফিল্টার
        </button>
      </div>

      <div className="max-w-7xl mx-auto flex gap-6 p-4 md:p-6">
        {/* Sidebar Desktop */}
        <div className="hidden md:block w-72 bg-base-100 p-5 shadow h-screen sticky top-0 overflow-y-auto card">
          <h2 className="font-semibold text-base mb-3">আপনি কি খুঁজতে চান?</h2>

          {/* 2 Tabs: বায়োডাটা নং ও সব ফিল্টার */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-base-200/90 rounded-lg mb-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSearchTab("biodataNo")}
              className={`py-2 px-1 text-center rounded-md transition-all font-medium ${
                searchTab === "biodataNo"
                  ? "bg-[#ff6b6b] text-white shadow-sm"
                  : "text-base-content/70 hover:text-base-content"
              }`}
            >
              বায়োডাটা নং
            </button>
            <button
              type="button"
              onClick={() => setSearchTab("all")}
              className={`py-2 px-1 text-center rounded-md transition-all font-medium ${
                searchTab === "all"
                  ? "bg-[#ff6b6b] text-white shadow-sm"
                  : "text-base-content/70 hover:text-base-content"
              }`}
            >
              সব ফিল্টার
            </button>
          </div>

          {searchTab === "biodataNo" ? (
            /* TAB 1: শুধু বায়োডাটা নম্বর দিয়ে অনুসন্ধান */
            <div className="space-y-4">
              <div className="bg-base-200/50 p-3 rounded-lg border border-base-300">
                <label className="text-xs font-semibold mb-1.5 block opacity-80">
                  বায়োডাটা নং দিয়ে খুঁজুন
                </label>
                <input
                  value={biodataNo}
                  onChange={(e) => setBiodataNo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyFilters();
                  }}
                  placeholder="যেমন: BD-1001 বা 1001"
                  className="input input-bordered input-sm w-full font-mono text-sm tracking-wide"
                />
                <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                  নির্দিষ্ট পাত্র বা পাত্রীর বায়োডাটা নম্বর লিখে সরাসরি খুঁজুন।
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setBiodataNo("");
                    setTimeout(() => fetchBiodatas(1), 50);
                  }}
                  className="btn btn-outline btn-error btn-sm flex-1"
                >
                  রিসেট
                </button>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="btn bg-[#ff6b6b] hover:bg-[#e05a5a] text-white btn-sm flex-1 shadow-sm"
                >
                  খুঁজুন
                </button>
              </div>
            </div>
          ) : (
            /* TAB 2: সব ফিল্টার দিয়ে অনুসন্ধান */
            <div>
              <div className="mb-3">
                <label className="flex gap-3 mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={gender === "MALE"}
                    onChange={(e) => setGender(e.target.checked ? "MALE" : "")}
                  />
                  <span>পাত্র</span>
                </label>
                <label className="flex gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={gender === "FEMALE"}
                    onChange={(e) => setGender(e.target.checked ? "FEMALE" : "")}
                  />
                  <span>পাত্রী</span>
                </label>
              </div>

              <FilterSelect
                value={religion}
                onChange={setReligion}
                className="w-full mb-3"
              >
                <option value="">সকল ধর্ম</option>
                <option value="Islam">ইসলাম</option>
                <option value="Hinduism">সনাতন (হিন্দু)</option>
                <option value="Christianity">খ্রিস্টান</option>
                <option value="Buddhism">বৌদ্ধ</option>
                <option value="Other">অন্যান্য</option>
              </FilterSelect>

              <FilterSelect
                value={maritalStatus}
                onChange={setMaritalStatus}
                className="w-full mb-3"
              >
                <option value="">বৈবাহিক অবস্থা</option>
                <option value="UNMARRIED">অবিবাহিত</option>
                <option value="DIVORCED">তালাকপ্রাপ্ত</option>
                <option value="WIDOWED">বিধবা/বিপত্নীক</option>
                <option value="OTHER">অন্যান্য</option>
              </FilterSelect>

              <label className="text-sm font-medium mb-1 block">বয়স</label>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="number"
                  min={18}
                  max={90}
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                  placeholder="১৮"
                  className="input input-bordered input-sm w-1/2"
                />
                <span>—</span>
                <input
                  type="number"
                  min={18}
                  max={90}
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                  placeholder="৬০"
                  className="input input-bordered input-sm w-1/2"
                />
              </div>

              <FilterSelect value={district} onChange={setDistrict} className="w-full mb-3">
                <option value="">জেলা শহর</option>
                <option>ঢাকা</option>
                <option>চট্টগ্রাম</option>
                <option>খুলনা</option>
                <option>রাজশাহী</option>
                <option>সিলেট</option>
                <option>বরিশাল</option>
                <option>রংপুর</option>
                <option>ময়মনসিংহ</option>
                <option>কক্সবাজার</option>
                <option>যশোর</option>
                <option>রাঙ্গামাটি</option>
                <option>বান্দরবান</option>
              </FilterSelect>

              <FilterSelect value={education} onChange={setEducation} className="w-full mb-3">
                <option value="">শিক্ষাগত যোগ্যতা</option>
                <option>স্নাতক</option>
                <option>স্নাতকোত্তর</option>
                <option>এইচ.এস.সি</option>
                <option>এস.এস.সি</option>
                <option>দ্বীনি শিক্ষা</option>
              </FilterSelect>

              <FilterSelect value={occupation} onChange={setOccupation} className="w-full mb-3">
                <option value="">পেশা</option>
                <option>ডাক্তার</option>
                <option>ইঞ্জিনিয়ার</option>
                <option>শিক্ষক</option>
                <option>ব্যবসায়ী</option>
                <option>ব্যাংকার</option>
                <option>সরকারি চাকরি</option>
                <option>সফটওয়্যার ইঞ্জিনিয়ার</option>
              </FilterSelect>

              <FilterSelect value={skinColor} onChange={setSkinColor} className="w-full mb-3">
                <option value="">গায়ের রং</option>
                <option>ফর্সা</option>
                <option>উজ্জ্বল ফর্সা</option>
                <option>শ্যামলা</option>
                <option>উজ্জ্বল শ্যামলা</option>
              </FilterSelect>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="নাম/পেশা/শিক্ষা খুঁজুন..."
                className="input input-bordered input-sm w-full mb-3"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="btn btn-outline btn-error btn-sm flex-1"
                >
                  ফিল্টার মুছুন
                </button>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="btn bg-[#ff6b6b] hover:bg-[#e05a5a] text-white btn-sm flex-1 shadow-sm"
                >
                  বায়োডাটা খুঁজুন
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Drawer */}
        {open && (
          <div className="fixed inset-0 bg-black/40 z-50">
            <div className="bg-white w-72 h-full p-5 overflow-y-auto">
              <button
                onClick={() => setOpen(false)}
                className="btn btn-sm btn-error mb-4"
              >
                বন্ধ
              </button>

              <h2 className="font-semibold text-base mb-3">আপনি কি খুঁজতে চান?</h2>

              {/* 2 Tabs: বায়োডাটা নং ও সব ফিল্টার */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-base-200/90 rounded-lg mb-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSearchTab("biodataNo")}
                  className={`py-2 px-1 text-center rounded-md transition-all font-medium ${
                    searchTab === "biodataNo"
                      ? "bg-[#ff6b6b] text-white shadow-sm"
                      : "text-base-content/70 hover:text-base-content"
                  }`}
                >
                  বায়োডাটা নং
                </button>
                <button
                  type="button"
                  onClick={() => setSearchTab("all")}
                  className={`py-2 px-1 text-center rounded-md transition-all font-medium ${
                    searchTab === "all"
                      ? "bg-[#ff6b6b] text-white shadow-sm"
                      : "text-base-content/70 hover:text-base-content"
                  }`}
                >
                  সব ফিল্টার
                </button>
              </div>

              {searchTab === "biodataNo" ? (
                /* TAB 1: শুধু বায়োডাটা নম্বর দিয়ে অনুসন্ধান */
                <div className="space-y-4">
                  <div className="bg-base-200/50 p-3 rounded-lg border border-base-300">
                    <label className="text-xs font-semibold mb-1.5 block opacity-80">
                      বায়োডাটা নং দিয়ে খুঁজুন
                    </label>
                    <input
                      value={biodataNo}
                      onChange={(e) => setBiodataNo(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setOpen(false);
                          applyFilters();
                        }
                      }}
                      placeholder="যেমন: BD-1001 বা 1001"
                      className="input input-bordered input-sm w-full font-mono text-sm tracking-wide"
                    />
                    <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                      নির্দিষ্ট পাত্র বা পাত্রীর বায়োডাটা নম্বর লিখে সরাসরি খুঁজুন।
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBiodataNo("");
                        setTimeout(() => fetchBiodatas(1), 50);
                      }}
                      className="btn btn-outline btn-error btn-sm flex-1"
                    >
                      রিসেট
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        applyFilters();
                      }}
                      className="btn bg-[#ff6b6b] hover:bg-[#e05a5a] text-white btn-sm flex-1 shadow-sm"
                    >
                      খুঁজুন
                    </button>
                  </div>
                </div>
              ) : (
                /* TAB 2: সব ফিল্টার দিয়ে অনুসন্ধান */
                <div>
                  <div className="mb-3">
                    <label className="flex gap-3 mb-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={gender === "MALE"}
                        onChange={(e) => setGender(e.target.checked ? "MALE" : "")}
                      />
                      <span>পাত্র</span>
                    </label>
                    <label className="flex gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={gender === "FEMALE"}
                        onChange={(e) => setGender(e.target.checked ? "FEMALE" : "")}
                      />
                      <span>পাত্রী</span>
                    </label>
                  </div>

                  <FilterSelect
                    value={religion}
                    onChange={setReligion}
                    className="w-full mb-3"
                  >
                    <option value="">সকল ধর্ম</option>
                    <option value="Islam">ইসলাম</option>
                    <option value="Hinduism">সনাতন (হিন্দু)</option>
                    <option value="Christianity">খ্রিস্টান</option>
                    <option value="Buddhism">বৌদ্ধ</option>
                    <option value="Other">অন্যান্য</option>
                  </FilterSelect>

                  <FilterSelect
                    value={maritalStatus}
                    onChange={setMaritalStatus}
                    className="w-full mb-3"
                  >
                    <option value="">বৈবাহিক অবস্থা</option>
                    <option value="UNMARRIED">অবিবাহিত</option>
                    <option value="DIVORCED">তালাকপ্রাপ্ত</option>
                    <option value="WIDOWED">বিধবা/বিপত্নীক</option>
                    <option value="OTHER">অন্যান্য</option>
                  </FilterSelect>

                  <label className="text-sm font-medium mb-1 block">বয়স</label>
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="number"
                      value={ageMin}
                      onChange={(e) => setAgeMin(e.target.value)}
                      placeholder="১৮"
                      className="input input-bordered input-sm w-1/2"
                    />
                    <span>—</span>
                    <input
                      type="number"
                      value={ageMax}
                      onChange={(e) => setAgeMax(e.target.value)}
                      placeholder="৬০"
                      className="input input-bordered input-sm w-1/2"
                    />
                  </div>

                  <FilterSelect value={district} onChange={setDistrict} className="w-full mb-3">
                    <option value="">জেলা শহর</option>
                    <option>ঢাকা</option>
                    <option>চট্টগ্রাম</option>
                    <option>খুলনা</option>
                    <option>রাজশাহী</option>
                    <option>সিলেট</option>
                    <option>বরিশাল</option>
                    <option>রংপুর</option>
                    <option>ময়মনসিংহ</option>
                  </FilterSelect>

                  <FilterSelect value={education} onChange={setEducation} className="w-full mb-3">
                    <option value="">শিক্ষাগত যোগ্যতা</option>
                    <option>স্নাতক</option>
                    <option>স্নাতকোত্তর</option>
                    <option>এইচ.এস.সি</option>
                    <option>এস.এস.সি</option>
                  </FilterSelect>

                  <FilterSelect value={occupation} onChange={setOccupation} className="w-full mb-3">
                    <option value="">পেশা</option>
                    <option>ডাক্তার</option>
                    <option>ইঞ্জিনিয়ার</option>
                    <option>শিক্ষক</option>
                    <option>ব্যবসায়ী</option>
                  </FilterSelect>

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="নাম/পেশা/শিক্ষা খুঁজুন..."
                    className="input input-bordered input-sm w-full mb-3"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="btn btn-outline btn-error btn-sm flex-1"
                    >
                      ফিল্টার মুছুন
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        applyFilters();
                      }}
                      className="btn bg-[#ff6b6b] hover:bg-[#e05a5a] text-white btn-sm flex-1 shadow-sm"
                    >
                      বায়োডাটা খুঁজুন
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 ">
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
            {/* View Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setView("grid")}
                className={`btn btn-sm ${
                  view === "grid" ? "btn-primary" : "btn-outline"
                } text-sm flex items-center gap-1`}
              >
                <TfiLayoutGrid3Alt size={13} />
                বক্স
              </button>

              <button
                onClick={() => setView("table")}
                className={`btn btn-sm ${
                  view === "table" ? "btn-primary" : "btn-outline"
                } text-sm  items-center gap-1 hidden lg:flex`}
              >
                <MdTableRows size={18} /> টেবিল
              </button>
            </div>

            {/* Sort */}
            <div className="flex gap-2">
            <FilterSelect
              value={`${sortBy}:${sortOrder}`}
              onChange={(v) => {
                const [sb, so] = v.split(":");
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              className="select-sm"
            >
                <option value="createdAt:desc">সর্বশেষ</option>
                <option value="age:asc">বয়স অনুযায়ী</option>
                <option value="age:desc">বয়স (উল্টো)</option>
              </FilterSelect>

              <FilterSelect
                value={limit}
                onChange={(v) => {
                  setLimit(Number(v));
                  setPage(1);
                }}
                className="select-sm"
              >
                <option value={10}>Show 10</option>
                <option value={20}>Show 20</option>
              </FilterSelect>
            </div>
          </div>

          {error && (
            <div className="alert alert-error text-sm mb-4">{error}</div>
          )}
          {loading && (
            <div className="flex justify-center py-20">
              <span className="loading loading-spinner loading-lg text-red-400"></span>
            </div>
          )}

          {/* GRID VIEW */}
          {!loading && view === "grid" ? (
            items.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-gray-400 text-lg">
                  কোনো বায়োডাটা পাওয়া যায়নি
                </p>
                <button onClick={resetFilters} className="btn btn-outline btn-error btn-sm mt-4">
                  ফিল্টার মুছুন
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {items.map((item) => (
                  <ProfileCard key={item.id} profile={item} />
                ))}
              </div>
            )
          ) : !loading && view === "table" ? (
            /* TABLE VIEW */
            <div className="w-full  overflow-x-auto rounded shadow-sm">
              <table className="table table-zebra  w-full">
                <thead className="">
                  <tr>
                    <th className="whitespace-nowrap">ছবি</th>
                    <th className="whitespace-nowrap">নাম</th>
                    <th className="whitespace-nowrap">বয়স</th>
                    <th className="whitespace-nowrap">লোকেশন</th>
                    <th className="whitespace-nowrap">উচ্চতা</th>
                    <th className="whitespace-nowrap">গাত্রবর্ণ</th>
                    <th className="whitespace-nowrap">অ্যাকশন</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-base-300 cursor-pointer transition-colors duration-200"
                    >
                      <td>
                        <Image
                          src={item.profileImage || defaultAvatarFor(item.gender, item.religion)}
                          width={50}
                          height={50}
                          alt="profile"
                          className="rounded-md object-cover border"
                        />
                      </td>

                      <td className="whitespace-nowrap font-medium">
                        <div className="flex items-center gap-2">
                          <span>{item.fullName}</span>
                          {item.religion && (
                            <span className={`badge badge-xs text-[10px] font-semibold border ${getReligionMeta(item.religion).badgeClass}`}>
                              {getReligionMeta(item.religion).label}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{item.biodataNo}</div>
                      </td>

                      <td className="whitespace-nowrap text-sm">
                        {item.age} বছর
                      </td>

                      <td className="whitespace-nowrap">
                        {item.district || item.division}
                      </td>

                      <td className="whitespace-nowrap">
                        {item.heightText || "—"}
                      </td>

                      <td className="whitespace-nowrap">
                        {item.skinColor || "—"}
                      </td>

                      <td className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div>
                            {item.likedByMe ? (
                              <FcLike
                                size={18}
                                className="cursor-pointer"
                                onClick={() => toggleLike(item)}
                              />
                            ) : (
                              <FcLikePlaceholder
                                size={18}
                                className="cursor-pointer"
                                onClick={() => toggleLike(item)}
                              />
                            )}
                          </div>

                          <Link
                            href={`/details?id=${item.id}`}
                            className="btn btn-outline btn-xs"
                          >
                            দেখুন
                          </Link>

                          <StartChatButton
                            userId={item.ownerId}
                            className="btn btn-xs border-none bg-red-50 text-[#fd6969] hover:bg-[#fd6969] hover:text-white"
                          >
                            মেসেজ
                          </StartChatButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-gray-400">কোনো বায়োডাটা পাওয়া যায়নি</p>
                </div>
              )}
            </div>
          ) : null}

          {/* Infinite Scroll Sentinel and Loaders */}
          <div ref={sentinelRef} className="h-6 w-full pointer-events-none" />

          {loadingMore && (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <span className="loading loading-spinner loading-md text-[#ff6b6b]"></span>
              <p className="text-xs text-gray-500 font-medium animate-pulse">
                আরও পাত্র-পাত্রী লোড হচ্ছে...
              </p>
            </div>
          )}

          {hasMore && !loadingMore && !loading && (
            <div className="text-center py-6">
              <button
                type="button"
                onClick={loadMore}
                className="btn btn-outline btn-sm rounded-full px-6 border-red-300 text-red-500 hover:bg-red-50 hover:border-red-400 gap-2 shadow-sm"
              >
                আরও বায়োডাটা দেখুন ({items.length} / {pagination.total})
              </button>
            </div>
          )}

          {!hasMore && items.length > 0 && !loading && (
            <div className="text-center py-8 border-t border-gray-200/60 mt-6">
              <p className="text-xs text-gray-400 font-medium">
                ✓ আপনি সকল উপলব্ধ পাত্র-পাত্রীর তালিকা দেখেছেন (মোট {pagination.total} টি বায়োডাটা)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BiodataGrid() {
  return (
    <Suspense fallback={null}>
      <BiodataGridBody />
    </Suspense>
  );
}
