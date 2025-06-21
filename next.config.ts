import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    // Opt-out specific dependencies from being bundled in Server Components / Route Handlers.
    // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages
    serverExternalPackages: ["pdf-parse"],
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
