import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Midnight JS SDK uses Node.js crypto — polyfill for browser bundles
  webpack: (config, { isServer }) => {
    // @midnight-ntwrk/compact-runtime ships a malformed exports map
    // ("default" before "types"); webpack rejects it. Alias straight to the
    // dist entry so the exports field is bypassed.
    config.resolve.alias["@midnight-ntwrk/compact-runtime"] = path.resolve(
      "node_modules/@midnight-ntwrk/compact-runtime/dist/index.js"
    );
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false,
      };
    }
    return config;
  },
};

export default nextConfig;
