import { Noto_Sans_Bengali, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/lib/auth-context";
import { GuardPreviewProvider } from "@/components/GuardPreviewProvider";
import SiteChrome from "@/components/SiteChrome";

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto",
});

const hind_siliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto",
});

// ডিপ্লয়-ডোমেইন — OG/সাইটম্যাপের সুত্র-ঠিকানা; সেট না থাকলে লোকাল ফলব্যাক
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "বিবাহডিল - মুসলিম ম্যাট্রিমনি প্ল্যাটফর্ম",
  description: "বাংলাদেশের বিশ্বস্ত মুসলিম বিবাহ ও ম্যাট্রিমনি প্ল্যাটফর্ম",
  keywords: ["মুসলিম বিবাহ", "ম্যাট্রিমনি", "বায়োডাটা", "বিবাহ প্রস্তাব", "nikah", "matrimony", "বাংলাদেশ"],
  applicationName: "নিকাহ্ দ্বীন",
  openGraph: {
    title: "বিবাহডিল - মুসলিম ম্যাট্রিমনি প্ল্যাটফর্ম",
    description: "বাংলাদেশের বিশ্বস্ত মুসলিম বিবাহ ও ম্যাট্রিমনি প্ল্যাটফর্ম",
    type: "website",
    locale: "bn_BD",
    siteName: "বিবাহডিল",
  },
  twitter: {
    card: "summary",
    title: "বিবাহডিল - মুসলিম ম্যাট্রিমনি প্ল্যাটফর্ম",
    description: "বাংলাদেশের বিশ্বস্ত মুসলিম বিবাহ ও ম্যাট্রিমনি প্ল্যাটফর্ম",
  },
};

/** মোবাইল ভিউপোর্ট + ব্রাউজার-UI থিম — Next ১৬-এ viewport আলাদা এক্সপোর্ট (metadata-এ নয়) */
export const viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  themeColor: "#FD6969",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="bn"
      data-theme="light"
      className={`${notoSansBengali.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-base-100 text-base-content font-noto">
        <AuthProvider>
          <GuardPreviewProvider>
            <SiteChrome>{children}</SiteChrome>
            <ScrollToTop />
          </GuardPreviewProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
