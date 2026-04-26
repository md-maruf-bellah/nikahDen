/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      new URL("https://images.unsplash.com/photo-1529636798458-92182e662485"),
    ],
  },
};

export default nextConfig;
