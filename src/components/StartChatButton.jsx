"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Ban, CreditCard, ShieldCheck } from "lucide-react";
import { tokenStore } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useGuardPreview } from "@/components/GuardPreviewProvider";
import {
  resolveGuardReason,
  isOwnOrMissing,
  buildChatTargets,
} from "./StartChatButton.core.mjs";

/**
 * বায়োডাটা কার্ড/ডিটেইলসের Message বোতাম —
 * ক্লিকে মেসেঞ্জার (?chat=<ownerId>) খোলে এবং ওই সদস্যের সাথে কথোপকথন শুরু হয়।
 * - লগইন না থাকলে লগইনে পাঠায় (next= দিয়ে ফিরে আসার পথসহ)
 * - নিজের বায়োডাটায় বোতামই দেখায় না
 * - guard-প্রিভিউ: ব্লক/সীমা/প্যাকেজ-বাধা থাকলে বোতাম নিষ্ক্রিয় + কারণ লেখা
 *   (প্রিভিউ শেষ কথা নয় — ক্লিক করলেও সার্ভারের guard-ই চূড়ান্ত সিদ্ধান্ত দেয়)
 *
 * কারণ-ম্যাপিং/পথ-তৈরির লজিক StartChatButton.core.mjs-এ — ইউনিট-টেস্টেড।
 */
const ICONS = {
  ban: Ban,
  "shield-check": ShieldCheck,
  "credit-card": CreditCard,
};

export default function StartChatButton({ userId, className = "", children }) {
  const router = useRouter();
  const { user } = useAuth();
  const [preview] = useGuardPreview(userId);

  if (isOwnOrMissing(userId, user?.id)) return null;

  // guard-প্রিভিউতে বাধা থাকলে নিষ্ক্রিয় + কারণ (নীরব দেয়াল/সীমা — সব আগেই দেখা যায়)
  const { disabled, reason, title } = resolveGuardReason(preview);
  const ReasonIcon = (reason && ICONS[reason.iconKey]) || Ban;

  const { chatPath, loginPath } = buildChatTargets(userId);

  const go = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!tokenStore.getAccess()) {
      router.push(loginPath);
      return;
    }
    router.push(chatPath);
  };

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        title={title}
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
