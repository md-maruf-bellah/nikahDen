/** @type {import('next').NextConfig} */

// Uploads live on the backend (:5000); proxy /uploads/* so relative photo URLs
// stored by the API resolve from the frontend origin too.
const API_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1").origin;
  } catch {
    return "http://localhost:5000";
  }
})();

const nextConfig = {
  async rewrites() {
    return [{ source: "/uploads/:path*", destination: `${API_ORIGIN}/uploads/:path*` }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**", // এটি Unsplash-এর সব ইমেজ পাথ এলাউ করবে
      },
    ],
  },
};

export default nextConfig;
