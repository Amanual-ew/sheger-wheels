import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [50, 65, 75],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'mekina.s3.eu-west-1.amazonaws.com' },
    ],
  },
};

export default nextConfig;