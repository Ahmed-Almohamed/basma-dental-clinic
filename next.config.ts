import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Multipart requests pass through the framework body reader before API routing.
  // The file endpoint applies its stricter 10 MiB file limit separately.
  experimental: { serverActions: { bodySizeLimit: '11mb' } },
};

export default nextConfig;
