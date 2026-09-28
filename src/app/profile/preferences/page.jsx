"use client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Heart, SlidersHorizontal, Loader2, Search, AlertCircle, Sparkles } from "lucide-react";
import { preferencesApi, biodataApi } from "@/lib/api";

const DIVISIONS = ["ঢাকা", "চট্টগ্রাম", "রাজশাহী", "সিলেট", "বরিশাল", "খুলনা", "রংপুর", "ময়মনসিংহ"];
const RELIGIONS = [
  ["Islam", "ইসলাম"],
  ["Hinduism", "হিন্দুধর্ম"],
  ["Christianity", "খ্রিস্টধর্ম"],
  ["Buddhism", "বৌদ্ধধর্ম"],
  ["Other", "অন্যান্য"],
];
const MARITAL = [
  ["UNMARRIED", "অবিবাহিত"],
  ["DIVORCED", "তালাকপ্রাপ্ত"],
  ["WIDOWED", "বিধবা/বিপত্নীক"],
  ["OTHER", "অন্যান্য"],
];

const emptyForm = {
  gender: "",
  ageMin: "",
  ageMax: "",
  divisions: [],
  religion: "",
  maritalStatuses: [],
  education: "",
  occupation: "",
  minMatchScore: 0,
};

export default function PreferencesPage() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [matches, setMatches] = useState([]);
  const [matchMeta, setMatchMeta] = useState({ total: 0, page: 1, pages: 1, preferenceApplied: false });
  const [matchPage, setMatchPage] = useState(1);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState("");
  const [likedIds, setLikedIds] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const data = await preferencesApi.mine();
        setForm({
          gender: data.gender || "",
          ageMin: data.ageMin ?? "",
          ageMax: data.ageMax ?? "",
          divisions: data.divisions || [],
          religion: data.religion || "",
          maritalStatuses: data.maritalStatuses || [],
          education: data.education || "",
          occupation: data.occupation || "",
          minMatchScore: data.minMatchScore ?? 0,
        });
      } catch (err) {
        setError(err.message || "প্রেফারেন্স লোড করা যায়নি।");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadMatches = useCallback(async (page = 1) => {
    setMatchLoading(true);
    setMatchError("");
    try {
      const res = await preferencesApi.matches({ page, limit: 8 });
      setMatches(res.data || []);
      setMatchMeta({
        total: res.pagination?.total ?? 0,
        page: res.pagination?.page ?? page,
        pages: res.pagination?.totalPages ?? res.pagination?.pages ?? 1,
        preferenceApplied: res.pagination?.preferenceApplied ?? false,
      });
      setMatchPage(page);
      const liked = {};
      for (const it of res.data || []) liked[it.id] = it.likedByMe;
      setLikedIds((prev) => ({ ...prev, ...liked }));
    } catch (err) {
      setMatchError(err.message || "ম্যাচ লোড করা যায়নি।");
    } finally {
      setMatchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) loadMatches(1);
  }, [loading, loadMatches]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const toggleArray = (key, value) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((x) => x !== value) : [...f[key], value],
    }));

  const save = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const payload = {
        gender: form.gender || null,
        ageMin: form.ageMin === "" ? null : Number(form.ageMin),
        ageMax: form.ageMax === "" ? null : Number(form.ageMax),
        divisions: form.divisions,
        religion: form.religion || null,
        maritalStatuses: form.maritalStatuses,
        education: form.education,
        occupation: form.occupation,
        minMatchScore: Number(form.minMatchScore) || 0,
      };
      await preferencesApi.save(payload);
      setMessage("প্রেফারেন্স সংরক্ষিত হয়েছে। ম্যাচ তালিকা আপডেট হচ্ছে...");
      await loadMatches(1);
    } catch (err) {
      setError(err.message || "সংরক্ষণ করা যায়নি।");
    } finally {
      setSaving(false);
    }
  };

  const toggleLike = async (id) => {
    const isLiked = likedIds[id];
    try {
      if (isLiked) {
        await biodataApi.unlike(id);
        setLikedIds((p) => ({ ...p, [id]: false }));
      } else {
        await biodataApi.like(id);
        setLikedIds((p) => ({ ...p, [id]: true }));
      }
    } catch (err) {
      if (err.status === 409) setLikedIds((p) => ({ ...p, [id]: true }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 gap-2 text-gray-500">
        <Loader2 size={20} className="animate-spin" /> প্রেফারেন্স লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ---- প্রেফারেন্স ফর্ম ---- */}
      <div className="card bg-base-200 p-4 md:p-5">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal size={18} className="text-red-500" />
          <h2 className="font-bold">যাকে খুঁজছেন — পার্টনার প্রেফারেন্স</h2>
        </div>

        {message && <div className="alert alert-success text-sm mb-3 py-2"><span>{message}</span></div>}
        {error && <div className="alert alert-error text-sm mb-3 py-2"><AlertCircle size={16} /><span>{error}</span></div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-500">লিঙ্গ</label>
            <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className="select select-bordered w-full text-sm">
              <option value="">যেকোনো</option>
              <option value="FEMALE">পাত্রী</option>
              <option value="MALE">পাত্র</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">বয়স (ন্যূনতম)</label>
            <input type="number" min={16} max={90} value={form.ageMin} onChange={(e) => set("ageMin", e.target.value)} className="input input-bordered w-full text-sm" placeholder="যেমন: ২২" />
          </div>
          <div>
            <label className="text-xs text-gray-500">বয়স (সর্বোচ্চ)</label>
            <input type="number" min={16} max={90} value={form.ageMax} onChange={(e) => set("ageMax", e.target.value)} className="input input-bordered w-full text-sm" placeholder="যেমন: ৩০" />
          </div>

          <div>
            <label className="text-xs text-gray-500">ধর্ম</label>
            <select value={form.religion} onChange={(e) => set("religion", e.target.value)} className="select select-bordered w-full text-sm">
              <option value="">যেকোনো</option>
              {RELIGIONS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">শিক্ষা (কীওয়ার্ড)</label>
            <input value={form.education} onChange={(e) => set("education", e.target.value)} className="input input-bordered w-full text-sm" placeholder="যেমন: স্নাতক" />
          </div>
          <div>
            <label className="text-xs text-gray-500">পেশা (কীওয়ার্ড)</label>
            <input value={form.occupation} onChange={(e) => set("occupation", e.target.value)} className="input input-bordered w-full text-sm" placeholder="যেমন: শিক্ষক" />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-gray-500">বিভাগ (একাধিক নির্বাচন করা যাবে)</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {DIVISIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleArray("divisions", d)}
                  className={`badge cursor-pointer py-2 px-3 text-xs ${form.divisions.includes(d) ? "badge-success text-white" : "badge-outline"}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">বৈবাহিক অবস্থা (একাধিক)</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {MARITAL.map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggleArray("maritalStatuses", v)}
                  className={`badge cursor-pointer py-2 px-3 text-xs ${form.maritalStatuses.includes(v) ? "badge-success text-white" : "badge-outline"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="text-xs text-gray-500">
              সর্বনিম্ন ম্যাচ স্কোর: <span className="font-bold text-red-500">{form.minMatchScore}%</span>
              <span className="ml-2 text-gray-400">(0 = সব দেখাও)</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={10}
              value={form.minMatchScore}
              onChange={(e) => set("minMatchScore", e.target.value)}
              className="range range-xs range-error w-full max-w-md"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={save} disabled={saving} className="btn btn-sm bg-red-500 text-white hover:bg-red-600 border-none">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} সংরক্ষণ ও ম্যাচ দেখুন
          </button>
        </div>
      </div>

      {/* ---- ম্যাচ তালিকা ---- */}
      <div className="card bg-base-200 p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-red-500" />
            <h2 className="font-bold">আপনার জন্য প্রস্তাবিত ম্যাচ</h2>
            {matchMeta.preferenceApplied ? (
              <span className="badge badge-success badge-sm text-white">প্রেফারেন্স প্রয়োগ হয়েছে</span>
            ) : (
              <span className="badge badge-ghost badge-sm">প্রেফারেন্স সেট করা নেই</span>
            )}
          </div>
          <span className="text-xs text-gray-400">মোট {matchMeta.total} জন • পৃষ্ঠা {matchMeta.page}/{matchMeta.pages}</span>
        </div>

        {matchError && <div className="alert alert-error text-sm mb-3 py-2"><span>{matchError}</span></div>}

        {matchLoading ? (
          <div className="flex items-center justify-center p-8 gap-2 text-gray-500">
            <Loader2 size={18} className="animate-spin" /> ম্যাচ খোঁজা হচ্ছে...
          </div>
        ) : matches.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">
            কোনো ম্যাচ পাওয়া যায়নি। প্রেফারেন্স শিথিল করে আবার চেষ্টা করুন।
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {matches.map((m) => (
              <div key={m.id} className="bg-base-100 rounded-lg border border-base-300 p-3 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 shrink-0">
                    {m.profileImage ? (
                      <Image src={m.profileImage} alt={m.fullName || "প্রোফাইল"} width={56} height={56} unoptimized className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">{(m.fullName || "?").slice(0, 1)}</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <a href={`/details?id=${m.id}`} className="font-bold text-sm truncate block hover:text-red-500">
                      {m.fullName || "—"}
                    </a>
                    <p className="text-xs text-gray-500 truncate">{m.occupation || "পেশা নেই"}</p>
                    <p className="text-xs text-gray-400">{m.age ? `${m.age} বছর` : ""}{m.division ? ` • ${m.division}` : ""}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <progress className="progress progress-success progress-xs w-full" value={m.matchScore} max={100} />
                  </div>
                  <span className="text-xs font-bold text-green-600">{m.matchScore}%</span>
                </div>

                {m.matchReasons?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {m.matchReasons.slice(0, 3).map((r) => (
                      <span key={r} className="badge badge-ghost badge-xs">{r}</span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => toggleLike(m.id)}
                  className={`btn btn-xs w-full ${likedIds[m.id] ? "bg-red-500 text-white hover:bg-red-600 border-none" : "btn-outline text-red-500 border-red-300 hover:bg-red-50"}`}
                >
                  <Heart size={12} fill={likedIds[m.id] ? "currentColor" : "none"} />
                  {likedIds[m.id] ? "পছন্দ করা হয়েছে" : "পছন্দ করুন"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* পেজিনেশন */}
        {matchMeta.pages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button disabled={matchPage <= 1} onClick={() => loadMatches(matchPage - 1)} className="btn btn-xs">«</button>
            {Array.from({ length: matchMeta.pages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => loadMatches(p)} className={`btn btn-xs ${p === matchPage ? "bg-red-500 text-white border-none" : ""}`}>{p}</button>
            ))}
            <button disabled={matchPage >= matchMeta.pages} onClick={() => loadMatches(matchPage + 1)} className="btn btn-xs">»</button>
          </div>
        )}
      </div>
    </div>
  );
}
