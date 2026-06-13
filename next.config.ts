import type { NextConfig } from "next";
import { join } from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "**.ufs.sh",
      },
    ],
  },
  sassOptions: {
    includePaths: [join(__dirname, "styles")],
  },
};

export default nextConfig;
