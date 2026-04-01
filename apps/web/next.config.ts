import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@signalboard/domain', '@signalboard/llm'],
};

export default nextConfig;
