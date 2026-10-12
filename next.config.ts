import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // lib/ia caches upstream failures this way: regenerated on the next request, never prerendered.
  cacheLife: { failure: { stale: 0, revalidate: 0, expire: 1 } },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
