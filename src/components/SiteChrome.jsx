"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/components/landing/Navabar";
import Footer from "@/components/landing/Footer";

// এই রুটগুলোতে সাইট-নেভ/ফুটার দেখানো হয় না:
//  - অথ ফ্লো (লগইন/রেজিস্টার/রিসেট/ইমেইল) — মনোযোগী ফর্ম পেজ
//  - চেকআউট/পেমেন্ট/সাকসেস — ট্রানজেকশনাল ফ্লো
//  - /dashboard* — অ্যাডমিন নিজের সাইডবার-শেল ব্যবহার করে
const NO_CHROME_ROUTES = ["/login", "/register", "/reset", "/email", "/checkout", "/payment", "/success", "/dashboard"];

export default function SiteChrome({ children }) {
  const pathname = usePathname() || "/";
  const hideChrome = NO_CHROME_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

  if (hideChrome) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
