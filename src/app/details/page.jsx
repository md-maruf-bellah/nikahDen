"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Check } from "lucide-react";
import Link from "next/link";
import { FcLikePlaceholder } from "react-icons/fc";
import { FcLike } from "react-icons/fc";
import man from "./../../../assets/member/alem.png";
import SimilarBiodataSlider from "./SimilarBiodataSlider";
import { biodataApi, tokenStore } from "@/lib/api";
import { CreditCard, LogIn, ArrowLeft } from "lucide-react";

function Section({ title, rows }) {
  const filtered = rows.filter(([, v]) => v);
  if (!filtered.length) return null;
  return (
    <div className="mb-6 mt-6 ">
      <div>
        <h2 className="text-lg lg:text-xl font-bold lg:block relative pb-1">
          {title}
          <span className="absolute left-0 bottom-0 w-10 h-[2px] bg-red-500"></span>
        </h2>

        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3 text-sm">
          {filtered.map(([k, v], idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:gap-2">
              <span className="font-semibold sm:min-w-[180px]">{k} :</span>
              <span className="">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailsBody() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");

  const [biodata, setBiodata] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [like, setLike] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!id) {
      Promise.resolve().then(() => {
        if (cancelled) return;
        setError("বায়োডাটা আইডি পাওয়া যায়নি");
        setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      try {
        const [doc, sim] = await Promise.all([
          biodataApi.get(id),
          biodataApi.similar(id).catch(() => []),
        ]);
        if (cancelled) return;
        setBiodata(doc);
        setLike(Boolean(doc.likedByMe));
        setSimilar(Array.isArray(sim) ? sim : []);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "বায়োডাটা পাওয়া যায়নি");
          setErrorCode(err.errorCode || "");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleLike = async () => {
    if (!tokenStore.getAccess()) {
      router.push("/login");
      return;
    }
    try {
      if (like) {
        await biodataApi.unlike(id);
        setLike(false);
      } else {
        await biodataApi.like(id);
        setLike(true);
      }
    } catch {
      /* keep state */
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <span className="loading loading-spinner loading-lg text-red-400"></span>
      </div>
    );
  }

  if (error || !biodata) {
    // কানেক্ট শেষ → কেনার CTA; লগইন নেই → লগইন CTA; বাকি সব ক্ষেত্রে সাধারণ এরর।
    const isLoggedIn = Boolean(tokenStore.getAccess());
    const isConnectIssue = errorCode === "CONNECTS_INSUFFICIENT" || isLoggedIn === false;
    const needsLogin = !isLoggedIn;
    return (
      <div className="max-w-md mx-auto text-center py-24 px-4">
        <div className="bg-base-200 border border-red-100 rounded-2xl p-8">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            {needsLogin ? <LogIn size={26} className="text-red-500" /> : <CreditCard size={26} className="text-red-500" />}
          </div>
          <h2 className="font-bold text-lg mb-2">
            {needsLogin ? "লগইন করুন" : isConnectIssue ? "কানেক্ট শেষ হয়ে গেছে" : "কিছু সমস্যা হয়েছে"}
          </h2>
          <p className="text-gray-500 text-sm mb-6">{error || "বায়োডাটা পাওয়া যায়নি"}</p>

          {needsLogin ? (
            <Link
              href={`/login?next=/details?id=${id}`}
              className="btn bg-[#f25f5c] text-white border-none w-full"
            >
              <LogIn size={16} /> লগইন করে দেখুন
            </Link>
          ) : isConnectIssue ? (
            <div className="space-y-2">
              <Link href="/checkout" className="btn bg-[#f25f5c] text-white border-none w-full">
                <CreditCard size={16} /> প্যাকেজ কিনুন
              </Link>
              <Link href="/checkout?kind=PACK" className="btn btn-outline border-red-300 text-red-500 hover:bg-red-50 w-full">
                <CreditCard size={16} /> শুধু কানেক্ট আলাদাভাবে কিনুন
              </Link>
              <p className="text-xs text-gray-400 pt-1">প্রতিটি পূর্ণ বায়োডাটা দেখতে ১টি কানেক্ট লাগে।</p>
            </div>
          ) : (
            <Link href="/list" className="btn bg-[#f25f5c] text-white border-none w-full">
              <ArrowLeft size={16} /> তালিকায় ফিরে যান
            </Link>
          )}

          <Link href="/list" className="block text-xs text-gray-400 hover:text-red-400 mt-4">
            তালিকায় ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  const maritalLabel = {
    UNMARRIED: "অবিবাহিত",
    DIVORCED: "তালাকপ্রাপ্ত",
    WIDOWED: "বিধবা/বিপত্নীক",
    OTHER: "অন্যান্য",
  };

  return (
    <div className="bg-base-200 min-h-screen">
      {/* Header */}
      <div className="bg-[#f25f5c] text-white text-center py-10">
        <h1 className="text-lg font-semibold">বায়োডাটা</h1>
        <p className="text-xs mt-1">
          বায়োডাটা নং {biodata.biodataNo} • পাত্র-পাত্রী বিস্তারিত তথ্য
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 px-10">
        {/* Top Info */}
        <div className="flex flex-col lg:flex-row gap-4 items-center mb-6">
          <Image
            src={biodata.profileImage || man}
            width={180}
            height={180}
            alt="profile"
            className="rounded"
          />

          <div className="text-center lg:text-left flex-1">
            <h2 className="font-semibold text-2xl lg:text-3xl mb-2">
              {biodata.fullName}
            </h2>
            <p className="text-md mb-1">{biodata.occupation || "—"}</p>
            <p className="text-sm hidden lg:block">
              {biodata.district || biodata.division} • {biodata.age} বছর •{" "}
              {biodata.occupation || "—"}
            </p>
            {/* Like Button */}
            <button
              onClick={handleLike}
              className="btn btn-sm btn-outline mt-3"
              style={{ color: "#f25f5c", borderColor: "#f25f5c" }}
            >
              {like ? (
                <>
                  <FcLike size={18} /> পছন্দ করেছেন
                </>
              ) : (
                <>
                  <FcLikePlaceholder size={18} /> পছন্দ করুন
                </>
              )}
            </button>
          </div>
        </div>

        {/* About */}
        <div>
          <h1 className="text-xl lg:text-2xl font-bold mb-2">
            নিজের সম্পর্কে কিছু কথা
          </h1>
          <p className="text-sm  leading-relaxed">
            {biodata.aboutYourself ||
              "বায়োডাটা মালিক নিজের সম্পর্কে কিছু লিখেননি।"}
          </p>
        </div>

        {/* Match */}
        <div className="mt-6">
          <p className="text-lg font-bold mb-3">আপনার কিছু মিল</p>
          <div className="flex flex-wrap gap-4 lg:gap-20 items-center">
            {[
              biodata.education && "শিক্ষাগত যোগ্যতা",
              biodata.occupation && "পেশা",
              biodata.monthlyIncome && "ইনকাম",
              (biodata.presentAddress || biodata.permanentAddress) && "ঠিকানা",
            ]
              .filter(Boolean)
              .map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Check className="text-error w-4 h-4" />
                  <span className="text-md">{item}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="divider my-10"></div>

        <Section
          title="ব্যক্তিগত তথ্য"
          rows={[
            ["নাম", biodata.fullName],
            ["বয়স", biodata.age ? `${biodata.age} বছর` : ""],
            ["উচ্চতা", biodata.heightText],
            ["ওজন", biodata.weightKg ? `${biodata.weightKg} কেজি` : ""],
            ["বৈবাহিক অবস্থা", maritalLabel[biodata.maritalStatus]],
            ["ধর্ম", biodata.religion],
            ["জাতীয়তা", biodata.nationality],
            ["রক্তের গ্রুপ", biodata.bloodGroup],
            ["ঠিকানা", biodata.presentAddress || biodata.permanentAddress],
            ["শারীরিক অবস্থা", biodata.healthCondition],
            ["পোশাকের ধরন", biodata.clothingStyle],
            ["বিনোদন", biodata.entertainmentHabit],
            ["রাজনৈতিক দর্শন", biodata.politicalView],
            ["পছন্দের বই ও ব্যক্তিত্ব", biodata.favoriteBooksPeople],
            ["বিশেষ ক্যাটাগরি", biodata.specialCategories],
          ]}
        />

        <Section
          title="ধর্মীয় তথ্য"
          rows={[
            ["মাজহাব / সম্প্রদায়", biodata.sectOrDenomination],
            ["ধর্মীয় চর্চার স্তর", biodata.religiousPracticeLevel],
            ["উপাসনালয়ে যাতায়াত", biodata.placeOfWorshipAttendance],
            ["ধর্মগ্রন্থ পাঠ", biodata.holyBookReading],
            ["ধর্মীয় শিক্ষা", biodata.religiousEducation],
            ["ধর্মীয় পোশাক", biodata.religiousDressPreference],
            ["দান / সামাজিক কাজ", biodata.charityActivity],
            ["ধর্মীয় সংগঠন", biodata.religiousOrganization],
            ["খাদ্যনীতি", biodata.dietaryPractice],
            ["ভবিষ্যৎ পরিকল্পনা", biodata.futureReligiousGoal],
            ["জীবনসঙ্গীর প্রত্যাশা", biodata.partnerReligiousExpectation],
          ]}
        />

        <Section
          title="শিক্ষাগত যোগ্যতা"
          rows={[
            ["শিক্ষা মাধ্যম", biodata.education],
            ["ডিগ্রি", biodata.degree],
            ["প্রতিষ্ঠান", biodata.institution],
            ["বোর্ড", biodata.board],
            ["বিভাগ", biodata.subject],
            ["ফলাফল", biodata.result],
            ["পাসের সন", biodata.passingYear],
            ["দ্বীনি শিক্ষা", biodata.deeniEducation],
          ]}
        />

        <Section
          title="পারিবারিক তথ্য"
          rows={[
            ["পিতা", biodata.fatherName],
            ["পিতার পেশা", biodata.fatherOccupation],
            ["মাতা", biodata.motherName],
            ["মাতার পেশা", biodata.motherOccupation],
            ["ভাই-বোন", biodata.siblings],
          ]}
        />

        <Section
          title="পেশাগত তথ্য"
          rows={[
            ["পেশা", biodata.occupation],
            ["কোম্পানি", biodata.company],
            ["অভিজ্ঞতা", biodata.experienceYears],
            ["মাসিক আয়", biodata.monthlyIncome ? `৳${biodata.monthlyIncome.toLocaleString("bn-BD")}` : ""],
            ["পেশার বিবরণ", biodata.occupationDetails],
          ]}
        />

        <Section
          title="যোগাযোগের তথ্য"
          rows={[
            ["ইমেইল", biodata.email],
            ["ফোন", biodata.mobile || biodata.phoneNumber],
            ["পিতার মোবাইল", biodata.fatherMobile],
            ["বর্তমান ঠিকানা", biodata.presentAddress],
            ["স্থায়ী ঠিকানা", biodata.permanentAddress],
          ]}
        />

        <div className="divider my-10"></div>

        {/* Similar */}
        {similar.length > 0 && <SimilarBiodataSlider profiles={similar} />}
      </div>
    </div>
  );
}

export default function BiodataDetails() {
  return (
    <Suspense fallback={null}>
      <DetailsBody />
    </Suspense>
  );
}