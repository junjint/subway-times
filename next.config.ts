import type { NextConfig } from "next";

/**
 * For GitHub Pages we need:
 *   - Static export (`output: "export"`)
 *   - A basePath because the site is served from /<repo>/, not /
 *   - Unoptimized images (no Node image server in static export)
 *
 * basePath is supplied via NEXT_PUBLIC_BASE_PATH at build time so the same
 * code works locally (`npm run dev`) and on GH Pages.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
};

export default nextConfig;
