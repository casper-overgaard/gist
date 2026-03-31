import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@signalboard/domain', '@signalboard/llm'],
};

export default nextConfig;
