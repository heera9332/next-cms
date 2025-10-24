import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "edevhindi.com",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
      },

      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
    minimumCacheTTL: 60,
    formats: ["image/webp", "image/avif"],
    dangerouslyAllowSVG: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    // Also ignore ESLint errors during build if needed
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
