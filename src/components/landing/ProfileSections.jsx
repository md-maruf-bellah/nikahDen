"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { FcLikePlaceholder, FcLike } from "react-icons/fc";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import ManTestomonial from "./ManTestomonial";

import boy from "./../../../assets/member/alem.png";
import girl from "./../../../assets/member/alema.png";

import { biodataApi, tokenStore } from "@/lib/api";
import StartChatButton from "../StartChatButton";

export const maleProfiles = [];
export const femaleProfiles = [];

function ProfileCard({ profile }) {
  const router = useRouter();
  const [like, setLike] = useState(Boolean(profile.likedByMe));
  const [busy, setBusy] = useState(false);

  const toggleLike = async () => {
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
    <div className="card  relative border border-primary/30 bg-base-100 shadow hover:shadow-lg transition-all">
      {/* Like Button (same as before) */}
      <div className="absolute right-2 top-2 z-10 cursor-pointer">
        {like ? (
          <FcLike size={24} onClick={toggleLike} />
        ) : (
          <FcLikePlaceholder size={24} onClick={toggleLike} />
        )}
      </div>

      {/* Image (same) */}
      <Image
        src={profile.profileImage || boy}
        alt={profile.fullName || "profile"}
        width={400}
        height={350}
        className="w-full h-full border rounded-tl-xl rounded-tr-xl"
      />

      {/* Body (UNCHANGED DESIGN) */}
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

function ProfileSection({ title, profiles }) {
  return (
    <section className="py-32">
      <div className="max-w-7xl mx-auto px-4 lg:px-16">
        {/* Title SAME */}
        <div className="text-center mb-8">
          <h2 className="text-4xl  font-bold py-5">{title}</h2>
        </div>

        <div className="relative">
          {/* LEFT BUTTON (same style) */}
          <button className="prev-btn btn btn-square btn-md absolute bg-gray-700 text-white left-[-45px] top-1/2 -translate-y-1/2 z-10 hidden md:flex">
            <ChevronLeft size={18} />
          </button>

          {/* RIGHT BUTTON (same style) */}
          <button className="next-btn btn btn-square btn-md absolute bg-gray-700 text-white right-[-45px] top-1/2 -translate-y-1/2 z-10 hidden md:flex">
            <ChevronRight size={18} />
          </button>

          {/* ONLY GRID → SWIPER CHANGE */}
          <Swiper
            modules={[Navigation, Autoplay]}
            navigation={{
              prevEl: ".prev-btn",
              nextEl: ".next-btn",
            }}
            autoplay={{
              delay: 2000,
              disableOnInteraction: false,
            }}
            loop={profiles.length > 4}
            spaceBetween={16}
            breakpoints={{
              0: { slidesPerView: 2 }, // same feel as grid
              640: { slidesPerView: 3 },
              1024: { slidesPerView: 4 },
            }}
          >
            {profiles.map((p, i) => (
              <SwiperSlide key={p.id || i}>
                <ProfileCard profile={p} />
              </SwiperSlide>
            ))}
          </Swiper>
          {profiles.length === 0 && (
            <p className="text-center text-gray-400 py-10">
              এখনো কোনো বায়োডাটা অনুমোদিত হয়নি।
            </p>
          )}
        </div>

        {/* Footer SAME */}
        <div className="text-center mt-10">
          <Link
            href="/list"
            className="btn bg-[#fd6969] text-lg px-7 text-white"
          >
            আরো দেখুন
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function ProfileSections() {
  const [all, setAll] = useState([]);
  const [females, setFemales] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ data: latest }, { data: brides }] = await Promise.all([
          biodataApi.list({ limit: 10, sortBy: "createdAt", sortOrder: "desc" }),
          biodataApi.list({ limit: 10, gender: "FEMALE", sortBy: "createdAt", sortOrder: "desc" }),
        ]);
        if (cancelled) return;
        setAll(latest || []);
        setFemales(brides || []);
      } catch {
        /* backend offline — keep empty state */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <ProfileSection title="পাত্র-পাত্রীর বায়োডাটা" profiles={all} />

      <ManTestomonial />

      <ProfileSection title="পাত্রীর বায়োডাটা" profiles={females} />
    </>
  );
}