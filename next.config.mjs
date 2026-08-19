/** @type {import('next').NextConfig} */
const nextConfig = {
  // Midnight JS SDK uses Node.js crypto — polyfill for browser bundles
  webpack: (config, { isServer }) => {
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
