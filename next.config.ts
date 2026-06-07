import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root so the "multiple lockfiles" warning goes away.
    // The root package.json (one level up) is the canonical script entry.
    root: path.resolve(__dirname, ".."),
  },
};

export default nextConfig;