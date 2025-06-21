import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    experimental: {
        // Ensure pdf-parse (which depends on Node built-ins) is kept as an
        // external dependency when bundling route handlers that run in the
        // Node.js runtime.
        serverComponentsExternalPackages: ["pdf-parse"],
    },
    webpack(config, { isServer }) {
        // Additional safeguard: mark pdf-parse as external so that Next's
        // webpack bundling doesn't try to bundle it (which fails because the
        // package ships as CommonJS).
        if (isServer) {
            config.externals = config.externals || [];
            if (!config.externals.includes("pdf-parse")) {
                config.externals.push("pdf-parse");
            }
        }
        return config;
    },
};

export default nextConfig;
