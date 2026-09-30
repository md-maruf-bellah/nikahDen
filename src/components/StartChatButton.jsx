"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Ban, CreditCard, ShieldCheck } from "lucide-react";
import { tokenStore } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useGuardPreview } from "@/components/GuardPreviewProvider";

/**
 * বায়োডাটা কার্ড/ডিটেইলসের Message বোতাম —
 * ক্লিকে মেসেঞ্জার (?chat=<ownerId>) খোলে এবং ওই সদস্যের সাথে কথোপকথন শুরু হয়।
 * - লগইন না থাকলে লগইনে পাঠায় (next= দিয়ে ফিরে আসার পথসহ)
 * - নিজের বায়োডাটায় বোতামই দেখায় না
 * - guard-প্রিভিউ: ব্লক/সীমা/প্যাকেজ-বাধা থাকলে বোতাম নিষ্ক্রিয় + কারণ লেখা
 *   (প্রিভিউ শেষ কথা নয় — ক্লিক করলেও সার্ভারের guard-ই চূড়ান্ত সিদ্ধান্ত দেয়)
 */
const REASON_LABELS = {
  blocked: { icon: Ban, text: "মেসেজিং সম্ভব নয়" },
  LIMIT_REACHED: { icon: ShieldCheck, text: "সীমা শেষ — ম্যাচ বা আপগ্রেড" },
  UPGRADE_REQUIRED: { icon: CreditCard, text: "প্যাকেজ আপগ্রেড দরকার" },
  NO_PACKAGE: { icon: CreditCard, text: "প্যাকেজ আপগ্রেড দরকার" },
};

export default function StartChatButton({ userId, className = "", children }) {
  const router = useRouter();
  const { user } = useAuth();
  const [preview] = useGuardPreview(userId);

  if (!userId || (user && user.id === userId)) return null;

  // guard-প্রিভিউতে বাধা থাকলে নিষ্ক্রিয় + কারণ (নীরব দেয়াল/সীমা — সব আগেই দেখা যায়)
  const disabled = Boolean(preview && preview.canMessage === false);
  const reason = disabled ? REASON_LABELS[preview.blocked ? "blocked" : preview.reason] || null : null;
  const ReasonIcon = reason?.icon || Ban;

  const go = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!tokenStore.getAccess()) {
      router.push(`/login?next=${encodeURIComponent(`/profile?tab=${encodeURIComponent("মেসেজিং")}&chat=${userId}`)}`);
      return;
    }
    router.push(`/profile?tab=${encodeURIComponent("মেসেজিং")}&chat=${userId}`);
  };

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        title={reason ? reason.text : "মেসেজিং সম্ভব নয়"}
        className={`${className} opacity-55 cursor-not-allowed`}
      >
        {reason ? (
          <>
            <ReasonIcon size={16} /> {reason.text}
          </>
        ) : (
          children ?? (
            <>
              <MessageCircle size={16} /> মেসেজ
            </>
          )
        )}
      </button>
    );
  }

  return (
    <button type="button" onClick={go} className={className}>
      {children ?? (
        <>
          <MessageCircle size={16} /> মেসেজ
        </>
      )}
    </button>
  );
}
