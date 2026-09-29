"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { tokenStore } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

/**
 * বায়োডাটা কার্ড/ডিটেইলসের Message বোতাম —
 * ক্লিকে মেসেঞ্জার (?chat=<ownerId>) খোলে এবং ওই সদস্যের সাথে কথোপকথন শুরু হয়।
 * - লগইন না থাকলে লগইনে পাঠায় (next= দিয়ে ফিরে আসার পথসহ)
 * - নিজের বায়োডাটায় বোতামই দেখায় না
 * - block/limit — সিদ্ধান্ত মেসেঞ্জারের guard-ই দেখাবে (নীরব দেয়াল / আপগ্রেড নোটিস)
 */
export default function StartChatButton({ userId, className = "", children }) {
  const router = useRouter();
  const { user } = useAuth();

  if (!userId || (user && user.id === userId)) return null;

  const go = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!tokenStore.getAccess()) {
      router.push(`/login?next=${encodeURIComponent(`/profile?tab=${encodeURIComponent("মেসেজিং")}&chat=${userId}`)}`);
      return;
    }
    router.push(`/profile?tab=${encodeURIComponent("মেসেজিং")}&chat=${userId}`);
  };

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
