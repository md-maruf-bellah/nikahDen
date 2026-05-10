/** @type {import('next').NextConfig} */
const nextConfig = {
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
