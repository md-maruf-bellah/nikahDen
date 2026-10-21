"use client";

import {
  UserPlus,
  Search,
  MessageCircle,
  Heart,
  FileText,
  Users,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { FaArrowRightToBracket } from "react-icons/fa6";
import { useLanguage } from "@/lib/language-context";

export default function HowItWorks() {
  const { t, isRTL, language } = useLanguage();

  const steps = [
    {
      icon: UserPlus,
      title: language === "en" ? "Register Free" : language === "ar" ? "سجل مجاناً" : "রেজিস্ট্রেশন করুন",
      desc: language === "en" ? "Create your free account and set up your profile" : language === "ar" ? "أنشئ حسابك المجاني وابدأ رحلتك" : "বিনামূল্যে একাউন্ট খুলুন এবং আপনার প্রোফাইল তৈরি করুন",
    },
    {
      icon: FileText,
      title: language === "en" ? "Create Biodata" : language === "ar" ? "أنشئ السيرة الذاتية" : "বায়োডাটা তৈরি করুন",
      desc: language === "en" ? "Add your complete personal and family preferences" : language === "ar" ? "أضف تفاصيلك الشخصية والعائلية ومواصفات الشريك" : "আপনার সম্পূর্ণ বায়োডাটা ও পছন্দ যোগ করুন",
    },
    {
      icon: Search,
      title: language === "en" ? "Search Profiles" : language === "ar" ? "ابحث وتصفح" : "পাত্র-পাত্রী খুঁজুন",
      desc: language === "en" ? "Find matching practicing profiles using smart filters" : language === "ar" ? "استخدم الفلاتر المتقدمة لاختيار الشريك المناسب" : "উন্নত ফিল্টার দিয়ে আপনার পছন্দমতো প্রোফাইল খুঁজুন",
    },
    {
      icon: MessageCircle,
      title: language === "en" ? "Express Interest" : language === "ar" ? "أرسل طلب الاهتمام" : "যোগাযোগ করুন",
      desc: language === "en" ? "Send interest or direct messages to suitable profiles" : language === "ar" ? "أرسل رسالة أو طلب اهتمام للملفات المتوافقة" : "পছন্দের প্রোফাইলে সরাসরি মেসেজ পাঠান",
    },
    {
      icon: Users,
      title: language === "en" ? "Involve Guardians" : language === "ar" ? "إشراك ولي الأمر" : "পরিবারকে জানান",
      desc: language === "en" ? "Share verified profiles directly with family guardians" : language === "ar" ? "شارك بيانات السيرة الذاتية مع ولي الأمر للموافقة" : "পরিবারের সাথে প্রোফাইল শেয়ার করুন",
    },
    {
      icon: CheckCircle,
      title: language === "en" ? "Mutual Consent" : language === "ar" ? "التوافق والقبول" : "সিদ্ধান্ত নিন",
      desc: language === "en" ? "Conclude discussions with family blessings" : language === "ar" ? "مناقشة التفاصيل وتأكيد التوافق بين العائلتين" : "পারস্পরিক আলোচনার মাধ্যমে চূড়ান্ত সিদ্ধান্ত নিন",
    },
    {
      icon: Heart,
      title: language === "en" ? "Sunnah Nikah" : language === "ar" ? "إتمام عقد النكاح" : "বিবাহ সম্পন্ন করুন",
      desc: language === "en" ? "Begin your blessed halal marital journey" : language === "ar" ? "البدء في حياة زوجية سعيدة ومباركة على كتاب الله وسنته" : "সুন্দর জীবন শুরু করুন আমাদের সাথে",
    },
  ];

  return (
    <section className="py-16 bg-[#f45f5f] text-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-lg font-semibold text-white/90">
            {t("howItWorks.badge", "প্রক্রিয়া")}
          </p>
          <h2 className="text-4xl font-bold text-white mt-1">
            {t("howItWorks.title", "আমরা যেভাবে কাজ করি")}
          </h2>
          <p className="text-sm mt-2 text-white/90">
            {t("howItWorks.subtitle", "সহজ কয়েকটি ধাপে আপনার জীবনসঙ্গী খুঁজুন")}
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-2 sm:grid-cols-3 items-center md:grid-cols-4 gap-5">
          {steps.map((step, i) => {
            const Icon = step.icon;

            return (
              <div
                key={i}
                className="hover:bg-white/20 transition-all backdrop-blur-sm card"
              >
                <div className="card-body items-center text-center p-5">
                  <div className="card w-16 h-16 bg-base-100 text-gray-800 flex items-center font-extrabold justify-center mb-3">
                    <Icon size={32} />
                  </div>

                  <h3 className="font-bold text-sm lg:text-xl text-white">
                    {step.title}
                  </h3>

                  <p className="text-sm lg:text-base opacity-90 mt-1 leading-relaxed text-white">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
          <div>
            <Link
              href="/register"
              className="btn btn-outline text-white border-white text-base hover:bg-white hover:text-[#f45f5f] flex items-center gap-2"
            >
              <span>{t("auth.registerBtn", "রেজিস্ট্রেশন করুন")}</span>
              <FaArrowRightToBracket className={isRTL ? "rotate-180" : ""} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
