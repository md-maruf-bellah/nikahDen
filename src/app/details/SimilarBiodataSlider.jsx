"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FcLike, FcLikePlaceholder } from "react-icons/fc";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import boy from "./../../../assets/member/alem.png";
import StartChatButton from "@/components/StartChatButton";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

export default function SimilarBiodataSlider({ profiles = [] }) {
  const [likedItems, setLikedItems] = useState({});

  const handleLike = (index) => {
    setLikedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  if (!profiles.length) return null;

  return (
    <div className="mt-10 relative">
      <h3 className="text-center text-lg lg:text-2xl font-bold mb-6">
        অনুরূপ বায়োডাটা সমূহ
      </h3>

      <Swiper
        modules={[Navigation, Autoplay]}
        navigation={{
          nextEl: ".similar-next",
          prevEl: ".similar-prev",
        }}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        loop={profiles.length > 4}
        spaceBetween={20}
        breakpoints={{
          0: { slidesPerView: 1 },
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 4 },
        }}
        className="pb-12"
      >
        {profiles.map((item, index) => (
          <SwiperSlide key={item.id || index}>
            <div className="relative h-full">
              {/* Like Button */}
              <button
                type="button"
                onClick={() => handleLike(index)}
                className="absolute right-3 top-3 z-10 bg-white rounded-full p-1 shadow"
              >
                {likedItems[index] ? (
                  <FcLike size={20} />
                ) : (
                  <FcLikePlaceholder size={20} />
                )}
              </button>

              {/* Card */}
              <div className="card border border-primary/30 bg-base-100 shadow hover:shadow-lg transition-all">
                <Image
                  src={item.profileImage || boy}
                  alt={item.fullName || "profile"}
                  width={400}
                  height={300}
                  className="w-full object-cover"
                />

                <div className="card-body items-center text-center p-4">
                  <h4 className="font-bold text-sm truncate w-full">
                    {item.fullName}
                  </h4>
                  <div className="text-sm">
                    <div className="flex justify-between gap-3">
                      <p>বয়স - {item.age}</p>
                      <p>লোকেশান - {item.district || item.division}</p>
                    </div>

                    <div className="flex justify-between gap-3 mt-1">
                      <p>উচ্চতা - {item.heightText || "—"}</p>
                      <p>গাত্রবর্ণ - {item.skinColor || "—"}</p>
                    </div>
                  </div>

                  <div className="w-5/6 flex flex-col gap-2 mt-3">
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
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Buttons */}
      <button
        className="
          similar-prev
          absolute left-2 top-1/2 -translate-y-1/2 z-20
          w-12 h-12 rounded-full
          bg-white shadow-lg
          hover:bg-primary hover:text-white
          transition-all flex items-center justify-center
        "
      >
        <FiChevronLeft size={22} />
      </button>

      <button
        className="
          similar-next
          absolute right-2 top-1/2 -translate-y-1/2 z-20
          w-12 h-12 rounded-full
          bg-white shadow-lg
          hover:bg-primary hover:text-white
          transition-all flex items-center justify-center
        "
      >
        <FiChevronRight size={22} />
      </button>
    </div>
  );
}