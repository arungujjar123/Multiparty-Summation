import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Image optimization
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
  },
  // Increase body size limit for PDF uploads (Vercel default is 4.5MB)
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
