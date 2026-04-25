import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: './',
  },
  reactCompiler: true,
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
