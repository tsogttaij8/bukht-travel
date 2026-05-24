import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  webpack: (config, { dev }) => {
    if (dev) {
      const ignored = config.watchOptions?.ignored
      const ignoredPatterns = Array.isArray(ignored) ? ignored : [ignored]

      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          ...ignoredPatterns.filter(
            (pattern): pattern is string => typeof pattern === "string" && pattern.length > 0,
          ),
          "**/data/db/**",
        ],
      }
    }

    return config
  },
};

export default nextConfig;
