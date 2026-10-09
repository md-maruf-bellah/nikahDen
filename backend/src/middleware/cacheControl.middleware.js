/**
 * Cache-Control নীতি — প্রতিটি রেসপন্সে স্পষ্ট হেডার:
 *
 *   • প্রকাশ্য GET (কখনোই ব্যক্তি-ভেদে ফল না বদলায় এমন এন্ডপয়েন্ট)
 *       → `public, max-age=N` — CDN/ব্রাউজার cache-যোগ্য
 *   • বাকি সব (optionalAuth-সহ সব GET, সব non-GET, এরর)
 *       → `private, no-store` — শেয়ার্ড cache-এ কখনো যাবে না,
 *         কারণ ফল Authorization দিয়ে ব্যক্তি-ভেদে বদলায়
 *
 * /uploads বাদ — express.static নিজে `public, max-age=7d` বসায়।
 */

const PUBLIC_GET = new Map([
  ["/health", 60],
  ["/api/v1/site/stats", 300],
]);

export function cacheControl(req, res, next) {
  if (req.path.startsWith("/uploads")) return next(); // static নিজের নীতি
  if (req.method === "GET" && PUBLIC_GET.has(req.path)) {
    res.set("Cache-Control", `public, max-age=${PUBLIC_GET.get(req.path)}`);
  } else {
    res.set("Cache-Control", "private, no-store");
  }
  next();
}

export default cacheControl;
