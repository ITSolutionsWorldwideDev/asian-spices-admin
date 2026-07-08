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
        hostname: "nm60drcq00.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "**.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/**",
      },
    ],
  },
  sassOptions: {
    includePaths: [join(__dirname, "styles")],
  },
};


// const nextConfig: NextConfig = {
//   typescript: {
//     ignoreBuildErrors: false,
//   },
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "utfs.io",
//       },
//       {
//         protocol: "https",
//         hostname: "nm60drcq00.ufs.sh",
//       },
//       {
//         protocol: "https",
//         hostname: "*.ufs.sh",
//       },
//       {
//         protocol: "https",
//         hostname: "img.youtube.com",
//         pathname: "/**",
//       },
//     ],
//   },
// };

export default nextConfig;
