import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@greenfund/shared"],
  serverExternalPackages: ["@prisma/client"],
  allowedDevOrigins: ["35.224.91.179", "34.10.140.183", "34.10.140.183:3000"],
};

export default nextConfig;
