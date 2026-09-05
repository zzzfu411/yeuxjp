import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  // Local browser checks use the loopback IP as well as localhost.
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    // Keep build discovery inside the actual app repository. A parent folder
    // may contain optional forwarding scripts, but it is not an app boundary.
    root: __dirname,
  },
};

export default nextConfig;
