"use client";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { siteApi } from "@/lib/api";

const RELIGION_MAP = {
  islam: "Islam",
  hinduism: "Hinduism",
  christianity: "Christianity",
  buddhism: "Buddhism",
  other: "Other",
};

export default function SearchBar() {
  const router = useRouter();
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
    if (filters.division) params.set("district", filters.division);
    router.push(`/list?${params.toString()}`);
  };

  return (
    <section className=" p-4">
      {/* STATS */}
      <div className="w-full lg:max-w-3xl mx-auto my-10 grid grid-cols-2 md:grid-cols-4 gap-7 ">
        {[
          { num: stats.users, label: "একাউন্ট" },
          { num: stats.grooms, label: "পাত্রের বায়োডাটা" },
          { num: stats.brides, label: "পাত্রীর বায়োডাটা" },
          { num: stats.marriages, label: "বিবাহ সম্পন্ন হয়েছে" },
        ].map((stat, i) => (
          <div key={i} className="card bg-[#fd6969] text-white shadow-md">
            <div className="card-body p-4 text-center">
              <div className="text-5xl font-extrabold">
                {stat.num.toLocaleString("bn-BD")}
              </div>
              <div className="text-lg opacity-90">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className=" w-full lg:max-w-5xl  border border-primary/0 mx-auto bg-base-200 py-6 px-4 card block md:flex-row items-center gap-4">
        <div className="max-w-6xl mx-auto">
          {/* Top Labels (Hidden on mobile) */}
          <div className="hidden md:grid grid-cols-5  mb-2 font-medium text-lg text-start">
            <p>কোন ধর্ম থেকে খুঁজছি</p>
            <p>আমি খুঁজছি</p>
            <p>বৈবাহিক অবস্থা</p>
            <p>বয়স</p>
            <p>বিভাগ</p>
            <p></p>
          </div>

          {/* Input Area */}
          <div className="bg-[#e8dfdf] card overflow-hidden">
            {/* Mobile Layout */}
            <div className="flex flex-col md:hidden divide-y divide-gray-300">
              {[
                {
                  key: "religion",
                  label: "কোন ধর্ম থেকে খুঁজছি",
                  options: [
                    ["", "ধর্ম নির্বাচন করুন"],
                    ["islam", "ইসলাম"],
                    ["hinduism", "হিন্দু"],
                    ["christianity", "খ্রিস্টান"],
                    ["buddhism", "বৌদ্ধ"],
                    ["other", "অন্যান্য"],
                  ],
                },
                {
                  key: "gender",
                  label: "আমি খুঁজছি",
                  options: [
                    ["", "পাত্র/পাত্রী নির্বাচন করুন"],
                    ["patro", "পাত্র"],
                    ["patri", "পাত্রী"],
                  ],
                },
                {
                  key: "maritalStatus",
                  label: "বৈবাহিক অবস্থা",
                  options: [
                    ["", "নির্বাচন করুন"],
                    ["UNMARRIED", "অবিবাহিত"],
                    ["DIVORCED", "তালাকপ্রাপ্ত"],
                    ["WIDOWED", "বিধবা/বিপত্নীক"],
                    ["OTHER", "অন্যান্য"],
                  ],
                },
                {
                  key: "age",
                  label: "বয়স",
                  options: [
                    ["", "বয়স নির্বাচন করুন"],
                    ["18-21", "১৮ - ২১"],
                    ["22-25", "২২ - ২৫"],
                    ["26-30", "২৬ - ৩০"],
                    ["31-35", "৩১ - ৩৫"],
                    ["36-40", "৩৬ - ৪০"],
                    ["41-60", "৪১+"],
                  ],
                },
                {
                  key: "division",
                  label: "বিভাগ",
                  options: [
                    ["", "স্থান নির্বাচন করুন"],
                    ["ঢাকা", "ঢাকা"],
                    ["চট্টগ্রাম", "চট্টগ্রাম"],
                    ["খুলনা", "খুলনা"],
                    ["রাজশাহী", "রাজশাহী"],
                    ["সিলেট", "সিলেট"],
                    ["বরিশাল", "বরিশাল"],
                    ["রংপুর", "রংপুর"],
                    ["ময়মনসিংহ", "ময়মনসিংহ"],
                  ],
                },
              ].map((item, i) => (
                <div key={i} className="px-4 py-3">
                  <select
                    className="select select-ghost w-full bg-[#e8dfdf] border-none outline-none focus:outline-none focus:border-none text-gray-700 focus:bg-[#e8dfdf]"
                    value={filters[item.key]}
                    onChange={set(item.key)}
                  >
                    {item.options.map(([value, label], j) => (
                      <option key={j} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Button */}
              <button
                onClick={submit}
                className="w-full bg-[#5a5a5a] py-3 flex items-center justify-center hover:bg-[#444] transition"
              >
                <Search className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex items-center h-[60px] ">
              <div className="flex-1 px-4">
                <select
                  className="select select-ghost w-full bg-[#e8dfdf] border-none outline-none focus:outline-none focus:border-none text-gray-700 focus:bg-[#e8dfdf] cursor-pointer"
                  value={filters.religion}
                  onChange={set("religion")}
                >
                  <option value="" disabled>
                    ধর্ম নির্বাচন করুন
                  </option>
                  <option value="islam">ইসলাম</option>
                  <option value="hinduism">হিন্দু</option>
                  <option value="christianity">খ্রিস্টান</option>
                  <option value="buddhism">বৌদ্ধ</option>
                  <option value="other">অন্যান্য</option>
                </select>
              </div>

              <div className="w-px h-6 bg-gray-400"></div>

              <div className="flex-1 px-4">
                <select
                  className="select select-ghost w-full bg-[#e8dfdf] border-none outline-none focus:outline-none focus:border-none text-gray-700 focus:bg-[#e8dfdf] cursor-pointer"
                  value={filters.gender}
                  onChange={set("gender")}
                >
                  <option value="" disabled>
                    পাত্র নির্বাচন করুন
                  </option>
                  <option value="patro">পাত্র</option>
                  <option value="patri">পাত্রী</option>
                </select>
              </div>

              <div className="w-px h-6 bg-gray-400"></div>

              <div className="flex-1 px-4">
                <select
                  className="select select-ghost w-full bg-[#e8dfdf] border-none outline-none focus:outline-none focus:border-none text-gray-700 focus:bg-[#e8dfdf] cursor-pointer"
                  value={filters.maritalStatus}
                  onChange={set("maritalStatus")}
                >
                  <option value="" disabled>
                    নির্বাচন করুন
                  </option>
                  <option value="UNMARRIED">অবিবাহিত</option>
                  <option value="DIVORCED">তালাকপ্রাপ্ত</option>
                  <option value="WIDOWED">বিধবা/বিপত্নীক</option>
                </select>
              </div>

              <div className="w-px h-6 bg-gray-400"></div>

              <div className="flex-1 px-4">
                <select
                  className="select select-ghost w-full bg-[#e8dfdf] border-none outline-none focus:outline-none focus:border-none text-gray-700 focus:bg-[#e8dfdf] cursor-pointer"
                  value={filters.age}
                  onChange={set("age")}
                >
                  <option value="" disabled>
                    বয়স নির্বাচন করুন
                  </option>
                  <option value="18-21">১৮ - ২১</option>
                  <option value="22-25">২২ - ২৫</option>
                  <option value="26-30">২৬ - ৩০</option>
                  <option value="31-35">৩১ - ৩৫</option>
                  <option value="36-60">৩৬+</option>
                </select>
              </div>

              <div className="w-px h-6 bg-gray-400"></div>

              <div className="flex-1 px-4">
                <select
                  className="select select-ghost w-full bg-[#e8dfdf] border-none outline-none focus:outline-none focus:border-none text-gray-700 focus:bg-[#e8dfdf] cursor-pointer"
                  value={filters.division}
                  onChange={set("division")}
                >
                  <option value="" disabled>
                    স্থান নির্বাচন করুন
                  </option>
                  <option value="ঢাকা">ঢাকা</option>
                  <option value="চট্টগ্রাম">চট্টগ্রাম</option>
                  <option value="খুলনা">খুলনা</option>
                  <option value="রাজশাহী">রাজশাহী</option>
                  <option value="সিলেট">সিলেট</option>
                  <option value="বরিশাল">বরিশাল</option>
                  <option value="রংপুর">রংপুর</option>
                  <option value="ময়মনসিংহ">ময়মনসিংহ</option>
                </select>
              </div>

              <button
                onClick={submit}
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