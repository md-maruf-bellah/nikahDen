// সার্চ-ইঞ্জিনের জন্য পাবলিক রুটের সাইটম্যাপ।
// ডোমেইন NEXT_PUBLIC_SITE_URL থেকে (ডিপ্লয়ে সেট করতে হবে); সেট না থাকলে লোকাল ফলব্যাক।
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

/** লগইন-ছাড়া দেখা যায় এমন পাতা — প্রাইভেট অ্যাপ-পাথ (/profile, /dashboard...) ইচ্ছাকৃতভাবে বাদ */
const PUBLIC_ROUTES = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/list", priority: 0.9, changeFrequency: "daily" },
  { path: "/member", priority: 0.7, changeFrequency: "weekly" },
  { path: "/register", priority: 0.8, changeFrequency: "yearly" },
  { path: "/about", priority: 0.5, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/refund", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap() {
  return PUBLIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path || "/"}`, // রুট-URL সবসময় স্ল্যাশ-সহ
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
