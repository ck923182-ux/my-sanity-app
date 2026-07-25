import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        // Allow images served through ngrok tunnel (dev only)
        protocol: "https",
        hostname: "*.ngrok-free.app",
      },
    ],
  },
};

export default nextConfig;
