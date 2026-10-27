import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
   
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Only needed if your car photos are remote URLs.
    // Replace with the real host(s) your photos come from.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
    ],
  },
};

export default nextConfig;