"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { FcLikePlaceholder, FcLike } from "react-icons/fc";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import { defaultAvatarFor } from "@/lib/avatar";
import { biodataApi, tokenStore } from "@/lib/api";
import StartChatButton from "../StartChatButton";
import { useLanguage } from "@/lib/language-context";
import { getReligionMeta } from "@/lib/religiousAdab";

export const maleProfiles = [];
export const femaleProfiles = [];

export function ProfileCard({ profile }) {
  const router = useRouter();
  const [like, setLike] = useState(Boolean(profile.likedByMe));
  const [busy, setBusy] = useState(false);

  const toggleLike = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!tokenStore.getAccess()) {
      router.push("/login");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      if (like) {
        await biodataApi.unlike(profile.id);
        setLike(false);
      } else {
        await biodataApi.like(profile.id);
        setLike(true);
      }
    } catch {
      /* keep previous state on failure */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card relative border border-primary/30 bg-base-100 shadow hover:shadow-lg transition-all overflow-hidden">
      {/* Left-side Religion Badge */}
      {profile.religion && (
        <div className="absolute left-2.5 top-2.5 z-10 pointer-events-none">
          <span className={`badge badge-sm font-semibold gap-1 px-2.5 py-2 border text-[11px] tracking-wide rounded-full shadow-md ${getReligionMeta(profile.religion).badgeClass}`}>
            <span>{getReligionMeta(profile.religion).icon}</span>
            <span>{getReligionMeta(profile.religion).label}</span>
          </span>
        </div>
      )}

      {/* Like Button */}
      <div className="absolute right-2 top-2 z-10 cursor-pointer">
        {like ? (
          <FcLike size={24} onClick={toggleLike} />
        ) : (
          <FcLikePlaceholder size={24} onClick={toggleLike} />
        )}
      </div>

      {/* Image */}
      <Image
        src={profile.profileImage || defaultAvatarFor(profile.gender, profile.religion)}
        alt={profile.fullName || "profile"}
        width={400}
        height={350}
        className="w-full h-full border rounded-tl-xl rounded-tr-xl object-cover"
      />

      {/* Body */}
      <div className="card-body items-center text-center p-4">
        <h2 className="font-bold text-base truncate w-full">
          {profile.fullName}
        </h2>
        <div className="text-line-through">
          <div className="flex justify-around items-center gap-3">
            <p>বয়স - {profile.age}</p>
            <p>লোকেশান - {profile.district || profile.division}</p>
          </div>

          <div className="flex justify-around items-center gap-3">
            <p>উচ্চতা - {profile.heightText || "—"}</p>
            <p>গাত্রবর্ণ - {profile.skinColor || "—"}</p>
          </div>
        </div>

        <div className="w-5/6 flex flex-col gap-2">
          <Link
            href={`/details?id=${profile.id}`}
            className="btn btn-outline text-xs md:text-base p-2"
          >
            বায়োডাটা দেখুন
          </Link>
          <StartChatButton
            userId={profile.ownerId}
            className="btn text-xs md:text-base p-2 border-none bg-red-50 text-[#fd6969] hover:bg-[#fd6969] hover:text-white"
          >
            মেসেজ পাঠান
          </StartChatButton>
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ title, subtitle, countBadge, profiles, sectionKey, viewAllHref }) {
  const { t, isRTL } = useLanguage();
  const prevClass = `prev-btn-${sectionKey}`;
  const nextClass = `next-btn-${sectionKey}`;

  return (
    <section className="py-14 md:py-18 relative">
      <div className="max-w-7xl mx-auto px-4 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pb-4 border-b border-base-200">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl md:text-3xl font-extrabold text-base-content tracking-tight">
                {title}
              </h2>
              {countBadge && (
                <span className="badge bg-[#fd6969]/10 text-[#fd6969] border border-[#fd6969]/30 text-xs font-semibold px-2.5 py-1">
                  {countBadge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-sm md:text-base text-base-content/70 mt-1.5">
                {subtitle}
              </p>
            )}
          </div>

          {/* Controls & View All link */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            <Link
              href={viewAllHref || "/list"}
              className="text-sm font-semibold text-[#fd6969] hover:underline flex items-center gap-1 group"
            >
              <span>{t("common.viewAll", "সকল প্রোফাইল")}</span>
              <ArrowRight size={16} className={`group-hover:translate-x-1 transition-transform ${isRTL ? "rotate-180" : ""}`} />
            </Link>

            <div className="hidden sm:flex items-center gap-2">
              <button
                className={`${prevClass} btn btn-sm btn-circle btn-outline border-base-300 hover:border-[#fd6969] hover:bg-[#fd6969] hover:text-white transition-all`}
                aria-label="Previous slide"
              >
                <ChevronLeft size={16} className={isRTL ? "rotate-180" : ""} />
              </button>
              <button
                className={`${nextClass} btn btn-sm btn-circle btn-outline border-base-300 hover:border-[#fd6969] hover:bg-[#fd6969] hover:text-white transition-all`}
                aria-label="Next slide"
              >
                <ChevronRight size={16} className={isRTL ? "rotate-180" : ""} />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Slider */}
        <div className="relative">
          <Swiper
            modules={[Navigation, Autoplay]}
            navigation={{
              prevEl: `.${prevClass}`,
              nextEl: `.${nextClass}`,
            }}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            loop={profiles.length > 4}
            spaceBetween={20}
            breakpoints={{
              0: { slidesPerView: 1.25, spaceBetween: 12 },
              480: { slidesPerView: 2, spaceBetween: 14 },
              768: { slidesPerView: 3, spaceBetween: 18 },
              1024: { slidesPerView: 4, spaceBetween: 20 },
            }}
          >
            {profiles.map((p, i) => (
              <SwiperSlide key={p.id || i} className="h-auto">
                <ProfileCard profile={p} />
              </SwiperSlide>
            ))}
          </Swiper>

          {profiles.length === 0 && (
            <div className="text-center py-16 bg-base-200/50 rounded-2xl border border-dashed border-base-300">
              <p className="text-gray-400">
                {t("common.loading", "বায়োডাটা লোড হচ্ছে...")}
              </p>
            </div>
          )}
        </div>

        {/* Mobile View All Button */}
        <div className="text-center mt-6 sm:hidden">
          <Link
            href={viewAllHref || "/list"}
            className="btn bg-[#fd6969] hover:bg-[#e05858] text-sm text-white w-full rounded-xl"
          >
            {t("common.viewAll", "আরো দেখুন")}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function ProfileSections() {
  const { language } = useLanguage();
  const [grooms, setGrooms] = useState([]);
  const [brides, setBrides] = useState([]);
  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [groomsRes, bridesRes, latestRes] = await Promise.all([
          biodataApi.list({ limit: 12, gender: "MALE", sortBy: "createdAt", sortOrder: "desc" }),
          biodataApi.list({ limit: 12, gender: "FEMALE", sortBy: "createdAt", sortOrder: "desc" }),
          biodataApi.list({ limit: 12, sortBy: "createdAt", sortOrder: "desc" }),
        ]);
        if (cancelled) return;
        setGrooms(groomsRes?.data || []);
        setBrides(bridesRes?.data || []);
        setLatest(latestRes?.data || []);
      } catch {
        /* backend offline — keep empty state */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isEn = language === "en";
  const isAr = language === "ar";

  const titles = {
    grooms: isEn ? "Groom Biodatas" : isAr ? "سير ذاتية للعرسان" : "পাত্রের বায়োডাটা",
    groomsSub: isEn
      ? "Verified & practicing Muslim grooms ready for marriage"
      : isAr
      ? "سير ذاتية لشباب ملتزمين ومؤهلين للزواج الشرعي"
      : "দ্বীনদার ও যোগ্য পাত্রদের অনুমোদিত বায়োডাটা • সরাসরি অভিভাবকের সাথে যোগাযোগ",
    brides: isEn ? "Bride Biodatas" : isAr ? "سير ذاتية للعرائس" : "পাত্রীর বায়োডাটা",
    bridesSub: isEn
      ? "Practicing & modesty-conscious Muslim brides"
      : isAr
      ? "سير ذاتية لفتيات صالحات وملتزمات بالحجاب الشرعي"
      : "পর্দাশীল ও পরহেযগার পাত্রীদের অনুমোদিত বায়োডাটা • সুন্নাহ সম্মত প্রস্তাব",
    latest: isEn ? "Recent Biodatas" : isAr ? "أحدث السير الذاتية" : "সর্বশেষ বায়োডাটা",
    latestSub: isEn
      ? "Newly submitted and verified profiles on Nikah Deen"
      : isAr
      ? "أحدث الملفات الشخصية المعتمدة في المنصة"
      : "নিকাহ্ দ্বীন প্ল্যাটফর্মে সদ্য অনুমোদিত নতুন পাত্র-পাত্রীর বায়োডাটা",
  };

  return (
    <div className="space-y-4">
      {/* 1. পাত্রের বায়োডাটা (Grooms Section) - 100% REAL DATA FROM MONGODB */}
      <ProfileSection
        title={titles.grooms}
        subtitle={titles.groomsSub}
        countBadge={grooms.length ? `${grooms.length} টি প্রোফাইল` : null}
        profiles={grooms}
        sectionKey="grooms"
        viewAllHref="/list?gender=MALE"
      />

      {/* Decorative Islamic separator */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-[#fd6969]/30 to-transparent my-4" />
      </div>

      {/* 2. পাত্রীর বায়োডাটা (Brides Section) - 100% REAL DATA FROM MONGODB */}
      <ProfileSection
        title={titles.brides}
        subtitle={titles.bridesSub}
        countBadge={brides.length ? `${brides.length} টি প্রোফাইল` : null}
        profiles={brides}
        sectionKey="brides"
        viewAllHref="/list?gender=FEMALE"
      />
    </div>
  );
}