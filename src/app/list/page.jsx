"use client";

import Image from "next/image";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TfiLayoutGrid3Alt } from "react-icons/tfi";
import { MdTableRows } from "react-icons/md";
import { FcLikePlaceholder } from "react-icons/fc";
import { FcLike } from "react-icons/fc";
import boy from "./../../../assets/member/alem.png";
import { biodataApi, tokenStore } from "@/lib/api";
import StartChatButton from "@/components/StartChatButton";

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
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters (initialized from landing SearchBar query params)
  const [gender, setGender] = useState(params.get("gender") || "");
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
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  const fetchList = useCallback(async () => {
    setError("");
    try {
      const { data, pagination: pg } = await biodataApi.list({
        page,
        limit,
        gender: gender || undefined,
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
      setItems(data || []);
      setPagination(pg || { page: 1, limit, total: 0, totalPages: 0 });
    } catch (err) {
      setError(err.message || "বায়োডাটা লোড করা যায়নি।");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, gender, maritalStatus, ageMin, ageMax, district, education, occupation, skinColor, search, sortBy, sortOrder]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) return fetchList();
    });
    return () => {
      cancelled = true;
    };
  }, [fetchList]);

  const applyFilters = () => {
    setPage(1);
    fetchList();
  };

  const resetFilters = () => {
    setGender("");
    setMaritalStatus("");
    setAgeMin("");
    setAgeMax("");
    setDistrict("");
    setEducation("");
    setOccupation("");
    setSkinColor("");
    setSearch("");
    setPage(1);
    fetchList();
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

  const pageNumbers = [];
  const totalPages = pagination.totalPages || 1;
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pageNumbers.push(i);

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
          <h2 className="font-semibold mb-4">আপনি কি খঁজতে চান?</h2>

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

          <label className="text-sm font-medium  mb-1 block">বয়স</label>
          <div className="flex items-center gap-2 mb-1">
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
              onClick={resetFilters}
              className="btn btn-outline btn-error btn-sm flex-1"
            >
              বায়োডাটা মুছুন{" "}
            </button>
            <button
              onClick={applyFilters}
              className="btn bg-[#ff6b6b] text-white btn-sm flex-1"
            >
              বায়োডাটা খুজুন{" "}
            </button>
          </div>
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

              <h2 className="font-semibold mb-4">আপনি কি খঁজতে চান?</h2>

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
                value={maritalStatus}
                onChange={setMaritalStatus}
                className="w-full mb-3"
              >
                <option value="">বৈবাহিক অবস্থা</option>
                <option value="UNMARRIED">অবিবাহিত</option>
                <option value="DIVORCED">তালাকপ্রাপ্ত</option>
                <option value="WIDOWED">বিধবা/বিপত্নীক</option>
              </FilterSelect>

              <label className="text-sm font-medium  mb-1 block">বয়স</label>
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
                  onClick={resetFilters}
                  className="btn btn-outline btn-error btn-sm flex-1"
                >
                  বায়োডাটা মুছুন{" "}
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    applyFilters();
                  }}
                  className="btn bg-[#ff6b6b] btn-sm flex-1"
                >
                  বায়োডাটা খুজুন{" "}
                </button>
              </div>
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
              <div className="grid grid-cols-2 cursor-pointer sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {items.map((item) => (
                  <div key={item.id} className="relative">
                    <div className="absolute left-2 top-2 z-10">
                      {religionBadge[item.religion] && (
                        <span
                          className={`badge badge-sm text-white ${religionBadge[item.religion]}`}
                        >
                          {item.religion}
                        </span>
                      )}
                    </div>
                    <div className="absolute right-2 top-2 z-10">
                      {item.likedByMe ? (
                        <FcLike
                          size={24}
                          className="cursor-pointer"
                          onClick={() => toggleLike(item)}
                        />
                      ) : (
                        <FcLikePlaceholder
                          size={24}
                          className="cursor-pointer"
                          onClick={() => toggleLike(item)}
                        />
                      )}
                    </div>
                    <div className="card border border-primary/30 bg-base-100 shadow hover:shadow-lg transition-all">
                      <Image
                        src={item.profileImage || boy}
                        alt={item.fullName}
                        width={400}
                        height={400}
                        className="w-full h-full border rounded-tl-xl rounded-tr-xl"
                      />

                      <div className="card-body items-center text-center p-4">
                        <h2 className="font-bold text-base truncate w-full">
                          {item.fullName}
                        </h2>

                        <div className="text-line-through ">
                          <div className="flex  justify-around items-center gap-3">
                            <p>বয়স - {item.age}</p>
                            <p>লোকেশান - {item.district || item.division}</p>
                          </div>
                          <div className="flex  justify-around items-center gap-3">
                            <p>উচ্চতা - {item.heightText || "—"} </p>
                            <p>গাত্রবর্ণ - {item.skinColor || "—"}</p>
                          </div>
                        </div>
                        <div className="w-5/6 flex flex-col gap-2">
                          <Link
                            href={`/details?id=${item.id}`}
                            className="btn btn-outline text-xs md:text-base p-2"
                          >
                            বায়োডাটা দেখুন
                          </Link>
                          <StartChatButton
                            userId={item.ownerId}
                            className="btn text-xs md:text-base p-2 border-none bg-red-50 text-[#fd6969] hover:bg-[#fd6969] hover:text-white"
                          >
                            মেসেজ পাঠান
                          </StartChatButton>
                        </div>
                      </div>
                    </div>
                  </div>
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
                          src={item.profileImage || boy}
                          width={50}
                          height={50}
                          alt="profile"
                          className="rounded-md object-cover border"
                        />
                      </td>

                      <td className="whitespace-nowrap font-medium">
                        {item.fullName}
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

          {/* Pagination */}
          {!loading && items.length > 0 && (
            <div className="flex flex-col items-center gap-2 mt-6 md:mt-8">
              <p className="text-xs text-gray-400">
                মোট {pagination.total} টি • পৃষ্ঠা {page}/{totalPages}
              </p>
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  «
                </button>
                {start > 1 && (
                  <button className="join-item btn btn-sm" onClick={() => setPage(1)}>
                    1
                  </button>
                )}
                {start > 2 && <button className="join-item btn btn-sm btn-disabled">…</button>}
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    className={`join-item btn btn-sm ${
                      page === n ? "btn-active" : ""
                    }`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}
                {end < totalPages - 1 && (
                  <button className="join-item btn btn-sm btn-disabled">…</button>
                )}
                {end < totalPages && (
                  <button
                    className="join-item btn btn-sm"
                    onClick={() => setPage(totalPages)}
                  >
                    {totalPages}
                  </button>
                )}
                <button
                  className="join-item btn btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  »
                </button>
              </div>
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
