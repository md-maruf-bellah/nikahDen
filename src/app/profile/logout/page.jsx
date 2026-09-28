"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { tokenStore } from "@/lib/api";
import { useRouter } from "next/navigation";

// লগ আউট পেজ — লোড হওয়ামাত্র সেশন বাতিল করে লগইনে পাঠায়
const LogoutPage = () => {
  const { logout } = useAuth();
  const router = useRouter();
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => logout())
      .catch(() => tokenStore.clear())
      .finally(() => {
        if (cancelled) return;
        setDone(true);
        router.replace("/login");
      });
    return () => {
      cancelled = true;
    };
  }, [logout, router]);

  return (
    <div className="flex items-center justify-center min-h-[300px] gap-2 text-gray-500">
      {done ? (
        <span>লগ আউট হয়েছে। লগইন পেজে যাচ্ছে...</span>
      ) : (
        <>
          <Loader2 size={18} className="animate-spin" /> লগ আউট হচ্ছে...
        </>
      )}
    </div>
  );
};

export default LogoutPage;
