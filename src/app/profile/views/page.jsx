"use client";
import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, Clock, MessageSquare, ExternalLink, Users, Calendar } from "lucide-react";
import { biodataApi } from "@/lib/api";
import { defaultAvatarFor } from "@/lib/avatar";
import StartChatButton from "@/components/StartChatButton";
import { useLanguage } from "@/lib/language-context";

export default function ProfileViews() {
  const { t, language } = useLanguage();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ totalViews: 0, uniqueViewers: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await biodataApi.views({ limit: 50 });
      // API returns sendSuccess(res, msg, { items, stats }, pagination)
      const data = res?.data || {};
      setItems(Array.isArray(data.items) ? data.items : []);
      if (data.stats) setStats(data.stats);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) return load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const isEn = language === "en";
  const isAr = language === "ar";

  return (
    <div className="p-4 md:p-8 min-h-[500px]">
      {/* Header and Summary Stats */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-base-300">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Eye className="text-[#fd6969]" size={24} />
            {isEn ? "Who Viewed Your Biodata" : isAr ? "من زار سيرتك الذاتية" : "কারা আপনার বায়োডাটা দেখেছেন"}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isEn
              ? "See who checked your profile and how many times they viewed it."
              : isAr
              ? "تعرف على الأعضاء الذين شاهدوا سيرتك الذاتية وعدد مرات المشاهدة."
              : "আপনার বায়োডাটা কোন কোন সদস্য কতবার দেখেছেন তার তালিকা।"}
          </p>
        </div>

        {/* Stats Badges */}
        <div className="flex items-center gap-3">
          <div className="bg-red-50 dark:bg-base-200 px-3.5 py-2 rounded-xl border border-red-100 dark:border-base-300 text-center">
            <p className="text-[11px] text-gray-500">{isEn ? "Total Views" : isAr ? "إجمالي الزيارات" : "মোট দর্শন"}</p>
            <p className="text-lg font-bold text-[#fd6969]">
              {isEn ? stats.totalViews : stats.totalViews.toLocaleString("bn-BD")}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-base-200 px-3.5 py-2 rounded-xl border border-blue-100 dark:border-base-300 text-center">
            <p className="text-[11px] text-gray-500">{isEn ? "Unique Viewers" : isAr ? "زوار فريدون" : "অনন্য দর্শক"}</p>
            <p className="text-lg font-bold text-blue-600">
              {isEn ? stats.uniqueViewers : stats.uniqueViewers.toLocaleString("bn-BD")}
            </p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-20">
          <span className="loading loading-spinner loading-md text-[#fd6969]"></span>
          <p className="text-xs text-gray-400 mt-2">{isEn ? "Loading..." : "তথ্য লোড হচ্ছে..."}</p>
        </div>
      )}

      {/* Viewer List */}
      {!loading && items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-xs md:text-sm text-gray-500 border-none">
                <th>{isEn ? "Viewer" : isAr ? "الزائر" : "দর্শক"}</th>
                <th>{isEn ? "Details" : isAr ? "معلومات" : "তথ্য"}</th>
                <th className="text-center">{isEn ? "View Count" : isAr ? "مرات الزيارة" : "কতবার দেখেছেন"}</th>
                <th>{isEn ? "Last Viewed" : isAr ? "آخر زيارة" : "সর্বশেষ পরিদর্শন"}</th>
                <th className="text-center">{isEn ? "Action" : isAr ? "إجراء" : "অ্যাকশন"}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const bio = item.biodata;
                const avatarUrl =
                  bio?.profileImage ||
                  item.viewerAvatar ||
                  defaultAvatarFor(bio?.gender || "MALE");

                return (
                  <tr
                    key={item.id}
                    className="bg-base-100 hover:bg-gray-50/80 dark:hover:bg-base-200/50 shadow-sm rounded-xl transition-all border border-gray-100 dark:border-base-300"
                  >
                    {/* Viewer avatar & name */}
                    <td className="rounded-l-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 dark:border-base-300 bg-gray-50 shrink-0 relative">
                          <Image
                            src={avatarUrl}
                            alt={item.viewerName}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-base-content truncate max-w-[150px]">
                            {item.viewerName}
                          </p>
                          {bio?.biodataNo ? (
                            <span className="text-[11px] font-mono text-gray-400">
                              {bio.biodataNo}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">
                              {isEn ? "No Biodata" : "বায়োডাটা নেই"}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Basic details */}
                    <td>
                      {bio ? (
                        <div className="text-xs text-gray-600 dark:text-gray-300 space-y-0.5">
                          <p>
                            {isEn ? "Age: " : "বয়স: "}
                            <span className="font-medium">{bio.age || "—"}</span>
                          </p>
                          <p className="truncate max-w-[140px]">
                            {isEn ? "Profession: " : "পেশা: "}
                            <span className="font-medium">{bio.occupation || "—"}</span>
                          </p>
                          <p className="truncate max-w-[140px]">
                            {isEn ? "District: " : "জেলা: "}
                            <span className="font-medium">{bio.district || "—"}</span>
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* View count */}
                    <td className="text-center">
                      <span className="badge badge-sm bg-[#fd6969]/15 text-[#fd6969] border border-[#fd6969]/30 font-bold px-2 py-1">
                        {isEn
                          ? String(item.count) + " times"
                          : item.count.toLocaleString("bn-BD") + " বার"}
                      </span>
                    </td>

                    {/* Last Viewed time */}
                    <td>
                      <div className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Clock size={13} className="text-gray-400 shrink-0" />
                        <span>
                          {new Date(item.lastViewedAt).toLocaleDateString(
                            isEn ? "en-US" : "bn-BD",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Actions: View Biodata + Send Message */}
                    <td className="rounded-r-xl">
                      <div className="flex items-center justify-center gap-2">
                        {bio ? (
                          <Link
                            href={"/details?id=" + bio.id}
                            className="btn btn-xs bg-[#fd6969] hover:bg-[#e05858] text-white border-none gap-1 font-medium"
                          >
                            <ExternalLink size={12} />
                            {isEn ? "View Biodata" : "বায়োডাটা দেখুন"}
                          </Link>
                        ) : null}

                        <StartChatButton
                          userId={item.viewerId}
                          className="btn btn-xs btn-outline border-gray-300 hover:border-[#fd6969] hover:bg-[#fd6969] hover:text-white"
                        >
                          <MessageSquare size={12} />
                          {isEn ? "Message" : "মেসেজ"}
                        </StartChatButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="text-center py-20 bg-gray-50/50 dark:bg-base-200/30 rounded-2xl border border-dashed border-gray-200 dark:border-base-300">
          <Eye size={48} className="mx-auto text-gray-300 mb-3" />
          <h3 className="font-bold text-gray-600 dark:text-gray-300 text-base">
            {isEn ? "No profile views yet" : isAr ? "لا توجد زيارات بعد" : "এখনো কেউ আপনার বায়োডাটা দেখেনি"}
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            {isEn
              ? "When other members visit your biodata, they will appear here with the number of times they viewed it."
              : "অন্যান্য সদস্যরা যখন আপনার বায়োডাটা ভিজিট করবেন, তখন তারা কতবার দেখেছেন তা এখানে দেখতে পাবেন।"}
          </p>
        </div>
      )}
    </div>
  );
}
