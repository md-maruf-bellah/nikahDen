"use client";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { siteApi } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";

const RELIGION_MAP = {
  islam: "Islam",
  hinduism: "Hinduism",
  christianity: "Christianity",
  buddhism: "Buddhism",
  other: "Other",
};

export default function SearchBar() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [stats, setStats] = useState({ users: 0, grooms: 0, brides: 0, marriages: 0 });
  const [filters, setFilters] = useState({
    religion: "",
    gender: "",
    maritalStatus: "",
    age: "",
    division: "",
  });

  useEffect(() => {
    siteApi
      .stats()
      .then((s) =>
        setStats({
          users: s?.accounts ?? 0,
          grooms: s?.grooms ?? 0,
          brides: s?.brides ?? 0,
          marriages: s?.marriagesCompleted ?? 0,
        })
      )
      .catch(() => {});
  }, []);

  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  const submit = () => {
    const params = new URLSearchParams();
    const religion = RELIGION_MAP[filters.religion];
    if (religion) params.set("religion", religion);
    if (filters.gender) params.set("gender", filters.gender === "patro" ? "MALE" : "FEMALE");
    if (filters.maritalStatus) params.set("maritalStatus", filters.maritalStatus);
    if (filters.age) {
      const [min, max] = filters.age.split("-");
      params.set("ageMin", min);
      if (max) params.set("ageMax", max);
    }
    if (filters.division) {
      params.set("division", filters.division);
      params.set("district", filters.division);
    }
    router.push(`/list?${params.toString()}`);
  };

  const formatNumber = (n) => {
    if (language === "bn") return Number(n).toLocaleString("bn-BD");
    if (language === "ar") return Number(n).toLocaleString("ar-EG");
    return Number(n).toLocaleString("en-US");
  };

  const divisions = [
    { value: "ঢাকা", label: language === "en" ? "Dhaka" : language === "ar" ? "دكا" : "ঢাকা" },
    { value: "চট্টগ্রাম", label: language === "en" ? "Chattogram" : language === "ar" ? "شيتاغونغ" : "চট্টগ্রাম" },
    { value: "খুলনা", label: language === "en" ? "Khulna" : language === "ar" ? "خولنا" : "খুলনা" },
    { value: "রাজশাহী", label: language === "en" ? "Rajshahi" : language === "ar" ? "راجشاهي" : "রাজশাহী" },
    { value: "সিলেট", label: language === "en" ? "Sylhet" : language === "ar" ? "سلهيت" : "সিলেট" },
    { value: "বরিশাল", label: language === "en" ? "Barishal" : language === "ar" ? "باريشال" : "বরিশাল" },
    { value: "রংপুর", label: language === "en" ? "Rangpur" : language === "ar" ? "رانغبور" : "রংপুর" },
    { value: "ময়মনসিংহ", label: language === "en" ? "Mymensingh" : language === "ar" ? "ميمينسينغ" : "ময়মনসিংহ" },
  ];

  return (
    <section className="p-4">
      {/* STATS */}
      <div className="w-full lg:max-w-4xl mx-auto my-10 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {[
          { num: stats.users, label: t("search.stats.accounts", "একাউন্ট") },
          { num: stats.grooms, label: t("search.stats.grooms", "পাত্রের বায়োডাটা") },
          { num: stats.brides, label: t("search.stats.brides", "পাত্রীর বায়োডাটা") },
          { num: stats.marriages, label: t("search.stats.marriages", "বিবাহ সম্পন্ন হয়েছে") },
        ].map((stat, i) => (
          <div
            key={i}
            className="card bg-gradient-to-br from-[#fd6969] to-[#ee5353] text-white rounded-2xl shadow-md shadow-red-200/50 dark:shadow-none hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border border-white/10"
          >
            <div className="card-body p-4 sm:p-5 text-center flex flex-col items-center justify-center">
              <div className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-sm font-mono">
                {formatNumber(stat.num)}
              </div>
              <div className="text-xs sm:text-sm font-medium opacity-95 mt-1 leading-snug">
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full lg:max-w-5xl mx-auto bg-base-200 py-6 px-4 card block md:flex-row items-center gap-4">
        <div className="max-w-6xl mx-auto w-full">
          {/* Top Labels (Hidden on mobile) */}
          <div className="hidden md:grid grid-cols-5 mb-2 font-medium text-lg text-start">
            <p>{t("search.religion", "কোন ধর্ম থেকে খুঁজছি")}</p>
            <p>{t("search.lookingFor", "আমি খুঁজছি")}</p>
            <p>{t("search.maritalStatus", "বৈবাহিক অবস্থা")}</p>
            <p>{t("search.age", "বয়স")}</p>
            <p>{t("search.division", "বিভাগ")}</p>
          </div>

          {/* Input Area */}
          <div className="bg-[#e8dfdf] card overflow-hidden">
            {/* Mobile Layout */}
            <div className="flex flex-col md:hidden divide-y divide-gray-300">
              <div className="px-4 py-3">
                <select
                  className="select select-ghost w-full bg-[#e8dfdf] border-none outline-none text-gray-700"
                  value={filters.religion}
                  onChange={set("religion")}
                >
                  <option value="">{t("search.religionPlaceholder", "ধর্ম নির্বাচন করুন")}</option>
                  <option value="islam">{t("search.islam", "ইসলাম")}</option>
                  <option value="hinduism">{t("search.hinduism", "হিন্দু")}</option>
                  <option value="christianity">{t("search.christianity", "খ্রিস্টান")}</option>
                  <option value="buddhism">{t("search.buddhism", "বৌদ্ধ")}</option>
                  <option value="other">{t("search.other", "অন্যান্য")}</option>
                </select>
              </div>

              <div className="px-4 py-3">
                <select
                  className="select select-ghost w-full bg-[#e8dfdf] border-none outline-none text-gray-700"
                  value={filters.gender}
                  onChange={set("gender")}
                >
                  <option value="">{t("search.lookingForPlaceholder", "পাত্র/পাত্রী নির্বাচন করুন")}</option>
                  <option value="patro">{t("search.groom", "পাত্র")}</option>
                  <option value="patri">{t("search.bride", "পাত্রী")}</option>
                </select>
              </div>

              <div className="px-4 py-3">
                <select
                  className="select select-ghost w-full bg-[#e8dfdf] border-none outline-none text-gray-700"
                  value={filters.maritalStatus}
                  onChange={set("maritalStatus")}
                >
                  <option value="">{t("search.maritalStatusPlaceholder", "বৈবাহিক অবস্থা নির্বাচন করুন")}</option>
                  <option value="UNMARRIED">{t("search.neverMarried", "অবিবাহিত")}</option>
                  <option value="DIVORCED">{t("search.divorced", "তালাকপ্রাপ্ত")}</option>
                  <option value="WIDOWED">{t("search.widowed", "বিধবা/বিপত্নীক")}</option>
                </select>
              </div>

              <div className="px-4 py-3">
                <select
                  className="select select-ghost w-full bg-[#e8dfdf] border-none outline-none text-gray-700"
                  value={filters.age}
                  onChange={set("age")}
                >
                  <option value="">{t("search.agePlaceholder", "বয়স নির্বাচন করুন")}</option>
                  <option value="18-21">18 - 21</option>
                  <option value="22-25">22 - 25</option>
                  <option value="26-30">26 - 30</option>
                  <option value="31-35">31 - 35</option>
                  <option value="36-60">36+</option>
                </select>
              </div>

              <div className="px-4 py-3">
                <select
                  className="select select-ghost w-full bg-[#e8dfdf] border-none outline-none text-gray-700"
                  value={filters.division}
                  onChange={set("division")}
                >
                  <option value="">{t("search.divisionPlaceholder", "স্থান নির্বাচন করুন")}</option>
                  {divisions.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={submit}
                aria-label={t("search.searchBtn", "খুঁজুন")}
                className="w-full bg-[#5a5a5a] py-3 flex items-center justify-center hover:bg-[#444] transition"
              >
                <Search className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex items-center h-[60px]">
              <div className="flex-1 px-4">
                <select
                  className="select select-ghost w-full bg-[#e8dfdf] border-none outline-none text-gray-700 cursor-pointer"
                  value={filters.religion}
                  onChange={set("religion")}
                >
                  <option value="">{t("search.religionPlaceholder", "ধর্ম নির্বাচন করুন")}</option>
                  <option value="islam">{t("search.islam", "ইসলাম")}</option>
                  <option value="hinduism">{t("search.hinduism", "হিন্দু")}</option>
                  <option value="christianity">{t("search.christianity", "খ্রিস্টান")}</option>
                  <option value="buddhism">{t("search.buddhism", "বৌদ্ধ")}</option>
                  <option value="other">{t("search.other", "অন্যান্য")}</option>
                </select>
              </div>

              <div className="w-px h-6 bg-gray-400"></div>

              <div className="flex-1 px-4">
                <select
                  className="select select-ghost w-full bg-[#e8dfdf] border-none outline-none text-gray-700 cursor-pointer"
                  value={filters.gender}
                  onChange={set("gender")}
                >
                  <option value="">{t("search.lookingForPlaceholder", "পাত্র নির্বাচন করুন")}</option>
                  <option value="patro">{t("search.groom", "পাত্র")}</option>
                  <option value="patri">{t("search.bride", "পাত্রী")}</option>
                </select>
              </div>

              <div className="w-px h-6 bg-gray-400"></div>

              <div className="flex-1 px-4">
                <select
                  className="select select-ghost w-full bg-[#e8dfdf] border-none outline-none text-gray-700 cursor-pointer"
                  value={filters.maritalStatus}
                  onChange={set("maritalStatus")}
                >
                  <option value="">{t("search.maritalStatusPlaceholder", "নির্বাচন করুন")}</option>
                  <option value="UNMARRIED">{t("search.neverMarried", "অবিবাহিত")}</option>
                  <option value="DIVORCED">{t("search.divorced", "তালাকপ্রাপ্ত")}</option>
                  <option value="WIDOWED">{t("search.widowed", "বিধবা/বিপত্নীক")}</option>
                </select>
              </div>

              <div className="w-px h-6 bg-gray-400"></div>

              <div className="flex-1 px-4">
                <select
                  className="select select-ghost w-full bg-[#e8dfdf] border-none outline-none text-gray-700 cursor-pointer"
                  value={filters.age}
                  onChange={set("age")}
                >
                  <option value="">{t("search.agePlaceholder", "বয়স নির্বাচন করুন")}</option>
                  <option value="18-21">18 - 21</option>
                  <option value="22-25">22 - 25</option>
                  <option value="26-30">26 - 30</option>
                  <option value="31-35">31 - 35</option>
                  <option value="36-60">36+</option>
                </select>
              </div>

              <div className="w-px h-6 bg-gray-400"></div>

              <div className="flex-1 px-4">
                <select
                  className="select select-ghost w-full bg-[#e8dfdf] border-none outline-none text-gray-700 cursor-pointer"
                  value={filters.division}
                  onChange={set("division")}
                >
                  <option value="">{t("search.divisionPlaceholder", "স্থান নির্বাচন করুন")}</option>
                  {divisions.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={submit}
                aria-label={t("search.searchBtn", "খুঁজুন")}
                className="w-[70px] h-full bg-[#5a5a5a] flex items-center justify-center hover:bg-[#444] transition cursor-pointer"
              >
                <Search className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}