import type { NextConfig } from "next";

const nextConfig: import("next").NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
