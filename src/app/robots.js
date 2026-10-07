// robots.txt — ক্রলারকে পাবলিক কনটেন্ট দেখতে দিই, লগইন-ঘেরা অ্যাপ-পাথ দূরে রাখি
// (ইনডেক্স হলে শুধু ভুল/খালি পৃষ্ঠা দেখায়, কোনো সুবিধা নেই)।
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

const DISALLOW = ["/dashboard", "/profile", "/message", "/payment", "/checkout", "/reset", "/email"];

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: DISALLOW,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
