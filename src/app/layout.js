import { Noto_Sans_Bengali, Hind_Siliguri } from "next/font/google";
import "./globals.css";
// import Navbar from "@/components/landing/Navabar";
// import Footer from "@/components/landing/Footer";
import ScrollToTop from "@/components/ScrollToTop";

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

export const metadata = {
  title: "বিবাহডিল - মুসলিম ম্যাট্রিমনি প্ল্যাটফর্ম",
  description: "বাংলাদেশের বিশ্বস্ত মুসলিম বিবাহ ও ম্যাট্রিমনি প্ল্যাটফর্ম",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="bn"
      data-theme="light"
      className={`${hind_siliguri.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-base-100 text-base-content font-noto">
        {/* <Navbar />
        <Footer /> */}
        <main className="flex-1">{children}</main>
        <ScrollToTop />
      </body>
    </html>
  );
}
