import { Noto_Sans_Bengali, Noto_Naskh_Arabic, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider } from "@/lib/language-context";
import { GuardPreviewProvider } from "@/components/GuardPreviewProvider";
import SiteChrome from "@/components/SiteChrome";

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto",
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-arabic",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-latin",
});

// ডিপ্লয়-ডোমেইন — OG/সাইটম্যাপের সুত্র-ঠিকানা; সেট না থাকলে লোকাল ফলব্যাক
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "নিকাহ্ দ্বীন - বিশ্বস্ত ইসলামিক ম্যাট্রিমনি প্ল্যাটফর্ম",
  description: "দ্বীনদার ও পরহেযগার পাত্র-পাত্রী খোঁজার বিশ্বস্ত ইসলামিক ম্যাট্রিমনি প্ল্যাটফর্ম",
  keywords: ["নিকাহ্ দ্বীন", "মুসলিম বিবাহ", "ইসলামিক ম্যাট্রিমনি", "বায়োডাটা", "বিবাহ প্রস্তাব", "nikah deen", "islamic matrimony", "বাংলাদেশ"],
  applicationName: "নিকাহ্ দ্বীন",
  openGraph: {
    title: "নিকাহ্ দ্বীন - বিশ্বস্ত ইসলামিক ম্যাট্রিমনি প্ল্যাটফর্ম",
    description: "দ্বীনদার ও পরহেযগার পাত্র-পাত্রী খোঁজার বিশ্বস্ত ইসলামিক ম্যাট্রিমনি প্ল্যাটফর্ম",
    type: "website",
    locale: "bn_BD",
    siteName: "নিকাহ্ দ্বীন",
  },
  twitter: {
    card: "summary",
    title: "নিকাহ্ দ্বীন - বিশ্বস্ত ইসলামিক ম্যাট্রিমনি প্ল্যাটফর্ম",
    description: "দ্বীনদার ও পরহেযগার পাত্র-পাত্রী খোঁজার বিশ্বস্ত ইসলামিক ম্যাট্রিমনি প্ল্যাটফর্ম",
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
      suppressHydrationWarning
      className={`${notoSansBengali.variable} ${notoNaskhArabic.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var savedTheme = localStorage.getItem('theme');
                if (savedTheme) {
                  document.documentElement.setAttribute('data-theme', savedTheme);
                }
              } catch (e) {}
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-base-100 text-base-content font-noto">
        <LanguageProvider>
          <AuthProvider>
            <GuardPreviewProvider>
              <SiteChrome>{children}</SiteChrome>
              <ScrollToTop />
            </GuardPreviewProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
