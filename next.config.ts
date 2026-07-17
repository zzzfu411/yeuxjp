import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  turbopack: {
    // Keep build discovery inside the actual app repository. A parent folder
    // may contain optional forwarding scripts, but it is not an app boundary.
    root: __dirname,
  },
};

export default nextConfig;
